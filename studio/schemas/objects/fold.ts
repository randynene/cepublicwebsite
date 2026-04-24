import { defineField, defineType } from 'sanity'

export const FOLD_TYPES = [
  { title: 'Header + Intro', value: 'headerIntro' },
  { title: 'Feature Bullets', value: 'featureBullets' },
  { title: 'Item List', value: 'itemList' },
  { title: 'Paragraph Section', value: 'paragraphSection' },
  { title: 'Header Only', value: 'headerOnly' },
] as const

export default defineType({
  name: 'fold',
  title: 'Fold',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Fold type',
      type: 'string',
      options: { list: FOLD_TYPES.map((t) => ({ title: t.title, value: t.value })) },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label (eyebrow)',
      type: 'string',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: 'header',
      title: 'Header',
      type: 'string',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'paragraph',
      title: 'Paragraph',
      type: 'portableText',
    }),
    defineField({
      name: 'bullets',
      title: 'Bullets',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'foldItem',
          fields: [
            {
              name: 'header',
              type: 'string',
              title: 'Header',
              validation: (Rule) => Rule.required().max(120),
            },
            {
              name: 'description',
              type: 'text',
              title: 'Description',
              validation: (Rule) => Rule.required().max(400),
            },
          ],
          preview: { select: { title: 'header', subtitle: 'description' } },
        },
      ],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    }),
  ],
  preview: {
    select: { title: 'header', subtitle: 'type' },
    prepare({ title, subtitle }) {
      return {
        title: title || '(no header)',
        subtitle: `Fold: ${subtitle}`,
      }
    },
  },
})
