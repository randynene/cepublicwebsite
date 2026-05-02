import { defineField, defineType } from 'sanity'

import {
  imageField,
  localeField,
  metaFields,
  metaSourceFields,
  slugField,
  sourceTrackingFieldsCarryover,
} from '../_shared'

export default defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({
      name: 'nameClient',
      title: 'Client name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('nameClient'),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),

    defineField({
      name: 'testimonyShort',
      title: 'Testimony — short',
      type: 'text',
      rows: 3,
    }),
    defineField({ name: 'testimonyParagraph', title: 'Testimony — paragraph', type: 'portableText' }),
    defineField({ name: 'testimonyFullPage', title: 'Testimony — full page', type: 'portableText' }),
    defineField({
      name: 'snippetForMeta',
      title: 'Snippet for meta',
      type: 'string',
      description: 'Used as metaDescription source. Max 300 chars.',
      validation: (Rule) => Rule.max(300),
    }),

    imageField('memberImage', 'Member image'),
    imageField('companyLogo', 'Company logo'),
    imageField('thumbnailImage', 'Thumbnail image'),

    defineField({ name: 'additionalInfo', title: 'Additional info', type: 'portableText' }),

    ...metaFields({ og: false }),
    ...metaSourceFields(),
    ...sourceTrackingFieldsCarryover(),
    localeField(),
  ],
  preview: { select: { title: 'nameClient', subtitle: 'position', media: 'memberImage' } },
})
