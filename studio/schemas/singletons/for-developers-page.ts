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
// JOIN FORM: the multi-step "build your profile" form stays a React component
// (demo submit → done state; no HubSpot yet per D2). Its copy lives in `join`
// so Seb can edit labels/options in Studio. JOIN_CONTENT is the static fallback.
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
    defineField({
      name: 'ctaPrimaryHref',
      title: 'Primary CTA link',
      type: 'string',
      description: 'Path or #anchor. Default #join (scrolls to the profile form).',
      initialValue: '#join',
    }),
    defineField({ name: 'ctaGhost', title: 'Secondary CTA', type: 'string' }),
    defineField({
      name: 'ctaGhostHref',
      title: 'Secondary CTA link',
      type: 'string',
      description: 'Path or #anchor. Default #how (the process section).',
      initialValue: '#how',
    }),
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
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube / Vimeo / Loom. Leave empty to keep the decorative poster.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
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
    defineField({
      name: 'ctaHref',
      title: 'CTA link',
      type: 'string',
      description: 'Path or #anchor. Default #join.',
      initialValue: '#join',
    }),
    defineField({ name: 'trust', title: 'Trust chips', ...stringArray }),
  ],
})

const joinStepMember = defineArrayMember({
  type: 'object',
  name: 'feJoinStep',
  fields: [
    defineField({ name: 'label', title: 'Step label', type: 'string' }),
    defineField({ name: 'q', title: 'Question', type: 'string' }),
  ],
  preview: { select: { title: 'label', subtitle: 'q' } },
})

const joinSection = defineField({
  name: 'join',
  title: 'Build your profile (join form)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  description:
    'Editable copy for the multi-step join form. Submit stays a demo (done state) until HubSpot wiring.',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'continue', title: 'Continue button', type: 'string' }),
    defineField({ name: 'joinCta', title: 'Final join button', type: 'string' }),
    defineField({ name: 'back', title: 'Back label', type: 'string' }),
    defineField({ name: 'steps', title: 'Steps', type: 'array', of: [joinStepMember] }),
    defineField({
      name: 'fields',
      title: 'Field labels & options',
      type: 'object',
      fields: [
        defineField({ name: 'locLabel', title: 'Location label', type: 'string' }),
        defineField({ name: 'locPlaceholder', title: 'Location placeholder', type: 'string' }),
        defineField({ name: 'roleLabel', title: 'Role label', type: 'string' }),
        defineField({ name: 'roleDefault', title: 'Role default', type: 'string' }),
        defineField({ name: 'roles', title: 'Roles', ...stringArray }),
        defineField({ name: 'yrsLabel', title: 'Years label', type: 'string' }),
        defineField({ name: 'yrsDefault', title: 'Years default', type: 'string' }),
        defineField({ name: 'yrs', title: 'Years options', ...stringArray }),
        defineField({ name: 'skillsLabel', title: 'Skills label', type: 'string' }),
        defineField({ name: 'skills', title: 'Skill chips', ...stringArray }),
        defineField({ name: 'skillPlaceholder', title: 'Skill placeholder', type: 'string' }),
        defineField({ name: 'skillVocab', title: 'Skill autocomplete vocab', ...stringArray }),
        defineField({ name: 'styleLabel', title: 'Work style label', type: 'string' }),
        defineField({ name: 'styles', title: 'Work styles', ...stringArray }),
        defineField({ name: 'rateHelp', title: 'Rate help', type: 'text', rows: 2 }),
        defineField({ name: 'rateLabel', title: 'Rate label', type: 'string' }),
        defineField({ name: 'ratePlaceholder', title: 'Rate placeholder', type: 'string' }),
        defineField({ name: 'availLabel', title: 'Availability label', type: 'string' }),
        defineField({ name: 'availDefault', title: 'Availability default', type: 'string' }),
        defineField({ name: 'avail', title: 'Availability options', ...stringArray }),
        defineField({ name: 'nameLabel', title: 'Name label', type: 'string' }),
        defineField({ name: 'namePlaceholder', title: 'Name placeholder', type: 'string' }),
        defineField({ name: 'emailLabel', title: 'Email label', type: 'string' }),
        defineField({ name: 'emailPlaceholder', title: 'Email placeholder', type: 'string' }),
        defineField({ name: 'workLabel', title: 'Work link label', type: 'string' }),
        defineField({ name: 'workHint', title: 'Work link hint', type: 'string' }),
        defineField({ name: 'workPlaceholder', title: 'Work link placeholder', type: 'string' }),
      ],
    }),
    defineField({
      name: 'done',
      title: 'Done state',
      type: 'object',
      fields: [
        defineField({ name: 'h', title: 'Heading', type: 'string' }),
        defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'preview',
      title: 'Live preview card',
      type: 'object',
      fields: [
        defineField({ name: 'pl', title: 'Preview label', type: 'string' }),
        defineField({ name: 'name', title: 'Default name', type: 'string' }),
        defineField({ name: 'role', title: 'Default role', type: 'string' }),
        defineField({ name: 'tagsEmpty', title: 'Empty tags', type: 'string' }),
        defineField({ name: 'label', title: 'How you work label', type: 'string' }),
        defineField({ name: 'rateEmpty', title: 'Empty rate', type: 'string' }),
        defineField({ name: 'rateSub', title: 'Rate subtitle', type: 'string' }),
        defineField({ name: 'foot', title: 'Footer stats', type: 'array', of: [footMember] }),
      ],
    }),
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
      joinSection,
      finalSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'For Developers Page' }),
  },
})
