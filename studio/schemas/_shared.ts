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
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'SEO page title — max 60 chars',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'SEO page description — 140-160 chars',
      validation: (Rule) => Rule.required().min(140).max(160),
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

export function imageField(
  name: string,
  title: string,
  opts: { required?: boolean } = {},
): FieldDefinition {
  return defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    validation: opts.required ? (Rule) => Rule.required() : undefined,
  })
}
