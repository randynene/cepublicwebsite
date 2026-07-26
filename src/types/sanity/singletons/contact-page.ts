import { z } from 'zod'

// Bespoke contactPage shape (WP-05). The site's runtime contract lives in
// site/src/lib/sanity/queries/contact-page.ts — this twin is a lenient mirror
// for repo-wide type exports (not used by the Next.js template directly).

const nzs = z.string().nullable().optional()

export const ContactPageSchema = z.object({
  _id: z.literal('contactPage').or(z.string()),
  _type: z.literal('contactPage'),
  title: nzs,
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      paragraphs: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
  contactStrip: z
    .object({
      links: z
        .array(z.object({ kind: nzs, label: nzs, value: nzs }))
        .nullable()
        .optional(),
      note: nzs,
    })
    .nullable()
    .optional(),
  form: z
    .object({ heading: nzs, hubspotFormId: nzs, portalId: nzs })
    .nullable()
    .optional(),
  offices: z
    .object({
      eyebrow: nzs,
      heading: nzs,
      items: z
        .array(z.object({ name: nzs, address: nzs, phone: nzs, email: nzs }))
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
})

export type ContactPage = z.infer<typeof ContactPageSchema>
