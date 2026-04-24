import { defineField, defineType } from 'sanity'

import { imageField, slugField } from '../_shared'

export default defineType({
  name: 'benefitValue',
  title: 'Benefit / Value',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    }),
    slugField('name'),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Benefits', value: 'benefits' },
          { title: 'Values', value: 'values' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    imageField('thumbnailImage', 'Thumbnail image'),
    defineField({
      name: 'paragraph',
      title: 'Paragraph',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'category', media: 'thumbnailImage' } },
})
