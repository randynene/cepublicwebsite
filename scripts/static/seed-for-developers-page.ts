import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import {
  FOR_ENGINEERS_CONTENT as FE,
  FOR_ENGINEERS_META,
  JOIN_CONTENT as JC,
} from '../../site/src/components/templates/for-engineers/content'

// MYGRATR For Developers Sanity wiring - seed the forDevelopersPage singleton.
//
// Transcribes the template's static FOR_ENGINEERS_CONTENT 1:1 into the singleton
// so Seb can edit every headline, card line, benefit, testimonial, CTA, and
// join-form copy in Studio, and drop real photos into the 10 image slots. The
// page body is a tokenised Figma export hydrated from this doc; field names
// match the content paths exactly, so the site-side transform is a blunt cast.
//
// IMAGE SLOTS: left EMPTY here (hero card, 2 video-call stills, 3 benefit photos,
// the testimonial video poster, 3 quote-card photos). Empty keeps the baked Figma
// placeholder tile, so the page stays pixel-identical until Seb uploads.
//
// TESTIMONIALS: the three quotes (Kenneth / Jen / Lance) are PLACEHOLDER copy
// carried from the frozen export - not real engineer testimonials. Seb replaces
// them in Studio before a public relaunch. tests.videoUrl carries CE's Boracay
// Cloudfest film, which the tile plays muted on loop.
//
// JOIN FORM: seeded from JOIN_CONTENT (D2 demo - editable copy, no HubSpot yet).
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
    ctaPrimaryHref: FE.hero.ctaPrimaryHref ?? 'https://talent.cloudemployee.io',
    ctaGhost: FE.hero.ctaGhost,
    ctaGhostHref: FE.hero.ctaGhostHref ?? '#fe2-how',
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
    videoUrl: FE.tests.videoUrl,
    // videoImage left empty - the video covers the tile, so the poster only
    // shows for the split second before the player mounts.
    quotes: keyed(
      FE.tests.quotes.map((q) => ({ name: q.name, role: q.role, quote: q.quote })),
      'quote',
    ),
  }

  const join = {
    eyebrow: JC.eyebrow,
    titleLead: JC.titleLead,
    titleAccent: JC.titleAccent,
    lead: JC.lead,
    continue: JC.continue,
    joinCta: JC.joinCta,
    back: JC.back,
    steps: keyed(
      JC.steps.map((s) => ({ label: s.label, q: s.q })),
      'join-step',
    ),
    fields: {
      locLabel: JC.fields.locLabel,
      locPlaceholder: JC.fields.locPlaceholder,
      roleLabel: JC.fields.roleLabel,
      roleDefault: JC.fields.roleDefault,
      roles: [...JC.fields.roles],
      yrsLabel: JC.fields.yrsLabel,
      yrsDefault: JC.fields.yrsDefault,
      yrs: [...JC.fields.yrs],
      skillsLabel: JC.fields.skillsLabel,
      skills: [...JC.fields.skills],
      skillPlaceholder: JC.fields.skillPlaceholder,
      skillVocab: [...JC.fields.skillVocab],
      styleLabel: JC.fields.styleLabel,
      styles: [...JC.fields.styles],
      rateHelp: JC.fields.rateHelp,
      rateLabel: JC.fields.rateLabel,
      ratePlaceholder: JC.fields.ratePlaceholder,
      availLabel: JC.fields.availLabel,
      availDefault: JC.fields.availDefault,
      avail: [...JC.fields.avail],
      nameLabel: JC.fields.nameLabel,
      namePlaceholder: JC.fields.namePlaceholder,
      emailLabel: JC.fields.emailLabel,
      emailPlaceholder: JC.fields.emailPlaceholder,
      workLabel: JC.fields.workLabel,
      workHint: JC.fields.workHint,
      workPlaceholder: JC.fields.workPlaceholder,
    },
    done: { h: JC.done.h, p: JC.done.p },
    preview: {
      pl: JC.preview.pl,
      name: JC.preview.name,
      role: JC.preview.role,
      tagsEmpty: JC.preview.tagsEmpty,
      label: JC.preview.label,
      rateEmpty: JC.preview.rateEmpty,
      rateSub: JC.preview.rateSub,
      foot: keyed(
        JC.preview.foot.map((f) => ({ n: f.n, l: f.l })),
        'join-foot',
      ),
    },
  }

  const final = {
    titleLead: FE.final.titleLead,
    titleAccent: FE.final.titleAccent,
    p: FE.final.p,
    cta: FE.final.cta,
    ctaHref: FE.final.ctaHref ?? 'https://talent.cloudemployee.io',
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
    join,
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
