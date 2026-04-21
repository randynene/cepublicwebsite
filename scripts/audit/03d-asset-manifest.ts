import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

const WF_CDN_SITE = '673326831abed6267051fa11';
const WF_CDN_CMS  = '673326831abed6267051fa18';

export interface AssetRecord {
  url: string;
  relativePath: string;
  cdnFolder: 'site' | 'cms' | 'external';
  format: string;
  referencedByPages: string[];
  referencedCount: number;
  isResponsive: boolean;
  altText: string;
  estimatedSizeCategory: 'icon' | 'small' | 'medium' | 'large' | 'unknown';
  assetCategory: 'logo' | 'hero' | 'content' | 'icon' | 'background' | 'video-poster' | 'other';
}

export interface AssetManifest {
  totalUniqueAssets: number;
  siteAssets: number;
  cmsAssets: number;
  externalAssets: number;
  byFormat: Record<string, number>;
  byCategory: Record<string, number>;
  estimatedTotalFiles: number;
  assets: AssetRecord[];
}

function classifyAsset(url: string, alt: string, context: string): AssetRecord['assetCategory'] {
  const lower = url.toLowerCase();
  const altLower = alt.toLowerCase();
  if (lower.includes('logo') || altLower.includes('logo')) return 'logo';
  if (lower.includes('favicon') || lower.includes('webclip')) return 'icon';
  if (lower.includes('hero') || lower.includes('tech.avif') || lower.includes('techdel')) return 'hero';
  if (lower.includes('avatar') || lower.includes('headshot') || lower.includes('thumbnail')) return 'content';
  if (lower.includes('icon') || lower.includes('arrow') || lower.includes('checl') || lower.includes('check.')) return 'icon';
  if (context.includes('background') || context.includes('bg-')) return 'background';
  if (/\.(mp4|webm|mov)$/i.test(lower)) return 'video-poster';
  return 'content';
}

function estimateSize(url: string, srcset?: string): AssetRecord['estimatedSizeCategory'] {
  if (url.includes('icon') || url.includes('arrow') || /\.svg($|\?)/i.test(url)) return 'icon';
  if (srcset) {
    const widths = (srcset.match(/\d+w/g) ?? []).map(w => parseInt(w));
    const maxWidth = Math.max(...widths, 0);
    if (maxWidth > 1200) return 'large';
    if (maxWidth > 600) return 'medium';
    if (maxWidth > 0) return 'small';
  }
  return 'unknown';
}

export async function buildAssetManifest(
  pageContents: Record<string, { rawHtml?: string; url?: string }>
): Promise<AssetManifest> {
  const assetMap = new Map<string, AssetRecord>();

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;
    const $ = cheerio.load(content.rawHtml);

    $('img').each((_, el) => {
      const src = $(el).attr('src') ?? '';
      const srcset = $(el).attr('srcset') ?? '';
      const alt = $(el).attr('alt') ?? '';

      const urls = [src, ...srcset.split(',').map(s => s.trim().split(' ')[0])].filter(Boolean);

      for (const rawUrl of urls) {
        if (!rawUrl || rawUrl.startsWith('data:')) continue;

        let url: string;
        try { url = new URL(rawUrl).href; }
        catch { url = rawUrl; }

        const existing = assetMap.get(url);
        if (existing) {
          if (!existing.referencedByPages.includes(urlPath)) {
            existing.referencedByPages.push(urlPath);
            existing.referencedCount++;
          }
          if (!existing.isResponsive && srcset) existing.isResponsive = true;
        } else {
          const cdnFolder = url.includes(WF_CDN_SITE) ? 'site' :
                            url.includes(WF_CDN_CMS) ? 'cms' : 'external';
          const urlObj = (() => { try { return new URL(url); } catch { return null; } })();
          const relativePath = urlObj?.pathname ?? url;
          const formatMatch = relativePath.match(/\.([a-z0-9]+)(\?|$)/i);
          const format = formatMatch ? formatMatch[1].toLowerCase() : 'unknown';

          assetMap.set(url, {
            url,
            relativePath,
            cdnFolder,
            format,
            referencedByPages: [urlPath],
            referencedCount: 1,
            isResponsive: !!srcset,
            altText: alt,
            estimatedSizeCategory: estimateSize(url, srcset),
            assetCategory: classifyAsset(url, alt, ''),
          });
        }
      }
    });

    // Inline CSS background images
    const styleContent = $('style').map((_, el) => $(el).html()).get().join('\n');
    const bgUrlMatches = styleContent.matchAll(/url\(['"]?([^'")\s]+)['"]?\)/g);
    for (const match of bgUrlMatches) {
      const rawUrl = match[1];
      if (!rawUrl || rawUrl.startsWith('data:')) continue;
      const url = rawUrl.startsWith('http') ? rawUrl : rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      if (!assetMap.has(url)) {
        const cdnFolder = url.includes(WF_CDN_SITE) ? 'site' :
                          url.includes(WF_CDN_CMS) ? 'cms' : 'external';
        const formatMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
        assetMap.set(url, {
          url,
          relativePath: url,
          cdnFolder,
          format: formatMatch ? formatMatch[1].toLowerCase() : 'unknown',
          referencedByPages: [urlPath],
          referencedCount: 1,
          isResponsive: false,
          altText: '',
          estimatedSizeCategory: 'unknown',
          assetCategory: 'background',
        });
      } else {
        const existing = assetMap.get(url)!;
        if (!existing.referencedByPages.includes(urlPath)) {
          existing.referencedByPages.push(urlPath);
          existing.referencedCount++;
        }
      }
    }

    // Inline style attributes
    $('[style*="url("]').each((_, el) => {
      const style = $(el).attr('style') ?? '';
      const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (!m) return;
      const rawUrl = m[1];
      if (!rawUrl || rawUrl.startsWith('data:')) return;
      const url = rawUrl.startsWith('http') ? rawUrl : rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      if (!assetMap.has(url)) {
        const cdnFolder = url.includes(WF_CDN_SITE) ? 'site' :
                          url.includes(WF_CDN_CMS) ? 'cms' : 'external';
        const formatMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
        assetMap.set(url, {
          url,
          relativePath: url,
          cdnFolder,
          format: formatMatch ? formatMatch[1].toLowerCase() : 'unknown',
          referencedByPages: [urlPath],
          referencedCount: 1,
          isResponsive: false,
          altText: '',
          estimatedSizeCategory: 'unknown',
          assetCategory: 'background',
        });
      }
    });
  }

  const assets = Array.from(assetMap.values());
  const byFormat: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const asset of assets) {
    byFormat[asset.format] = (byFormat[asset.format] ?? 0) + 1;
    byCategory[asset.assetCategory] = (byCategory[asset.assetCategory] ?? 0) + 1;
  }

  const manifest: AssetManifest = {
    totalUniqueAssets: assets.length,
    siteAssets: assets.filter(a => a.cdnFolder === 'site').length,
    cmsAssets: assets.filter(a => a.cdnFolder === 'cms').length,
    externalAssets: assets.filter(a => a.cdnFolder === 'external').length,
    byFormat,
    byCategory,
    estimatedTotalFiles: assets.filter(a => a.cdnFolder !== 'external').length,
    assets,
  };

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-assets.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('Asset manifest complete:');
  console.log(`  Total unique assets: ${manifest.totalUniqueAssets}`);
  console.log(`  Site assets (fa11):  ${manifest.siteAssets}`);
  console.log(`  CMS assets (fa18):   ${manifest.cmsAssets}`);
  console.log(`  External assets:     ${manifest.externalAssets}`);
  console.log(`  By format:           ${JSON.stringify(byFormat)}`);
  console.log(`  By category:         ${JSON.stringify(byCategory)}`);

  return manifest;
}
