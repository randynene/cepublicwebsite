import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { HOME_CONTENT as HC, HOME_META } from '../../site/src/components/templates/home/content'

// MYGRATR home Sanity wiring — seed the homePage singleton.
//
// Uploads every home design image (site/public/design/home/*) to Sanity and
// builds the homePage document 1:1 with the template's HOME_CONTENT shape, so
// Seb can edit every headline, paragraph, stat, testimonial, FAQ answer, and
// photo in Studio. Idempotent:
//   - assets are content-hashed by Sanity → re-uploads return the same ref
//   - array _keys are deterministic (section + index)
//   - createOrReplace on _id "homePage" → clean overwrite each run
//
// Author-voice rule (Jake's persistent memory): no em/en dashes. normalizeDeep
// strips them from every string written (structural keys are left untouched).
//
// Run: npm run static:seed-home-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')

// SEO meta — metaTitle <=60, metaDescription 140-160 (schema validation).
const META_TITLE = HOME_META.title
const META_DESCRIPTION =
  'We embed senior engineers full time in your team, tools, and timezone within 7 days. Vetted by senior engineers, not recruiters. HR and payroll handled.'

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

// Upload cache: public path → Sanity asset _id (dedupes repeated logos).
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

function keyed<T extends Record<string, unknown>>(items: T[], prefix: string): Array<T & { _key: string }> {
  return items.map((item, i) => ({ _key: `${prefix}-${i}`, ...item }))
}

// ── Build ───────────────────────────────────────────────────────────────

async function img(publicPath: string, alt?: string) {
  const assetId = await uploadAsset(publicPath)
  return imageRef(assetId, alt)
}

async function buildDoc() {
  const hero = {
    eyebrow: HC.hero.eyebrow,
    titleLead: HC.hero.titleLead,
    titleAccent: HC.hero.titleAccent,
    paragraphLines: [...HC.hero.paragraphLines],
    primaryCta: HC.hero.primaryCta,
    secondaryCta: HC.hero.secondaryCta,
    bottomPills: [...HC.hero.bottomPills],
    floatingPills: [...HC.hero.floatingPills],
    profiles: keyed(
      await Promise.all(
        HC.hero.profiles.map(async (p) => ({
          name: p.name,
          role: p.role,
          flag: p.flag,
          tags: [...p.tags],
          image: await img(p.image, p.name),
          objectPosition: p.objectPosition ?? 'center',
        })),
      ),
      'hero-prof',
    ),
  }

  // Hub photos are still Picsum placeholders (external URLs) — seed via
  // imageUrl so Studio can later swap in a real Sanity image asset.
  const whereWeWork = {
    eyebrow: HC.whereWeWork.eyebrow,
    titleLead: HC.whereWeWork.titleLead,
    titleAccent: HC.whereWeWork.titleAccent,
    paragraph: HC.whereWeWork.paragraph,
    hubs: keyed(
      HC.whereWeWork.hubs.map((h) => ({
        name: h.name,
        href: h.href,
        imageUrl: h.image,
      })),
      'hub',
    ),
  }

  const trustedBy = {
    label: HC.trustedBy.label,
    labelLine1: HC.trustedBy.labelLine1,
    labelLine2: HC.trustedBy.labelLine2,
    logos: keyed(
      await Promise.all(
        HC.trustedBy.logos.map(async (l) => ({
          name: l.name,
          image: await img(l.src, l.name),
          invert: l.invert,
          displayHeight: l.displayH,
          displayOpacity: l.displayOpacity,
        })),
      ),
      'logo',
    ),
  }

  const clientStory = {
    eyebrow: HC.clientStory.eyebrow,
    quoteLines: [...HC.clientStory.quoteLines],
    name: HC.clientStory.name,
    role: HC.clientStory.role,
    avatar: await img(HC.clientStory.avatar, HC.clientStory.name),
    logo: {
      name: HC.clientStory.logo.name,
      image: await img(HC.clientStory.logo.src, HC.clientStory.logo.name),
    },
  }

  const whyDifferent = {
    eyebrow: HC.whyDifferent.eyebrow,
    titleLead: HC.whyDifferent.titleLead,
    titleAccent: HC.whyDifferent.titleAccent,
    paragraph: HC.whyDifferent.paragraph,
    lead: {
      title: HC.whyDifferent.lead.title,
      body: HC.whyDifferent.lead.body,
      icon: HC.whyDifferent.lead.icon,
      proof: HC.whyDifferent.lead.proof,
    },
    leadImage: await img(HC.whyDifferent.leadImage.src, 'Cloud Employee engineers in a live coding interview'),
    reasons: keyed(
      HC.whyDifferent.reasons.map((r) => ({
        title: r.title,
        body: r.body,
        icon: r.icon,
        ...(r.proof ? { proof: r.proof } : {}),
      })),
      'reason',
    ),
  }

  const process = {
    eyebrow: HC.process.eyebrow,
    titleLead: HC.process.titleLead,
    titleAccent: HC.process.titleAccent,
    steps: keyed(
      HC.process.steps.map((s) => ({ number: s.number, title: s.title, body: s.body, cta: s.cta })),
      'step',
    ),
    video: {
      name: HC.process.video.name,
      roleLine: HC.process.video.roleLine,
      caption: HC.process.video.caption,
      subtitle: HC.process.video.subtitle,
      cta: HC.process.video.cta,
      poster: await img(HC.process.video.poster.src, HC.process.video.name),
      ...(HC.process.video.videoUrl ? { videoUrl: HC.process.video.videoUrl } : {}),
    },
  }

  const testimonials = {
    eyebrow: HC.testimonials.eyebrow,
    title: HC.testimonials.title,
    items: keyed(
      await Promise.all(
        HC.testimonials.items.map(async (t) => ({
          quote: t.quote,
          name: t.name,
          role: t.role,
          logo: { name: t.logo.name, image: await img(t.logo.src, t.logo.name) },
          image: await img(t.image, t.name),
          stats: keyed(
            t.stats.map((st) => ({ value: st.value, label: st.label })),
            'stat',
          ),
        })),
      ),
      'testimonial',
    ),
  }

  const included = {
    eyebrow: HC.included.eyebrow,
    titleLead: HC.included.titleLead,
    titleAccent: HC.included.titleAccent,
    you: {
      label: HC.included.you.label,
      heading: HC.included.you.heading,
      items: [...HC.included.you.items],
    },
    us: {
      label: HC.included.us.label,
      heading: HC.included.us.heading,
      items: [...HC.included.us.items],
    },
    footnote: HC.included.footnote,
  }

  const calculator = {
    eyebrow: HC.calculator.eyebrow,
    titleLead: HC.calculator.titleLead,
    titleAccent: HC.calculator.titleAccent,
    fields: keyed(
      HC.calculator.fields.map((f) => ({ label: f.label, value: f.value })),
      'calc',
    ),
    resultLabel: HC.calculator.resultLabel,
    price: HC.calculator.price,
    priceSuffix: HC.calculator.priceSuffix,
    comparison: HC.calculator.comparison,
    saving: HC.calculator.saving,
    badgeSave: HC.calculator.badgeSave,
    badgeSub: HC.calculator.badgeSub,
    cta: HC.calculator.cta,
    footnote: HC.calculator.footnote,
  }

  const realEngineers = {
    eyebrow: HC.realEngineers.eyebrow,
    titleLead: HC.realEngineers.titleLead,
    titleAccent: HC.realEngineers.titleAccent,
    badge: HC.realEngineers.badge,
    profiles: keyed(
      await Promise.all(
        HC.realEngineers.profiles.map(async (p) => ({
          name: p.name,
          role: p.role,
          flag: p.flag,
          tags: [...p.tags],
          image: await img(p.image, p.name),
          ...(p.objectPosition ? { objectPosition: p.objectPosition } : {}),
        })),
      ),
      're-prof',
    ),
  }

  const readyToFind = {
    eyebrow: HC.readyToFind.eyebrow,
    titleLead: HC.readyToFind.titleLead,
    titleAccent: HC.readyToFind.titleAccent,
    paragraph: HC.readyToFind.paragraph,
    steps: [...HC.readyToFind.steps],
    question: HC.readyToFind.question,
    questionSub: HC.readyToFind.questionSub,
    roles: [...HC.readyToFind.roles],
    bottomPills: [...HC.readyToFind.bottomPills],
    nextLabel: HC.readyToFind.nextLabel,
    matching: {
      label: HC.readyToFind.matching.label,
      unlocks: HC.readyToFind.matching.unlocks,
      tags: [...HC.readyToFind.matching.tags],
      note: HC.readyToFind.matching.note,
      stats: keyed(
        HC.readyToFind.matching.stats.map((st) => ({ value: st.value, label: st.label })),
        'match-stat',
      ),
    },
    talkPrompt: HC.readyToFind.talkPrompt,
    talkCtas: [...HC.readyToFind.talkCtas],
  }

  const locations = {
    eyebrow: HC.locations.eyebrow,
    titleLead: HC.locations.titleLead,
    titleAccent: HC.locations.titleAccent,
    placeholder: HC.locations.placeholder,
    cards: [...HC.locations.cards],
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
    _id: 'homePage',
    _type: 'homePage',
    title: 'Home Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero,
    whereWeWork,
    trustedBy,
    clientStory,
    whyDifferent,
    process,
    testimonials,
    included,
    calculator,
    realEngineers,
    readyToFind,
    locations,
    faq,
  }

  return normalizeDeep(doc)
}

async function main() {
  console.log('Building homePage doc + uploading images...')
  const doc = await buildDoc()
  console.log(`  uploaded ${assetCache.size} unique images`)
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace homePage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
