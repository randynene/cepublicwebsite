import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { ABOUT_US_CONTENT as C, ABOUT_US_META } from '../../site/src/components/templates/about-us/content'

// Seed aboutUsPage singleton (bespoke About Us shape).
// Team / values / reviews / logos are NOT in this doc — they come from their
// own documents. founderImage left empty for Studio upload.
//
// Run: npm run static:seed-about-us-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

const META_TITLE = 'About Us | Cloud Employee'
const META_DESCRIPTION =
  'Meet the Cloud Employee team. We embed senior engineers full-time in your team, tools, and timezone. Vetted by engineers, not recruiters, worldwide.'

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

function buildDoc() {
  return normalizeDeep({
    _id: 'aboutUsPage',
    _type: 'aboutUsPage',
    title: 'About Us Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero: {
      eyebrow: C.hero.eyebrow,
      titleLead: C.hero.titleLead,
      titleAccent: C.hero.titleAccent,
      intro: C.hero.intro,
      cta: C.hero.cta,
      ctaHref: C.hero.ctaHref,
    },
    trusted: { ...C.trusted },
    stats: keyed(
      C.stats.map((s) => ({ value: s.value, label: s.label })),
      'au-stat',
    ),
    story: { ...C.story },
    team: { ...C.team },
    values: { ...C.values },
    reviews: { ...C.reviews },
    midCta: { ...C.midCta },
  })
}

async function main() {
  console.log('Building aboutUsPage doc...')
  void ABOUT_US_META
  const doc = buildDoc()
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace aboutUsPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
