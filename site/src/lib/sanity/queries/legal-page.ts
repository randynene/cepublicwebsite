import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'

// The two long-form legal pages: /legals/privacy-policy and /legals/general-terms.
//
// Both are singletons of the same shape (defineStaticPage), and both store their
// body as a single richTextSection — one continuous legal document, not a set of
// marketing sections. One query, parameterised by singleton id, rather than a
// copy per page.
//
// generalTermsPage had no query, no route and no singleton until Jul 2026, and
// nothing had noticed: /legals/general-terms is a live 200 page in both locales
// but has no backlinks, no rankings and is not in the sitemap, so every source we
// built the parity corpus from was blind to it.

const PortableBlockSchema = z
  .object({ _key: z.string().optional(), _type: z.string() })
  .passthrough()

export const LegalPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  _updatedAt: z.string().nullable().optional(),
  title: z.string(),
  eyebrow: z.string().nullable().optional(),
  body: z.array(PortableBlockSchema).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
})

export type LegalPage = z.infer<typeof LegalPageSchema>

export type LegalPageId = 'privacyPolicyPage' | 'generalTermsPage' | 'cookiePolicyPage'

const LEGAL_PAGE_QUERY = /* groq */ `
*[_id == $id][0]{
  _id,
  _type,
  _updatedAt,
  title,
  eyebrow,
  "body": sections[_type == "richTextSection"][0].content,
  metaTitle,
  metaDescription
}
`

export async function fetchLegalPage(id: LegalPageId): Promise<LegalPage | null> {
  const { data } = await sanityFetch({ query: LEGAL_PAGE_QUERY, params: { id } })
  if (data === null || data === undefined) return null
  return LegalPageSchema.parse(data)
}

// Sanity stores `_updatedAt` as an ISO datetime. Render it as a human date.
export function formatLastUpdated(
  iso: string | null | undefined,
  locale: 'en-US' | 'en-GB' = 'en-US',
): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}
