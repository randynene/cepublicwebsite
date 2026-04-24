import { defineField, defineType } from 'sanity'

import { imageField, slugField } from '../_shared'

export default defineType({
  name: 'staffBenefit',
  title: 'Staff Benefit',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    }),
    slugField('name'),
    imageField('icon', 'Icon'),
  ],
  preview: { select: { title: 'name', media: 'icon' } },
})
