import { defineField, defineType } from 'sanity'

const PILL_STYLE_OPTIONS = [
  { title: 'Pill green (lime filled)', value: 'pill-green' },
  { title: 'Pill dark (navy filled)', value: 'pill-dark' },
  { title: 'Pill gradient (purple→pink)', value: 'pill-gradient' },
  { title: 'Pill navy (deep navy filled)', value: 'pill-navy' },
  { title: 'Pill outline-light (transparent + light border)', value: 'pill-outline-light' },
] as const

const LEGACY_FIELD_DESCRIPTION =
  '⚠️ Legacy field — populated by STATIC-2 reseed but no longer rendered. Will be removed in a future cleanup phase.'

export default defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    // ─── NEW: top CTA block ("Ready to hire your next engineer?")
    defineField({
      name: 'topCtaBlock',
      title: 'Top CTA block',
      type: 'object',
      fields: [
        { name: 'enabled', type: 'boolean', initialValue: true },
        { name: 'heading', type: 'string', validation: (R) => R.max(140) },
        {
          name: 'statRow',
          type: 'string',
          description: 'Single line of stats (e.g. "300+ teams built · 97% stay 2+ years · Cancel anytime").',
          validation: (R) => R.max(200),
        },
        defineField({
          name: 'primaryCta',
          title: 'Primary CTA',
          type: 'object',
          fields: [
            { name: 'label', type: 'string', validation: (R) => R.max(40) },
            { name: 'url', type: 'url' },
          ],
        }),
        defineField({
          name: 'secondaryCta',
          title: 'Secondary CTA',
          type: 'object',
          fields: [
            { name: 'label', type: 'string', validation: (R) => R.max(40) },
            { name: 'url', type: 'url' },
          ],
        }),
      ],
    }),

    // ─── NEW: section-grouped columns (Our Expertise + Learn more)
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description:
        'Section-grouped link columns. Per reference screenshot: Our Expertise (2 sub-columns + bottomPillLinks) + Learn more (2 sub-columns).',
      of: [
        {
          type: 'object',
          name: 'footerSection',
          fields: [
            { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
            {
              name: 'sectionLabelStyle',
              type: 'string',
              options: { list: [...PILL_STYLE_OPTIONS] },
              initialValue: 'pill-outline-light',
            },
            {
              name: 'columns',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'footerSectionColumn',
                  fields: [
                    { name: 'heading', type: 'string', validation: (R) => R.required().max(60) },
                    {
                      name: 'headingHasArrow',
                      type: 'boolean',
                      initialValue: false,
                      description: 'Small ↗ icon next to heading indicates the heading is a link.',
                    },
                    {
                      name: 'headingUrl',
                      type: 'url',
                      description: 'Required when headingHasArrow = true.',
                    },
                    {
                      name: 'links',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          name: 'footerSectionLink',
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
            },
            {
              name: 'bottomPillLinks',
              type: 'array',
              description:
                'Optional bottom pill row. Our Expertise has this (Project Builds + AI Services); Learn more does not.',
              of: [
                {
                  type: 'object',
                  name: 'footerBottomPillLink',
                  fields: [
                    { name: 'label', type: 'string', validation: (R) => R.required().max(40) },
                    { name: 'url', type: 'url', validation: (R) => R.required() },
                    {
                      name: 'hasArrow',
                      type: 'boolean',
                      initialValue: true,
                    },
                    {
                      name: 'variant',
                      type: 'string',
                      options: { list: [...PILL_STYLE_OPTIONS] },
                      initialValue: 'pill-outline-light',
                    },
                  ],
                  preview: { select: { title: 'label', subtitle: 'url' } },
                },
              ],
            },
          ],
          preview: { select: { title: 'sectionLabel' } },
        },
      ],
    }),

    // ─── NEW: talent locations column
    defineField({
      name: 'talentLocations',
      title: 'Talent locations',
      type: 'object',
      fields: [
        { name: 'sectionLabel', type: 'string', validation: (R) => R.max(40) },
        {
          name: 'sectionLabelStyle',
          type: 'string',
          options: { list: [...PILL_STYLE_OPTIONS] },
          initialValue: 'pill-outline-light',
        },
        {
          name: 'items',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'talentLocationItem',
              fields: [
                { name: 'label', type: 'string', validation: (R) => R.required() },
                { name: 'url', type: 'url', validation: (R) => R.required() },
              ],
              preview: { select: { title: 'label', subtitle: 'url' } },
            },
          ],
        },
      ],
    }),

    // ─── NEW: subscribe block
    defineField({
      name: 'subscribe',
      title: 'Subscribe block',
      type: 'object',
      fields: [
        { name: 'heading', type: 'string', validation: (R) => R.max(60) },
        { name: 'description', type: 'text', rows: 2, validation: (R) => R.max(240) },
        {
          name: 'formId',
          title: 'HubSpot form ID',
          type: 'string',
          description: 'GUID of the HubSpot form (e.g. deac2450-b51b-4630-b9e2-47017a13da15).',
        },
        { name: 'submitLabel', type: 'string', validation: (R) => R.max(30) },
      ],
    }),

    // ─── NEW: bottom bar
    defineField({
      name: 'bottomBar',
      title: 'Bottom bar',
      type: 'object',
      fields: [
        {
          name: 'copyrightText',
          type: 'string',
          description: 'Supports {year} token (resolved at render time).',
        },
        {
          name: 'links',
          type: 'array',
          description: 'Plain text legal/utility links (General Terms / Privacy Policy / Sitemap).',
          of: [
            {
              type: 'object',
              name: 'bottomBarLink',
              fields: [
                { name: 'label', type: 'string', validation: (R) => R.required() },
                { name: 'url', type: 'url', validation: (R) => R.required() },
              ],
              preview: { select: { title: 'label', subtitle: 'url' } },
            },
          ],
        },
        defineField({
          name: 'regionSelector',
          title: 'Region selector',
          type: 'object',
          fields: [
            { name: 'enabled', type: 'boolean', initialValue: true },
            {
              name: 'options',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'regionOption',
                  fields: [
                    { name: 'label', type: 'string', validation: (R) => R.required() },
                    { name: 'url', type: 'url', validation: (R) => R.required() },
                    { name: 'hreflang', type: 'string' },
                  ],
                  preview: { select: { title: 'label', subtitle: 'hreflang' } },
                },
              ],
            },
          ],
        }),
      ],
    }),

    // ─── LEGACY: kept for regression safety on STATIC-1 Footer render.
    //             STATIC-3 swaps reads to the new fields above; legacy
    //             fields stop being read but stay in schema until cleanup.
    defineField({
      name: 'newsletterFormId',
      title: 'Newsletter HubSpot form ID',
      type: 'string',
      description: LEGACY_FIELD_DESCRIPTION,
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright text',
      type: 'string',
      description: LEGACY_FIELD_DESCRIPTION + ' Supports {year} token.',
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      description: LEGACY_FIELD_DESCRIPTION,
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
      description: LEGACY_FIELD_DESCRIPTION,
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
