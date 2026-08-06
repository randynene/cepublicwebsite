import { defineField, defineType } from 'sanity'

import { imageField, localeField, retiredField, slugField } from '../_shared'

export default defineType({
  name: 'download',
  title: 'Download',
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
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'comingSoon', title: 'Coming soon', type: 'boolean', initialValue: false }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
          options: { filter: 'category == "downloads"' },
        },
      ],
    }),

    defineField({ name: 'mainDescription', title: 'Main description', type: 'portableText' }),
    imageField('headerFooterImage', 'Header / footer image'),

    defineField({ name: 'button1Text', title: 'Button 1 text', type: 'string' }),
    defineField({ name: 'button1Link', title: 'Button 1 link', type: 'url' }),
    defineField({ name: 'button2Text', title: 'Button 2 text', type: 'string' }),
    defineField({ name: 'button2Link', title: 'Button 2 link', type: 'url' }),

    defineField({
      name: 'youllGet',
      title: "You'll get",
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.max(5),
    }),

    defineField({
      name: 'howToUseIt',
      title: 'How to use it',
      type: 'object',
      fields: [
        { name: 'videoThumbnail', type: 'image', options: { hotspot: true }, fields: [{ name: 'alt', type: 'string' }] },
        { name: 'videoLink', type: 'url' },
        { name: 'title', type: 'string', validation: (R) => R.max(160) },
        { name: 'description', type: 'portableText' },
      ],
    }),

    defineField({
      name: 'theImpact',
      title: 'The impact',
      type: 'object',
      fields: [
        { name: 'image', type: 'image', options: { hotspot: true }, fields: [{ name: 'alt', type: 'string' }] },
        { name: 'title', type: 'string', validation: (R) => R.max(160) },
        { name: 'description', type: 'portableText' },
      ],
    }),

    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      validation: (Rule) => Rule.max(6),
    }),

    defineField({
      name: 'getItNow',
      title: 'Get it now',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', validation: (R) => R.max(160) },
        { name: 'description', type: 'portableText' },
      ],
    }),

    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      validation: (Rule) => [Rule.required(), Rule.max(60).warning()], // length is guidance, see _shared.ts metaFields
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (Rule) => [Rule.required(), Rule.min(140).warning(), Rule.max(160).warning()], // length is guidance, see _shared.ts metaFields
    }),
    imageField('metaThumbnail', 'Meta thumbnail (Open Graph)'),

    defineField({
      name: 'hubspotFormId',
      title: 'HubSpot form ID',
      type: 'string',
      description: 'Gated form embedded on the download page. Portal ID is in siteSettings.',
    }),

    localeField(),

    retiredField(),
  ],
  preview: { select: { title: 'name', subtitle: 'title' } },
})
