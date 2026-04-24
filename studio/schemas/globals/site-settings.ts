import { defineField, defineType } from 'sanity'

import { imageField } from '../_shared'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'defaultMetaTitle',
      title: 'Default meta title',
      type: 'string',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'defaultMetaDescription',
      title: 'Default meta description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().min(140).max(160),
    }),
    imageField('defaultOgImage', 'Default Open Graph image', { required: true }),

    defineField({
      name: 'announcementBar',
      title: 'Announcement bar',
      type: 'object',
      fields: [
        { name: 'enabled', type: 'boolean', initialValue: false },
        { name: 'text', type: 'string', validation: (R) => R.max(240) },
        { name: 'ctaLabel', type: 'string', validation: (R) => R.max(60) },
        { name: 'ctaLink', type: 'url' },
      ],
    }),

    defineField({
      name: 'socialProof',
      title: 'Social proof',
      type: 'object',
      description: 'Organization JSON-LD data emitted site-wide.',
      fields: [
        { name: 'organizationName', type: 'string' },
        { name: 'organizationUrl', type: 'url' },
        {
          name: 'logo',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string' }],
        },
        { name: 'foundingDate', type: 'date' },
        { name: 'description', type: 'text', rows: 3 },
      ],
    }),

    defineField({
      name: 'claraChat',
      title: 'Clara chat',
      type: 'object',
      fields: [
        { name: 'enabled', type: 'boolean', initialValue: false },
        { name: 'workspaceId', type: 'string' },
      ],
    }),

    defineField({
      name: 'hubspotPortalId',
      title: 'HubSpot portal ID',
      type: 'string',
      description: 'CE value: 22809822',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'siteName', subtitle: 'siteUrl' } },
})
