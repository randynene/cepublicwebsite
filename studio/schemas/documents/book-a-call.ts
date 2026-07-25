import { defineField, defineType } from 'sanity'

import { metaSourceFields, retiredField, sourceTrackingFieldsCarryover } from '../_shared'

interface BookACallDoc {
  firstName?: string
  lastName?: string
}

export default defineType({
  name: 'bookACall',
  title: 'Book-a-Call Page',
  type: 'document',
  fields: [
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc) => {
          const d = doc as BookACallDoc
          return [d.firstName, d.lastName].filter(Boolean).join(' ')
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    retiredField(),
    defineField({
      name: 'calendlyEmbed',
      title: 'Calendly embed',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
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
      description: 'Maps from the Webflow `title` field (mislabelled as a title, but used as a meta description — §3.14 / D9).',
      validation: (Rule) => Rule.required().min(140).max(160),
    }),
    ...metaSourceFields(),
    ...sourceTrackingFieldsCarryover(),
  ],
  preview: {
    select: { title: 'firstName', subtitle: 'lastName' },
    prepare: ({ title, subtitle }) => ({
      title: [title, subtitle].filter(Boolean).join(' ') || '(no name)',
    }),
  },
})
