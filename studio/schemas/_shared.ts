// Reusable field builders for Mygratr Sanity schemas.
// Each builder returns a FieldDefinition (or array thereof) that callers
// spread into a schema's fields array. Keeps cross-cutting rules from
// MYGRATR_SCHEMA_DESIGN_DECISIONS §7.2 and §7.11 consistent across 20+ types.
import { defineField, type FieldDefinition } from 'sanity'

export const LOCALE_OPTIONS = [
  { title: 'Default (US)', value: 'default' },
  { title: 'UK', value: 'uk' },
] as const

export const SOURCE_OPTIONS = [
  { title: 'Manual', value: 'manual' },
  { title: 'Beem', value: 'beem' },
  { title: 'Claude Code', value: 'claude_code' },
  { title: 'Imported', value: 'imported' },
] as const

export function localeField(): FieldDefinition {
  return defineField({
    name: 'locale',
    title: 'Locale',
    type: 'string',
    options: { list: [...LOCALE_OPTIONS] },
    initialValue: 'default',
    validation: (Rule) => Rule.required(),
  })
}

export function sourceTrackingFields(): FieldDefinition[] {
  return [
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: { list: [...SOURCE_OPTIONS] },
      initialValue: 'manual',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'generatedAt',
      title: 'Generated at',
      type: 'datetime',
    }),
    defineField({
      name: 'needsReview',
      title: 'Needs review',
      type: 'boolean',
      initialValue: false,
    }),
  ]
}

// CONTENT-1D §0a — retroactive §7.2 source-tracking applied to schemas
// that already have published content without the source-tracking triplet.
//
// Differences from `sourceTrackingFields()` (used by technology/service,
// which were migrated with `source: 'imported'`):
//   - `source` is `hidden: true` and NOT required — F18: `initialValue`
//     does NOT backfill the pre-CONTENT-1D docs in these collections;
//     they remain `source: undefined`. Marking required would fail
//     validation on every existing doc.
//   - `generatedAt` is `hidden: true` (provenance metadata, not editorial).
//   - `needsReview` is visible — drives Seb's Studio review queue.
export function sourceTrackingFieldsCarryover(): FieldDefinition[] {
  return [
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: { list: [...SOURCE_OPTIONS] },
      initialValue: 'manual',
      hidden: true,
    }),
    defineField({
      name: 'generatedAt',
      title: 'Generated at',
      type: 'datetime',
      hidden: true,
    }),
    defineField({
      name: 'needsReview',
      title: 'Needs review',
      type: 'boolean',
      initialValue: false,
    }),
  ]
}

// CONTENT-1D §0a — split per-field provenance (F21).
// Hidden audit-trail objects recording how each meta field was set.
//
// `metaTitleSource.provider` ∈ {'live-scrape', 'placeholder'}
// `metaDescriptionSource.provider` ∈ {'live-scrape', 'snippetForMeta-copy',
//                                     'placeholder', 'webflow-cms'}
//
// Split (vs single `metaSource` object) is required because review docs
// may have title from live-scrape but description from snippetForMeta-copy
// — a single provenance object cannot represent both accurately.
export function metaSourceFields(): FieldDefinition[] {
  return [
    defineField({
      name: 'metaTitleSource',
      title: 'Meta title source',
      type: 'object',
      hidden: true,
      fields: [
        { name: 'provider', type: 'string' },
        { name: 'scrapedAt', type: 'datetime' },
        { name: 'url', type: 'url' },
      ],
    }),
    defineField({
      name: 'metaDescriptionSource',
      title: 'Meta description source',
      type: 'object',
      hidden: true,
      fields: [
        { name: 'provider', type: 'string' },
        { name: 'scrapedAt', type: 'datetime' },
        { name: 'url', type: 'url' },
      ],
    }),
  ]
}

export function metaFields(opts: { og?: boolean } = {}): FieldDefinition[] {
  const fields: FieldDefinition[] = [
    // Length rules are WARNINGS, not errors, and deliberately so.
    //
    // They were authored as hard errors against ideal SEO lengths, but the
    // migrated content does not meet them: a full-dataset `sanity documents
    // validate` on 6 Aug 2026 returned 352 documents failing, 312 of those on
    // meta length alone (178 descriptions under 140, 78 titles over 60, 56
    // descriptions over 160). Sanity blocks publish on ANY error in the
    // document, so a rule about ideal character counts was preventing editors
    // from saving unrelated copy changes anywhere on the site. That is how
    // CE-33 surfaced: Seb deleted a line from the homepage and could not
    // publish it, because the meta description was 20 characters too long.
    //
    // Presence is still a hard requirement - a page with no meta description
    // is a real defect. The length target is guidance, so Studio still shows
    // the nudge in amber without holding the editor hostage to it.
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'SEO page title - aim for max 60 chars',
      validation: (Rule) => [Rule.required(), Rule.max(60).warning()],
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'SEO page description - aim for 140-160 chars',
      validation: (Rule) => [Rule.required(), Rule.min(140).warning(), Rule.max(160).warning()],
    }),
  ]
  if (opts.og !== false) {
    fields.push(
      defineField({
        name: 'openGraphImage',
        title: 'Open Graph image',
        type: 'image',
        options: { hotspot: true },
        fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
      }),
    )
  }
  return fields
}

// Phase 0.1 — retired (unpublished) documents.
//
// The CONTENT-1 migration ran against a 2026-04 Webflow snapshot. Since then
// 35 items were deleted or unpublished upstream; Webflow now 301s their URLs to
// the parent hub (or 404s them). Sanity still holds the documents, so without a
// marker the new site would resurrect 35 pages the customer deliberately took
// down, and advertise them in the sitemap.
//
// `retired: true` means: do not route, do not list, do not put in the sitemap.
// The document survives so an accidental upstream deletion can be reversed in
// Studio with one toggle. The legacy 301 keeps serving the URL either way.
//
// Every query that lists or routes documents MUST filter on `!(retired == true)`.
// Use the RETIRED_FILTER constant in site/src/lib/sanity/queries/_filters.ts so
// the predicate is written once. `!retired` alone is WRONG: it is false for docs
// where the field is undefined, which is every pre-existing document.
export function retiredField(): FieldDefinition {
  return defineField({
    name: 'retired',
    title: 'Retired',
    type: 'boolean',
    description:
      'Hide this document from the live site. It stops being routed, listed and included in the sitemap, but the content is kept. Used for pages removed from the old Webflow site.',
    initialValue: false,
  })
}

export function slugField(source: string | ((doc: Record<string, unknown>) => string)): FieldDefinition {
  return defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    options: {
      source: source as never,
      maxLength: 96,
    },
    validation: (Rule) => Rule.required(),
  })
}

// Image field helper.
//
// Opts (additive across phases):
//   - required: the WHOLE image field is required (asset must be set)
//   - altRequired: the `alt` subfield is required (STATIC-2 §2.1 §2 — every
//     NEW image field requires `alt: string` with Rule.required()).
//     Pattern reusable for customer-2 chrome work: chrome image fields
//     should always have required alt for a11y; document images may be
//     more permissive.
//
// Note: `altRequired: true` enforces alt-on-the-image. To enforce alt-when-
// asset-is-set conditionally (e.g. for a discriminated icon shape where the
// asset branch is optional but its alt is required), use `Rule.custom()` at
// the parent-object level instead — this helper covers the simpler case.
export function imageField(
  name: string,
  title: string,
  opts: { required?: boolean; altRequired?: boolean } = {},
): FieldDefinition {
  return defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    fields: [
      {
        name: 'alt',
        type: 'string',
        title: 'Alt text',
        validation: opts.altRequired ? (Rule) => Rule.required() : undefined,
      },
    ],
    validation: opts.required ? (Rule) => Rule.required() : undefined,
  })
}
