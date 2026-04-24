import { defineField, defineType } from 'sanity'

import { slugField } from '../_shared'

export default defineType({
  name: 'downloadAccess',
  title: 'Download Access (Thank-You Page)',
  type: 'document',
  description: 'Private lead-magnet thank-you pages. Rendered at /download-thank-you/[slug] with noindex.',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    slugField('name'),
    defineField({
      name: 'downloadFileLink',
      title: 'Download file link',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'downloadFileLink' } },
})
