// MYGRATR-STATIC-2 Step 4 — seed-globals-v2.
//
// Reads Step 1 audit outputs (audit-output/static-2/*.json + asset files),
// resolves references by slug, uploads inline How It Works mega-menu photos,
// and rewrites the `navigation` + `footer` globals with the v2 structure.
// Also patches `tagline` on every service + technology doc that matched
// a captured tagline in the audit.
//
// Idempotent across re-runs:
//   - createOrReplace on globals → clean overwrite
//   - asset uploads are content-hashed by Sanity → re-uploads return same
//     asset reference for the same file
//   - tagline patches use .patch().set() with conditional-spread (skip
//     null/empty; never write 'null' literal)
//
// Locked decisions threaded through (Step 4 go from Jake):
//   A. Hand-curated 3 customerStory refs (Salmon Software, Willo,
//      Event Connections). Fail loudly if any doesn't resolve by slug.
//   B. Hand-curated 3 blogPost refs by exact slug (spans 3 namespaces
//      per DELTA-D). Fail loudly if any doesn't resolve.
//   C. Footer primary CTA = "Book A Call" → /book-a-call per live-site
//      audit + DELTA-A. Brief's "Start building your team" is superseded.
//   DELTA-6. "CE vs. Alternatives" url rewritten from live-captured
//      /compare → /alternatives (HUB_CONFIG canonical).
//   DELTA-B. Service icons absent from live site; no service.thumbnail
//      backfill happens here. Services mega-menu renders text-only.
//
// Author-voice rule (Jake's persistent memory): no em or en dashes.
// `normalize()` strips them. Every string written to Sanity passes through.
//
// Run: `npm run static:seed-globals-v2`
// Token: SANITY_MIGRATION_WRITE_TOKEN

import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { createClient } from '@sanity/client'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// ────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────

const AUDIT_DIR = path.resolve(process.cwd(), 'audit-output', 'static-2')
const CE_HOST = 'https://www.cloudemployee.io'

const FEATURED_CUSTOMER_STORIES = ['salmon-software', 'willo', 'event-connections'] as const
const FEATURED_BLOG_POSTS = [
  'nearshore-software-development-how-to-choose-the-right-vendor',
  'hiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development',
  'building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models',
] as const

// Read-only client for slug → docId lookups. Uses no token (public read
// of the production dataset is sufficient for these queries) and bypasses
// the CDN so we get post-deploy schema fields.
const sanityRead = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'lzbhll1u',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function url(p: string): string {
  return `${CE_HOST}${p}`
}

async function readJson<T>(filename: string): Promise<T> {
  const fullPath = path.join(AUDIT_DIR, filename)
  const raw = await fs.readFile(fullPath, 'utf8')
  return JSON.parse(raw) as T
}

function pathFromUrl(u: string): string | null {
  try {
    return new URL(u).pathname
  } catch {
    return null
  }
}

function slugFromUrl(u: string): { slug: string; routePrefix: string } | null {
  const p = pathFromUrl(u)
  if (!p) return null
  const parts = p.split('/').filter(Boolean)
  if (parts.length < 2) return null
  return { slug: parts[parts.length - 1], routePrefix: parts[0] }
}

// Strip trailing junk from the audit's bottomBar.copyrightText (regex over-grabbed).
// Keep everything up to and including "All rights reserved." — drop the rest.
function sanitizeCopyright(captured: string | null | undefined): string {
  if (!captured) return '© {year} Cloud Employee. All rights reserved.'
  const m = captured.match(/©[^©]*?All rights reserved\.?/)
  return normalize(m ? m[0] : '© {year} Cloud Employee. All rights reserved.').replace(/\d{4}/, '{year}')
}

// Rewrite live-faithful /compare → /alternatives for "CE vs. Alternatives"
// links per STATIC-2-DELTA-6.
function rewriteAlternativesUrl(label: string, captured: string): string {
  if (/^ce vs\.? alternatives$/i.test(label)) {
    return captured.replace('/compare', '/alternatives')
  }
  return captured
}

// ────────────────────────────────────────────────────────────────────────
// Audit JSON types (loose — we trust the script that wrote them)
// ────────────────────────────────────────────────────────────────────────

interface CapturedItem {
  label: string
  url: string
  tagline: string | null
  iconSource: string | null
  iconUrl: string | null
  iconName: string | null
  iconSvgInline: string | null
  iconAlt: string | null
}

interface NavigationCapture {
  primaryLinks: Array<{ label: string; url: string; dropdownType: string }>
  ctaButton: { label: string; url: string; captureMethod: string; captureNotes: string }
  servicesMegaMenu: {
    leftColumn: {
      sectionLabel: string
      sectionLink: string | null
      sectionLabelStyle: string
      highlightedItems?: CapturedItem[]
      items: CapturedItem[]
    }
    rightColumnTop: { sectionLabel: string; sectionLink: string | null; sectionLabelStyle: string; items: CapturedItem[] }
    rightColumnBottom: {
      sections: Array<{ sectionLabel: string; sectionLink: string | null; sectionLabelStyle: string; items: CapturedItem[] }>
    }
  }
  howItWorksMegaMenu: {
    cards: Array<{ title: string; subtitle: string; imageUrl: string; imageAlt: string; ctaLabel: string; ctaUrl: string }>
    bottomPanel: { heading: string; subheading: string; ctaLabel: string; ctaUrl: string; imageUrl: string; imageAlt: string }
  }
  resourcesMegaMenu: {
    leftColumn: { sectionLabel: string; items: Array<{ label: string; url: string; iconSource: string | null; iconUrl: string | null; iconName: string | null; iconAlt: string | null }> }
    middleColumn: { sectionLabel: string; viewAllLink: { label: string; url: string } | null }
    rightColumn: { sectionLabel: string; viewAllLink: { label: string; url: string } | null }
  }
}

interface FooterCapture {
  topCtaBlock: {
    heading: string
    statRow: string
    primaryCta: { label: string; url: string; captureMethod: string; captureNotes: string }
    secondaryCta: { label: string; url: string; captureMethod: string; captureNotes: string }
  }
  sections: Array<{
    sectionLabel: string
    sectionLabelStyle: string
    columns: Array<{ heading: string; headingHasArrow: boolean; headingUrl: string | null; links: Array<{ label: string; url: string; hasArrow?: boolean }> }>
    bottomPillLinks: Array<{ label: string; url: string; hasArrow: boolean }> | null
  }>
  talentLocations: {
    sectionLabel: string
    sectionLabelStyle: string
    items: Array<{ label: string; url: string }>
  }
  subscribe: { heading: string; description: string; formId: string; submitLabel: string }
  bottomBar: {
    copyrightText: string
    links: Array<{ label: string; url: string }>
    regionSelector: { enabled: boolean; options: Array<{ label: string; url: string }> }
  }
}

interface SlugMatchEntry {
  label: string
  url: string
  capturedTagline: string | null
  capturedIconUrl: string | null
  matchStatus: 'matched' | 'orphan'
  matchedDocId: string | null
  matchedDocType: 'service' | 'technology' | null
  matchedDocThumbnail: string | null
}
interface SlugMatchReport {
  totalProbed: number
  matched: number
  orphans: number
  entries: SlugMatchEntry[]
}

interface HiwPhotoComparison {
  decision: string
  reason: string
  capturedPhotos: Array<{ key: string; liveUrl: string; localPath: string }>
}

// ────────────────────────────────────────────────────────────────────────
// Slug resolution (with fail-loudly semantics)
// ────────────────────────────────────────────────────────────────────────

async function resolveSlugsByType(
  type: 'service' | 'technology' | 'blogPost' | 'customerStory',
  slugs: string[],
): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map()
  const query = `*[_type==$type && slug.current in $slugs]{_id, "slug": slug.current}`
  const rows = (await sanityRead.fetch<Array<{ _id: string; slug: string }>>(query, { type, slugs })) ?? []
  const found = new Map(rows.map((r) => [r.slug, r._id]))
  return found
}

async function resolveMegaMenuItemRefs(items: CapturedItem[]): Promise<Array<{ _id: string; _type: 'service' | 'technology'; sourceItem: CapturedItem }>> {
  const serviceSlugs: string[] = []
  const technologySlugs: string[] = []
  const meta: Array<{ slug: string; type: 'service' | 'technology'; sourceItem: CapturedItem }> = []
  for (const item of items) {
    const s = slugFromUrl(item.url)
    if (!s) continue
    if (s.routePrefix === 'services') {
      serviceSlugs.push(s.slug)
      meta.push({ slug: s.slug, type: 'service', sourceItem: item })
    } else if (s.routePrefix === 'technology') {
      technologySlugs.push(s.slug)
      meta.push({ slug: s.slug, type: 'technology', sourceItem: item })
    }
  }
  const [serviceMap, technologyMap] = await Promise.all([
    resolveSlugsByType('service', serviceSlugs),
    resolveSlugsByType('technology', technologySlugs),
  ])
  const resolved: Array<{ _id: string; _type: 'service' | 'technology'; sourceItem: CapturedItem }> = []
  const orphans: string[] = []
  for (const m of meta) {
    const map = m.type === 'service' ? serviceMap : technologyMap
    const id = map.get(m.slug)
    if (!id) {
      orphans.push(`${m.type}/${m.slug} (label: ${m.sourceItem.label})`)
      continue
    }
    resolved.push({ _id: id, _type: m.type, sourceItem: m.sourceItem })
  }
  if (orphans.length > 0) {
    throw new Error(
      `mega-menu reference resolution: ${orphans.length} unmatched slug(s) — ${orphans.join(', ')}`,
    )
  }
  return resolved
}

// ────────────────────────────────────────────────────────────────────────
// Reference array builders (used in Sanity payload)
// ────────────────────────────────────────────────────────────────────────

function refArray(
  resolved: Array<{ _id: string; _type: 'service' | 'technology' }>,
  keyPrefix: string,
): Array<{ _key: string; _type: 'reference'; _ref: string }> {
  return resolved.map((r, i) => ({
    _key: `${keyPrefix}-${i}`,
    _type: 'reference' as const,
    _ref: r._id,
  }))
}

// ────────────────────────────────────────────────────────────────────────
// Tagline patches
// ────────────────────────────────────────────────────────────────────────

async function patchTaglines(slugMatch: SlugMatchReport): Promise<{ patched: number; skipped: number; sample: Array<{ docId: string; label: string; tagline: string }> }> {
  let patched = 0
  let skipped = 0
  const sample: Array<{ docId: string; label: string; tagline: string }> = []
  for (const entry of slugMatch.entries) {
    if (entry.matchStatus !== 'matched') continue
    if (!entry.matchedDocId) continue
    const raw = entry.capturedTagline?.trim()
    if (!raw) {
      skipped++
      continue
    }
    const tagline = normalize(raw)
    if (!tagline) {
      skipped++
      continue
    }
    await sanityWriteClient.patch(entry.matchedDocId).set({ tagline }).commit()
    patched++
    if (sample.length < 3) sample.push({ docId: entry.matchedDocId, label: entry.label, tagline })
  }
  return { patched, skipped, sample }
}

// ────────────────────────────────────────────────────────────────────────
// Asset uploads (How It Works photos — Option B locked)
// ────────────────────────────────────────────────────────────────────────

interface UploadedAsset {
  _id: string
  url: string
  filename: string
}

async function uploadImageAsset(localPath: string, filename: string, contentType: string): Promise<UploadedAsset> {
  const buf = await fs.readFile(localPath)
  const asset = await sanityWriteClient.assets.upload('image', buf, { filename, contentType })
  return { _id: asset._id, url: asset.url, filename }
}

function contentTypeFromPath(p: string): string {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.avif') return 'image/avif'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.gif') return 'image/gif'
  return 'application/octet-stream'
}

async function uploadHowItWorksPhotos(comparison: HiwPhotoComparison): Promise<{
  byKey: Map<string, UploadedAsset>
  uploadedCount: number
  warnings: string[]
}> {
  const byKey = new Map<string, UploadedAsset>()
  const warnings: string[] = []
  for (const p of comparison.capturedPhotos) {
    const abs = path.resolve(process.cwd(), p.localPath)
    try {
      await fs.access(abs)
    } catch {
      warnings.push(`HIW photo missing on disk: ${p.localPath} (key: ${p.key}) — skipping upload`)
      continue
    }
    const filename = `hiw-${p.key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${path.extname(p.localPath)}`
    const ct = contentTypeFromPath(p.localPath)
    const uploaded = await uploadImageAsset(abs, filename, ct)
    byKey.set(p.key, uploaded)
    // DELTA-flag: bottomPanel photo in audit is actually the white-arrow icon
    // (capture heuristic picked the wrong image). Uploading faithful to audit;
    // Seb can replace via Studio post-reseed.
    if (p.key === 'bottomPanel' && /arrow|white-arrow|black-arrow/i.test(p.liveUrl)) {
      warnings.push(
        `HIW bottomPanel image is the live arrow icon (${p.liveUrl}) — uploaded faithful to audit, but visually incorrect. Replace via Studio.`,
      )
    }
  }
  return { byKey, uploadedCount: byKey.size, warnings }
}

// ────────────────────────────────────────────────────────────────────────
// Navigation payload builder
// ────────────────────────────────────────────────────────────────────────

interface MegaMenuItemResolved {
  _id: string
  _type: 'service' | 'technology'
  sourceItem: CapturedItem
}

interface NavigationBuildContext {
  capture: NavigationCapture
  servicesItems: {
    highlighted: MegaMenuItemResolved[]
    leftFlat: MegaMenuItemResolved[]
    techTop: MegaMenuItemResolved[]
    aiServices: MegaMenuItemResolved[]
    productBuilds: MegaMenuItemResolved[]
  }
  hiwAssets: Map<string, UploadedAsset>
  featuredStoryIds: string[]
  featuredBlogIds: string[]
}

function assetRef(uploaded: UploadedAsset | undefined, alt: string): { _type: 'image'; asset: { _ref: string; _type: 'reference' }; alt: string } | undefined {
  if (!uploaded) return undefined
  return {
    _type: 'image',
    asset: { _ref: uploaded._id, _type: 'reference' },
    alt: normalize(alt) || 'image',
  }
}

function buildNavigationDoc(ctx: NavigationBuildContext): { _id: string; _type: string; [key: string]: unknown } {
  const cap = ctx.capture

  // primaryLinks: 6 links per STATIC-2 reseed. Captured primaryLinks already
  // has 6 in correct order (Services / Our Clients / How It Works / Resources /
  // Pricing / About Us). Per DELTA-5: "Our Clients" → /our-work.
  const primaryLinks = cap.primaryLinks.map((l, i) => ({
    _key: `pl-${i}`,
    _type: 'primaryLink' as const,
    label: normalize(l.label),
    url: l.url,
    dropdownType: l.dropdownType,
    // Legacy fields kept empty (regression safety preserves STATIC-1 reads)
    cmsDriven: false,
    dropdownItems: [] as unknown[],
  }))

  // Services mega-menu — references built from resolved slug map
  const servicesMegaMenu = {
    _type: 'object' as const,
    leftColumn: {
      _type: 'object' as const,
      sectionLabel: normalize(cap.servicesMegaMenu.leftColumn.sectionLabel),
      sectionLink: cap.servicesMegaMenu.leftColumn.sectionLink ?? undefined,
      sectionLabelStyle: cap.servicesMegaMenu.leftColumn.sectionLabelStyle,
      highlightedItems: refArray(ctx.servicesItems.highlighted, 'svc-hl'),
      items: refArray(ctx.servicesItems.leftFlat, 'svc-lf'),
    },
    rightColumnTop: {
      _type: 'object' as const,
      sectionLabel: normalize(cap.servicesMegaMenu.rightColumnTop.sectionLabel),
      sectionLink: cap.servicesMegaMenu.rightColumnTop.sectionLink ?? undefined,
      sectionLabelStyle: cap.servicesMegaMenu.rightColumnTop.sectionLabelStyle,
      items: refArray(ctx.servicesItems.techTop, 'svc-tech'),
      viewAllLink: { label: 'View all', url: url('/technology') },
    },
    rightColumnBottom: {
      _type: 'object' as const,
      sections: [
        {
          _key: 'svc-ai',
          _type: 'servicesSubsection' as const,
          sectionLabel: 'AI Services',
          sectionLabelStyle: 'pill-gradient' as const,
          items: refArray(ctx.servicesItems.aiServices, 'svc-ai-i'),
        },
        {
          _key: 'svc-pb',
          _type: 'servicesSubsection' as const,
          sectionLabel: 'Product Builds',
          sectionLabelStyle: 'pill-navy' as const,
          items: refArray(ctx.servicesItems.productBuilds, 'svc-pb-i'),
        },
      ],
    },
  }

  // How It Works mega-menu — inline images (Option B)
  const hiwCardsCapture = cap.howItWorksMegaMenu.cards
  const hiwCards = hiwCardsCapture.map((card, i) => {
    const uploaded = ctx.hiwAssets.get(card.title)
    const image = assetRef(uploaded, card.imageAlt || card.title)
    return {
      _key: `hiw-card-${i}`,
      _type: 'howItWorksCard' as const,
      title: normalize(card.title),
      subtitle: normalize(card.subtitle),
      ...(image ? { image } : {}),
      ctaLabel: normalize(card.ctaLabel || 'Learn more'),
      ctaUrl: card.ctaUrl,
    }
  })
  const bottomPanelCapture = cap.howItWorksMegaMenu.bottomPanel
  const bottomPanelUploaded = ctx.hiwAssets.get('bottomPanel')
  const bottomPanelImage = assetRef(bottomPanelUploaded, bottomPanelCapture.imageAlt || 'How It Works panel image')
  const howItWorksMegaMenu = {
    _type: 'object' as const,
    cards: hiwCards,
    bottomPanel: {
      _type: 'object' as const,
      heading: normalize(bottomPanelCapture.heading),
      subheading: normalize(bottomPanelCapture.subheading || 'This is nearshoring that actually works.'),
      ctaLabel: normalize(bottomPanelCapture.ctaLabel),
      ctaUrl: bottomPanelCapture.ctaUrl,
      ...(bottomPanelImage ? { image: bottomPanelImage } : {}),
    },
  }

  // Resources mega-menu — left items use material-font icons; middle + right
  // use references to blogPost + customerStory (Decisions A + B)
  const resourcesLeftItems = cap.resourcesMegaMenu.leftColumn.items.map((it, i) => ({
    _key: `rsrc-left-${i}`,
    _type: 'resourcesLeftItem' as const,
    label: normalize(it.label),
    url: it.url,
    icon: {
      _type: 'object' as const,
      source: it.iconSource === 'material-font' ? 'material-font' : it.iconSource === 'img-src' || it.iconSource === 'background-image' || it.iconSource === 'inline-svg' ? 'asset' : null,
      ...(it.iconName ? { name: it.iconName } : {}),
      // asset + alt not populated for material-font case
    },
  }))

  const resourcesMegaMenu = {
    _type: 'object' as const,
    leftColumn: {
      _type: 'object' as const,
      sectionLabel: 'Resources',
      items: resourcesLeftItems,
    },
    middleColumn: {
      _type: 'object' as const,
      sectionLabel: 'Blogs',
      viewAllLink: { label: 'View all', url: url('/blog') },
      featuredPosts: ctx.featuredBlogIds.map((id, i) => ({
        _key: `rsrc-post-${i}`,
        _type: 'reference' as const,
        _ref: id,
      })),
    },
    rightColumn: {
      _type: 'object' as const,
      sectionLabel: 'Customer Stories',
      viewAllLink: { label: 'View all', url: url('/customer-stories') },
      featuredStories: ctx.featuredStoryIds.map((id, i) => ({
        _key: `rsrc-story-${i}`,
        _type: 'reference' as const,
        _ref: id,
      })),
    },
  }

  // CTA button — locked canonical Calendly URL (DELTA-A's audit-captured
  // CTA was already canonical-fallback to this URL; we use the same here)
  const ctaButton = {
    _type: 'object' as const,
    label: normalize(cap.ctaButton.label || 'Schedule a Call'),
    link: cap.ctaButton.url || 'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee',
    type: 'calendly' as const,
  }

  // Locale dropdown — kept for STATIC-1 regression safety; STATIC-3 will
  // strip the Header switcher (region moves to Footer's regionSelector).
  const localeDropdown = {
    _type: 'object' as const,
    enabled: true,
    options: [
      {
        _key: 'loc-us',
        _type: 'localeOption' as const,
        label: 'United States',
        url: 'https://www.cloudemployee.io/',
        hreflang: 'en',
      },
      {
        _key: 'loc-uk',
        _type: 'localeOption' as const,
        label: 'United Kingdom',
        url: 'https://www.cloudemployee.io/uk',
        hreflang: 'en-GB',
      },
    ],
  }

  return {
    _id: 'navigation',
    _type: 'navigation',
    primaryLinks,
    ctaButton,
    localeDropdown,
    announcementBar: {
      _type: 'object' as const,
      enabled: true,
      badgeLabel: 'NEW',
      message: 'Compare engineer costs by region with our live Price Calculator.',
      linkLabel: 'Open calculator',
      linkUrl: '/pricing',
    },
    servicesMegaMenu,
    howItWorksMegaMenu,
    resourcesMegaMenu,
  }
}

// ────────────────────────────────────────────────────────────────────────
// Footer payload builder
// ────────────────────────────────────────────────────────────────────────

function buildFooterDoc(cap: FooterCapture): { _id: string; _type: string; [key: string]: unknown } {
  // Decision C — primary CTA uses captured "Book A Call" → /book-a-call
  const primaryCta = {
    _type: 'object' as const,
    label: normalize(cap.topCtaBlock.primaryCta.label),
    url: cap.topCtaBlock.primaryCta.url,
  }
  const secondaryCta = {
    _type: 'object' as const,
    label: normalize(cap.topCtaBlock.secondaryCta.label),
    url: cap.topCtaBlock.secondaryCta.url,
  }

  const sections = cap.sections.map((sec, si) => ({
    _key: `fs-${si}`,
    _type: 'footerSection' as const,
    sectionLabel: normalize(sec.sectionLabel),
    sectionLabelStyle: sec.sectionLabelStyle,
    columns: sec.columns.map((col, ci) => ({
      _key: `fs-${si}-c-${ci}`,
      _type: 'footerSectionColumn' as const,
      heading: normalize(col.heading),
      headingHasArrow: col.headingHasArrow,
      ...(col.headingUrl ? { headingUrl: col.headingUrl } : {}),
      links: col.links.map((l, li) => ({
        _key: `fs-${si}-c-${ci}-l-${li}`,
        _type: 'footerSectionLink' as const,
        label: normalize(l.label),
        url: rewriteAlternativesUrl(l.label, l.url),
      })),
    })),
    ...(sec.bottomPillLinks
      ? {
          bottomPillLinks: sec.bottomPillLinks.map((p, pi) => ({
            _key: `fs-${si}-p-${pi}`,
            _type: 'footerBottomPillLink' as const,
            label: normalize(p.label),
            url: p.url,
            hasArrow: p.hasArrow,
            variant: 'pill-outline-light' as const,
          })),
        }
      : {}),
  }))

  const talentLocations = {
    _type: 'object' as const,
    sectionLabel: normalize(cap.talentLocations.sectionLabel),
    sectionLabelStyle: cap.talentLocations.sectionLabelStyle,
    items: cap.talentLocations.items.map((it, i) => ({
      _key: `tl-${i}`,
      _type: 'talentLocationItem' as const,
      label: normalize(it.label),
      url: it.url,
    })),
  }

  const subscribe = {
    _type: 'object' as const,
    heading: normalize(cap.subscribe.heading),
    description: normalize(cap.subscribe.description),
    formId: cap.subscribe.formId,
    submitLabel: normalize(cap.subscribe.submitLabel),
  }

  const bottomBar = {
    _type: 'object' as const,
    copyrightText: sanitizeCopyright(cap.bottomBar.copyrightText),
    links: cap.bottomBar.links.map((l, i) => ({
      _key: `bb-l-${i}`,
      _type: 'bottomBarLink' as const,
      label: normalize(l.label),
      url: l.url,
    })),
    regionSelector: {
      _type: 'object' as const,
      enabled: !!cap.bottomBar.regionSelector?.enabled,
      options: (cap.bottomBar.regionSelector?.options ?? []).map((o, i) => ({
        _key: `bb-r-${i}`,
        _type: 'regionOption' as const,
        label: normalize(o.label),
        url: o.url,
      })),
    },
  }

  // Legacy fields kept populated for STATIC-1 Footer render regression safety.
  // STATIC-3 swaps reads to the new fields above; legacy stops being read but
  // stays in schema until cleanup phase.
  const legacyColumns = [
    {
      _key: 'leg-fc-0',
      _type: 'footerColumn' as const,
      heading: 'Full-time Staff Augmentation',
      links: cap.sections[0]?.columns[0]?.links.map((l, li) => ({
        _key: `leg-fc-0-l-${li}`,
        _type: 'footerLink' as const,
        label: normalize(l.label),
        url: l.url,
      })) ?? [],
    },
    {
      _key: 'leg-fc-1',
      _type: 'footerColumn' as const,
      heading: 'Technology',
      links: cap.sections[0]?.columns[1]?.links.map((l, li) => ({
        _key: `leg-fc-1-l-${li}`,
        _type: 'footerLink' as const,
        label: normalize(l.label),
        url: l.url,
      })) ?? [],
    },
    {
      _key: 'leg-fc-2',
      _type: 'footerColumn' as const,
      heading: 'About',
      links: cap.sections[1]?.columns[0]?.links.map((l, li) => ({
        _key: `leg-fc-2-l-${li}`,
        _type: 'footerLink' as const,
        label: normalize(l.label),
        url: l.url,
      })) ?? [],
    },
    {
      _key: 'leg-fc-3',
      _type: 'footerColumn' as const,
      heading: 'Resources',
      links:
        cap.sections[1]?.columns[1]?.links.map((l, li) => ({
          _key: `leg-fc-3-l-${li}`,
          _type: 'footerLink' as const,
          label: normalize(l.label),
          url: rewriteAlternativesUrl(l.label, l.url),
        })) ?? [],
    },
  ]

  return {
    _id: 'footer',
    _type: 'footer',
    // STATIC-2 new structure:
    topCtaBlock: {
      _type: 'object' as const,
      enabled: true,
      heading: normalize(cap.topCtaBlock.heading),
      statRow: normalize(cap.topCtaBlock.statRow),
      primaryCta,
      secondaryCta,
    },
    sections,
    talentLocations,
    subscribe,
    bottomBar,
    // Legacy fields preserved for regression safety:
    newsletterFormId: cap.subscribe.formId,
    copyrightText: sanitizeCopyright(cap.bottomBar.copyrightText),
    columns: legacyColumns,
    legalLinks: cap.bottomBar.links.map((l, i) => ({
      _key: `leg-leg-${i}`,
      _type: 'legalLink' as const,
      label: normalize(l.label),
      url: l.url,
    })),
  }
}

// ────────────────────────────────────────────────────────────────────────
// Post-write verification
// ────────────────────────────────────────────────────────────────────────

interface VerifyResult {
  pass: boolean
  navigation: {
    primaryLinkCount: number
    servicesMegaMenuPopulated: boolean
    howItWorksMegaMenuPopulated: boolean
    resourcesMegaMenuPopulated: boolean
    referencesResolved: number
    referencesBroken: number
  }
  footer: {
    topCtaBlockPopulated: boolean
    sectionsPopulated: boolean
    talentLocationsPopulated: boolean
    subscribePopulated: boolean
    bottomBarPopulated: boolean
    legacyFieldsPopulated: boolean
    alternativesUrlSeen: boolean
    compareUrlSeen: boolean
  }
  taglines: {
    populatedCount: number
    sampleDocs: Array<{ _id: string; _type: string; name: string; tagline: string }>
  }
  hiwAssets: {
    cardsWithImage: number
    bottomPanelHasImage: boolean
  }
  newAssetCount: number
}

async function verifyState(baselineAssetCount: number): Promise<VerifyResult> {
  const nav = await sanityRead.fetch<Record<string, unknown> | null>(
    `*[_id == "navigation"][0]{
      _id,
      primaryLinks,
      servicesMegaMenu,
      howItWorksMegaMenu,
      resourcesMegaMenu,
      "resolvedItems": servicesMegaMenu.leftColumn.highlightedItems[]->_id + servicesMegaMenu.leftColumn.items[]->_id + servicesMegaMenu.rightColumnTop.items[]->_id + servicesMegaMenu.rightColumnBottom.sections[].items[]->_id,
      "resolvedFeaturedPosts": resourcesMegaMenu.middleColumn.featuredPosts[]->_id,
      "resolvedFeaturedStories": resourcesMegaMenu.rightColumn.featuredStories[]->_id
    }`,
  )
  const navAny = nav as
    | (Record<string, unknown> & {
        primaryLinks?: unknown[]
        servicesMegaMenu?: unknown
        howItWorksMegaMenu?: { cards?: Array<{ image?: { asset?: { _ref?: string } } }>; bottomPanel?: { image?: { asset?: { _ref?: string } } } }
        resourcesMegaMenu?: unknown
        resolvedItems?: Array<string | null>
        resolvedFeaturedPosts?: Array<string | null>
        resolvedFeaturedStories?: Array<string | null>
      })
    | null

  const footer = await sanityRead.fetch<Record<string, unknown> | null>(
    `*[_id == "footer"][0]{
      _id,
      topCtaBlock,
      sections,
      talentLocations,
      subscribe,
      bottomBar,
      newsletterFormId,
      copyrightText,
      columns,
      legalLinks
    }`,
  )
  const footerAny = footer as (Record<string, unknown> & { sections?: unknown[]; columns?: unknown[]; legalLinks?: unknown[] }) | null

  const allRefs = [
    ...(navAny?.resolvedItems ?? []),
    ...(navAny?.resolvedFeaturedPosts ?? []),
    ...(navAny?.resolvedFeaturedStories ?? []),
  ]
  const broken = allRefs.filter((r) => r === null || r === undefined).length

  // Tagline sample query
  const taglineCount = await sanityRead.fetch<number>(
    `count(*[_type in ["service", "technology"] && defined(tagline) && tagline != ""])`,
  )
  const taglineSample = await sanityRead.fetch<Array<{ _id: string; _type: string; name: string; tagline: string }>>(
    `*[_type in ["service", "technology"] && defined(tagline) && tagline != ""]{
      _id, _type, "name": coalesce(name, technologyName), tagline
    }[0..2]`,
  )

  // Alternatives URL probe
  const altQuery = await sanityRead.fetch<Array<string>>(
    `*[_id == "footer"][0].sections[].columns[].links[].url + *[_id == "footer"][0].columns[].links[].url`,
  )
  const altUrls = (altQuery ?? []).filter(Boolean)
  const compareSeen = altUrls.some((u) => u.includes('/compare'))
  const alternativesSeen = altUrls.some((u) => u.includes('/alternatives'))

  // Asset count delta
  const currentAssetCount = await sanityRead.fetch<number>(`count(*[_type == "sanity.imageAsset"])`)
  const newAssetCount = currentAssetCount - baselineAssetCount

  const cardsWithImage = (navAny?.howItWorksMegaMenu?.cards ?? []).filter((c) => !!c?.image?.asset?._ref).length
  const bottomPanelHasImage = !!navAny?.howItWorksMegaMenu?.bottomPanel?.image?.asset?._ref

  const result: VerifyResult = {
    pass:
      !!navAny &&
      !!navAny.servicesMegaMenu &&
      !!navAny.howItWorksMegaMenu &&
      !!navAny.resourcesMegaMenu &&
      !!footerAny &&
      !!footerAny.sections &&
      !!footerAny.topCtaBlock &&
      broken === 0 &&
      alternativesSeen &&
      !compareSeen,
    navigation: {
      primaryLinkCount: Array.isArray(navAny?.primaryLinks) ? navAny.primaryLinks.length : 0,
      servicesMegaMenuPopulated: !!navAny?.servicesMegaMenu,
      howItWorksMegaMenuPopulated: !!navAny?.howItWorksMegaMenu,
      resourcesMegaMenuPopulated: !!navAny?.resourcesMegaMenu,
      referencesResolved: allRefs.filter((r) => !!r).length,
      referencesBroken: broken,
    },
    footer: {
      topCtaBlockPopulated: !!(footerAny as Record<string, unknown> | null)?.topCtaBlock,
      sectionsPopulated: Array.isArray((footerAny as Record<string, unknown> | null)?.sections) && ((footerAny as { sections?: unknown[] } | null)?.sections?.length ?? 0) > 0,
      talentLocationsPopulated: !!(footerAny as Record<string, unknown> | null)?.talentLocations,
      subscribePopulated: !!(footerAny as Record<string, unknown> | null)?.subscribe,
      bottomBarPopulated: !!(footerAny as Record<string, unknown> | null)?.bottomBar,
      legacyFieldsPopulated:
        Array.isArray((footerAny as Record<string, unknown> | null)?.columns) &&
        ((footerAny as { columns?: unknown[] } | null)?.columns?.length ?? 0) > 0,
      alternativesUrlSeen: alternativesSeen,
      compareUrlSeen: compareSeen,
    },
    taglines: {
      populatedCount: taglineCount,
      sampleDocs: taglineSample,
    },
    hiwAssets: {
      cardsWithImage,
      bottomPanelHasImage,
    },
    newAssetCount,
  }
  return result
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('STATIC-2 Step 4: seed-globals-v2\n')

  // ── Read audit inputs
  console.log('[1/8] reading audit inputs...')
  const navigationCapture = await readJson<NavigationCapture>('navigation.json')
  const footerCapture = await readJson<FooterCapture>('footer.json')
  const slugMatchReport = await readJson<SlugMatchReport>('slug-match-report.json')
  const hiwComparison = await readJson<HiwPhotoComparison>('how-it-works-photo-comparison.json')
  console.log(`  navigation primary links: ${navigationCapture.primaryLinks.length}`)
  console.log(`  slug-match: ${slugMatchReport.matched}/${slugMatchReport.totalProbed} matched, ${slugMatchReport.orphans} orphans`)

  // ── Baseline asset count (for verification delta)
  const baselineAssetCount = await sanityRead.fetch<number>(`count(*[_type == "sanity.imageAsset"])`)
  console.log(`  baseline asset count: ${baselineAssetCount}`)

  // ── Resolve Decision A + B references (fail loudly on misses)
  console.log('\n[2/8] resolving Decision A + B references (fail-loudly)...')
  const customerStoryMap = await resolveSlugsByType('customerStory', [...FEATURED_CUSTOMER_STORIES])
  const missingStories = FEATURED_CUSTOMER_STORIES.filter((s) => !customerStoryMap.has(s))
  if (missingStories.length > 0) {
    throw new Error(`Decision A — unresolved customerStory slugs: ${missingStories.join(', ')}`)
  }
  const featuredStoryIds = FEATURED_CUSTOMER_STORIES.map((s) => customerStoryMap.get(s) as string)
  console.log(`  Decision A customerStory ids: ${featuredStoryIds.join(', ')}`)

  const blogPostMap = await resolveSlugsByType('blogPost', [...FEATURED_BLOG_POSTS])
  const missingBlogs = FEATURED_BLOG_POSTS.filter((s) => !blogPostMap.has(s))
  if (missingBlogs.length > 0) {
    throw new Error(`Decision B — unresolved blogPost slugs: ${missingBlogs.join(', ')}`)
  }
  const featuredBlogIds = FEATURED_BLOG_POSTS.map((s) => blogPostMap.get(s) as string)
  console.log(`  Decision B blogPost ids: ${featuredBlogIds.join(', ')}`)

  // ── Resolve mega-menu service/technology references (5 groups)
  console.log('\n[3/8] resolving Services mega-menu references...')
  const highlighted = await resolveMegaMenuItemRefs(navigationCapture.servicesMegaMenu.leftColumn.highlightedItems ?? [])
  const leftFlat = await resolveMegaMenuItemRefs(navigationCapture.servicesMegaMenu.leftColumn.items)
  const techTop = await resolveMegaMenuItemRefs(navigationCapture.servicesMegaMenu.rightColumnTop.items)
  const aiServices = await resolveMegaMenuItemRefs(navigationCapture.servicesMegaMenu.rightColumnBottom.sections[0]?.items ?? [])
  const productBuilds = await resolveMegaMenuItemRefs(navigationCapture.servicesMegaMenu.rightColumnBottom.sections[1]?.items ?? [])
  console.log(
    `  highlighted ${highlighted.length}, leftFlat ${leftFlat.length}, techTop ${techTop.length}, aiServices ${aiServices.length}, productBuilds ${productBuilds.length}`,
  )

  // ── PATCH taglines
  console.log('\n[4/8] patching service + technology taglines...')
  const taglineResult = await patchTaglines(slugMatchReport)
  console.log(`  patched ${taglineResult.patched} taglines, skipped ${taglineResult.skipped} (empty/null)`)
  for (const s of taglineResult.sample) {
    console.log(`    sample: ${s.label} (${s.docId}) → "${s.tagline}"`)
  }

  // ── Upload How It Works inline images
  console.log('\n[5/8] uploading How It Works inline images...')
  const hiwUpload = await uploadHowItWorksPhotos(hiwComparison)
  console.log(`  uploaded ${hiwUpload.uploadedCount} HIW images`)
  for (const w of hiwUpload.warnings) console.log(`  ⚠️ ${w}`)

  // ── Build navigation payload
  console.log('\n[6/8] writing navigation global (createOrReplace)...')
  const navigationDoc = buildNavigationDoc({
    capture: navigationCapture,
    servicesItems: { highlighted, leftFlat, techTop, aiServices, productBuilds },
    hiwAssets: hiwUpload.byKey,
    featuredStoryIds,
    featuredBlogIds,
  })
  await sanityWriteClient.createOrReplace(navigationDoc)
  console.log('  navigation OK')

  // ── Build footer payload
  console.log('\n[7/8] writing footer global (createOrReplace)...')
  const footerDoc = buildFooterDoc(footerCapture)
  await sanityWriteClient.createOrReplace(footerDoc)
  console.log('  footer OK')

  // ── Verify
  console.log('\n[8/8] verifying post-write state...')
  const verify = await verifyState(baselineAssetCount)
  console.log(`  pass: ${verify.pass}`)
  console.log('  navigation:')
  console.log(`    primaryLinkCount: ${verify.navigation.primaryLinkCount}`)
  console.log(`    servicesMegaMenuPopulated: ${verify.navigation.servicesMegaMenuPopulated}`)
  console.log(`    howItWorksMegaMenuPopulated: ${verify.navigation.howItWorksMegaMenuPopulated}`)
  console.log(`    resourcesMegaMenuPopulated: ${verify.navigation.resourcesMegaMenuPopulated}`)
  console.log(`    referencesResolved: ${verify.navigation.referencesResolved} (broken: ${verify.navigation.referencesBroken})`)
  console.log('  footer:')
  console.log(`    topCtaBlockPopulated: ${verify.footer.topCtaBlockPopulated}`)
  console.log(`    sectionsPopulated: ${verify.footer.sectionsPopulated}`)
  console.log(`    talentLocationsPopulated: ${verify.footer.talentLocationsPopulated}`)
  console.log(`    subscribePopulated: ${verify.footer.subscribePopulated}`)
  console.log(`    bottomBarPopulated: ${verify.footer.bottomBarPopulated}`)
  console.log(`    legacyFieldsPopulated: ${verify.footer.legacyFieldsPopulated}`)
  console.log(`    /alternatives URL: ${verify.footer.alternativesUrlSeen}`)
  console.log(`    /compare URL: ${verify.footer.compareUrlSeen} (expect false — DELTA-6 rewrite)`)
  console.log('  taglines:')
  console.log(`    populatedCount: ${verify.taglines.populatedCount}`)
  for (const s of verify.taglines.sampleDocs) {
    console.log(`    sample: ${s._type}/${s.name} → "${s.tagline}"`)
  }
  console.log('  HIW assets:')
  console.log(`    cardsWithImage: ${verify.hiwAssets.cardsWithImage}/3`)
  console.log(`    bottomPanelHasImage: ${verify.hiwAssets.bottomPanelHasImage}`)
  console.log(`  newAssetCount: ${verify.newAssetCount} (expect ~4 for HIW photos)`)

  if (!verify.pass) {
    console.error('\nVERIFY FAILED — Step 4 gate not satisfied')
    process.exit(1)
  }
  console.log('\nstep 4 seed-globals-v2 complete.')
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})
