import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { FOR_ENGINEERS_CONTENT as FE, FOR_ENGINEERS_META } from '../../site/src/components/templates/for-engineers/content'

// MYGRATR For Developers Sanity wiring - seed the forDevelopersPage singleton.
//
// Transcribes the template's static FOR_ENGINEERS_CONTENT 1:1 into the singleton
// so Seb can edit every headline, card line, benefit, testimonial, and CTA in
// Studio, and drop real photos into the 10 image slots. The page body is a
// tokenised Figma export hydrated from this doc; field names match the content
// paths exactly, so the site-side transform is a blunt cast.
//
// IMAGE SLOTS: left EMPTY here (hero card, 2 video-call stills, 3 benefit photos,
// the testimonial video poster, 3 quote-card photos). Empty keeps the baked Figma
// placeholder tile, so the page stays pixel-identical until Seb uploads.
//
// TESTIMONIALS: the three quotes (Kenneth / Jen / Lance) are PLACEHOLDER copy
// carried from the frozen export - not real engineer testimonials. Seb replaces
// them in Studio before a public relaunch.
//
// The interactive "build your profile" form (JoinForm) is NOT seeded - it is a
// code-owned React component with its own copy (JOIN_CONTENT).
//
// Idempotent: deterministic array _keys + createOrReplace on _id
// "forDevelopersPage" => clean overwrite each run.
//
// Author-voice rule (Jake's persistent memory): no em/en dashes. normalizeDeep
// strips them from every string written.
//
// Run: npm run static:seed-for-developers-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

// SEO meta - metaTitle <=60, metaDescription 140-160 (schema validation).
const META_TITLE = FOR_ENGINEERS_META.title
const META_DESCRIPTION = FOR_ENGINEERS_META.description

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
    eyebrow: FE.hero.eyebrow,
    titleLead: FE.hero.titleLead,
    titleAccent: FE.hero.titleAccent,
    sub: FE.hero.sub,
    ctaPrimary: FE.hero.ctaPrimary,
    ctaGhost: FE.hero.ctaGhost,
    trust: [...FE.hero.trust],
    card: {
      name: FE.hero.card.name,
      role: FE.hero.card.role,
      matched: FE.hero.card.matched,
      workLabel: FE.hero.card.workLabel,
      tags: [...FE.hero.card.tags],
      foot: keyed(FE.hero.card.foot.map((f) => ({ n: f.n, l: f.l })), 'hero-foot'),
      // image left empty - Seb uploads in Studio.
    },
  }

  const problem = {
    eyebrow: FE.problem.eyebrow,
    titleLead: FE.problem.titleLead,
    titleAccent: FE.problem.titleAccent,
    leadPre: FE.problem.leadPre,
    leadStrong: FE.problem.leadStrong,
    leadPost: FE.problem.leadPost,
    stats: keyed(FE.problem.stats.map((s) => ({ num: s.num, body: s.body })), 'stat'),
  }

  const how = {
    eyebrow: FE.how.eyebrow,
    titleLead: FE.how.titleLead,
    titleAccent: FE.how.titleAccent,
    steps: {
      one: {
        n: FE.how.steps.one.n,
        h: FE.how.steps.one.h,
        p: FE.how.steps.one.p,
        tag: FE.how.steps.one.tag,
        miniLabel: FE.how.steps.one.miniLabel,
        rows: [...FE.how.steps.one.rows],
      },
      two: {
        n: FE.how.steps.two.n,
        badge: FE.how.steps.two.badge,
        h: FE.how.steps.two.h,
        p: FE.how.steps.two.p,
        live: FE.how.steps.two.live,
        camYou: FE.how.steps.two.camYou,
        camEng: FE.how.steps.two.camEng,
        // camYouImage / camEngImage left empty.
      },
      three: {
        n: FE.how.steps.three.n,
        h: FE.how.steps.three.h,
        p: FE.how.steps.three.p,
        incomingLabel: FE.how.steps.three.incomingLabel,
        msgs: keyed(FE.how.steps.three.msgs.map((m) => ({ co: m.co, ln: m.ln, mt: m.mt })), 'msg'),
      },
      four: {
        n: FE.how.steps.four.n,
        h: FE.how.steps.four.h,
        p: FE.how.steps.four.p,
        tag: FE.how.steps.four.tag,
        handleLabel: FE.how.steps.four.handleLabel,
        chips: [...FE.how.steps.four.chips],
      },
    },
  }

  const benefits = {
    eyebrow: FE.benefits.eyebrow,
    titleLead: FE.benefits.titleLead,
    titleAccent: FE.benefits.titleAccent,
    lead: FE.benefits.lead,
    items: keyed(FE.benefits.items.map((it) => ({ h: it.h, p: it.p })), 'benefit'),
    photos: keyed(FE.benefits.photos.map((p) => ({ caption: p.caption, sub: p.sub })), 'photo'),
  }

  const mission = {
    eyebrow: FE.mission.eyebrow,
    titleLead: FE.mission.titleLead,
    titleAccent: FE.mission.titleAccent,
    p: FE.mission.p,
  }

  const tests = {
    eyebrow: FE.tests.eyebrow,
    titleLead: FE.tests.titleLead,
    titleAccent: FE.tests.titleAccent,
    videoPill: FE.tests.videoPill,
    videoLabel: FE.tests.videoLabel,
    // videoImage left empty.
    quotes: keyed(
      FE.tests.quotes.map((q) => ({ name: q.name, role: q.role, quote: q.quote })),
      'quote',
    ),
  }

  const final = {
    titleLead: FE.final.titleLead,
    titleAccent: FE.final.titleAccent,
    p: FE.final.p,
    cta: FE.final.cta,
    trust: [...FE.final.trust],
  }

  const doc = {
    _id: 'forDevelopersPage',
    _type: 'forDevelopersPage',
    title: 'For Developers Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero,
    problem,
    how,
    benefits,
    mission,
    tests,
    final,
  }

  return normalizeDeep(doc)
}

async function main() {
  console.log('Building forDevelopersPage doc...')
  const doc = buildDoc()
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace forDevelopersPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
