import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import {
  EASTERN_EUROPE_CONTENT,
  LATAM_CONTENT,
  PHILIPPINES_CONTENT,
  type LocationContent,
} from '../../site/src/components/templates/location/content'

// MYGRATR WIRE-BESPOKE (v2) - seed the three locationPage docs.
//
// Transcribes the code registry content (LATAM / Eastern Europe / Philippines)
// into three locationPage documents so Seb can edit every headline, paragraph,
// card, FAQ answer AND image in Studio. The code registry stays as the route's
// fallback; this fills Sanity so the doc wins.
//
// IMAGE HANDLING (v2): every image is uploaded to Sanity as a real image asset
// (hero cards, logos, video poster, on-the-ground photo, hub photos, engineer
// photos), mirroring the homePage seed. Assets are content-hashed by Sanity, so
// re-runs return the same ref (idempotent).
//
// HERO CARDS: the polished hero stack shows up to 3 cards. Each region only has
// 2 hand-written hero cards, so we top up to 3 from that region's engineer
// profiles (real photos) to match the approved 3-card look. Seb can edit all
// three per region afterwards.
//
// VIDEO: the poster image is uploaded; `videoUrl` is left empty so Seb pastes a
// YouTube/Vimeo link in Studio when ready. Until then the poster shows as a
// static still.
//
// CALCULATOR: only the surrounding COPY is written. The numeric config (roles,
// region multipliers, currency, comparison multiple) is deliberately NOT written
// - it stays code-driven in the registry and the site-side transform splices it
// back in.
//
// Idempotent: createOrReplace on a slug-derived _id, deterministic array _keys.
//
// Author-voice rule (no em/en dashes): normalizeDeep strips them from every
// string written.
//
// Run: npm run static:seed-location-pages
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')

// Shared logo strip (mirrors LOGOS_FALLBACK in the template).
const LOGOS = [
  { name: 'Virgin Experience Days', src: '/design/home/logos/virgin.png', displayHeight: 29, displayOpacity: 0.95, invert: true },
  { name: 'Salmon', src: '/design/home/logos/salmon.png', displayHeight: 22, displayOpacity: 0.95, invert: true },
  { name: 'Hotelplan', src: '/design/home/logos/hotelplan.png', displayHeight: 20, displayOpacity: 0.95, invert: true },
  { name: 'Willo', src: '/design/home/logos/willo.png', displayHeight: 22, displayOpacity: 0.95, invert: true },
  { name: 'Travelex', src: '/design/home/logos/travelex.png', displayHeight: 22, displayOpacity: 0.95, invert: false },
  { name: 'Tidal', src: '/design/home/logos/tidal.png', displayHeight: 22, displayOpacity: 0.95, invert: true },
  { name: 'Scorpion', src: '/design/home/logos/scorpion.png', displayHeight: 14, displayOpacity: 0.8, invert: true },
]

const LOGOS_LABEL_LINES = ['Trusted by', '300+', 'engineering teams']

// SEO meta per slug - metaTitle <=60, metaDescription 140-160 (schema rules).
const SEO: Record<string, { metaTitle: string; metaDescription: string }> = {
  'latam-developers': {
    metaTitle: 'Hire senior engineers in Latin America',
    metaDescription:
      'Hire senior AI, ML, data and full-stack engineers in Latin America on US hours. Vetted by senior engineers and embedded full time on rolling monthly contracts.',
  },
  'eastern-europe-developers': {
    metaTitle: 'Hire senior engineers in Eastern Europe',
    metaDescription:
      'Hire senior platform, backend and data engineers across Eastern Europe with EU and US-morning overlap. Vetted, embedded full time on rolling monthly contracts.',
  },
  'philippines-developers': {
    metaTitle: 'Hire senior engineers in the Philippines',
    metaDescription:
      'Hire senior AI, ML, data and full-stack engineers in the Philippines, working your exact UK or AU hours. Vetted and embedded full time on rolling contracts.',
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

function normalizeStr(s: string): string {
  return s
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function normalizeDeep<T>(value: T): T {
  if (typeof value === 'string') return normalizeStr(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => normalizeDeep(v)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = STRUCTURAL_KEYS.has(k) ? v : normalizeDeep(v)
    }
    return out as T
  }
  return value
}

function contentType(p: string): string {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.avif') return 'image/avif'
  if (ext === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

// Upload cache: public path → Sanity asset _id (dedupes repeated photos/logos).
const assetCache = new Map<string, string>()

async function uploadAsset(publicPath: string): Promise<string> {
  const cached = assetCache.get(publicPath)
  if (cached) return cached
  // publicPath is stored as a site URL ("/location/.../eng-1.jpg"). Strip the
  // leading slash so path.join does not discard PUBLIC_ROOT (absolute segment).
  const localPath = path.join(PUBLIC_ROOT, publicPath.replace(/^\//, ''))
  const buf = await fs.readFile(localPath)
  const filename = path.basename(publicPath)
  const asset = await sanityWriteClient.assets.upload('image', buf, {
    filename,
    contentType: contentType(publicPath),
  })
  assetCache.set(publicPath, asset._id)
  return asset._id
}

function imageRef(assetId: string, alt?: string) {
  return {
    _type: 'image' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
    ...(alt ? { alt } : {}),
  }
}

async function img(publicPath: string, alt?: string) {
  const assetId = await uploadAsset(publicPath)
  return imageRef(assetId, alt)
}

function keyed<T extends Record<string, unknown>>(items: T[], prefix: string): Array<T & { _key: string }> {
  return items.map((item, i) => ({ _key: `${prefix}-${i}`, ...item }))
}

// ── Build ───────────────────────────────────────────────────────────────

async function buildDoc(c: LocationContent) {
  const seo = SEO[c.slug]
  if (!seo) throw new Error(`No SEO entry for slug ${c.slug}`)

  // Hero cards: the region's hand-written hero cards, topped up to 3 from its
  // engineer profiles (real photos) to fill the 3-card stack.
  const heroSources = [
    ...c.hero.cards.map((card) => ({ name: card.name, role: card.role, skills: card.skills, flag: card.flag, image: card.image })),
    ...c.engineers.profiles.map((p) => ({ name: p.name, role: p.role, skills: p.skills, flag: p.flag, image: p.image })),
  ].slice(0, 3)

  const hero = {
    eyebrow: c.hero.eyebrow,
    titleLead: c.hero.titleLead,
    titleConnector: c.hero.titleConnector,
    titleAccent: c.hero.titleAccent,
    paragraph: c.hero.paragraph,
    ctaPrimary: c.hero.ctaPrimary,
    ctaSecondary: c.hero.ctaSecondary,
    trustPills: [...c.hero.trustPills],
    floatingBadges: [...c.hero.floatingBadges],
    cards: keyed(
      await Promise.all(
        heroSources.map(async (card) => ({
          name: card.name,
          role: card.role,
          skills: [...card.skills],
          flag: card.flag,
          image: await img(card.image, card.name),
        })),
      ),
      'hero-card',
    ),
  }

  const logos = keyed(
    await Promise.all(
      LOGOS.map(async (l) => ({
        name: l.name,
        image: await img(l.src, l.name),
        invert: l.invert,
        displayHeight: l.displayHeight,
        displayOpacity: l.displayOpacity,
      })),
    ),
    'logo',
  )

  const advantage = {
    eyebrow: c.advantage.eyebrow,
    titleLead: c.advantage.titleLead,
    titleAccent: c.advantage.titleAccent,
    intro: c.advantage.intro,
    cards: keyed(
      c.advantage.cards.map((card) => ({ eyebrow: card.eyebrow, title: card.title, body: card.body })),
      'adv',
    ),
  }

  const video = {
    eyebrow: c.video.eyebrow,
    titleLead: c.video.titleLead,
    titleAccent: c.video.titleAccent,
    intro: c.video.intro,
    presenter: c.video.presenter,
    pullQuote: c.video.pullQuote,
    image: await img(c.video.image, `${c.region} video`),
  }

  const onGround = c.onGround
    ? {
        eyebrow: c.onGround.eyebrow,
        titleLead: c.onGround.titleLead,
        titleAccent: c.onGround.titleAccent,
        body: c.onGround.body,
        bullets: [...c.onGround.bullets],
        image: await img(c.onGround.image, `${c.region} team`),
      }
    : undefined

  const eor = c.eor
    ? {
        eyebrow: c.eor.eyebrow,
        titleLead: c.eor.titleLead,
        titleAccent: c.eor.titleAccent,
        ...(c.eor.subhead ? { subhead: c.eor.subhead } : {}),
        ...(c.eor.intro ? { intro: c.eor.intro } : {}),
        items: keyed(
          c.eor.items.map((it) => ({ title: it.title, body: it.body })),
          'eor',
        ),
      }
    : undefined

  const included = c.included
    ? {
        eyebrow: c.included.eyebrow,
        titleLead: c.included.titleLead,
        titleAccent: c.included.titleAccent,
        youLabel: c.included.youLabel,
        ...(c.included.youSubhead ? { youSubhead: c.included.youSubhead } : {}),
        ...(c.included.youBody ? { youBody: c.included.youBody } : {}),
        you: [...c.included.you],
        ...(c.included.youFootnote ? { youFootnote: c.included.youFootnote } : {}),
        weLabel: c.included.weLabel,
        ...(c.included.wePill ? { wePill: c.included.wePill } : {}),
        ...(c.included.weSubhead ? { weSubhead: c.included.weSubhead } : {}),
        ...(c.included.weBody ? { weBody: c.included.weBody } : {}),
        we: [...c.included.we],
        footnote: c.included.footnote,
      }
    : undefined

  const regionsStrip = c.regionsStrip
    ? {
        title: c.regionsStrip.title,
        retentionValue: c.regionsStrip.retentionValue,
        retentionLabel: c.regionsStrip.retentionLabel,
        hubs: keyed(
          await Promise.all(
            c.regionsStrip.hubs.map(async (h) => ({
              city: h.city,
              note: h.note,
              image: await img(h.image, h.city),
            })),
          ),
          'region-hub',
        ),
      }
    : undefined

  const primaryHub = {
    eyebrow: c.primaryHub.eyebrow,
    titleLead: c.primaryHub.titleLead,
    titleAccent: c.primaryHub.titleAccent,
    bannerEyebrow: c.primaryHub.bannerEyebrow,
    bannerTitle: c.primaryHub.bannerTitle,
    bannerBody: c.primaryHub.bannerBody,
    image: await img(c.primaryHub.image, c.primaryHub.bannerEyebrow),
    secondaryEyebrow: c.primaryHub.secondaryEyebrow,
    secondary: keyed(
      await Promise.all(
        c.primaryHub.secondary.map(async (h) => ({
          city: h.city,
          note: h.note,
          image: await img(h.image, h.city),
        })),
      ),
      'hub',
    ),
  }

  const engineers = {
    titleLead: c.engineers.titleLead,
    titleAccent: c.engineers.titleAccent,
    intro: c.engineers.intro,
    profiles: keyed(
      await Promise.all(
        c.engineers.profiles.map(async (p) => ({
          name: p.name,
          role: p.role,
          skills: [...p.skills],
          years: p.years,
          bio: p.bio,
          flag: p.flag,
          image: await img(p.image, p.name),
        })),
      ),
      'eng',
    ),
  }

  const funFact = { eyebrow: c.funFact.eyebrow, body: c.funFact.body, source: c.funFact.source }

  const calculator = {
    eyebrow: c.calculator.eyebrow,
    titleLead: c.calculator.titleLead,
    titleAccent: c.calculator.titleAccent,
    titleSuffix: c.calculator.titleSuffix,
    ...(c.calculator.resultEyebrow ? { resultEyebrow: c.calculator.resultEyebrow } : {}),
    ...(c.calculator.savedPrefix ? { savedPrefix: c.calculator.savedPrefix } : {}),
    savingsSticker: c.calculator.savingsSticker,
    savingsStickerSub: c.calculator.savingsStickerSub,
    disclaimer: c.calculator.disclaimer,
  }

  const start = {
    eyebrow: c.start.eyebrow,
    titleLead: c.start.titleLead,
    titleAccent: c.start.titleAccent,
    ...(c.start.variant ? { variant: c.start.variant } : {}),
    cards: keyed(
      c.start.cards.map((card) => ({
        eyebrow: card.eyebrow,
        title: card.title,
        body: card.body,
        ...(card.bullets ? { bullets: [...card.bullets] } : {}),
        cta: card.cta,
        ctaHref: card.ctaHref,
      })),
      'start',
    ),
  }

  const faq = {
    eyebrow: c.faq.eyebrow,
    title: c.faq.title,
    helpEyebrow: c.faq.helpEyebrow,
    helpBody: c.faq.helpBody,
    helpCta: c.faq.helpCta,
    items: keyed(
      c.faq.items.map((it) => ({ number: it.number, question: it.question, answer: it.answer })),
      'faq',
    ),
  }

  const doc = {
    _id: `locationPage-${c.slug}`,
    _type: 'locationPage',
    region: c.region,
    slug: { _type: 'slug' as const, current: c.slug },
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    logosLabelLines: [...LOGOS_LABEL_LINES],
    logos,
    hero,
    advantage,
    video,
    ...(onGround ? { onGround } : {}),
    ...(regionsStrip ? { regionsStrip } : {}),
    ...(eor ? { eor } : {}),
    ...(included ? { included } : {}),
    primaryHub,
    engineers,
    funFact,
    calculator,
    start,
    faq,
  }

  return normalizeDeep(doc)
}

async function main() {
  const contents = [LATAM_CONTENT, EASTERN_EUROPE_CONTENT, PHILIPPINES_CONTENT]
  for (const c of contents) {
    const doc = await buildDoc(c)
    console.log(
      `  ${doc.slug.current}: metaTitle ${doc.metaTitle.length} chars, metaDescription ${doc.metaDescription.length} chars`,
    )
    await sanityWriteClient.createOrReplace(doc)
    console.log(`createOrReplace ${doc._id} OK`)
  }
  console.log(`Seeded 3 locationPage docs. Uploaded ${assetCache.size} unique images.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
