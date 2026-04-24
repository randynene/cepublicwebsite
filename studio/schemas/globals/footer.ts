import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    defineField({
      name: 'newsletterFormId',
      title: 'Newsletter HubSpot form ID',
      type: 'string',
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright text',
      type: 'string',
      description: 'Supports {year} token.',
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'footerColumn',
          fields: [
            { name: 'heading', type: 'string', validation: (R) => R.required().max(60) },
            {
              name: 'links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'footerLink',
                  fields: [
                    { name: 'label', type: 'string', validation: (R) => R.required() },
                    { name: 'url', type: 'url', validation: (R) => R.required() },
                  ],
                  preview: { select: { title: 'label', subtitle: 'url' } },
                },
              ],
            },
          ],
          preview: { select: { title: 'heading' } },
        },
      ],
    }),
    defineField({
      name: 'legalLinks',
      title: 'Legal links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'legalLink',
          fields: [
            { name: 'label', type: 'string', validation: (R) => R.required() },
            { name: 'url', type: 'url', validation: (R) => R.required() },
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Footer' }) },
})
