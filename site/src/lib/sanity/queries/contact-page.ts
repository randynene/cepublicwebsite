import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import {
  CONTACT_CONTENT,
  type ContactContent,
  type ContactOffice,
  type ContactQuickLink,
  type ContactQuickLinkKind,
} from '@/components/templates/contact/content'
import { sanityFetch } from '@/lib/sanity/live'

// contactPage singleton for /contact + /uk/contact.
// Bespoke shape (About Us pattern): every field falls back to CONTACT_CONTENT
// so an empty or half-filled document still renders the live page.

const CONTACT_QUERY = /* groq */ `
*[_id == "contactPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{ eyebrow, titleLead, titleAccent, paragraphs },
  contactStrip{ links[]{ kind, label, value }, note },
  form{ heading, hubspotFormId, portalId },
  offices{ eyebrow, heading, items[]{ name, address, phone, email } }
}
`

const nzs = z.string().nullable().optional()

export const ContactPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
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

export type ContactPageData = z.infer<typeof ContactPageSchema>

export async function fetchContactPage(): Promise<ContactPageData | null> {
  const { data } = await sanityFetch({ query: CONTACT_QUERY })
  if (data === null || data === undefined) return null
  const result = ContactPageSchema.safeParse(data)
  if (!result.success) {
    console.warn('[contactPage] Sanity parse failed, falling back to static content:', result.error.message)
    return null
  }
  return result.data
}

function pick(v: string | null | undefined, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

// hrefs and the HubSpot GUID are machine-read, not displayed, so the stega
// invisible characters Presentation injects have to come off or the link is
// malformed and hbspt.forms.create is handed a GUID HubSpot cannot match.
function cleanValue(v: string | null | undefined, fallback: string): string {
  const raw = pick(v, fallback)
  return stegaClean(raw) ?? ''
}

const QUICK_LINK_KINDS = new Set<ContactQuickLinkKind>(['calendly', 'phone', 'email', 'link'])

function toKind(v: string | null | undefined): ContactQuickLinkKind {
  const cleaned = stegaClean(v ?? '') as ContactQuickLinkKind
  return QUICK_LINK_KINDS.has(cleaned) ? cleaned : 'link'
}

export function toContactContent(data: ContactPageData): ContactContent {
  const FE = CONTACT_CONTENT

  const paragraphs = (data.hero?.paragraphs ?? []).filter((p) => typeof p === 'string' && p.trim())

  const links: ContactQuickLink[] = (data.contactStrip?.links ?? [])
    .filter((l) => Boolean(l?.label && l?.value))
    .map((l) => ({
      kind: toKind(l.kind),
      label: l.label as string,
      // The label stays stega-tagged so Presentation can click through to it;
      // only the destination is cleaned.
      value: stegaClean(l.value as string) ?? '',
    }))

  const offices: ContactOffice[] = (data.offices?.items ?? [])
    .filter((o) => Boolean(o?.name && o?.address))
    .map((o) => ({
      name: o.name as string,
      address: o.address as string,
      ...(o.phone ? { phone: o.phone } : {}),
      ...(o.email ? { email: o.email } : {}),
    }))

  return {
    hero: {
      eyebrow: pick(data.hero?.eyebrow, FE.hero.eyebrow),
      titleLead: pick(data.hero?.titleLead, FE.hero.titleLead),
      titleAccent: pick(data.hero?.titleAccent, FE.hero.titleAccent),
      paragraphs: paragraphs.length > 0 ? paragraphs : FE.hero.paragraphs,
    },
    contactStrip: {
      links: links.length > 0 ? links : FE.contactStrip.links,
      note: pick(data.contactStrip?.note, FE.contactStrip.note),
    },
    form: {
      heading: pick(data.form?.heading, FE.form.heading),
      hubspotFormId: cleanValue(data.form?.hubspotFormId, FE.form.hubspotFormId),
      portalId: cleanValue(data.form?.portalId, FE.form.portalId),
    },
    offices: {
      eyebrow: pick(data.offices?.eyebrow, FE.offices.eyebrow),
      heading: pick(data.offices?.heading, FE.offices.heading),
      items: offices.length > 0 ? offices : FE.offices.items,
    },
  }
}
