import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, metaSourceFields, retiredField, slugField, sourceTrackingFields } from '../_shared'

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
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short tagline used by Services mega-menu "By Technology" column.',
      validation: (Rule) => Rule.max(80),
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
      title: 'FAQs (page override)',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description:
        'Optional. Leave EMPTY to use the shared Service Model FAQ group (matches the live site). Add items here only to give THIS page its own unique FAQs, which then replace the shared block for this page. FAQPage JSON-LD is generated server-side from whichever set renders.',
    }),

    ...sourceTrackingFields(),
    localeField(),
    retiredField(),
  ],
  preview: { select: { title: 'technologyName', subtitle: 'shortLabel', media: 'techLogo' } },
})
