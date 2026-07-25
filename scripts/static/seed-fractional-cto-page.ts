import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { FCTO, FRACTIONAL_CTO_META } from '../../site/src/components/templates/fractional-cto/content'

// MYGRATR Fractional CTO Sanity wiring - seed the fractionalCtoPage singleton.
//
// Transcribes the template's static FCTO content 1:1 into the singleton so Seb
// can edit every headline, card, FAQ answer, and the video URL in Studio. This
// page has NO photographs by design (anonymised CTO cards, text-name logos,
// stylised video tile), so there are no image uploads here - unlike the home /
// location seeds. Layout fields (card offsets, pill icon/offsets, option width)
// are seeded and kept hidden in Studio; the site-side transform is a blunt cast.
//
// Idempotent: deterministic array _keys + createOrReplace on _id
// "fractionalCtoPage" => clean overwrite each run.
//
// Author-voice rule (Jake's persistent memory): no em/en dashes. normalizeDeep
// strips them from every string written.
//
// Run: npm run static:seed-fractional-cto-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

// SEO meta - metaTitle <=60, metaDescription 140-160 (schema validation).
const META_TITLE = FRACTIONAL_CTO_META.title
const META_DESCRIPTION = FRACTIONAL_CTO_META.description

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
  const hero = {
    eyebrow: FCTO.hero.eyebrow,
    h1Lead: FCTO.hero.h1Lead,
    h1Em: FCTO.hero.h1Em,
    sub: FCTO.hero.sub,
    ctaPrimary: FCTO.hero.ctaPrimary,
    ctaGhost: FCTO.hero.ctaGhost,
    trust: [...FCTO.hero.trust],
    cards: keyed(
      FCTO.hero.cards.map((c) => ({
        role: c.role,
        days: c.days,
        name: c.name,
        cred: c.cred,
        tags: [...c.tags],
        left: c.left,
        top: c.top,
        rot: c.rot,
      })),
      'hero-card',
    ),
    statusPills: keyed(
      FCTO.hero.statusPills.map((p) => ({ label: p.label, icon: p.icon, left: p.left, top: p.top })),
      'hero-pill',
    ),
  }

  const trusted = {
    label: FCTO.trusted.label,
    logos: [...FCTO.trusted.logos],
    aiPill: FCTO.trusted.aiPill,
  }

  const video = {
    eyebrow: FCTO.video.eyebrow,
    title: FCTO.video.title,
    tag: FCTO.video.tag,
    name: FCTO.video.name,
    role: FCTO.video.role,
    play: FCTO.video.play,
    timeStart: FCTO.video.timeStart,
    timeEnd: FCTO.video.timeEnd,
    stateIdle: FCTO.video.stateIdle,
    statePlaying: FCTO.video.statePlaying,
    // videoUrl deliberately left empty - Seb pastes a YouTube/Vimeo link in Studio.
  }

  const does = {
    eyebrow: FCTO.does.eyebrow,
    title: FCTO.does.title,
    cards: keyed(
      FCTO.does.cards.map((c) => ({ h4: c.h4, p: c.p })),
      'does',
    ),
  }

  const statement = {
    eyebrow: FCTO.statement.eyebrow,
    line1: FCTO.statement.line1,
    line2: FCTO.statement.line2,
    sub: FCTO.statement.sub,
  }

  const matched = {
    eyebrow: FCTO.matched.eyebrow,
    h2Lead: FCTO.matched.h2Lead,
    h2Em: FCTO.matched.h2Em,
    topSub: FCTO.matched.topSub,
    feature: {
      h3: FCTO.matched.feature.h3,
      p: FCTO.matched.feature.p,
      foot: FCTO.matched.feature.foot,
    },
    steps: keyed(
      FCTO.matched.steps.map((s) => ({ h4: s.h4, p: s.p })),
      'matched-step',
    ),
  }

  const derisk = {
    eyebrow: FCTO.derisk.eyebrow,
    benefits: [...FCTO.derisk.benefits],
  }

  const selfcheck = {
    eyebrow: FCTO.selfcheck.eyebrow,
    h2Lead: FCTO.selfcheck.h2Lead,
    h2Em: FCTO.selfcheck.h2Em,
    items: keyed(
      FCTO.selfcheck.items.map((it) => ({ n: it.n, p: it.p })),
      'sc',
    ),
  }

  const matchform = {
    eyebrow: FCTO.matchform.eyebrow,
    h2Lead: FCTO.matchform.h2Lead,
    h2Em: FCTO.matchform.h2Em,
    lead: FCTO.matchform.lead,
    progress: keyed(
      FCTO.matchform.progress.map((p) => ({ num: p.num, lb: p.lb })),
      'mf-prog',
    ),
    options: keyed(
      FCTO.matchform.options.map((o) => ({ label: o.label, wide: o.wide })),
      'mf-opt',
    ),
    back: FCTO.matchform.back,
    steps: keyed(
      FCTO.matchform.steps.map((s) => ({ title: s.title, hint: s.hint })),
      'mf-step',
    ),
    nextDefault: FCTO.matchform.nextDefault,
    nextStep2: FCTO.matchform.nextStep2,
    nextStep3: FCTO.matchform.nextStep3,
    reassureLabel: FCTO.matchform.reassureLabel,
    pillAi: FCTO.matchform.pillAi,
    pillBook: FCTO.matchform.pillBook,
    trust: [...FCTO.matchform.trust],
  }

  const faq = {
    eyebrow: FCTO.faq.eyebrow,
    title: FCTO.faq.title,
    ctaEyebrow: FCTO.faq.ctaEyebrow,
    ctaBody: FCTO.faq.ctaBody,
    ctaBtn: FCTO.faq.ctaBtn,
    items: keyed(
      FCTO.faq.items.map((f) => ({ n: f.n, q: f.q, a: f.a })),
      'faq',
    ),
  }

  const final = {
    h2Lead: FCTO.final.h2Lead,
    h2Em: FCTO.final.h2Em,
    p: FCTO.final.p,
    cta: FCTO.final.cta,
    metrics: [...FCTO.final.metrics],
  }

  const doc = {
    _id: 'fractionalCtoPage',
    _type: 'fractionalCtoPage',
    title: 'Fractional CTO Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero,
    trusted,
    video,
    does,
    statement,
    matched,
    derisk,
    selfcheck,
    matchform,
    faq,
    final,
  }

  return normalizeDeep(doc)
}

async function main() {
  console.log('Building fractionalCtoPage doc...')
  const doc = buildDoc()
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace fractionalCtoPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
