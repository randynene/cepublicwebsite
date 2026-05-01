import { defineField, defineType } from 'sanity'

import {
  imageField,
  localeField,
  metaFields,
  metaSourceFields,
  slugField,
  sourceTrackingFields,
} from '../_shared'

export default defineType({
  name: 'technology',
  title: 'Technology',
  type: 'document',
  fields: [
    defineField({
      name: 'technologyName',
      title: 'Technology name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('technologyName'),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({
      name: 'shortLabel',
      title: 'Short label',
      type: 'string',
      validation: (Rule) => Rule.max(100),
    }),
    imageField('techLogo', 'Technology logo'),
    defineField({
      name: 'listItemOnly',
      title: 'List item only',
      type: 'boolean',
      initialValue: false,
      description: 'If true, appears in nav lists but has no dedicated page.',
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
    ...metaSourceFields(),

    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description: 'Replaces the raw JSON-LD faq-schema-2 PlainText field. JSON-LD is generated server-side from this array.',
      validation: (Rule) => Rule.max(6),
    }),

    ...sourceTrackingFields(),
    localeField(),
  ],
  preview: { select: { title: 'technologyName', subtitle: 'shortLabel', media: 'techLogo' } },
})
