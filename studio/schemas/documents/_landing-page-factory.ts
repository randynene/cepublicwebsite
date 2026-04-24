// Shared factory for the three AI-search landing-page types
// (industry, persona, location) per MYGRATR_SCHEMA_DESIGN_DECISIONS §3.20.
// All three share an identical structure — only name, title, description,
// and route prefix differ.
import { defineField, defineType, type SchemaTypeDefinition } from 'sanity'

import {
  imageField,
  localeField,
  metaFields,
  slugField,
  sourceTrackingFields,
} from '../_shared'

export function defineLandingPageType(opts: {
  name: string
  title: string
  routePrefix: string
  description: string
}): SchemaTypeDefinition {
  return defineType({
    name: opts.name,
    title: opts.title,
    type: 'document',
    description: `${opts.description} Route: ${opts.routePrefix}/[slug].`,
    fields: [
      defineField({
        name: 'name',
        title: 'Name',
        type: 'string',
        validation: (Rule) => Rule.required().max(100),
      }),
      slugField('name'),
      defineField({ name: 'order', title: 'Order', type: 'number' }),
      defineField({
        name: 'shortLabel',
        title: 'Short label',
        type: 'string',
        validation: (Rule) => Rule.max(100),
      }),
      imageField('thumbnail', 'Thumbnail'),

      defineField({
        name: 'folds',
        title: 'Folds',
        type: 'array',
        of: [{ type: 'fold' }],
        validation: (Rule) => Rule.required().min(1),
      }),

      ...metaFields(),
      ...sourceTrackingFields(),
      localeField(),
    ],
    preview: { select: { title: 'name', subtitle: 'shortLabel', media: 'thumbnail' } },
  })
}
