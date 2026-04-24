import { defineField, defineType } from 'sanity'

import {
  imageField,
  localeField,
  metaFields,
  slugField,
  sourceTrackingFields,
} from '../_shared'

export default defineType({
  name: 'compareBlog',
  title: 'Compare Blog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    slugField('title'),
    defineField({
      name: 'competitor',
      title: 'Competitor',
      type: 'string',
      description: 'Extracted from title, e.g. "Turing", "Toptal".',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
          options: { filter: 'category == "alternatives"' },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),

    imageField('thumbnailImage', 'Thumbnail image', { required: true }),
    defineField({ name: 'tldrSection', title: 'TL;DR section', type: 'portableText' }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'resourceDescription',
      title: 'Resource description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(300),
    }),

    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      validation: (Rule) => Rule.max(6),
    }),

    ...metaFields(),
    ...sourceTrackingFields(),
    localeField(),
  ],
  preview: {
    select: { title: 'title', subtitle: 'competitor', media: 'thumbnailImage' },
  },
})
