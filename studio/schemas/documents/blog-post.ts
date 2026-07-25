import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, retiredField, slugField, sourceTrackingFields } from '../_shared'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
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
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'blogCategory' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
          options: { filter: 'category == "blogs"' },
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
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),

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
    retiredField(),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category.name', media: 'thumbnailImage' },
  },
})
