import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, metaSourceFields, retiredField, slugField, sourceTrackingFields } from '../_shared'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('name'),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Staff Augmentation', value: 'staffAugmentation' },
          { title: 'Product Builds', value: 'productBuilds' },
          { title: 'Consulting Services', value: 'consultingServices' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'prefix',
      title: 'Prefix',
      type: 'string',
      options: {
        list: [
          { title: 'Hire', value: 'hire' },
          { title: 'Build', value: 'build' },
          { title: 'Expert', value: 'expert' },
          { title: 'End-to-End', value: 'endToEnd' },
        ],
      },
    }),
    defineField({ name: 'aiOffering', title: 'AI offering', type: 'boolean', initialValue: false }),
    defineField({ name: 'location', title: 'Location-specific', type: 'boolean', initialValue: false }),
    defineField({
      name: 'shortLabel',
      title: 'Short label',
      type: 'string',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description:
        'Short tagline used by Services mega-menu (e.g. "Scalable product-builders on demand"). Renders below the service name in the mega-menu item.',
      validation: (Rule) => Rule.max(80),
    }),
    imageField('thumbnail', 'Thumbnail'),

    defineField({
      name: 'associatedTechnologies',
      title: 'Associated technologies',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'technology' }] }],
    }),

    defineField({
      name: 'folds',
      title: 'Folds',
      type: 'array',
      of: [{ type: 'fold' }],
      validation: (Rule) => Rule.required().min(1),
    }),

    ...metaFields(),
    ...metaSourceFields(),

    defineField({
      name: 'faqs',
      title: 'FAQs (page override)',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description:
        'Optional. Leave EMPTY to use the shared Service & Technology FAQ block (matches the live site). Add items here only to give THIS page its own unique FAQs, which then replace the shared block for this page.',
    }),

    ...sourceTrackingFields(),
    localeField(),
    retiredField(),
  ],
  preview: { select: { title: 'name', subtitle: 'type', media: 'thumbnail' } },
})
