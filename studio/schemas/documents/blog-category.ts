import { defineField, defineType } from 'sanity'

import { slugField } from '../_shared'

export default defineType({
  name: 'blogCategory',
  title: 'Blog Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('name'),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first in nav',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'order' } },
})
