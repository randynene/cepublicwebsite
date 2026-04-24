import { defineField, defineType } from 'sanity'

import {
  imageField,
  localeField,
  metaFields,
  slugField,
  sourceTrackingFields,
} from '../_shared'

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
    ...sourceTrackingFields(),
    localeField(),
  ],
  preview: { select: { title: 'name', subtitle: 'type', media: 'thumbnail' } },
})
