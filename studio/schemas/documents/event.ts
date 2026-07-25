import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, retiredField, slugField } from '../_shared'

export default defineType({
  name: 'event',
  title: 'Event / Webinar',
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
      name: 'dateTime',
      title: 'Date / time',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),

    defineField({ name: 'headerDescription', title: 'Header description', type: 'portableText' }),
    defineField({
      name: 'headerDescriptionPostEvent',
      title: 'Header description (post-event)',
      type: 'portableText',
    }),
    defineField({
      name: 'headerButtonText',
      title: 'Header button text',
      type: 'string',
      validation: (Rule) => Rule.max(60),
    }),

    imageField('featuredImage', 'Featured image'),
    imageField('thumbnailImage', 'Thumbnail image'),

    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'object',
      fields: [
        { name: 'header', type: 'string', validation: (R) => R.max(160) },
        { name: 'description', type: 'portableText' },
        {
          name: 'items',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'topicItem',
              fields: [
                { name: 'title', type: 'string', validation: (R) => R.required().max(160) },
                { name: 'description', type: 'text', rows: 3, validation: (R) => R.required().max(400) },
              ],
              preview: { select: { title: 'title', subtitle: 'description' } },
            },
          ],
          validation: (Rule) => Rule.max(4),
        },
      ],
    }),

    defineField({
      name: 'speakers',
      title: 'Speakers',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'teamMember' }] }],
    }),

    defineField({
      name: 'signUp',
      title: 'Sign up',
      type: 'object',
      fields: [
        { name: 'header', type: 'string', validation: (R) => R.max(160) },
        { name: 'description', type: 'portableText' },
        { name: 'formEmbed', type: 'portableText' },
      ],
    }),

    defineField({
      name: 'onDemandEmbedDescription',
      title: 'On-demand embed description',
      type: 'portableText',
    }),

    defineField({
      name: 'eventType',
      title: 'Event type',
      type: 'reference',
      to: [{ type: 'tag' }],
      options: { filter: 'category == "eventsWebinars"' },
    }),
    defineField({
      name: 'eventCategory',
      title: 'Event category',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
          options: { filter: 'category == "eventsWebinars"' },
        },
      ],
    }),

    ...metaFields({ og: false }),
    localeField(),
    retiredField(),
  ],
  preview: { select: { title: 'name', subtitle: 'dateTime', media: 'thumbnailImage' } },
})
