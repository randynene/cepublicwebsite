import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// fractionalCtoPage singleton (route /services/fractional-ctos + /uk). Bespoke
// shape mirroring the template's FctoContent (site/src/components/templates/
// fractional-cto/content.ts). Every visible string is a plain string/text field
// so Seb edits copy in Studio; the template renders it verbatim.
//
// IMAGES (added 23 Jul 2026, Jake request): the design ships with CSS
// placeholder tiles, but every placeholder is now an editable Sanity image so
// Seb can drop real photos in: the 3 hero card avatars, the "Tell us what you
// need" feature photo, and the video poster. All are optional - empty falls
// back to the original placeholder tile, so nothing breaks before upload. The
// logo strip stays text names (that is the marquee design, not image slots).
// Video: paste a YouTube/Vimeo/Loom link to play a real embed; the poster (or,
// for a YouTube link, the auto thumbnail) shows as the still.
//
// LAYOUT FIELDS: card positions (left/top/rot), status-pill positions/icon, and
// the match-form option width are pure layout, not content. They are seeded and
// kept as `hidden` fields so the Studio form stays clean and Seb cannot break
// the design by editing pixel offsets. The site-side transform is therefore a
// blunt cast (identical to homePage), and the doc carries every field it needs.
//
// Seeded by scripts/static/seed-fractional-cto-page.ts. Author-voice rule
// (no em/en dashes) is enforced at seed time.

// ── Reusable array-member object shapes ─────────────────────────────────

const heroCardMember = defineArrayMember({
  type: 'object',
  name: 'fctoHeroCard',
  title: 'Hero card',
  fields: [
    defineField({ name: 'role', title: 'Role label', type: 'string' }),
    defineField({ name: 'days', title: 'Days line', type: 'string' }),
    defineField({ name: 'name', title: 'Headline', type: 'string' }),
    defineField({ name: 'cred', title: 'Credential line', type: 'string' }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    imageField('image', 'Avatar photo'),
    // Layout (seeded, hidden from editors)
    defineField({ name: 'left', title: 'Left offset', type: 'string', hidden: true }),
    defineField({ name: 'top', title: 'Top offset', type: 'string', hidden: true }),
    defineField({ name: 'rot', title: 'Rotation', type: 'string', hidden: true }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
})

const statusPillMember = defineArrayMember({
  type: 'object',
  name: 'fctoStatusPill',
  title: 'Status pill',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    // Layout (seeded, hidden from editors)
    defineField({ name: 'icon', title: 'Icon', type: 'string', hidden: true }),
    defineField({ name: 'left', title: 'Left offset', type: 'string', hidden: true }),
    defineField({ name: 'top', title: 'Top offset', type: 'string', hidden: true }),
  ],
  preview: { select: { title: 'label' } },
})

const optionMember = defineArrayMember({
  type: 'object',
  name: 'fctoOption',
  title: 'Option',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'wide', title: 'Full width', type: 'boolean', hidden: true }),
  ],
  preview: { select: { title: 'label' } },
})

const pairMember = (name: string, aTitle: string, bTitle: string, aKey: string, bKey: string) =>
  defineArrayMember({
    type: 'object',
    name,
    fields: [
      defineField({ name: aKey, title: aTitle, type: 'string' }),
      defineField({ name: bKey, title: bTitle, type: 'text', rows: 3 }),
    ],
    preview: { select: { title: aKey, subtitle: bKey } },
  })

// ── Section objects ─────────────────────────────────────────────────────

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h1Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h1Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'sub', title: 'Sub paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'ctaPrimary', title: 'Primary CTA', type: 'string' }),
    defineField({ name: 'ctaGhost', title: 'Secondary CTA', type: 'string' }),
    defineField({ name: 'trust', title: 'Trust chips', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'cards', title: 'Hero cards', type: 'array', of: [heroCardMember] }),
    defineField({ name: 'statusPills', title: 'Status pills', type: 'array', of: [statusPillMember] }),
  ],
})

const trustedSection = defineField({
  name: 'trusted',
  title: 'Trusted by',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'text',
      rows: 2,
      description: 'Use a line break to split across lines (e.g. "Trusted by 300+" / "engineering teams").',
    }),
    defineField({ name: 'logos', title: 'Logo names', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'aiPill', title: 'AI pill label', type: 'string' }),
  ],
})

const videoSection = defineField({
  name: 'video',
  title: 'Video feature',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (YouTube / Vimeo / Loom)',
      type: 'url',
      description: 'Paste a YouTube, Vimeo or Loom link. Leave empty to keep the stylised placeholder tile.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    imageField('poster', 'Poster / thumbnail'),
    defineField({ name: 'tag', title: 'Tag', type: 'string' }),
    defineField({ name: 'name', title: 'Presenter name', type: 'string' }),
    defineField({ name: 'role', title: 'Presenter role', type: 'string' }),
    defineField({ name: 'play', title: 'Play button label', type: 'string' }),
    defineField({ name: 'timeStart', title: 'Time (start)', type: 'string' }),
    defineField({ name: 'timeEnd', title: 'Time (end)', type: 'string' }),
    defineField({ name: 'stateIdle', title: 'Caption (idle)', type: 'string' }),
    defineField({ name: 'statePlaying', title: 'Caption (playing)', type: 'string' }),
  ],
})

const doesSection = defineField({
  name: 'does',
  title: 'What they do',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [pairMember('fctoDoesCard', 'Heading', 'Body', 'h4', 'p')],
    }),
  ],
})

const statementSection = defineField({
  name: 'statement',
  title: 'Statement',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'line1', title: 'Line 1', type: 'string' }),
    defineField({ name: 'line2', title: 'Line 2 (accent)', type: 'string' }),
    defineField({ name: 'sub', title: 'Sub', type: 'string' }),
  ],
})

const matchedSection = defineField({
  name: 'matched',
  title: 'Matched in 7 days',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'topSub', title: 'Sub', type: 'string' }),
    defineField({
      name: 'feature',
      title: 'Feature step',
      type: 'object',
      fields: [
        defineField({ name: 'h3', title: 'Heading', type: 'string' }),
        defineField({ name: 'p', title: 'Body', type: 'text', rows: 3 }),
        imageField('image', 'Photo'),
        defineField({ name: 'foot', title: 'Footnote', type: 'string' }),
      ],
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      of: [pairMember('fctoMatchedStep', 'Heading', 'Body', 'h4', 'p')],
    }),
  ],
})

const deriskSection = defineField({
  name: 'derisk',
  title: 'Why low risk',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'benefits', title: 'Benefit chips', type: 'array', of: [{ type: 'string' }] }),
  ],
})

const selfcheckSection = defineField({
  name: 'selfcheck',
  title: 'Self-check',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [pairMember('fctoSelfcheckItem', 'Number', 'Body', 'n', 'p')],
    }),
  ],
})

const matchformSection = defineField({
  name: 'matchform',
  title: 'Match form',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 2 }),
    defineField({
      name: 'progress',
      title: 'Progress steps',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'fctoProgress',
          fields: [
            defineField({ name: 'num', title: 'Number', type: 'string' }),
            defineField({ name: 'lb', title: 'Label', type: 'string' }),
          ],
          preview: { select: { title: 'lb', subtitle: 'num' } },
        },
      ],
    }),
    defineField({ name: 'options', title: 'Options', type: 'array', of: [optionMember] }),
    defineField({ name: 'back', title: 'Back label', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Step copy',
      type: 'array',
      of: [pairMember('fctoFormStep', 'Title', 'Hint', 'title', 'hint')],
    }),
    defineField({ name: 'nextDefault', title: 'Next (default)', type: 'string' }),
    defineField({ name: 'nextStep2', title: 'Next (step 3)', type: 'string' }),
    defineField({ name: 'nextStep3', title: 'Next (final)', type: 'string' }),
    defineField({ name: 'reassureLabel', title: 'Reassure label', type: 'string' }),
    defineField({ name: 'pillAi', title: 'AI pill', type: 'string' }),
    defineField({ name: 'pillBook', title: 'Book pill', type: 'string' }),
    defineField({ name: 'trust', title: 'Trust chips', type: 'array', of: [{ type: 'string' }] }),
  ],
})

const faqSection = defineField({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'ctaEyebrow', title: 'CTA eyebrow', type: 'string' }),
    defineField({ name: 'ctaBody', title: 'CTA body', type: 'text', rows: 2 }),
    defineField({ name: 'ctaBtn', title: 'CTA button', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'fctoFaqItem',
          fields: [
            defineField({ name: 'n', title: 'Number', type: 'string' }),
            defineField({ name: 'q', title: 'Question', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'a', title: 'Answer', type: 'text', rows: 4, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'q', subtitle: 'n' } },
        },
      ],
    }),
  ],
})

const finalSection = defineField({
  name: 'final',
  title: 'Final CTA',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'p', title: 'Paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'cta', title: 'CTA', type: 'string' }),
    defineField({ name: 'metrics', title: 'Metrics', type: 'array', of: [{ type: 'string' }] }),
  ],
})

export default defineType({
  name: 'fractionalCtoPage',
  title: 'Fractional CTO Page',
  type: 'document',
  description: 'Singleton for /services/fractional-ctos. Bespoke landing template shape.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'Fractional CTO Page',
      readOnly: true,
      hidden: true,
    }),
    // SEO
    ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),
    // Content sections
    ...[
      heroSection,
      trustedSection,
      videoSection,
      doesSection,
      statementSection,
      matchedSection,
      deriskSection,
      selfcheckSection,
      matchformSection,
      faqSection,
      finalSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'Fractional CTO Page' }),
  },
})
