import { defineField, defineType } from 'sanity'

import { retiredField, slugField } from '../_shared'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('name'),
    retiredField(),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Blogs', value: 'blogs' },
          { title: 'Alternatives', value: 'alternatives' },
          { title: 'Tools', value: 'tools' },
          { title: 'Video Library', value: 'videoLibrary' },
          { title: 'Downloads', value: 'downloads' },
          { title: 'Events & Webinars', value: 'eventsWebinars' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'singularName',
      title: 'Singular name',
      type: 'string',
      description: 'Only used by the Events & Webinars category',
      validation: (Rule) => Rule.max(100),
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'category' } },
})
