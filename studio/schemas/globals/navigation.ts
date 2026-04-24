import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'primaryLinks',
      title: 'Primary links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'primaryLink',
          fields: [
            { name: 'label', type: 'string', validation: (R) => R.required().max(60) },
            { name: 'url', type: 'url', validation: (R) => R.required() },
            {
              name: 'cmsDriven',
              type: 'boolean',
              initialValue: false,
              description: 'If true, the dropdown is populated dynamically from a CMS collection.',
            },
            {
              name: 'cmsCollection',
              type: 'string',
              description: 'Source collection name when cmsDriven is true (e.g. technology, service).',
            },
            {
              name: 'dropdownItems',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'dropdownItem',
                  fields: [
                    { name: 'label', type: 'string', validation: (R) => R.required() },
                    { name: 'url', type: 'url', validation: (R) => R.required() },
                  ],
                  preview: { select: { title: 'label', subtitle: 'url' } },
                },
              ],
            },
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        },
      ],
    }),

    defineField({
      name: 'ctaButton',
      title: 'CTA button',
      type: 'object',
      fields: [
        { name: 'label', type: 'string', validation: (R) => R.required().max(60) },
        { name: 'link', type: 'url', validation: (R) => R.required() },
        {
          name: 'type',
          type: 'string',
          options: {
            list: [
              { title: 'Calendly', value: 'calendly' },
              { title: 'Link', value: 'link' },
              { title: 'HubSpot form', value: 'hubspotForm' },
            ],
          },
          validation: (R) => R.required(),
        },
      ],
    }),

    defineField({
      name: 'localeDropdown',
      title: 'Locale dropdown',
      type: 'object',
      fields: [
        { name: 'enabled', type: 'boolean', initialValue: true },
        {
          name: 'options',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'localeOption',
              fields: [
                { name: 'label', type: 'string', validation: (R) => R.required() },
                { name: 'url', type: 'url', validation: (R) => R.required() },
                { name: 'hreflang', type: 'string', validation: (R) => R.required() },
              ],
              preview: { select: { title: 'label', subtitle: 'hreflang' } },
            },
          ],
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
})
