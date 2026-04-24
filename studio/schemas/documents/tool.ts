import { defineField, defineType } from 'sanity'

import { imageField, localeField, slugField } from '../_shared'

export default defineType({
  name: 'tool',
  title: 'Tool / Quiz',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    slugField('name'),
    defineField({
      name: 'subHeader',
      title: 'Sub-header',
      type: 'string',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({ name: 'headerBlurb', title: 'Header blurb', type: 'portableText' }),
    defineField({ name: 'description', title: 'Description', type: 'portableText' }),

    defineField({ name: 'button1Text', title: 'Button 1 text', type: 'string' }),
    defineField({ name: 'button1Link', title: 'Button 1 link', type: 'url' }),
    defineField({ name: 'button2Text', title: 'Button 2 text', type: 'string' }),
    defineField({ name: 'button2Link', title: 'Button 2 link', type: 'url' }),

    defineField({ name: 'toolEmbed', title: 'Tool embed', type: 'portableText' }),
    defineField({
      name: 'hiddenCode',
      title: 'Hidden code',
      type: 'portableText',
      description: 'Maps from the Webflow `hidden-code` RichText field. Culture Match API keys are explicitly excluded from this field during migration.',
    }),
    defineField({ name: 'videoOverview', title: 'Video overview', type: 'portableText' }),

    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      validation: (Rule) => Rule.max(10),
    }),

    imageField('thumbnail', 'Thumbnail'),

    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Maps from the existing Webflow `blurbs` field.',
      validation: (Rule) => Rule.required().min(140).max(160),
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
          options: { filter: 'category == "tools"' },
        },
      ],
    }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),

    localeField(),
  ],
  preview: { select: { title: 'name', subtitle: 'subHeader', media: 'thumbnail' } },
})
