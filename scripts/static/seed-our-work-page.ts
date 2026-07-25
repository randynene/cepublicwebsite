import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { OUR_WORK_CONTENT } from '../../site/src/components/templates/our-work/content'

// MYGRATR Our Work Sanity wiring - seed the ourWorkPage singleton.
//
// Transcribes the template's static OUR_WORK_CONTENT into the bespoke singleton so
// Seb can edit every headline, stat number and caption in Studio. The three
// decorative "customer photo" tiles are optional image fields left EMPTY here - Seb
// uploads real photos in Studio; empty falls back to the striped placeholder. The
// customer stories, logos, reviews and bento grid are Sanity-driven from their own
// documents and are not touched by this seed.
//
// This REPLACES the doc that the old generic defineStaticPage shape wrote (title +
// body sections). createOrReplace on _id "ourWorkPage" overwrites it cleanly.
//
// Idempotent: deterministic array _keys + createOrReplace => clean overwrite each
// run. Author-voice rule (Jake's persistent memory): no em/en dashes. normalizeDeep
// strips them from every string written.
//
// Run: npm run static:seed-our-work-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

// SEO meta - metaTitle <=60, metaDescription 140-160 (schema validation). The
// static fallback description is 132 chars (valid as a real meta tag but under the
// Studio 140 floor); this seed extends it faithfully with "engineering" so the doc
// passes Studio validation without changing the meaning.
const META_TITLE = 'Our Work | Cloud Employee'
const META_DESCRIPTION =
  'See what less recruitment and more development looks like. Real customer stories, results and reviews from the engineering teams we have scaled.'

// ── Helpers ─────────────────────────────────────────────────────────────

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

function normalizeStr(s: string): string {
  return s.replace(/—/g, ', ').replace(/–/g, '-')
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

function keyed<T extends Record<string, unknown>>(
  items: readonly T[],
  prefix: string,
): Array<T & { _key: string }> {
  return items.map((item, i) => ({ _key: `${prefix}-${i}`, ...item }))
}

// ── Build ───────────────────────────────────────────────────────────────

function buildDoc() {
  const C = OUR_WORK_CONTENT

  const hero = {
    eyebrow: C.hero.eyebrow,
    titleLead: C.hero.titleLead,
    titleAccent: C.hero.titleAccent,
    titleRest: C.hero.titleRest,
    intro: C.hero.intro,
    cta: C.hero.cta,
    // ctaHref deliberately omitted - code-owned, spliced on the site side.
  }

  const trusted = { pre: C.trusted.pre, highlight: C.trusted.highlight, post: C.trusted.post }

  const statsPrimary = keyed(
    C.statsPrimary.map((s) => ({ value: s.value, lead: s.lead, rest: s.rest })),
    'ow-stat',
  )

  const impact = {
    eyebrow: C.impact.eyebrow,
    heading: C.impact.heading,
    cta: C.impact.cta,
  }

  const beyondHiring = {
    headingLead: C.beyondHiring.headingLead,
    headingAccent: C.beyondHiring.headingAccent,
    stats1525: {
      value: C.beyondHiring.stats1525.value,
      lead: C.beyondHiring.stats1525.lead,
      rest: C.beyondHiring.stats1525.rest,
    },
    rating: { lead: C.beyondHiring.rating.lead, rest: C.beyondHiring.rating.rest },
    stats300: {
      value: C.beyondHiring.stats300.value,
      lead: C.beyondHiring.stats300.lead,
      rest: C.beyondHiring.stats300.rest,
    },
    // photo deliberately left empty - Seb uploads in Studio.
  }

  const reviews = {
    eyebrow: C.reviews.eyebrow,
    headingLead: C.reviews.headingLead,
    headingAccent: C.reviews.headingAccent,
    headingRest: C.reviews.headingRest,
  }

  const midCta = {
    eyebrow: C.midCta.eyebrow,
    heading: C.midCta.heading,
    cta: C.midCta.cta,
    micro: C.midCta.micro,
    // photo deliberately left empty - Seb uploads in Studio.
  }

  const doc = {
    _id: 'ourWorkPage',
    _type: 'ourWorkPage',
    title: 'Our Work',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero,
    trusted,
    statsPrimary,
    impact,
    beyondHiring,
    reviews,
    midCta,
  }

  return normalizeDeep(doc)
}

async function main() {
  console.log('Building ourWorkPage doc...')
  const doc = buildDoc()
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace ourWorkPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
