import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { stegaEnum } from '@/lib/sanity/stega-enum'

// MYGRATR-STATIC-2 Step 2 — footer global fetch.
//
// Schema source of truth: studio/schemas/globals/footer.ts.
//
// STATIC-1 baseline fields (kept; marked LEGACY in Studio):
//   newsletterFormId, copyrightText (supports {year} token), columns[]
//   ({ heading, links[{ label, url }] }), legalLinks[{ label, url }].
//
// STATIC-2 additions (new):
//   topCtaBlock    — heading + statRow + primaryCta + secondaryCta
//   sections[]     — sectionLabel + sectionLabelStyle + columns[] (heading +
//                    headingHasArrow + headingUrl + links[]) + optional
//                    bottomPillLinks[]
//   talentLocations — sectionLabel + items[]
//   subscribe      — heading + description + formId + submitLabel
//   bottomBar      — copyrightText + links[] + regionSelector
//
// Read-model nullability per TB18: every STATIC-2-added field is .nullable().optional().

// ─── Pill style enum (5 variants)
const PillStyleSchema = stegaEnum([
  'pill-green',
  'pill-dark',
  'pill-gradient',
  'pill-navy',
  'pill-outline-light',
])
export type FooterPillStyle = z.infer<typeof PillStyleSchema>

// ─── Generic label+url shape used across new fields
const FooterLinkSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
})

// ─── CTA shape (label + url; provenance lives in audit JSON, not Sanity)
const FooterCtaSchema = z
  .object({
    label: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

// ─── Top CTA block
const TopCtaBlockSchema = z
  .object({
    enabled: z.boolean().nullable().optional(),
    heading: z.string().nullable().optional(),
    statRow: z.string().nullable().optional(),
    primaryCta: FooterCtaSchema,
    secondaryCta: FooterCtaSchema,
  })
  .nullable()
  .optional()

// ─── Sections (Our Expertise / Learn more)
const FooterSectionColumnSchema = z.object({
  _key: z.string(),
  heading: z.string(),
  headingHasArrow: z.boolean().nullable().optional(),
  headingUrl: z.string().nullable().optional(),
  links: z.array(FooterLinkSchema).nullable().optional(),
})

const FooterBottomPillLinkSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
  hasArrow: z.boolean().nullable().optional(),
  variant: PillStyleSchema.nullable().optional(),
})

const FooterSectionSchema = z.object({
  _key: z.string(),
  sectionLabel: z.string(),
  sectionLabelStyle: PillStyleSchema.nullable().optional(),
  columns: z.array(FooterSectionColumnSchema).nullable().optional(),
  bottomPillLinks: z.array(FooterBottomPillLinkSchema).nullable().optional(),
})

// ─── Talent locations
const TalentLocationItemSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
})

const TalentLocationsSchema = z
  .object({
    sectionLabel: z.string().nullable().optional(),
    sectionLabelStyle: PillStyleSchema.nullable().optional(),
    items: z.array(TalentLocationItemSchema).nullable().optional(),
  })
  .nullable()
  .optional()

// ─── Subscribe
const SubscribeSchema = z
  .object({
    heading: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    formId: z.string().nullable().optional(),
    submitLabel: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

// ─── Bottom bar
const RegionOptionSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
  hreflang: z.string().nullable().optional(),
})

const RegionSelectorSchema = z
  .object({
    enabled: z.boolean().nullable().optional(),
    options: z.array(RegionOptionSchema).nullable().optional(),
  })
  .nullable()
  .optional()

const BottomBarSchema = z
  .object({
    copyrightText: z.string().nullable().optional(),
    links: z.array(FooterLinkSchema).nullable().optional(),
    regionSelector: RegionSelectorSchema,
  })
  .nullable()
  .optional()

// ─── Legacy footer column (kept)
const FooterColumnSchema = z.object({
  _key: z.string(),
  heading: z.string(),
  links: z.array(FooterLinkSchema),
})

// ─── Top-level footer
export const FooterSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  // Legacy (kept for STATIC-1 render regression safety; deprecated):
  newsletterFormId: z.string().optional(),
  copyrightText: z.string().optional(),
  columns: z.array(FooterColumnSchema).optional(),
  legalLinks: z.array(FooterLinkSchema).optional(),
  // STATIC-2 additions:
  topCtaBlock: TopCtaBlockSchema,
  sections: z.array(FooterSectionSchema).nullable().optional(),
  talentLocations: TalentLocationsSchema,
  subscribe: SubscribeSchema,
  bottomBar: BottomBarSchema,
})

export type FooterDoc = z.infer<typeof FooterSchema>
export type FooterColumn = z.infer<typeof FooterColumnSchema>
export type FooterLink = z.infer<typeof FooterLinkSchema>
export type FooterSection = z.infer<typeof FooterSectionSchema>
export type FooterSectionColumn = z.infer<typeof FooterSectionColumnSchema>
export type FooterBottomPillLink = z.infer<typeof FooterBottomPillLinkSchema>
export type TopCtaBlock = z.infer<typeof TopCtaBlockSchema>
export type TalentLocations = z.infer<typeof TalentLocationsSchema>
export type Subscribe = z.infer<typeof SubscribeSchema>
export type BottomBar = z.infer<typeof BottomBarSchema>

const FOOTER_QUERY = /* groq */ `
*[_id == "footer"][0]{
  _id,
  _type,
  newsletterFormId,
  copyrightText,
  columns[]{
    _key,
    heading,
    links[]{ _key, label, url }
  },
  legalLinks[]{ _key, label, url },
  topCtaBlock{
    enabled,
    heading,
    statRow,
    primaryCta{ label, url },
    secondaryCta{ label, url }
  },
  sections[]{
    _key,
    sectionLabel,
    sectionLabelStyle,
    columns[]{
      _key,
      heading,
      headingHasArrow,
      headingUrl,
      links[]{ _key, label, url }
    },
    bottomPillLinks[]{ _key, label, url, hasArrow, variant }
  },
  talentLocations{
    sectionLabel,
    sectionLabelStyle,
    items[]{ _key, label, url }
  },
  subscribe{
    heading,
    description,
    formId,
    submitLabel
  },
  bottomBar{
    copyrightText,
    links[]{ _key, label, url },
    regionSelector{
      enabled,
      options[]{ _key, label, url, hreflang }
    }
  }
}
`

export async function fetchFooter(): Promise<FooterDoc | null> {
  const { data } = await sanityFetch({ query: FOOTER_QUERY })
  if (data === null || data === undefined) return null
  return FooterSchema.parse(data)
}

// Token substitution for the copyrightText "{year}" placeholder.
// Sanity stores the literal copy + token; the year is resolved at render
// time so the footer auto-updates without re-seeding.
export function resolveCopyright(text: string | undefined): string {
  if (!text) return ''
  return text.replace(/\{year\}/g, String(new Date().getFullYear()))
}
