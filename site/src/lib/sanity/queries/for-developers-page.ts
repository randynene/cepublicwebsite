import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import {
  FOR_ENGINEERS_CONTENT,
  JOIN_CONTENT,
  type FeJoin,
  type ForEngineersContent,
} from '@/components/templates/for-engineers/content'

// forDevelopersPage singleton fetch (routes /for-developers + /uk).
//
// The template body is a tokenised Figma export hydrated from the content
// object; every image URL is embedded into a CSS background-image value, so the
// 10 image slots are projected as plain asset URLs and stega-cleaned in the
// transform (stega characters would corrupt a url("...") value). Editable text
// keeps its stega encoding so Presentation click-to-edit works. Join-form copy
// comes from Sanity when seeded (JOIN_CONTENT fallback). page.tsx falls back to
// the static FOR_ENGINEERS_CONTENT when the doc is null.

const FOR_DEVELOPERS_QUERY = /* groq */ `
*[_id == "forDevelopersPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, titleLead, titleAccent, sub, ctaPrimary, ctaPrimaryHref, ctaGhost, ctaGhostHref, trust,
    card{ name, role, matched, workLabel, tags, foot[]{ n, l }, "image": image.asset->url }
  },
  problem{
    eyebrow, titleLead, titleAccent, leadPre, leadStrong, leadPost,
    stats[]{ num, body }
  },
  how{
    eyebrow, titleLead, titleAccent,
    steps{
      one{ n, h, p, tag, miniLabel, rows },
      two{ n, badge, h, p, live, camYou, camEng, "camYouImage": camYouImage.asset->url, "camEngImage": camEngImage.asset->url },
      three{ n, h, p, incomingLabel, msgs[]{ co, ln, mt } },
      four{ n, h, p, tag, handleLabel, chips }
    }
  },
  benefits{
    eyebrow, titleLead, titleAccent, lead,
    items[]{ h, p },
    photos[]{ caption, sub, "image": image.asset->url }
  },
  mission{ eyebrow, titleLead, titleAccent, p },
  tests{
    eyebrow, titleLead, titleAccent, videoPill, videoLabel, videoUrl, "videoImage": videoImage.asset->url,
    quotes[]{ name, role, quote, "image": image.asset->url }
  },
  join{
    eyebrow, titleLead, titleAccent, lead, continue, joinCta, back,
    steps[]{ label, q },
    fields{
      locLabel, locPlaceholder, roleLabel, roleDefault, roles,
      yrsLabel, yrsDefault, yrs, skillsLabel, skills, skillPlaceholder, skillVocab,
      styleLabel, styles, rateHelp, rateLabel, ratePlaceholder,
      availLabel, availDefault, avail,
      nameLabel, namePlaceholder, emailLabel, emailPlaceholder,
      workLabel, workHint, workPlaceholder
    },
    done{ h, p },
    preview{ pl, name, role, tagsEmpty, label, rateEmpty, rateSub, foot[]{ n, l } }
  },
  final{ titleLead, titleAccent, p, cta, ctaHref, trust }
}
`

// ── Zod boundary schema (lenient - static content is the fallback) ───────
const nzs = z.string().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

export const ForDevelopersPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      sub: nzs,
      ctaPrimary: nzs,
      ctaPrimaryHref: nzs,
      ctaGhost: nzs,
      ctaGhostHref: nzs,
      trust: zStrArr,
      card: z
        .object({
          name: nzs,
          role: nzs,
          matched: nzs,
          workLabel: nzs,
          tags: zStrArr,
          foot: z.array(z.object({ n: nzs, l: nzs })).nullable().optional(),
          image: nzs,
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  problem: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      leadPre: nzs,
      leadStrong: nzs,
      leadPost: nzs,
      stats: z.array(z.object({ num: nzs, body: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  how: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      steps: z
        .object({
          one: z
            .object({ n: nzs, h: nzs, p: nzs, tag: nzs, miniLabel: nzs, rows: zStrArr })
            .nullable()
            .optional(),
          two: z
            .object({
              n: nzs,
              badge: nzs,
              h: nzs,
              p: nzs,
              live: nzs,
              camYou: nzs,
              camEng: nzs,
              camYouImage: nzs,
              camEngImage: nzs,
            })
            .nullable()
            .optional(),
          three: z
            .object({
              n: nzs,
              h: nzs,
              p: nzs,
              incomingLabel: nzs,
              msgs: z.array(z.object({ co: nzs, ln: nzs, mt: nzs })).nullable().optional(),
            })
            .nullable()
            .optional(),
          four: z
            .object({ n: nzs, h: nzs, p: nzs, tag: nzs, handleLabel: nzs, chips: zStrArr })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  benefits: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      lead: nzs,
      items: z.array(z.object({ h: nzs, p: nzs })).nullable().optional(),
      photos: z.array(z.object({ caption: nzs, sub: nzs, image: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  mission: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, p: nzs })
    .nullable()
    .optional(),
  tests: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      videoPill: nzs,
      videoLabel: nzs,
      videoUrl: nzs,
      videoImage: nzs,
      quotes: z
        .array(z.object({ name: nzs, role: nzs, quote: nzs, image: nzs }))
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  join: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      lead: nzs,
      continue: nzs,
      joinCta: nzs,
      back: nzs,
      steps: z.array(z.object({ label: nzs, q: nzs })).nullable().optional(),
      fields: z
        .object({
          locLabel: nzs,
          locPlaceholder: nzs,
          roleLabel: nzs,
          roleDefault: nzs,
          roles: zStrArr,
          yrsLabel: nzs,
          yrsDefault: nzs,
          yrs: zStrArr,
          skillsLabel: nzs,
          skills: zStrArr,
          skillPlaceholder: nzs,
          skillVocab: zStrArr,
          styleLabel: nzs,
          styles: zStrArr,
          rateHelp: nzs,
          rateLabel: nzs,
          ratePlaceholder: nzs,
          availLabel: nzs,
          availDefault: nzs,
          avail: zStrArr,
          nameLabel: nzs,
          namePlaceholder: nzs,
          emailLabel: nzs,
          emailPlaceholder: nzs,
          workLabel: nzs,
          workHint: nzs,
          workPlaceholder: nzs,
        })
        .nullable()
        .optional(),
      done: z.object({ h: nzs, p: nzs }).nullable().optional(),
      preview: z
        .object({
          pl: nzs,
          name: nzs,
          role: nzs,
          tagsEmpty: nzs,
          label: nzs,
          rateEmpty: nzs,
          rateSub: nzs,
          foot: z.array(z.object({ n: nzs, l: nzs })).nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  final: z
    .object({ titleLead: nzs, titleAccent: nzs, p: nzs, cta: nzs, ctaHref: nzs, trust: zStrArr })
    .nullable()
    .optional(),
})

export type ForDevelopersPageData = z.infer<typeof ForDevelopersPageSchema>

// Returns the parsed singleton, or null when absent / invalid. sanityFetch
// dedupes within a request so generateMetadata and the page body share one call.
export async function fetchForDevelopersPage(): Promise<ForDevelopersPageData | null> {
  const { data } = await sanityFetch({ query: FOR_DEVELOPERS_QUERY })
  if (data === null || data === undefined) return null
  const result = ForDevelopersPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[forDevelopersPage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// stega-clean an image URL string in place (leave null/absent alone).
function cleanUrl(v: string | null | undefined): string | undefined {
  return typeof v === 'string' ? stegaClean(v) : undefined
}

function strArr(v: (string | null | undefined)[] | null | undefined, fallback: readonly string[]): string[] {
  const cleaned = (v ?? []).filter((s): s is string => typeof s === 'string' && s.length > 0)
  return cleaned.length > 0 ? cleaned : [...fallback]
}

function mapJoin(raw: ForDevelopersPageData['join']): FeJoin {
  if (!raw?.fields || !raw.steps || raw.steps.length === 0) return JOIN_CONTENT
  const f = raw.fields
  const steps = raw.steps
    .filter((s): s is { label: string; q: string } => Boolean(s?.label && s?.q))
    .map((s) => ({ label: s.label, q: s.q }))
  if (steps.length === 0) return JOIN_CONTENT

  return {
    eyebrow: raw.eyebrow ?? JOIN_CONTENT.eyebrow,
    titleLead: raw.titleLead ?? JOIN_CONTENT.titleLead,
    titleAccent: raw.titleAccent ?? JOIN_CONTENT.titleAccent,
    lead: raw.lead ?? JOIN_CONTENT.lead,
    continue: raw.continue ?? JOIN_CONTENT.continue,
    joinCta: raw.joinCta ?? JOIN_CONTENT.joinCta,
    back: raw.back ?? JOIN_CONTENT.back,
    steps: steps.length === JOIN_CONTENT.steps.length ? steps : [...JOIN_CONTENT.steps],
    fields: {
      locLabel: f.locLabel ?? JOIN_CONTENT.fields.locLabel,
      locPlaceholder: f.locPlaceholder ?? JOIN_CONTENT.fields.locPlaceholder,
      roleLabel: f.roleLabel ?? JOIN_CONTENT.fields.roleLabel,
      roleDefault: f.roleDefault ?? JOIN_CONTENT.fields.roleDefault,
      roles: strArr(f.roles, JOIN_CONTENT.fields.roles),
      yrsLabel: f.yrsLabel ?? JOIN_CONTENT.fields.yrsLabel,
      yrsDefault: f.yrsDefault ?? JOIN_CONTENT.fields.yrsDefault,
      yrs: strArr(f.yrs, JOIN_CONTENT.fields.yrs),
      skillsLabel: f.skillsLabel ?? JOIN_CONTENT.fields.skillsLabel,
      skills: strArr(f.skills, JOIN_CONTENT.fields.skills),
      skillPlaceholder: f.skillPlaceholder ?? JOIN_CONTENT.fields.skillPlaceholder,
      skillVocab: strArr(f.skillVocab, JOIN_CONTENT.fields.skillVocab),
      styleLabel: f.styleLabel ?? JOIN_CONTENT.fields.styleLabel,
      styles: strArr(f.styles, JOIN_CONTENT.fields.styles),
      rateHelp: f.rateHelp ?? JOIN_CONTENT.fields.rateHelp,
      rateLabel: f.rateLabel ?? JOIN_CONTENT.fields.rateLabel,
      ratePlaceholder: f.ratePlaceholder ?? JOIN_CONTENT.fields.ratePlaceholder,
      availLabel: f.availLabel ?? JOIN_CONTENT.fields.availLabel,
      availDefault: f.availDefault ?? JOIN_CONTENT.fields.availDefault,
      avail: strArr(f.avail, JOIN_CONTENT.fields.avail),
      nameLabel: f.nameLabel ?? JOIN_CONTENT.fields.nameLabel,
      namePlaceholder: f.namePlaceholder ?? JOIN_CONTENT.fields.namePlaceholder,
      emailLabel: f.emailLabel ?? JOIN_CONTENT.fields.emailLabel,
      emailPlaceholder: f.emailPlaceholder ?? JOIN_CONTENT.fields.emailPlaceholder,
      workLabel: f.workLabel ?? JOIN_CONTENT.fields.workLabel,
      workHint: f.workHint ?? JOIN_CONTENT.fields.workHint,
      workPlaceholder: f.workPlaceholder ?? JOIN_CONTENT.fields.workPlaceholder,
    },
    done: {
      h: raw.done?.h ?? JOIN_CONTENT.done.h,
      p: raw.done?.p ?? JOIN_CONTENT.done.p,
    },
    preview: {
      pl: raw.preview?.pl ?? JOIN_CONTENT.preview.pl,
      name: raw.preview?.name ?? JOIN_CONTENT.preview.name,
      role: raw.preview?.role ?? JOIN_CONTENT.preview.role,
      tagsEmpty: raw.preview?.tagsEmpty ?? JOIN_CONTENT.preview.tagsEmpty,
      label: raw.preview?.label ?? JOIN_CONTENT.preview.label,
      rateEmpty: raw.preview?.rateEmpty ?? JOIN_CONTENT.preview.rateEmpty,
      rateSub: raw.preview?.rateSub ?? JOIN_CONTENT.preview.rateSub,
      foot: (() => {
        const foot = (raw.preview?.foot ?? [])
          .filter((x): x is { n: string; l: string } => Boolean(x?.n && x?.l))
          .map((x) => ({ n: x.n, l: x.l }))
        return foot.length > 0 ? foot : [...JOIN_CONTENT.preview.foot]
      })(),
    },
  } as unknown as FeJoin
}

// Cast the lenient boundary shape into the template content type. Whole sections
// fall back to the static content when absent; image URLs are stega-cleaned (a
// CSS url() value cannot carry stega characters); editable text keeps its stega
// encoding for Presentation click-to-edit; join falls back to JOIN_CONTENT.
export function toForEngineersContent(data: ForDevelopersPageData): ForEngineersContent {
  const c = data as unknown as ForEngineersContent
  const FE = FOR_ENGINEERS_CONTENT

  const hero: ForEngineersContent['hero'] = c.hero
    ? {
        ...FE.hero,
        ...c.hero,
        // Studio still stores the old one-line sub ("…fit your work style").
        // Keep the short line-1 string so the CE-13 rotator can own line 2.
        sub: (() => {
          const raw = (c.hero.sub || '').trim()
          if (!raw || /work style\s*$/i.test(raw)) return FE.hero.sub
          return raw
        })(),
        subRotateLead: FE.hero.subRotateLead,
        subRotate: FE.hero.subRotate,
        // Live-jobs CTAs are code-owned: Studio still holds the old
        // "Join the network" / #join pair and must not win on merge.
        ctaPrimary: FE.hero.ctaPrimary,
        ctaPrimaryHref: FE.hero.ctaPrimaryHref,
        // In-page process scroll is the product default. Treat legacy
        // /how-it-works values as unset so they cannot override #fe2-how.
        ctaGhostHref: (() => {
          const raw = (c.hero.ctaGhostHref || '').trim()
          if (!raw || raw === '/how-it-works' || raw === '/uk/how-it-works') {
            return FE.hero.ctaGhostHref
          }
          return raw
        })(),
        card: { ...FE.hero.card, ...c.hero.card, image: cleanUrl(c.hero.card?.image) },
      }
    : FE.hero

  const how: ForEngineersContent['how'] = c.how
    ? {
        ...c.how,
        steps: {
          ...c.how.steps,
          two: {
            ...c.how.steps.two,
            camYouImage: cleanUrl(c.how.steps.two?.camYouImage),
            camEngImage: cleanUrl(c.how.steps.two?.camEngImage),
          },
        },
      }
    : FE.how

  const benefits: ForEngineersContent['benefits'] = c.benefits
    ? {
        ...c.benefits,
        photos: (c.benefits.photos ?? []).map((p) => ({ ...p, image: cleanUrl(p.image) })),
        // Code-only flag — Studio has no field; keep the hide across Sanity merges.
        hideCommunityBlock: FE.benefits.hideCommunityBlock,
      }
    : FE.benefits

  const tests: ForEngineersContent['tests'] = c.tests
    ? {
        ...c.tests,
        videoImage: cleanUrl(c.tests.videoImage),
        // Falls back to code the same way ctaHref does below, so the video
        // still plays if the Studio field is ever cleared.
        videoUrl: cleanUrl(c.tests.videoUrl) || FE.tests.videoUrl || '',
        quotes: (c.tests.quotes ?? []).map((q) => ({ ...q, image: cleanUrl(q.image) })),
      }
    : FE.tests

  const final: ForEngineersContent['final'] = c.final
    ? {
        ...FE.final,
        ...c.final,
        // Same code-owned lock as the hero primary CTA above.
        cta: FE.final.cta,
        ctaHref: FE.final.ctaHref,
      }
    : FE.final

  return {
    hero,
    problem: (() => {
      const base = c.problem ?? FE.problem
      const twoBody = FE.problem.stats.find((s) => s.num === '2')?.body
      return {
        ...base,
        // Keep the intentional line-break on the "2" stat (layout fix, code-owned).
        stats: base.stats.map((s) =>
          s.num === '2' && twoBody ? { ...s, body: twoBody } : s,
        ),
      }
    })(),
    how,
    benefits,
    mission: c.mission ?? FE.mission,
    tests,
    final,
    join: mapJoin(data.join),
  }
}
