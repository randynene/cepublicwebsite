import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, slugField } from '../_shared'

export default defineType({
  name: 'customerStory',
  title: 'Customer Story',
  type: 'document',
  fields: [
    defineField({
      name: 'customerStoryTitle',
      title: 'Customer story title',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'companyName',
      title: 'Company name',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    slugField('customerStoryTitle'),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({
      name: 'featureInHomeHeader',
      title: 'Feature in home-page header',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'featureInFeaturedCustomers',
      title: 'Feature in featured customers',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'featuredOnCustomerStoriesPage',
      title: 'Featured on customer-stories page',
      type: 'boolean',
      initialValue: false,
    }),

    imageField('companyLogo', 'Company logo', { required: true }),
    imageField('companyProductImage', 'Company product image'),
    imageField('companyPeopleImage', 'Company people image'),
    imageField('thumbnail', 'Thumbnail'),

    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'Consolidated from Webflow `video-testimonial-if-available`; `video-url-2` dropped (§3.6 / D5).',
    }),
    defineField({ name: 'videoIntroContent', title: 'Video intro content', type: 'portableText' }),

    defineField({ name: 'tldrContent', title: 'TL;DR content', type: 'portableText' }),
    defineField({ name: 'hiringNeedsTable', title: 'Hiring needs table', type: 'portableText' }),
    defineField({ name: 'theCustomerContent', title: 'The customer', type: 'portableText' }),

    defineField({
      name: 'problem',
      title: 'Problem',
      type: 'object',
      fields: [
        { name: 'content', type: 'portableText' },
        { name: 'quote', type: 'quoteBlock' },
      ],
    }),
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'object',
      fields: [
        { name: 'content', type: 'portableText' },
        { name: 'quote', type: 'quoteBlock' },
      ],
    }),
    defineField({
      name: 'impact',
      title: 'Impact',
      type: 'object',
      fields: [
        { name: 'content', type: 'portableText' },
        { name: 'quote', type: 'quoteBlock' },
      ],
    }),

    defineField({ name: 'ctaContent', title: 'CTA content', type: 'portableText' }),
    defineField({
      name: 'reviewSnippetForMeta',
      title: 'Review snippet for meta',
      type: 'text',
      rows: 3,
    }),

    ...metaFields(),
    localeField(),
  ],
  preview: {
    select: { title: 'customerStoryTitle', subtitle: 'companyName', media: 'companyLogo' },
  },
})
