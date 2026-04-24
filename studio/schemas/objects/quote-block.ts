import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'quoteBlock',
  title: 'Quote',
  type: 'object',
  fields: [
    defineField({
      name: 'paragraph',
      title: 'Quote text',
      type: 'text',
      validation: (Rule) => Rule.required().max(600),
    }),
    defineField({
      name: 'personImage',
      title: 'Person image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    }),
    defineField({
      name: 'personName',
      title: 'Person name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'personTitle',
      title: 'Person title',
      type: 'string',
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: { title: 'personName', subtitle: 'personTitle' },
  },
})
