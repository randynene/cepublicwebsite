import { defineArrayMember, defineField, defineType, type SchemaTypeDefinition } from 'sanity'

import { metaFields } from '../_shared'

// Factory for the two Hire Engineers MARKET landing pages:
//
//   hireUsEngineersPage -> /services/hire-us-engineers + /uk/services/hire-us-engineers
//   hireUkEngineersPage -> /services/hire-uk-engineers + /uk/services/hire-uk-engineers
//
// LOCALE AND MARKET ARE DIFFERENT AXES (the load-bearing idea from the
// template's content-types.ts): locale is who is READING, market is where the
// ENGINEERS are. The four routes are a 2x2, so each of the two documents backs
// TWO routes. Editing hireUsEngineersPage changes the US-market page on both
// the US and the UK site, which is correct: it is one product page shown to
// two audiences.
//
// Both documents share this shape so the two markets cannot drift apart
// structurally while their copy stays independent - the same reason the
// template keeps its types in one file.
//
// DESIGN DATA IS NOT COPY. Fields that drive the drawing rather than the
// message are `hidden: true`: the CSS market modifier, code-block indentation
// and comment colouring, score-bar percentages and tones, funnel bar widths,
// the illustrative monograms, and the brief-builder step count. They are
// seeded so the document is complete, and the site-side transform splices them
// back from the static content by index. An editor cannot reach in and break
// the layout, and the Studio form stays about words.
//
// PHOTOGRAPHY: the `image` path on each photo slot is code-owned too (the
// assets live in /public and are referenced by the design). Editors own the
// photography `brief`, the overlay `label` and the `alt` text.
//
// Seeded by scripts/static/seed-hire-engineers-market-pages.ts from
// site/src/components/templates/hire-engineers-market/content.{us,uk}.ts.
// Author-voice rule (no em/en dashes) is enforced at seed time.

// -- Reusable array-member shapes ---------------------------------------

const profileMember = defineArrayMember({
  type: 'object',
  name: 'hemProfile',
  title: 'Shortlist profile',
  fields: [
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'meta', title: 'Location and experience', type: 'string' }),
    defineField({ name: 'stack', title: 'Stack tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'salary', title: 'Salary', type: 'string' }),
    defineField({ name: 'salaryNote', title: 'Salary note', type: 'string' }),
    // Monogram stands in for a headshot because these profiles are invented.
    // A real face would assert that a real person is job-hunting at that rate.
    defineField({ name: 'initial', title: 'Monogram', type: 'string', hidden: true }),
  ],
  preview: { select: { title: 'role', subtitle: 'meta' } },
})

const floatCardMember = defineArrayMember({
  type: 'object',
  name: 'hemFloatCard',
  title: 'Floating card',
  fields: [
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'note', title: 'Note', type: 'string' }),
  ],
  preview: { select: { title: 'role', subtitle: 'note' } },
})

const stageMember = defineArrayMember({
  type: 'object',
  name: 'hemStage',
  title: 'Process stage',
  fields: [
    defineField({ name: 'n', title: 'Number', type: 'string' }),
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h3', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
    defineField({ name: 'emphasis', title: 'Emphasis line', type: 'string' }),
    defineField({
      name: 'pill',
      title: 'Lime pill',
      type: 'string',
      description: 'Stage 01 only. Leave empty on the others.',
    }),
    defineField({
      name: 'arrow',
      title: 'Lime arrow line',
      type: 'string',
      description: 'Stages 02 and 03. Leave empty on stage 01.',
    }),
  ],
  preview: { select: { title: 'h3', subtitle: 'eyebrow' } },
})

const requirementMember = defineArrayMember({
  type: 'object',
  name: 'hemRequirement',
  title: 'Brief requirement',
  fields: [
    defineField({ name: 'text', title: 'Requirement', type: 'string' }),
    defineField({
      name: 'met',
      title: 'Show a lime tick',
      type: 'boolean',
      description: 'Off shows a neutral circle. The design ticks the human judgement lines only.',
      initialValue: false,
    }),
  ],
  preview: { select: { title: 'text', subtitle: 'met' } },
})

const codeLineMember = defineArrayMember({
  type: 'object',
  name: 'hemCodeLine',
  title: 'Code line',
  fields: [
    defineField({ name: 'text', title: 'Line', type: 'string' }),
    // Indentation depth and comment colouring are how the block is DRAWN.
    defineField({ name: 'indent', title: 'Indent depth', type: 'number', hidden: true }),
    defineField({ name: 'comment', title: 'Muted comment colour', type: 'boolean', hidden: true }),
  ],
  preview: { select: { title: 'text' } },
})

// A "REAL PHOTO" slot. `image` is the code-owned path into /public.
function imageSlotFields() {
  return [
    defineField({
      name: 'brief',
      title: 'Photography brief',
      type: 'string',
      description: 'What this photo should show. Shown as a placeholder tile when there is no photo.',
    }),
    defineField({
      name: 'label',
      title: 'Overlay label',
      type: 'string',
      description: 'Drawn on the tile. Line breaks are deliberate.',
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe the scene. Leave empty on the illustrative candidate avatars: those are decorative and an alt would assert an identity for a person who is not real.',
    }),
    defineField({ name: 'image', title: 'Photo path', type: 'string', hidden: true }),
  ]
}

const imageSlotMember = defineArrayMember({
  type: 'object',
  name: 'hemImageSlot',
  title: 'Photo slot',
  fields: imageSlotFields(),
  preview: { select: { title: 'label', subtitle: 'brief' } },
})

const scoreMember = defineArrayMember({
  type: 'object',
  name: 'hemScore',
  title: 'Report score',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    // Bar width and colour are drawing, not copy.
    defineField({ name: 'pct', title: 'Bar width percent', type: 'number', hidden: true }),
    defineField({ name: 'tone', title: 'Bar tone', type: 'string', hidden: true }),
  ],
  preview: { select: { title: 'label', subtitle: 'value' } },
})

const funnelRowMember = defineArrayMember({
  type: 'object',
  name: 'hemFunnelRow',
  title: 'Funnel row',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    defineField({ name: 'pct', title: 'Bar width percent', type: 'number', hidden: true }),
  ],
  preview: { select: { title: 'label', subtitle: 'value' } },
})

const diffCardMember = defineArrayMember({
  type: 'object',
  name: 'hemDiffCard',
  title: 'Differentiator card',
  fields: [
    defineField({ name: 'h3', title: 'Heading', type: 'string' }),
    defineField({ name: 'p', title: 'Body', type: 'text', rows: 3 }),
  ],
  preview: { select: { title: 'h3', subtitle: 'p' } },
})

const faqItemMember = defineArrayMember({
  type: 'object',
  name: 'hemFaqItem',
  title: 'FAQ item',
  fields: [
    defineField({ name: 'q', title: 'Question', type: 'string' }),
    defineField({
      name: 'a',
      title: 'Answer',
      type: 'text',
      rows: 6,
      description:
        'PLAIN TEXT ONLY. This exact string is also published as FAQPage structured data, so the answer a crawler reads and the answer on the page have to be the same string.',
    }),
    defineField({
      name: 'linkText',
      title: 'Link text',
      type: 'string',
      description:
        'Optional. Must be an exact substring of the answer above. The template wraps that substring in a link at render time, which is how the answer becomes a link without the structured data and the page disagreeing.',
    }),
    defineField({
      name: 'linkHref',
      title: 'Link destination',
      type: 'string',
      description:
        'Absolute site path, for example /services/hire-uk-engineers. Deliberately NOT locale-rewritten: this is the one link meant to leave the current locale.',
    }),
  ],
  preview: { select: { title: 'q', subtitle: 'a' } },
})

// -- The factory --------------------------------------------------------

export function defineHireEngineersMarketPage(opts: {
  name: string
  title: string
  market: 'us' | 'uk'
}): SchemaTypeDefinition {
  return defineType({
    name: opts.name,
    title: opts.title,
    type: 'document',
    groups: [
      { name: 'hero', title: 'Hero', default: true },
      { name: 'seo', title: 'SEO' },
      { name: 'problem', title: 'Market problem' },
      { name: 'process', title: 'Process' },
      { name: 'trust', title: 'De-risk and differentiators' },
      { name: 'intake', title: 'Start a search form' },
      { name: 'faq', title: 'FAQ' },
      { name: 'cta', title: 'Final CTA' },
    ],
    fields: [
      defineField({
        name: 'title',
        title: 'Internal title',
        type: 'string',
        initialValue: opts.title,
        readOnly: true,
        hidden: true,
      }),
      ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),

      // Drives the hem--us / hem--uk CSS modifier. Not copy.
      defineField({
        name: 'market',
        title: 'Market modifier',
        type: 'string',
        hidden: true,
        initialValue: opts.market,
      }),

      defineField({
        name: 'hero',
        title: 'Hero',
        type: 'object',
        group: 'hero',
        fields: [
          defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
          defineField({
            name: 'h1Lead',
            title: 'Headline lead',
            type: 'text',
            rows: 2,
            description: 'Line breaks are deliberate and are preserved on the page.',
          }),
          defineField({ name: 'h1Em', title: 'Headline accent', type: 'string' }),
          defineField({ name: 'sub', title: 'Sub-heading', type: 'text', rows: 3 }),
          defineField({ name: 'ctaPrimary', title: 'Primary CTA', type: 'string' }),
          defineField({ name: 'ctaGhost', title: 'Secondary CTA', type: 'string' }),
          defineField({ name: 'ticks', title: 'Tick list', type: 'array', of: [{ type: 'string' }] }),
          defineField({
            name: 'card',
            title: 'Shortlist card',
            type: 'object',
            fields: [
              defineField({ name: 'label', title: 'Label', type: 'string' }),
              defineField({ name: 'badge', title: 'Badge', type: 'string' }),
              defineField({ name: 'profiles', title: 'Profiles', type: 'array', of: [profileMember] }),
              defineField({ name: 'foot', title: 'Footer line', type: 'string' }),
              defineField({
                name: 'illustrative',
                title: 'Illustrative badge',
                type: 'string',
                description:
                  'The amber badge. These profiles are invented, and the badge is what keeps the page honest about that. Do not remove it.',
              }),
            ],
          }),
        ],
      }),

      defineField({
        name: 'problem',
        title: 'Market problem',
        type: 'object',
        group: 'problem',
        fields: [
          defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
          defineField({
            name: 'h2',
            title: 'Headline',
            type: 'text',
            rows: 3,
            description: 'Line breaks are deliberate and are preserved on the page.',
          }),
          defineField({ name: 'stat', title: 'Stat line', type: 'string' }),
          defineField({ name: 'body', title: 'Body', type: 'text', rows: 4 }),
          defineField({ name: 'gridCaption', title: 'Grid caption', type: 'string' }),
          defineField({ name: 'floatCards', title: 'Floating cards', type: 'array', of: [floatCardMember] }),
          defineField({ name: 'floatCaption', title: 'Floating caption', type: 'string' }),
        ],
      }),

      defineField({
        name: 'process',
        title: 'Process',
        type: 'object',
        group: 'process',
        fields: [
          defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
          defineField({ name: 'h2Lead', title: 'Headline lead', type: 'string' }),
          defineField({ name: 'h2Em', title: 'Headline accent', type: 'string' }),
          defineField({ name: 'stages', title: 'Stages', type: 'array', of: [stageMember] }),
          defineField({
            name: 'brief',
            title: 'The brief panel',
            type: 'object',
            fields: [
              defineField({ name: 'label', title: 'Label', type: 'string' }),
              defineField({ name: 'role', title: 'Role', type: 'string' }),
              defineField({
                name: 'requirements',
                title: 'Requirements',
                type: 'array',
                of: [requirementMember],
              }),
              defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
              defineField({ name: 'photo', title: 'Photo', type: 'object', fields: imageSlotFields() }),
            ],
          }),
          defineField({
            name: 'code',
            title: 'Pair-session panel',
            type: 'object',
            fields: [
              defineField({ name: 'title', title: 'Panel title', type: 'string' }),
              defineField({ name: 'live', title: 'Live badge', type: 'string' }),
              defineField({ name: 'lines', title: 'Code lines', type: 'array', of: [codeLineMember] }),
              defineField({ name: 'rail', title: 'Camera rail photos', type: 'array', of: [imageSlotMember] }),
            ],
          }),
          defineField({
            name: 'report',
            title: 'Candidate report panel',
            type: 'object',
            fields: [
              defineField({ name: 'role', title: 'Role', type: 'string' }),
              defineField({ name: 'meta', title: 'Meta line', type: 'string' }),
              defineField({ name: 'open', title: 'Open label', type: 'string' }),
              defineField({ name: 'initial', title: 'Monogram', type: 'string', hidden: true }),
              defineField({ name: 'tabs', title: 'Tabs', type: 'array', of: [{ type: 'string' }] }),
              defineField({ name: 'scores', title: 'Scores', type: 'array', of: [scoreMember] }),
              defineField({ name: 'note', title: 'Note', type: 'text', rows: 3 }),
            ],
          }),
          defineField({
            name: 'funnel',
            title: 'Funnel panel',
            type: 'object',
            fields: [
              defineField({ name: 'label', title: 'Label', type: 'string' }),
              defineField({ name: 'rows', title: 'Rows', type: 'array', of: [funnelRowMember] }),
            ],
          }),
        ],
      }),

      defineField({
        name: 'derisk',
        title: 'De-risk claims',
        type: 'object',
        group: 'trust',
        fields: [
          defineField({
            name: 'claims',
            title: 'Claims',
            type: 'array',
            of: [{ type: 'string' }],
            description:
              'These are commercial commitments (fee terms, replacement guarantee, the written off-limits clause). Check with the commercial team before changing the terms.',
          }),
        ],
      }),

      defineField({
        name: 'differentiators',
        title: 'Differentiators',
        type: 'object',
        group: 'trust',
        fields: [
          defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
          defineField({ name: 'h2Lead', title: 'Headline lead', type: 'string' }),
          defineField({ name: 'h2Em', title: 'Headline accent', type: 'string' }),
          defineField({ name: 'h2Tail', title: 'Headline tail', type: 'string' }),
          defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 3 }),
          defineField({ name: 'cards', title: 'Cards', type: 'array', of: [diffCardMember] }),
        ],
      }),

      defineField({
        name: 'intake',
        title: 'Start a search form',
        type: 'object',
        group: 'intake',
        fields: [
          defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
          defineField({ name: 'h2Lead', title: 'Headline lead', type: 'string' }),
          defineField({ name: 'h2Em', title: 'Headline accent', type: 'string' }),
          defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 3 }),
          defineField({ name: 'label', title: 'Panel label', type: 'string' }),
          defineField({ name: 'heading', title: 'Panel heading', type: 'string' }),
          defineField({ name: 'stepLabel', title: 'Step label', type: 'string' }),
          defineField({ name: 'stepCounter', title: 'Step counter', type: 'string' }),
          defineField({ name: 'stepCount', title: 'Step count', type: 'number', hidden: true }),
          defineField({ name: 'dropTitle', title: 'Drop zone title', type: 'string' }),
          defineField({ name: 'dropHint', title: 'Drop zone hint', type: 'string' }),
          defineField({ name: 'pillGuided', title: 'Pill - guided', type: 'string' }),
          defineField({ name: 'pillSay', title: 'Pill - say it', type: 'string' }),
          defineField({ name: 'pillType', title: 'Pill - type it', type: 'string' }),
          defineField({ name: 'fileChosenLabel', title: 'File attached label', type: 'string' }),
          defineField({ name: 'fileRemoveLabel', title: 'File remove label', type: 'string' }),
          defineField({
            name: 'fileNote',
            title: 'File note',
            type: 'text',
            rows: 2,
            description:
              'The attached file is NOT uploaded anywhere yet, so this line must not imply we already have the document.',
          }),
          defineField({ name: 'fileTypeError', title: 'File type error', type: 'string' }),
          defineField({ name: 'fileSizeError', title: 'File size error', type: 'string' }),
          defineField({ name: 'jobLabel', title: 'Role field label', type: 'string' }),
          defineField({ name: 'jobPlaceholder', title: 'Role field placeholder', type: 'text', rows: 3 }),
          defineField({ name: 'helper', title: 'Helper text', type: 'text', rows: 2 }),
          defineField({ name: 'nameLabel', title: 'Name label', type: 'string' }),
          defineField({ name: 'namePlaceholder', title: 'Name placeholder', type: 'string' }),
          defineField({ name: 'emailLabel', title: 'Email label', type: 'string' }),
          defineField({ name: 'emailPlaceholder', title: 'Email placeholder', type: 'string' }),
          defineField({ name: 'consentNote', title: 'Consent note', type: 'text', rows: 2 }),
          defineField({ name: 'footNote', title: 'Footer note', type: 'string' }),
          defineField({ name: 'submit', title: 'Submit label', type: 'string' }),
          defineField({ name: 'submitting', title: 'Submitting label', type: 'string' }),
          defineField({ name: 'errorRequired', title: 'Error - required', type: 'string' }),
          defineField({ name: 'errorEmail', title: 'Error - invalid email', type: 'string' }),
          defineField({ name: 'caption', title: 'Caption', type: 'string' }),
        ],
      }),

      defineField({
        name: 'faq',
        title: 'FAQ',
        type: 'object',
        group: 'faq',
        fields: [
          defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
          defineField({ name: 'titleLead', title: 'Headline lead', type: 'string' }),
          defineField({ name: 'titleAccent', title: 'Headline accent', type: 'string' }),
          defineField({
            name: 'card',
            title: 'Ask-us card',
            type: 'object',
            fields: [
              defineField({ name: 'h3', title: 'Heading', type: 'string' }),
              defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
              defineField({ name: 'cta', title: 'CTA', type: 'string' }),
            ],
          }),
          defineField({ name: 'items', title: 'Questions', type: 'array', of: [faqItemMember] }),
        ],
      }),

      defineField({
        name: 'finalCta',
        title: 'Final CTA',
        type: 'object',
        group: 'cta',
        fields: [
          defineField({ name: 'h2Lead', title: 'Headline lead', type: 'string' }),
          defineField({ name: 'h2Em', title: 'Headline accent', type: 'string' }),
          defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 3 }),
          defineField({ name: 'ctaPrimary', title: 'Primary CTA', type: 'string' }),
          defineField({ name: 'ctaGhost', title: 'Secondary CTA', type: 'string' }),
          defineField({ name: 'foot', title: 'Footer line', type: 'string' }),
        ],
      }),
    ],
    preview: {
      select: { title: 'title' },
      prepare: ({ title }: { title?: string }) => ({ title: title ?? opts.title }),
    },
  })
}
