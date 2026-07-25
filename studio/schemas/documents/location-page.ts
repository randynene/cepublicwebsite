import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields, slugField } from '../_shared'

// locationPage document type (route /services/<slug>). Bespoke shape mirroring
// the LocationContent shape consumed by the LocationTemplate. Three docs live
// here, keyed by slug: latam-developers, eastern-europe-developers,
// philippines-developers. Every string is plain copy the template renders
// verbatim.
//
// IMAGE HANDLING (WIRE-BESPOKE v2, 23 Jul 2026): every image is a real Sanity
// image asset (imageField), mirroring the homePage singleton. Seb drag-and-drops
// photos and logos in Studio. The site-side GROQ dereferences each asset to a
// plain URL so the template's <img src> usage is unchanged. (v1 stored string
// paths; Jake asked for full image editability, so v2 upgrades every image.)
//
// VIDEO: the video feature carries a `videoUrl` (YouTube/Vimeo/Loom) plus a
// poster image. When a URL is set the template renders click-to-play; when it is
// empty the poster shows as a static still (current behaviour).
//
// CALCULATOR: only the surrounding COPY lives here (headings, sticker,
// disclaimer). The calculator's numeric config (roles, region multipliers,
// currency, comparison multiple) stays code-driven in the location registry -
// the WIRE-BESPOKE brief keeps calculator logic in code. The site-side
// transform splices the code numerics back in.
//
// Route keeps the code registry (site/src/components/templates/location/content.ts)
// as the fallback: /services/[slug] fetches this doc first and falls back to the
// registry content when the doc is absent or fails validation.
//
// Author-voice rule (no em/en dashes) is enforced at seed time.
// Seeded by scripts/static/seed-location-pages.ts.

// ── Reusable array-member object shapes ─────────────────────────────────

const heroCardMember = defineArrayMember({
  type: 'object',
  name: 'heroCard',
  title: 'Hero card',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'skills', title: 'Skills', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'flag', title: 'Flag emoji', type: 'string' }),
    imageField('image', 'Photo'),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
})

const logoMember = defineArrayMember({
  type: 'object',
  name: 'locationLogo',
  title: 'Client logo',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    imageField('image', 'Logo'),
    defineField({
      name: 'invert',
      title: 'Invert to white',
      type: 'boolean',
      description: 'Default on. Turn off for logos that already have a solid/coloured background.',
    }),
    defineField({
      name: 'displayHeight',
      title: 'Display height (px)',
      type: 'number',
      description: 'Rendered max-height in the logo strip. Defaults to 22 if empty.',
    }),
    defineField({
      name: 'displayOpacity',
      title: 'Display opacity',
      type: 'number',
      description: 'Defaults to 1. Lower for faint logos.',
    }),
  ],
  preview: { select: { title: 'name', media: 'image' } },
})

const advantageCardMember = defineArrayMember({
  type: 'object',
  name: 'advantageCard',
  title: 'Advantage card',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
  ],
  preview: { select: { title: 'title', subtitle: 'eyebrow' } },
})

const hubCardMember = defineArrayMember({
  type: 'object',
  name: 'hubCard',
  title: 'Hub card',
  fields: [
    defineField({ name: 'city', title: 'City', type: 'string' }),
    defineField({ name: 'note', title: 'Note', type: 'string' }),
    imageField('image', 'Photo'),
  ],
  preview: { select: { title: 'city', subtitle: 'note', media: 'image' } },
})

const engineerProfileMember = defineArrayMember({
  type: 'object',
  name: 'engineerProfile',
  title: 'Engineer profile',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'skills', title: 'Skills', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'years', title: 'Years line', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 3 }),
    defineField({ name: 'flag', title: 'Flag emoji', type: 'string' }),
    imageField('image', 'Photo'),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
})

const startCardMember = defineArrayMember({
  type: 'object',
  name: 'startCard',
  title: 'Start card',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
    defineField({ name: 'bullets', title: 'Bullets', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
    defineField({ name: 'ctaHref', title: 'CTA href', type: 'string' }),
  ],
  preview: { select: { title: 'title', subtitle: 'eyebrow' } },
})

const faqItemMember = defineArrayMember({
  type: 'object',
  name: 'locationFaqItem',
  title: 'FAQ item',
  fields: [
    defineField({ name: 'number', title: 'Number', type: 'string' }),
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (R) => R.required() }),
  ],
  preview: { select: { title: 'question', subtitle: 'number' } },
})

// ── Section objects ─────────────────────────────────────────────────────

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleConnector', title: 'Title (connector, e.g. "in the")', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'paragraph', title: 'Paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'ctaPrimary', title: 'Primary CTA', type: 'string' }),
    defineField({ name: 'ctaSecondary', title: 'Secondary CTA', type: 'string' }),
    defineField({ name: 'trustPills', title: 'Trust pills', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'cards',
      title: 'Hero cards (photo stack, up to 3)',
      type: 'array',
      of: [heroCardMember],
      description: 'The overlapping photo cards in the hero. The first three are shown, in order.',
    }),
    defineField({ name: 'floatingBadges', title: 'Floating badges', type: 'array', of: [{ type: 'string' }] }),
  ],
})

const advantageSection = defineField({
  name: 'advantage',
  title: 'Advantage (time zone)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({ name: 'cards', title: 'Cards', type: 'array', of: [advantageCardMember] }),
  ],
})

const videoSection = defineField({
  name: 'video',
  title: 'Video feature',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
    defineField({ name: 'presenter', title: 'Presenter label', type: 'string' }),
    defineField({ name: 'pullQuote', title: 'Pull quote', type: 'string' }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (YouTube / Vimeo / Loom)',
      type: 'url',
      description: 'Paste a YouTube or Vimeo link. Leave empty to show the poster image as a static still.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    imageField('image', 'Poster image'),
  ],
})

const onGroundSection = defineField({
  name: 'onGround',
  title: 'On the ground (LATAM / EE only)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
    defineField({ name: 'bullets', title: 'Bullets', type: 'array', of: [{ type: 'string' }] }),
    imageField('image', 'Photo'),
  ],
})

const eorSection = defineField({
  name: 'eor',
  title: 'Employer of Record (Philippines only)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'eorItem',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
    }),
  ],
})

const includedSection = defineField({
  name: 'included',
  title: "What's included (Philippines only)",
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'youLabel', title: 'You label', type: 'string' }),
    defineField({ name: 'you', title: 'You items', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'weLabel', title: 'We label', type: 'string' }),
    defineField({ name: 'we', title: 'We items', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'footnote', title: 'Footnote', type: 'string' }),
  ],
})

const primaryHubSection = defineField({
  name: 'primaryHub',
  title: 'Primary hub',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'bannerEyebrow', title: 'Banner eyebrow', type: 'string' }),
    defineField({ name: 'bannerTitle', title: 'Banner title', type: 'string' }),
    defineField({ name: 'bannerBody', title: 'Banner body', type: 'text', rows: 3 }),
    imageField('image', 'Banner photo'),
    defineField({ name: 'secondaryEyebrow', title: 'Secondary eyebrow', type: 'string' }),
    defineField({ name: 'secondary', title: 'Secondary hubs', type: 'array', of: [hubCardMember] }),
  ],
})

const engineersSection = defineField({
  name: 'engineers',
  title: 'Sample engineers',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
    defineField({ name: 'profiles', title: 'Profiles', type: 'array', of: [engineerProfileMember] }),
  ],
})

const funFactSection = defineField({
  name: 'funFact',
  title: 'Fun fact',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
    defineField({ name: 'source', title: 'Source', type: 'string' }),
  ],
})

const calculatorSection = defineField({
  name: 'calculator',
  title: 'Calculator copy',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  description:
    'Only the copy around the calculator is editable here. The figures (roles, region multipliers, currency) stay code-driven.',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'titleSuffix', title: 'Title (suffix)', type: 'string' }),
    defineField({ name: 'resultEyebrow', title: 'Result eyebrow', type: 'string' }),
    defineField({ name: 'savedPrefix', title: 'Saved prefix', type: 'string' }),
    defineField({ name: 'savingsSticker', title: 'Savings sticker', type: 'string' }),
    defineField({ name: 'savingsStickerSub', title: 'Savings sticker sub', type: 'string' }),
    defineField({ name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 2 }),
  ],
})

const startSection = defineField({
  name: 'start',
  title: 'Three ways to start',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'cards', title: 'Cards', type: 'array', of: [startCardMember] }),
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
    defineField({ name: 'helpEyebrow', title: 'Help eyebrow', type: 'string' }),
    defineField({ name: 'helpBody', title: 'Help body', type: 'string' }),
    defineField({ name: 'helpCta', title: 'Help CTA', type: 'string' }),
    defineField({ name: 'items', title: 'Items', type: 'array', of: [faqItemMember] }),
  ],
})

export default defineType({
  name: 'locationPage',
  title: 'Location Page',
  type: 'document',
  description:
    'Bespoke regional hiring page served at /services/<slug>. Three docs: LATAM, Eastern Europe, Philippines.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'region',
      title: 'Region name',
      type: 'string',
      description: 'Display name (e.g. Latin America). Also used as the calculator region label.',
      validation: (R) => R.required(),
      group: 'content',
    }),
    { ...slugField('region'), group: 'content' },
    // SEO
    ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),
    // Content sections
    ...[
      heroSection,
      advantageSection,
      videoSection,
      onGroundSection,
      eorSection,
      includedSection,
      primaryHubSection,
      engineersSection,
      funFactSection,
      calculatorSection,
      startSection,
      faqSection,
    ].map((f) => ({ ...f, group: 'content' })),
    // Logo strip
    defineField({
      name: 'logosLabelLines',
      title: 'Logo strip label (one line per item)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Rendered stacked, one line each. e.g. "Trusted by" / "300+" / "engineering teams".',
      group: 'content',
    }),
    defineField({
      name: 'logos',
      title: 'Logo strip logos',
      type: 'array',
      of: [logoMember],
      group: 'content',
    }),
  ],
  preview: {
    select: { title: 'region', subtitle: 'slug.current' },
    prepare: ({ title, subtitle }) => ({
      title: (title as string) || 'Location Page',
      subtitle: subtitle as string,
    }),
  },
})
