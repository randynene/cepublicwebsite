import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { HIW_CONTENT as HC, HIW_META } from '../../site/src/components/templates/how-it-works/content'

// MYGRATR How It Works Sanity wiring — seed the howItWorksPage singleton.
//
// Uploads every How It Works design image (site/public/how-it-works/*) to
// Sanity and builds the howItWorksPage document 1:1 with the template's
// HIW_CONTENT shape, so Seb can edit every headline, paragraph, stage, funnel
// count, testimonial, FAQ answer, and photo in Studio. Idempotent:
//   - assets are content-hashed by Sanity → re-uploads return the same ref
//   - array _keys are deterministic (section + index)
//   - createOrReplace on _id "howItWorksPage" → clean overwrite each run
//
// Author-voice rule (Jake's persistent memory): no em/en dashes. normalizeDeep
// strips them from every string written (structural keys are left untouched).
//
// Run: npm run static:seed-how-it-works-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')

// SEO meta — metaTitle <=60, metaDescription 140-160 (schema validation).
const META_TITLE = HIW_META.title
const META_DESCRIPTION =
  'One brief, two matched engineers in 7 days. See how Cloud Employee finds, vets, onboards, and looks after the senior engineers we embed in your team.'

// ── Helpers ─────────────────────────────────────────────────────────────

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

function normalizeStr(s: string): string {
  return s
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

// Deep-normalize every string value, leaving asset refs / structural keys as-is.
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

// Upload cache: public path → Sanity asset _id.
const assetCache = new Map<string, string>()

async function uploadAsset(publicPath: string): Promise<string> {
  const cached = assetCache.get(publicPath)
  if (cached) return cached
  const localPath = path.join(PUBLIC_ROOT, publicPath)
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

// Optional image → conditional-spread object ({} when absent, so the field is
// omitted rather than written as a null literal — CONVENTIONS conditional-spread
// rule). Used for stages 1 & 4 (card, no photo) and quote-only testimonials.
async function imgOpt(publicPath?: string, alt?: string): Promise<{ image?: unknown }> {
  if (!publicPath) return {}
  return { image: await img(publicPath, alt) }
}

function keyed<T extends Record<string, unknown>>(items: T[], prefix: string): Array<T & { _key: string }> {
  return items.map((item, i) => ({ _key: `${prefix}-${i}`, ...item }))
}

// ── Build ───────────────────────────────────────────────────────────────

async function buildDoc() {
  const hero = {
    eyebrow: HC.hero.eyebrow,
    titleLead: HC.hero.titleLead,
    titleAccent: HC.hero.titleAccent,
    paragraph: HC.hero.paragraph,
    cta: HC.hero.cta,
    ctaHref: HC.hero.ctaHref,
    bottomPills: [...HC.hero.bottomPills],
    vetted: HC.hero.vetted,
    people: keyed(
      await Promise.all(
        HC.hero.people.map(async (p) => ({
          name: p.name,
          role: p.role,
          flag: p.flag,
          tags: [...p.tags],
          image: await img(p.image, p.imageAlt),
          rotate: p.rotate,
        })),
      ),
      'hero-person',
    ),
  }

  const stages = {
    eyebrow: HC.stages.eyebrow,
    titleLead: HC.stages.titleLead,
    titleAccent: HC.stages.titleAccent,
    items: keyed(
      await Promise.all(
        HC.stages.items.map(async (s) => ({
          stage: s.stage,
          title: s.title,
          intro: s.intro,
          checks: [...s.checks],
          ...(await imgOpt(s.image, s.imageAlt)),
        })),
      ),
      'stage',
    ),
    brief: {
      label: HC.stages.brief.label,
      status: HC.stages.brief.status,
      timer: HC.stages.brief.timer,
      role: HC.stages.brief.role,
      scopedBy: HC.stages.brief.scopedBy,
      stackLabel: HC.stages.brief.stackLabel,
      stack: [...HC.stages.brief.stack],
      fields: keyed(
        HC.stages.brief.fields.map((f) => ({ label: f.label, value: f.value })),
        'brief-field',
      ),
      searchingNote: HC.stages.brief.searchingNote,
      resultNote: HC.stages.brief.resultNote,
    },
    funnel: {
      label: HC.stages.funnel.label,
      rows: keyed(
        HC.stages.funnel.rows.map((r) => ({
          label: r.label,
          value: r.value,
          barWidth: r.barWidth,
          highlight: r.highlight,
        })),
        'funnel-row',
      ),
    },
    handled: {
      title: HC.stages.handled.title,
      status: HC.stages.handled.status,
      rows: keyed(
        HC.stages.handled.rows.map((r) => ({ title: r.title, sub: r.sub })),
        'handled-row',
      ),
      footnote: HC.stages.handled.footnote,
      footprint: HC.stages.handled.footprint,
    },
    stats: keyed(
      HC.stages.stats.map((st) => ({ value: st.value, label: st.label })),
      'stage-stat',
    ),
  }

  const deRisk = {
    eyebrow: HC.deRisk.eyebrow,
    items: [...HC.deRisk.items],
  }

  const testimonials = {
    eyebrow: HC.testimonials.eyebrow,
    titleLead: HC.testimonials.titleLead,
    titleAccent: HC.testimonials.titleAccent,
    items: keyed(
      await Promise.all(
        HC.testimonials.items.map(async (t) => ({
          quote: t.quote,
          name: t.name,
          role: t.role,
          variant: t.variant,
          ...(await imgOpt(t.image, t.imageAlt)),
        })),
      ),
      'testimonial',
    ),
  }

  const matcher = {
    eyebrow: HC.matcher.eyebrow,
    titleLead: HC.matcher.titleLead,
    titleAccent: HC.matcher.titleAccent,
    paragraph: HC.matcher.paragraph,
    steps: [...HC.matcher.steps],
    question: HC.matcher.question,
    questionSub: HC.matcher.questionSub,
    roles: [...HC.matcher.roles],
    bottomPills: [...HC.matcher.bottomPills],
    nextLabel: HC.matcher.nextLabel,
    matching: {
      label: HC.matcher.matching.label,
      unlocks: HC.matcher.matching.unlocks,
      tags: [...HC.matcher.matching.tags],
      note: HC.matcher.matching.note,
      stats: keyed(
        HC.matcher.matching.stats.map((st) => ({ value: st.value, label: st.label })),
        'match-stat',
      ),
    },
    talkPrompt: HC.matcher.talkPrompt,
    talkCtas: [...HC.matcher.talkCtas],
    bookHref: HC.matcher.bookHref,
  }

  const faq = {
    eyebrow: HC.faq.eyebrow,
    titleLead: HC.faq.titleLead,
    titleAccent: HC.faq.titleAccent,
    fallbackLabel: HC.faq.fallbackLabel,
    fallbackBody: HC.faq.fallbackBody,
    fallbackCta: HC.faq.fallbackCta,
    items: keyed(
      HC.faq.items.map((f) => ({ number: f.number, question: f.question, answer: f.answer })),
      'faq',
    ),
  }

  const doc = {
    _id: 'howItWorksPage',
    _type: 'howItWorksPage',
    title: 'How It Works Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero,
    stages,
    deRisk,
    testimonials,
    matcher,
    faq,
  }

  return normalizeDeep(doc)
}

async function main() {
  console.log('Building howItWorksPage doc + uploading images...')
  const doc = await buildDoc()
  console.log(`  uploaded ${assetCache.size} unique images`)
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace howItWorksPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
