import { defineField, defineType } from 'sanity'

import { imageField } from '../_shared'

// Pill-style variants used across mega-menu section labels.
// Five variants per STATIC-2 brief §3 Step 0 item 11.
const PILL_STYLE_OPTIONS = [
  { title: 'Pill green (lime filled)', value: 'pill-green' },
  { title: 'Pill dark (navy filled)', value: 'pill-dark' },
  { title: 'Pill gradient (purple→pink)', value: 'pill-gradient' },
  { title: 'Pill navy (deep navy filled)', value: 'pill-navy' },
  { title: 'Pill outline-light (transparent + light border)', value: 'pill-outline-light' },
] as const

const LEGACY_FIELD_DESCRIPTION =
  '⚠️ Legacy field — populated by STATIC-2 reseed but no longer rendered. Will be removed in a future cleanup phase.'

// ─── Compact dropdown factory (MYGRATR-NAV-SIMPLE).
// A small anchored dropdown (not a full-width mega-menu). Used by the
// Services and Locations primary links. Structure: one or more sections,
// each an optional uppercase label + a list of icon/title/subtitle/link
// items. Icons are Google Material Symbols ligatures rendered via the
// MaterialIcon branch (same path the Resources mega-menu already uses).
function simpleDropdownField(name: string, title: string, description: string) {
  return defineField({
    name,
    title,
    type: 'object',
    description,
    fields: [
      defineField({
        name: 'sections',
        title: 'Sections',
        type: 'array',
        of: [
          {
            type: 'object',
            name: `${name}Section`,
            fields: [
              {
                name: 'sectionLabel',
                title: 'Section label',
                type: 'string',
                description:
                  'Optional uppercase group label (e.g. "HIRE TALENT"). Leave blank for an unlabelled group.',
                validation: (R) => R.max(40),
              },
              {
                name: 'items',
                title: 'Items',
                type: 'array',
                of: [
                  {
                    type: 'object',
                    name: `${name}Item`,
                    fields: [
                      { name: 'label', title: 'Title', type: 'string', validation: (R) => R.required().max(60) },
                      { name: 'subtitle', title: 'Subtitle', type: 'string', validation: (R) => R.max(100) },
                      { name: 'url', title: 'Link URL', type: 'url', validation: (R) => R.required() },
                      {
                        name: 'icon',
                        title: 'Icon (Material Symbols ligature)',
                        type: 'string',
                        description:
                          "Google Material Symbols name, e.g. 'groups', 'explore', 'rocket_launch', 'auto_awesome', 'location_on'. See fonts.google.com/icons.",
                      },
                    ],
                    preview: { select: { title: 'label', subtitle: 'subtitle' } },
                  },
                ],
              },
            ],
            preview: { select: { title: 'sectionLabel' } },
          },
        ],
      }),
    ],
  })
}

export default defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    // ─── Primary nav links — kept; new `dropdownType` discriminator added.
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
              name: 'dropdownType',
              title: 'Dropdown type',
              type: 'string',
              options: {
                list: [
                  { title: 'None (flat link)', value: 'none' },
                  { title: 'Services dropdown (compact)', value: 'services-simple' },
                  { title: 'Locations dropdown (compact)', value: 'locations-simple' },
                  { title: 'Services mega-menu (legacy)', value: 'services-mega' },
                  { title: 'How It Works mega-menu (legacy)', value: 'how-it-works-mega' },
                  { title: 'Resources mega-menu (legacy)', value: 'resources-mega' },
                ],
              },
              initialValue: 'none',
              description:
                'Drives which mega-menu opens from this primary link. The 6-link STATIC-2+ nav: Services / Our Clients / How It Works / Resources / Pricing / About Us. 3 are flat (dropdownType: none); 3 trigger mega-menus.',
            },
            {
              name: 'cmsDriven',
              type: 'boolean',
              initialValue: false,
              description: LEGACY_FIELD_DESCRIPTION,
            },
            {
              name: 'cmsCollection',
              type: 'string',
              description: LEGACY_FIELD_DESCRIPTION,
            },
            {
              name: 'dropdownItems',
              type: 'array',
              description: LEGACY_FIELD_DESCRIPTION,
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

    // ─── Services mega-menu — hybrid CMS-driven (items are references to
    // existing service/technology docs; structural template is hand-curated).
    defineField({
      name: 'servicesMegaMenu',
      title: 'Services mega-menu',
      type: 'object',
      description:
        'Hybrid CMS-driven Services mega-menu. Items are references to service/technology docs — name/tagline/icon resolve at render time. Edit items in their home docs, not here.',
      fields: [
        // Left column (Staff Augmentation section)
        defineField({
          name: 'leftColumn',
          title: 'Left column — Staff Augmentation',
          type: 'object',
          fields: [
            { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
            { name: 'sectionLink', type: 'url' },
            {
              name: 'sectionLabelStyle',
              type: 'string',
              options: { list: [...PILL_STYLE_OPTIONS] },
              initialValue: 'pill-green',
              validation: (R) => R.required(),
            },
            {
              name: 'highlightedItems',
              title: 'Highlighted sub-card items',
              type: 'array',
              description: 'Top 2 service items rendered in the highlighted sub-card.',
              of: [{ type: 'reference', to: [{ type: 'service' }, { type: 'technology' }] }],
              validation: (R) => R.max(2),
            },
            {
              name: 'items',
              title: 'Flat list items',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'service' }, { type: 'technology' }] }],
            },
            {
              name: 'viewAllLink',
              type: 'object',
              fields: [
                { name: 'label', type: 'string' },
                { name: 'url', type: 'url' },
              ],
            },
          ],
        }),
        // Right column top (By Technology section)
        defineField({
          name: 'rightColumnTop',
          title: 'Right column top — By Technology',
          type: 'object',
          fields: [
            { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
            { name: 'sectionLink', type: 'url' },
            {
              name: 'sectionLabelStyle',
              type: 'string',
              options: { list: [...PILL_STYLE_OPTIONS] },
              initialValue: 'pill-dark',
              validation: (R) => R.required(),
            },
            {
              name: 'items',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'service' }, { type: 'technology' }] }],
            },
            {
              name: 'viewAllLink',
              type: 'object',
              fields: [
                { name: 'label', type: 'string' },
                { name: 'url', type: 'url' },
              ],
            },
          ],
        }),
        // Right column bottom (AI Services + Product Builds sections)
        defineField({
          name: 'rightColumnBottom',
          title: 'Right column bottom — AI Services + Product Builds',
          type: 'object',
          fields: [
            {
              name: 'sections',
              type: 'array',
              description:
                'Two sub-sections side-by-side. Section 0 = AI Services (pill-gradient). Section 1 = Product Builds (pill-navy).',
              of: [
                {
                  type: 'object',
                  name: 'servicesSubsection',
                  fields: [
                    { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
                    { name: 'sectionLink', type: 'url' },
                    {
                      name: 'sectionLabelStyle',
                      type: 'string',
                      options: { list: [...PILL_STYLE_OPTIONS] },
                      validation: (R) => R.required(),
                    },
                    {
                      name: 'items',
                      type: 'array',
                      of: [{ type: 'reference', to: [{ type: 'service' }, { type: 'technology' }] }],
                    },
                  ],
                  preview: { select: { title: 'sectionLabel' } },
                },
              ],
              validation: (R) => R.max(2),
            },
          ],
        }),
      ],
    }),

    // ─── Compact Services dropdown (MYGRATR-NAV-SIMPLE) — replaces the big
    //     Services mega-menu in the nav. Two groups: Hire Talent / Build With Us.
    simpleDropdownField(
      'servicesDropdown',
      'Services dropdown (compact)',
      'Small anchored Services dropdown. Two groups (Hire Talent / Build With Us) each with a couple of items. Rendered when a primary link has dropdownType = "services-simple".',
    ),

    // ─── Compact Locations dropdown (MYGRATR-NAV-SIMPLE) — talent locations.
    simpleDropdownField(
      'locationsDropdown',
      'Locations dropdown (compact)',
      'Small anchored Locations dropdown (LATAM / Philippines / Eastern Europe). Rendered when a primary link has dropdownType = "locations-simple".',
    ),

    // ─── How It Works mega-menu — Option B locked per DELTA-2/4
    // (inline image fields; Sanity singletons for source/embedding/retention/
    //  how-it-works are empty stubs, can't dereference singleton heroes).
    defineField({
      name: 'howItWorksMegaMenu',
      title: 'How It Works mega-menu',
      type: 'object',
      fields: [
        {
          name: 'cards',
          type: 'array',
          validation: (R) => R.max(3),
          of: [
            {
              type: 'object',
              name: 'howItWorksCard',
              fields: [
                { name: 'title', type: 'string', validation: (R) => R.required().max(60) },
                { name: 'subtitle', type: 'string', validation: (R) => R.max(120) },
                imageField('image', 'Image', { altRequired: true, required: true }),
                { name: 'ctaLabel', type: 'string', validation: (R) => R.required().max(40) },
                { name: 'ctaUrl', type: 'url', validation: (R) => R.required() },
              ],
              preview: { select: { title: 'title', subtitle: 'subtitle', media: 'image' } },
            },
          ],
        },
        defineField({
          name: 'bottomPanel',
          title: 'Bottom panel',
          type: 'object',
          fields: [
            { name: 'heading', type: 'string', validation: (R) => R.required().max(120) },
            { name: 'subheading', type: 'string', validation: (R) => R.max(200) },
            { name: 'ctaLabel', type: 'string', validation: (R) => R.required().max(40) },
            { name: 'ctaUrl', type: 'url', validation: (R) => R.required() },
            imageField('image', 'Image', { altRequired: true, required: true }),
          ],
        }),
      ],
    }),

    // ─── Resources mega-menu
    defineField({
      name: 'resourcesMegaMenu',
      title: 'Resources mega-menu',
      type: 'object',
      fields: [
        // Left column — pill links with discriminated icon (material-font | asset)
        defineField({
          name: 'leftColumn',
          title: 'Left column — Resources pill links',
          type: 'object',
          fields: [
            { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
            {
              name: 'items',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'resourcesLeftItem',
                  fields: [
                    { name: 'label', type: 'string', validation: (R) => R.required().max(60) },
                    { name: 'url', type: 'url', validation: (R) => R.required() },
                    // Discriminated icon shape. Two valid shapes:
                    //   - source: 'material-font' + name (ligature like 'download')
                    //   - source: 'asset' + asset + alt
                    // Caller (STATIC-3 render) reads `source` and picks the branch.
                    // When source is undefined the icon is rendered as a blank slot.
                    defineField({
                      name: 'icon',
                      title: 'Icon',
                      type: 'object',
                      fields: [
                        {
                          name: 'source',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Material font (ligature)', value: 'material-font' },
                              { title: 'Asset (uploaded image)', value: 'asset' },
                            ],
                          },
                        },
                        {
                          name: 'name',
                          title: 'Material ligature name',
                          type: 'string',
                          description:
                            "Ligature string for Material font icons (e.g. 'download', 'calculate', 'video_library', 'event_upcoming'). Required when source === 'material-font'.",
                        },
                        imageField('asset', 'Asset image'),
                        {
                          name: 'alt',
                          title: 'Asset alt text',
                          type: 'string',
                          description: "Required when source === 'asset'.",
                        },
                      ],
                      // Conditional validation per brief §3 Step 2 Resources icon spec.
                      validation: (R) =>
                        R.custom((value: unknown) => {
                          if (!value || typeof value !== 'object') return true
                          const icon = value as {
                            source?: string
                            name?: string
                            asset?: unknown
                            alt?: string
                          }
                          if (icon.source === 'material-font') {
                            if (!icon.name || icon.name.trim() === '') {
                              return 'name (ligature) is required when source = material-font'
                            }
                          } else if (icon.source === 'asset') {
                            if (!icon.asset) return 'asset is required when source = asset'
                            if (!icon.alt || icon.alt.trim() === '') {
                              return 'alt is required when source = asset'
                            }
                          }
                          return true
                        }),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'url' } },
                },
              ],
            },
          ],
        }),
        // Middle column — Blogs with featured posts
        defineField({
          name: 'middleColumn',
          title: 'Middle column — Blogs',
          type: 'object',
          fields: [
            { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
            {
              name: 'viewAllLink',
              type: 'object',
              fields: [
                { name: 'label', type: 'string' },
                { name: 'url', type: 'url' },
              ],
            },
            {
              name: 'featuredPosts',
              type: 'array',
              description: '3 blogPost references rendered as image+title cards.',
              of: [{ type: 'reference', to: [{ type: 'blogPost' }] }],
              validation: (R) => R.max(3),
            },
          ],
        }),
        // Right column — Customer Stories
        defineField({
          name: 'rightColumn',
          title: 'Right column — Customer Stories',
          type: 'object',
          fields: [
            { name: 'sectionLabel', type: 'string', validation: (R) => R.required().max(40) },
            {
              name: 'viewAllLink',
              type: 'object',
              fields: [
                { name: 'label', type: 'string' },
                { name: 'url', type: 'url' },
              ],
            },
            {
              name: 'featuredStories',
              type: 'array',
              description: '3 customerStory references rendered as dark-green-bg cards.',
              of: [{ type: 'reference', to: [{ type: 'customerStory' }] }],
              validation: (R) => R.max(3),
            },
          ],
        }),
      ],
    }),

    // ─── STATIC-3 chrome — announcement bar (Header.html frame 01).
    defineField({
      name: 'announcementBar',
      title: 'Announcement bar',
      type: 'object',
      description:
        'Optional 44px promo strip above the nav. When disabled, renders nothing and reserves no layout space.',
      fields: [
        {
          name: 'enabled',
          title: 'Enabled',
          type: 'boolean',
          initialValue: false,
          validation: (R) => R.required(),
        },
        {
          name: 'badgeLabel',
          title: 'Badge label',
          type: 'string',
          description: 'Lime pill text, e.g. "NEW". Optional.',
          validation: (R) => R.max(20),
        },
        {
          name: 'message',
          title: 'Message',
          type: 'string',
          validation: (R) =>
            R.custom((value, context) => {
              const parent = context.parent as { enabled?: boolean } | undefined
              if (parent?.enabled && !value) {
                return 'Message is required when the announcement bar is enabled'
              }
              return true
            }).max(120),
        },
        {
          name: 'linkLabel',
          title: 'Link label',
          type: 'string',
          description: 'CTA text on the right, e.g. "Open calculator". Optional.',
          validation: (R) => R.max(40),
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
          type: 'string',
          description: 'Internal path (/pricing) or full URL. Optional.',
        },
      ],
    }),

    // ─── CTA button — kept as-is from STATIC-1.
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

    // ─── Locale dropdown — kept for regression safety; STATIC-3 strips
    //     the Header locale switcher (region selector moves to Footer).
    defineField({
      name: 'localeDropdown',
      title: 'Locale dropdown',
      type: 'object',
      description: LEGACY_FIELD_DESCRIPTION,
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
