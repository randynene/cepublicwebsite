import { defineField, defineType } from 'sanity'

import { slugField } from '../_shared'

export default defineType({
  name: 'glassdoorReview',
  title: 'Glassdoor Review',
  type: 'document',
  fields: [
    defineField({
      name: 'clientName',
      title: 'Client name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('clientName'),
    defineField({
      name: 'title',
      title: 'Review title',
      type: 'string',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'reviewDescription',
      title: 'Review description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'workField',
      title: 'Work field',
      type: 'string',
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: { select: { title: 'clientName', subtitle: 'workField' } },
})
