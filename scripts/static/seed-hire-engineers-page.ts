import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { HE, HIRE_ENGINEERS_META } from '../../site/src/components/templates/hire-engineers/content'

// MYGRATR Hire Engineers Sanity wiring - seed the hireEngineersPage singleton.
//
// Transcribes the template's static HE content 1:1 into the singleton so Seb
// can edit every headline, card, FAQ-style copy block, calculator label, and
// form question in Studio. Every image slot is editable in Studio but seeded
// EMPTY here (Seb uploads real photos: hero avatars, the offer/proof/form
// photos, the sample-profile + author avatars, the match photos) - same as the
// Fractional CTO seed leaves videoUrl empty. The 90-second tour videoUrl +
// poster are likewise left empty for Seb to paste.
//
// Calculator: the numeric tables (CALC) stay in code. The three option arrays
// are seeded (hidden in Studio) so the doc is complete, but the site-side
// transform splices them from code regardless - they are calculator lookup keys.
//
// Idempotent: deterministic array _keys + createOrReplace on _id
// "hireEngineersPage" => clean overwrite each run.
//
// Author-voice rule (Jake's persistent memory): no em/en dashes. normalizeDeep
// strips them from every string written.
//
// Run: npm run static:seed-hire-engineers-page
// Token: SANITY_MIGRATION_WRITE_TOKEN
//
// WARNING: createOrReplace wipes any images Seb uploaded. Never re-run this seed
// after Seb has added photos in Studio.

// SEO meta - metaTitle <=60, metaDescription 140-160 (schema validation).
const META_TITLE = HIRE_ENGINEERS_META.title
const META_DESCRIPTION = HIRE_ENGINEERS_META.description

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
    eyebrow: HE.hero.eyebrow,
    h1Lead: HE.hero.h1Lead,
    h1Em: HE.hero.h1Em,
    sub: HE.hero.sub,
    ctaPrimary: HE.hero.ctaPrimary,
    ctaGhost: HE.hero.ctaGhost,
    trust: [...HE.hero.trust],
    card: {
      label: HE.hero.card.label,
      badge: HE.hero.card.badge,
      per: HE.hero.card.per,
      foot: HE.hero.card.foot,
      candidates: keyed(
        HE.hero.card.candidates.map((c) => ({ av: c.av, nm: c.nm, rl: c.rl, rate: c.rate })),
        'hero-cand',
      ),
    },
  }

  const offer = {
    eyebrow: HE.offer.eyebrow,
    h2Lead: HE.offer.h2Lead,
    h2Em: HE.offer.h2Em,
    lead: HE.offer.lead,
    cards: keyed(
      HE.offer.cards.map((c) => ({ h4: c.h4, p: c.p })),
      'offer',
    ),
    img: { tag: HE.offer.img.tag, t: HE.offer.img.t, s: HE.offer.img.s },
  }

  const roles = {
    eyebrow: HE.roles.eyebrow,
    h2Lead: HE.roles.h2Lead,
    h2Em: HE.roles.h2Em,
    items: keyed(
      HE.roles.items.map((r) => ({ rn: r.rn, rd: r.rd })),
      'role',
    ),
  }

  const how = {
    eyebrow: HE.how.eyebrow,
    h2Lead: HE.how.h2Lead,
    h2Em: HE.how.h2Em,
    steps: keyed(
      HE.how.steps.map((s) => ({ n: s.n, h4: s.h4, p: s.p })),
      'how',
    ),
    more: HE.how.more,
  }

  const vet = {
    eyebrow: HE.vet.eyebrow,
    h2Lead: HE.vet.h2Lead,
    h2Em: HE.vet.h2Em,
    points: keyed(
      HE.vet.points.map((pt) => ({ h4: pt.h4, p: pt.p })),
      'vet-pt',
    ),
    profile: {
      av: HE.vet.profile.av,
      nm: HE.vet.profile.nm,
      rl: HE.vet.profile.rl,
      tabs: [...HE.vet.profile.tabs],
      assessment: HE.vet.profile.assessment,
      scores: keyed(
        HE.vet.profile.scores.map((s) => ({ sn: s.sn, w: s.w, sp: s.sp })),
        'score',
      ),
      openTitle: HE.vet.profile.openTitle,
      openBtn: HE.vet.profile.openBtn,
    },
    tour: HE.vet.tour,
    modalStrong: HE.vet.modalStrong,
    modalBody: HE.vet.modalBody,
    // tourVideoUrl + tourPoster deliberately left empty - Seb pastes/uploads in Studio.
  }

  const proof = {
    eyebrow: HE.proof.eyebrow,
    h2Lead: HE.proof.h2Lead,
    h2Em: HE.proof.h2Em,
    stat: HE.proof.stat,
    quote: HE.proof.quote,
    whoName: HE.proof.whoName,
    whoRole: HE.proof.whoRole,
    sideImg: { tag: HE.proof.sideImg.tag, t: HE.proof.sideImg.t, s: HE.proof.sideImg.s },
    mini: { n: HE.proof.mini.n, l: HE.proof.mini.l },
    visitImg: { tag: HE.proof.visitImg.tag, t: HE.proof.visitImg.t, s: HE.proof.visitImg.s },
    note: HE.proof.note,
  }

  const price = {
    eyebrow: HE.price.eyebrow,
    h2Lead: HE.price.h2Lead,
    h2Em: HE.price.h2Em,
    roleLabel: HE.price.roleLabel,
    regionLabel: HE.price.regionLabel,
    senLabel: HE.price.senLabel,
    roleOptions: [...HE.price.roleOptions],
    regionOptions: [...HE.price.regionOptions],
    senOptions: [...HE.price.senOptions],
    outLabel: HE.price.outLabel,
    initialCost: HE.price.initialCost,
    per: HE.price.per,
    vsLabel: HE.price.vsLabel,
    initialSave: HE.price.initialSave,
    cta: HE.price.cta,
    note: HE.price.note,
  }

  const find = {
    eyebrow: HE.find.eyebrow,
    h2Lead: HE.find.h2Lead,
    h2Em: HE.find.h2Em,
    lead: HE.find.lead,
    stepper: keyed(
      HE.find.stepper.map((s) => ({ num: s.num, lbl: s.lbl })),
      'step',
    ),
    step0: { q: HE.find.step0.q, hint: HE.find.step0.hint, opts: [...HE.find.step0.opts] },
    step1: { q: HE.find.step1.q, hint: HE.find.step1.hint, opts: [...HE.find.step1.opts] },
    step2: { q: HE.find.step2.q, hint: HE.find.step2.hint, opts: [...HE.find.step2.opts] },
    step3: {
      q: HE.find.step3.q,
      hint: HE.find.step3.hint,
      per: HE.find.step3.per,
      matches: keyed(
        HE.find.step3.matches.map((m) => ({ ftag: m.ftag, nm: m.nm, rl: m.rl, rate: m.rate })),
        'match',
      ),
      cta: HE.find.step3.cta,
    },
    footTrust: [...HE.find.footTrust],
    back: HE.find.back,
    next: HE.find.next,
    img: { tag: HE.find.img.tag, t: HE.find.img.t, s: HE.find.img.s },
    talkLabel: HE.find.talkLabel,
    talkAi: HE.find.talkAi,
    talkBook: HE.find.talkBook,
  }

  const final = {
    h2Lead: HE.final.h2Lead,
    h2Em: HE.final.h2Em,
    p: HE.final.p,
    cta: HE.final.cta,
    sub: HE.final.sub,
  }

  const doc = {
    _id: 'hireEngineersPage',
    _type: 'hireEngineersPage',
    title: 'Hire Engineers Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero,
    offer,
    roles,
    how,
    vet,
    proof,
    price,
    find,
    final,
  }

  return normalizeDeep(doc)
}

async function main() {
  console.log('Building hireEngineersPage doc...')
  const doc = buildDoc()
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace hireEngineersPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
