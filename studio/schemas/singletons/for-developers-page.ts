import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// forDevelopersPage singleton (route /for-developers + /uk/for-developers).
//
// Bespoke shape mirroring the template's ForEngineersContent field-for-field
// (site/src/components/templates/for-engineers/content.ts). The page body is a
// tokenised copy of a frozen Figma export; every visible text run and photo in
// it is fed from this doc, so Seb edits copy + swaps photos in Studio and the
// page stays pixel-identical. The site-side transform is a blunt cast (like
// homePage / fractionalCtoPage), so field names MUST match the content paths.
//
// NOT in this schema (deliberately, code-owned): the multi-step "build your
// profile" form (JoinForm) - it is a live interactive React component and keeps
// its copy in JOIN_CONTENT.
//
// IMAGES: 10 optional image slots (hero card, the 2 video-call stills, 3 benefit
// photos, the testimonial video poster, 3 quote-card photos). Empty = keep the
// baked Figma placeholder tile, so nothing breaks before Seb uploads. The three
// testimonial quotes shipped as PLACEHOLDER copy - replace before a public
// relaunch.
//
// Seeded by scripts/static/seed-for-developers-page.ts. Author-voice rule
// (no em/en dashes) is enforced at seed time.

// ── Reusable array-member shapes ────────────────────────────────────────

const stringArray = { type: 'array' as const, of: [{ type: 'string' as const }] }

const footMember = defineArrayMember({
  type: 'object',
  name: 'feStat',
  fields: [
    defineField({ name: 'n', title: 'Number', type: 'string' }),
    defineField({ name: 'l', title: 'Label', type: 'string' }),
  ],
  preview: { select: { title: 'n', subtitle: 'l' } },
})

const statMember = defineArrayMember({
  type: 'object',
  name: 'feProblemStat',
  fields: [
    defineField({ name: 'num', title: 'Number', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'num', subtitle: 'body' } },
})

const msgMember = defineArrayMember({
  type: 'object',
  name: 'feMsg',
  fields: [
    defineField({ name: 'co', title: 'Company line', type: 'string' }),
    defineField({ name: 'ln', title: 'Detail line', type: 'string' }),
    defineField({ name: 'mt', title: 'Matched time', type: 'string' }),
  ],
  preview: { select: { title: 'co', subtitle: 'mt' } },
})

const benefitItemMember = defineArrayMember({
  type: 'object',
  name: 'feBenefitItem',
  fields: [
    defineField({ name: 'h', title: 'Heading', type: 'string' }),
    defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'h', subtitle: 'p' } },
})

const photoMember = defineArrayMember({
  type: 'object',
  name: 'feBenefitPhoto',
  fields: [
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'sub', title: 'Sub caption', type: 'string' }),
    imageField('image', 'Photo'),
  ],
  preview: { select: { title: 'caption', subtitle: 'sub', media: 'image' } },
})

const quoteMember = defineArrayMember({
  type: 'object',
  name: 'feQuote',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'quote', title: 'Quote (placeholder)', type: 'text', rows: 4 }),
    imageField('image', 'Photo'),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
})

// ── Section objects ─────────────────────────────────────────────────────

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({
      name: 'titleLead',
      title: 'Heading (lead)',
      type: 'text',
      rows: 3,
      description: 'Line breaks are preserved. The accent phrase renders after this.',
    }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'sub', title: 'Sub paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'ctaPrimary', title: 'Primary CTA', type: 'string' }),
    defineField({ name: 'ctaGhost', title: 'Secondary CTA', type: 'string' }),
    defineField({ name: 'trust', title: 'Trust chips', ...stringArray }),
    defineField({
      name: 'card',
      title: 'Profile card',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        defineField({ name: 'role', title: 'Role', type: 'string' }),
        defineField({ name: 'matched', title: 'Matched badge', type: 'string' }),
        defineField({ name: 'workLabel', title: 'Work label', type: 'string' }),
        defineField({ name: 'tags', title: 'Tags', ...stringArray }),
        defineField({ name: 'foot', title: 'Footer stats', type: 'array', of: [footMember] }),
        imageField('image', 'Card photo'),
      ],
    }),
  ],
})

const problemSection = defineField({
  name: 'problem',
  title: 'Why this exists',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'leadPre', title: 'Lead (before bold)', type: 'text', rows: 2 }),
    defineField({ name: 'leadStrong', title: 'Lead (bold run)', type: 'string' }),
    defineField({ name: 'leadPost', title: 'Lead (after bold)', type: 'text', rows: 2 }),
    defineField({ name: 'stats', title: 'Stats', type: 'array', of: [statMember] }),
  ],
})

const stepOne = defineField({
  name: 'one',
  title: 'Step 01',
  type: 'object',
  fields: [
    defineField({ name: 'n', title: 'Number', type: 'string' }),
    defineField({ name: 'h', title: 'Heading', type: 'string' }),
    defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
    defineField({ name: 'tag', title: 'Tag', type: 'string' }),
    defineField({ name: 'miniLabel', title: 'Mini-card label', type: 'string' }),
    defineField({ name: 'rows', title: 'Mini-card rows', ...stringArray }),
  ],
})

const stepTwo = defineField({
  name: 'two',
  title: 'Step 02',
  type: 'object',
  fields: [
    defineField({ name: 'n', title: 'Number', type: 'string' }),
    defineField({ name: 'badge', title: 'Badge', type: 'string' }),
    defineField({ name: 'h', title: 'Heading', type: 'string' }),
    defineField({ name: 'p', title: 'Body', type: 'text', rows: 3 }),
    defineField({ name: 'live', title: 'Live label', type: 'string' }),
    defineField({ name: 'camYou', title: 'Camera label (you)', type: 'string' }),
    defineField({ name: 'camEng', title: 'Camera label (engineer)', type: 'string' }),
    imageField('camYouImage', 'Camera still (you)'),
    imageField('camEngImage', 'Camera still (engineer)'),
  ],
})

const stepThree = defineField({
  name: 'three',
  title: 'Step 03',
  type: 'object',
  fields: [
    defineField({ name: 'n', title: 'Number', type: 'string' }),
    defineField({ name: 'h', title: 'Heading', type: 'string' }),
    defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
    defineField({ name: 'incomingLabel', title: 'Incoming label', type: 'string' }),
    defineField({ name: 'msgs', title: 'Incoming messages', type: 'array', of: [msgMember] }),
  ],
})

const stepFour = defineField({
  name: 'four',
  title: 'Step 04',
  type: 'object',
  fields: [
    defineField({ name: 'n', title: 'Number', type: 'string' }),
    defineField({ name: 'h', title: 'Heading', type: 'string' }),
    defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
    defineField({ name: 'tag', title: 'Tag', type: 'string' }),
    defineField({ name: 'handleLabel', title: 'We-handle label', type: 'string' }),
    defineField({ name: 'chips', title: 'Chips', ...stringArray }),
  ],
})

const howSection = defineField({
  name: 'how',
  title: 'The process',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'object',
      fields: [stepOne, stepTwo, stepThree, stepFour],
    }),
  ],
})

const benefitsSection = defineField({
  name: 'benefits',
  title: 'What you get',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'items', title: 'Benefit items', type: 'array', of: [benefitItemMember] }),
    defineField({ name: 'photos', title: 'Photos', type: 'array', of: [photoMember] }),
  ],
})

const missionSection = defineField({
  name: 'mission',
  title: 'The idea',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'text', rows: 2 }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'p', title: 'Paragraph', type: 'text', rows: 2 }),
  ],
})

const testsSection = defineField({
  name: 'tests',
  title: 'Testimonials',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'videoPill', title: 'Video pill', type: 'string' }),
    defineField({ name: 'videoLabel', title: 'Video label', type: 'string' }),
    imageField('videoImage', 'Video poster'),
    defineField({
      name: 'quotes',
      title: 'Quote cards (placeholder copy)',
      type: 'array',
      of: [quoteMember],
    }),
  ],
})

const finalSection = defineField({
  name: 'final',
  title: 'Final CTA',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'p', title: 'Paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'cta', title: 'CTA', type: 'string' }),
    defineField({ name: 'trust', title: 'Trust chips', ...stringArray }),
  ],
})

export default defineType({
  name: 'forDevelopersPage',
  title: 'For Developers Page',
  type: 'document',
  description: 'Singleton for /for-developers. Bespoke engineer-facing landing template shape.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'For Developers Page',
      readOnly: true,
      hidden: true,
    }),
    // SEO
    ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),
    // Content sections
    ...[
      heroSection,
      problemSection,
      howSection,
      benefitsSection,
      missionSection,
      testsSection,
      finalSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'For Developers Page' }),
  },
})
