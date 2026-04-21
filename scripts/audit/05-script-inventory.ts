import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { ThirdPartyScript, ScriptInventory } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

const SCRIPT_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  identifierExtract: RegExp;
  category: ThirdPartyScript['category'];
}> = [
  { name: 'Google Tag Manager', pattern: /GTM-[A-Z0-9]+/i, identifierExtract: /(GTM-[A-Z0-9]+)/i, category: 'tag_manager' },
  { name: 'GA4', pattern: /G-[A-Z0-9]{10,}/i, identifierExtract: /(G-[A-Z0-9]{10,})/i, category: 'analytics' },
  { name: 'Google Analytics UA', pattern: /UA-\d+-\d+/, identifierExtract: /(UA-\d+-\d+)/, category: 'analytics' },
  { name: 'LinkedIn Insight', pattern: /_linkedin_partner_id|linkedin\.com\/px/, identifierExtract: /_linkedin_partner_id\s*=\s*["']?(\d+)["']?/, category: 'advertising' },
  { name: 'Facebook Pixel', pattern: /fbq\(|facebook\.net\/.*fbevents/, identifierExtract: /fbq\('init',\s*['"](\d+)['"]/, category: 'advertising' },
  { name: 'HubSpot Tracking', pattern: /hs-script-loader|js\.hs-scripts\.com/, identifierExtract: /hs-scripts\.com\/(\d+)/, category: 'analytics' },
  { name: 'HubSpot Forms', pattern: /hsforms\.net\/forms|hbspt\.forms\.create/, identifierExtract: /portalId[:\s]*["']?(\d+)["']?/, category: 'analytics' },
  { name: 'Hotjar', pattern: /hotjar|hjid/i, identifierExtract: /hjid[:\s,=]+(\d+)/, category: 'heatmap' },
  { name: 'FullStory', pattern: /FullStory|fs\.js/i, identifierExtract: /org[:\s'",=]+([A-Z0-9]+)/i, category: 'heatmap' },
  { name: 'Intercom', pattern: /widget\.intercom\.io|intercom-container/i, identifierExtract: /app_id[:\s'",=]+['"]([^'"]+)['"]/, category: 'chat' },
  { name: 'Drift', pattern: /js\.driftt\.com|drift\.load/i, identifierExtract: /drift\.load\(['"]([^'"]+)['"]/, category: 'chat' },
  { name: 'Crisp Chat', pattern: /client\.crisp\.chat/i, identifierExtract: /CRISP_WEBSITE_ID\s*=\s*['"]([^'"]+)['"]/, category: 'chat' },
  { name: 'Cloudflare Turnstile', pattern: /turnstile\.cloudflare\.com/, identifierExtract: /sitekey[:\s'",=]+['"]([^'"]+)['"]/, category: 'other' },
  { name: 'Cloudflare Insights', pattern: /static\.cloudflareinsights\.com/, identifierExtract: /token["\s:=]+['"]?([a-f0-9]+)["']?/, category: 'analytics' },
  { name: 'Cookiebot', pattern: /cookiebot\.com/, identifierExtract: /cbid[=\/]([a-f0-9-]+)/, category: 'consent' },
  { name: 'OneTrust', pattern: /cdn\.cookielaw\.org|onetrust-sdk/i, identifierExtract: /data-domain-script=['"]([^'"]+)['"]/, category: 'consent' },
  { name: 'Ahrefs Analytics', pattern: /analytics\.ahrefs\.com/, identifierExtract: /data-key=['"]([^'"]+)['"]/, category: 'analytics' },
  { name: 'Vector Tag', pattern: /cdn\.vector\.co\/pixel/, identifierExtract: /vector-tag=['"]([^'"]+)['"]/, category: 'analytics' },
  { name: 'GeoTargetly', pattern: /g10498469755\.co\/gr|geotargetly/i, identifierExtract: /id=([a-zA-Z0-9]+)/, category: 'other' },
  { name: 'Calendly Widget', pattern: /assets\.calendly\.com/, identifierExtract: /calendly/, category: 'other' },
  { name: 'socks-ui Accordion', pattern: /unpkg\.com\/socks-ui/, identifierExtract: /socks-ui@([\d.]+)/, category: 'other' },
  { name: 'Swiper.js', pattern: /cdn\.jsdelivr\.net\/npm\/swiper/, identifierExtract: /swiper@([\d.]+)/, category: 'other' },
  { name: 'GSAP', pattern: /cdn\.jsdelivr\.net\/npm\/gsap|cdnjs\.cloudflare\.com\/ajax\/libs\/gsap/, identifierExtract: /gsap@?([\d.]+)/, category: 'other' },
  { name: 'Clara Chat Widget', pattern: /clara\.cloudemployee\.io\/widget/, identifierExtract: /data-workspace-id=['"]([a-f0-9-]+)['"]/, category: 'chat' },
  { name: 'Finsweet Attributes', pattern: /cdn\.jsdelivr\.net\/npm\/@finsweet/, identifierExtract: /@finsweet\/attributes@([\d.]+)/, category: 'other' },
  { name: 'Vimeo Player', pattern: /player\.vimeo\.com/, identifierExtract: /vimeo\.com\/video\/(\d+)/, category: 'other' },
  { name: 'YouTube Embed', pattern: /youtube\.com\/embed|www\.youtube-nocookie\.com/, identifierExtract: /embed\/([A-Za-z0-9_-]+)/, category: 'other' },
];

interface FoundScriptRaw extends ThirdPartyScript {
  // intentionally empty — alias for clarity
}

function analyseScripts(html: string, scope: string): FoundScriptRaw[] {
  const $ = cheerio.load(html);
  const found: FoundScriptRaw[] = [];
  const seen = new Set<string>();

  $('script').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const inline = $(el).html() ?? '';
    const content = src + ' ' + inline;
    const dataWorkspaceId = $(el).attr('data-workspace-id');
    const dataDomainScript = $(el).attr('data-domain-script');
    const combinedForId = content + ' ' + (dataWorkspaceId ?? '') + ' ' + (dataDomainScript ?? '');

    for (const pattern of SCRIPT_PATTERNS) {
      if (!pattern.pattern.test(content)) continue;

      const idMatch = combinedForId.match(pattern.identifierExtract);
      const identifier = idMatch ? (idMatch[1] ?? pattern.name) : pattern.name;
      const key = `${pattern.name}:${identifier}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const parentTag = (el.parent as { name?: string } | undefined)?.name ?? '';
      const loadLocation: ThirdPartyScript['loadLocation'] =
        parentTag === 'head' ? 'head' : inline.length > 0 ? 'inline' : 'body_start';

      found.push({
        name: pattern.name,
        identifier,
        src: src || undefined,
        loadLocation,
        scope,
        rawSnippet: src
          ? `<script src="${src}"${dataWorkspaceId ? ` data-workspace-id="${dataWorkspaceId}"` : ''}></script>`
          : `<script>${inline.slice(0, 500)}</script>`,
        category: pattern.category,
      });
    }
  });

  return found;
}

export async function buildScriptInventory(
  pageContents: Record<string, { rawHtml?: string }>
): Promise<ScriptInventory> {
  const perPageScripts: Record<string, ThirdPartyScript[]> = {};
  const scriptFrequency = new Map<string, number>();
  const scriptExemplar = new Map<string, ThirdPartyScript>();
  let pagesWithHtml = 0;

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;
    pagesWithHtml++;
    const scripts = analyseScripts(content.rawHtml, urlPath);
    perPageScripts[urlPath] = scripts;

    for (const s of scripts) {
      const key = `${s.name}:${s.identifier}`;
      scriptFrequency.set(key, (scriptFrequency.get(key) ?? 0) + 1);
      if (!scriptExemplar.has(key)) scriptExemplar.set(key, s);
    }
  }

  const globalThreshold = Math.max(1, Math.floor(pagesWithHtml * 0.8));
  const globalScriptKeys = new Set<string>();
  for (const [key, count] of scriptFrequency.entries()) {
    if (count >= globalThreshold) globalScriptKeys.add(key);
  }

  const globalScripts: ThirdPartyScript[] = [];
  for (const key of globalScriptKeys) {
    const exemplar = scriptExemplar.get(key);
    if (exemplar) globalScripts.push({ ...exemplar, scope: 'global' });
  }

  const perPageResult: Record<string, ThirdPartyScript[]> = {};
  for (const [urlPath, scripts] of Object.entries(perPageScripts)) {
    const pageOnly = scripts.filter(s => !globalScriptKeys.has(`${s.name}:${s.identifier}`));
    if (pageOnly.length > 0) perPageResult[urlPath] = pageOnly;
  }

  const summary: ScriptInventory['summary'] = {
    hasGTM: globalScripts.some(s => s.name === 'Google Tag Manager'),
    gtmContainerIds: globalScripts.filter(s => s.name === 'Google Tag Manager').map(s => s.identifier),
    hasGA4: globalScripts.some(s => s.name === 'GA4'),
    ga4MeasurementIds: globalScripts.filter(s => s.name === 'GA4').map(s => s.identifier),
    hasLinkedIn: globalScripts.some(s => s.name === 'LinkedIn Insight'),
    linkedInPartnerId: globalScripts.find(s => s.name === 'LinkedIn Insight')?.identifier,
    hasCookieConsent: globalScripts.some(s => s.category === 'consent'),
    cookieConsentProvider: globalScripts.find(s => s.category === 'consent')?.name,
    hasChat: globalScripts.some(s => s.category === 'chat'),
    chatProvider: globalScripts.find(s => s.category === 'chat')?.name,
    hasHeatmap: globalScripts.some(s => s.category === 'heatmap'),
    heatmapProvider: globalScripts.find(s => s.category === 'heatmap')?.name,
    otherScripts: globalScripts.filter(s => s.category === 'other').map(s => s.name),
  };

  const inventory: ScriptInventory = { global: globalScripts, perPage: perPageResult, summary };
  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-scripts.json'), JSON.stringify(inventory, null, 2));

  console.log('Script inventory complete:');
  console.log(`  Pages analysed:     ${pagesWithHtml}`);
  console.log(`  Global scripts:     ${globalScripts.length}`);
  console.log(`  Pages with unique:  ${Object.keys(perPageResult).length}`);
  console.log(`  GTM:                ${summary.hasGTM ? summary.gtmContainerIds.join(', ') : 'no'}`);
  console.log(`  GA4:                ${summary.hasGA4 ? summary.ga4MeasurementIds.join(', ') : 'no'}`);
  console.log(`  LinkedIn:           ${summary.hasLinkedIn ? summary.linkedInPartnerId : 'no'}`);
  console.log(`  Cookie consent:     ${summary.hasCookieConsent ? summary.cookieConsentProvider : 'no'}`);
  console.log(`  Chat:               ${summary.hasChat ? summary.chatProvider : 'no'}`);
  console.log(`  Heatmap:            ${summary.hasHeatmap ? summary.heatmapProvider : 'no'}`);
  console.log(`  Other (global):     ${summary.otherScripts.join(', ') || 'none'}`);

  return inventory;
}
