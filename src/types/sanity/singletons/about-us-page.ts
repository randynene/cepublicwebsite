import { z } from 'zod'

// Bespoke aboutUsPage shape (WP-04). The site's runtime contract lives in
// site/src/lib/sanity/queries/about-us-page.ts — this twin is a lenient mirror
// for repo-wide type exports (not used by the Next.js template directly).

const nzs = z.string().nullable().optional()

export const AboutUsPageSchema = z.object({
  _id: z.literal('aboutUsPage').or(z.string()),
  _type: z.literal('aboutUsPage'),
  title: nzs,
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      intro: nzs,
      cta: nzs,
      ctaHref: nzs,
    })
    .nullable()
    .optional(),
  trusted: z.object({ pre: nzs, highlight: nzs, post: nzs }).nullable().optional(),
  stats: z.array(z.object({ value: nzs, label: nzs })).nullable().optional(),
  story: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, body: nzs })
    .nullable()
    .optional(),
  team: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, intro: nzs })
    .nullable()
    .optional(),
  values: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, intro: nzs })
    .nullable()
    .optional(),
  reviews: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs })
    .nullable()
    .optional(),
  midCta: z
    .object({ eyebrow: nzs, heading: nzs, cta: nzs, ctaHref: nzs, micro: nzs })
    .nullable()
    .optional(),
})

export type AboutUsPage = z.infer<typeof AboutUsPageSchema>
