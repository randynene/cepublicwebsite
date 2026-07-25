import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// hireEngineersPage singleton (route /services/software-engineers + /uk).
// Bespoke shape mirroring the template's HireEngineersContent (site/src/
// components/templates/hire-engineers/content.ts). Every visible string is a
// plain string/text field so Seb edits copy in Studio; the template renders it
// verbatim, falling back to the static HE const when this doc is absent.
//
// IMAGES: the design ships with "Image suggestion" placeholder tiles and letter
// avatars, but every slot is now an editable Sanity image so Seb can drop real
// photos in - the 2 hero shortlist avatars, the "engineer at their desk" offer
// photo, the sample-profile avatar, the case-study author avatar, the two proof
// image bands, the two match-result photos, and the form-side photo. All are
// optional; empty keeps the original placeholder, so nothing breaks pre-upload.
//
// VIDEO: the vetting section's "90-second tour" link plays a real embed when a
// tourVideoUrl (YouTube/Vimeo/Loom) is set; tourPoster (or a YouTube link's auto
// thumbnail) shows as the still. Empty keeps the source's inert placeholder.
//
// CALCULATOR: the pricing cost calculator's numeric tables stay code-driven. The
// three option arrays (roleOptions / regionOptions / senOptions) double as the
// calculator's lookup keys, so they are seeded + kept `hidden` here and spliced
// from the code fallback by the site-side transform - editing them would break
// the maths. Everything else in the pricing section is editable copy.
//
// Seeded by scripts/static/seed-hire-engineers-page.ts. Author-voice rule (no
// em/en dashes) is enforced at seed time.

// ── Reusable object shapes ──────────────────────────────────────────────

// "Image suggestion" placeholder tile: a caption plus an optional real photo.
const imageSlot = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({ name: 'tag', title: 'Tag label', type: 'string' }),
      defineField({ name: 't', title: 'Caption title', type: 'string' }),
      defineField({ name: 's', title: 'Caption subtitle', type: 'text', rows: 2 }),
      imageField('image', 'Photo'),
    ],
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

const optsField = defineField({ name: 'opts', title: 'Options', type: 'array', of: [{ type: 'string' }] })

const stepQuestion = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({ name: 'q', title: 'Question', type: 'string' }),
      defineField({ name: 'hint', title: 'Hint', type: 'string' }),
      optsField,
    ],
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
    defineField({
      name: 'card',
      title: 'Shortlist card',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'badge', title: 'Badge', type: 'string' }),
        defineField({ name: 'per', title: 'Rate suffix', type: 'string' }),
        defineField({
          name: 'candidates',
          title: 'Candidates',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'heShortlistCandidate',
              fields: [
                defineField({ name: 'av', title: 'Avatar letter', type: 'string' }),
                defineField({ name: 'nm', title: 'Name', type: 'string' }),
                defineField({ name: 'rl', title: 'Role line', type: 'string' }),
                defineField({ name: 'rate', title: 'Rate', type: 'string' }),
                imageField('image', 'Avatar photo'),
              ],
              preview: { select: { title: 'nm', subtitle: 'rl', media: 'image' } },
            }),
          ],
        }),
        defineField({ name: 'foot', title: 'Footnote', type: 'string' }),
      ],
    }),
  ],
})

const offerSection = defineField({
  name: 'offer',
  title: 'What you get',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 2 }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [pairMember('heOfferCard', 'Heading', 'Body', 'h4', 'p')],
    }),
    imageSlot('img', 'Feature photo'),
  ],
})

const rolesSection = defineField({
  name: 'roles',
  title: 'Roles',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Role cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heRoleCard',
          fields: [
            defineField({ name: 'rn', title: 'Role name', type: 'string' }),
            defineField({ name: 'rd', title: 'Role detail', type: 'string' }),
          ],
          preview: { select: { title: 'rn', subtitle: 'rd' } },
        }),
      ],
    }),
  ],
})

const howSection = defineField({
  name: 'how',
  title: 'How it works',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heHowStep',
          fields: [
            defineField({ name: 'n', title: 'Number', type: 'string' }),
            defineField({ name: 'h4', title: 'Heading', type: 'string' }),
            defineField({ name: 'p', title: 'Body', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'h4', subtitle: 'n' } },
        }),
      ],
    }),
    defineField({ name: 'more', title: 'More link label', type: 'string' }),
  ],
})

const vetSection = defineField({
  name: 'vet',
  title: 'Vetting',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({
      name: 'points',
      title: 'Points',
      type: 'array',
      of: [pairMember('heVetPoint', 'Heading', 'Body', 'h4', 'p')],
    }),
    defineField({
      name: 'profile',
      title: 'Sample profile',
      type: 'object',
      fields: [
        defineField({ name: 'av', title: 'Avatar letter', type: 'string' }),
        defineField({ name: 'nm', title: 'Name', type: 'string' }),
        defineField({ name: 'rl', title: 'Role line', type: 'string' }),
        defineField({ name: 'tabs', title: 'Tabs', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'assessment', title: 'Assessment label', type: 'string' }),
        defineField({
          name: 'scores',
          title: 'Scores',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'heProfileScore',
              fields: [
                defineField({ name: 'sn', title: 'Score name', type: 'string' }),
                defineField({ name: 'w', title: 'Bar width (0-100)', type: 'number' }),
                defineField({ name: 'sp', title: 'Score label', type: 'string' }),
              ],
              preview: { select: { title: 'sn', subtitle: 'sp' } },
            }),
          ],
        }),
        defineField({ name: 'openTitle', title: 'Open title', type: 'string' }),
        defineField({ name: 'openBtn', title: 'Open button', type: 'string' }),
        imageField('image', 'Avatar photo'),
      ],
    }),
    defineField({ name: 'tour', title: 'Tour link label', type: 'string' }),
    defineField({ name: 'modalStrong', title: 'Modal heading', type: 'string' }),
    defineField({ name: 'modalBody', title: 'Modal body', type: 'text', rows: 3 }),
    defineField({
      name: 'tourVideoUrl',
      title: 'Tour video URL (YouTube / Vimeo / Loom)',
      type: 'url',
      description: 'Paste a YouTube, Vimeo or Loom link to make the 90-second tour play a real video. Empty keeps the placeholder.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    imageField('tourPoster', 'Tour poster / thumbnail'),
  ],
})

const proofSection = defineField({
  name: 'proof',
  title: 'Proof',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'stat', title: 'Stat', type: 'string' }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 4 }),
    defineField({ name: 'whoName', title: 'Author name', type: 'string' }),
    defineField({ name: 'whoRole', title: 'Author role', type: 'string' }),
    imageField('whoImage', 'Author photo'),
    imageSlot('sideImg', 'Side photo'),
    defineField({
      name: 'mini',
      title: 'Mini stat',
      type: 'object',
      fields: [
        defineField({ name: 'n', title: 'Number line', type: 'string' }),
        defineField({ name: 'l', title: 'Label', type: 'string' }),
      ],
    }),
    imageSlot('visitImg', 'Visit photo'),
    defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
  ],
})

const priceSection = defineField({
  name: 'price',
  title: 'Pricing',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'roleLabel', title: 'Role field label', type: 'string' }),
    defineField({ name: 'regionLabel', title: 'Region field label', type: 'string' }),
    defineField({ name: 'senLabel', title: 'Seniority field label', type: 'string' }),
    // Calculator lookup keys - seeded + hidden; spliced from code by the transform.
    defineField({ name: 'roleOptions', title: 'Role options', type: 'array', of: [{ type: 'string' }], hidden: true }),
    defineField({ name: 'regionOptions', title: 'Region options', type: 'array', of: [{ type: 'string' }], hidden: true }),
    defineField({ name: 'senOptions', title: 'Seniority options', type: 'array', of: [{ type: 'string' }], hidden: true }),
    defineField({ name: 'outLabel', title: 'Output label', type: 'string' }),
    defineField({ name: 'initialCost', title: 'Initial cost', type: 'string' }),
    defineField({ name: 'per', title: 'Cost suffix', type: 'string' }),
    defineField({ name: 'vsLabel', title: 'Comparison label', type: 'string' }),
    defineField({ name: 'initialSave', title: 'Initial saving', type: 'string' }),
    defineField({ name: 'cta', title: 'CTA', type: 'string' }),
    defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
  ],
})

const findSection = defineField({
  name: 'find',
  title: 'Find your engineer form',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'h2Lead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'h2Em', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'lead', title: 'Lead paragraph', type: 'text', rows: 2 }),
    defineField({
      name: 'stepper',
      title: 'Stepper',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heStepperItem',
          fields: [
            defineField({ name: 'num', title: 'Number', type: 'string' }),
            defineField({ name: 'lbl', title: 'Label', type: 'string' }),
          ],
          preview: { select: { title: 'lbl', subtitle: 'num' } },
        }),
      ],
    }),
    stepQuestion('step0', 'Step 1 (role)'),
    stepQuestion('step1', 'Step 2 (skills)'),
    stepQuestion('step2', 'Step 3 (team size)'),
    defineField({
      name: 'step3',
      title: 'Step 4 (match result)',
      type: 'object',
      fields: [
        defineField({ name: 'q', title: 'Question', type: 'string' }),
        defineField({ name: 'hint', title: 'Hint', type: 'string' }),
        defineField({ name: 'per', title: 'Rate suffix', type: 'string' }),
        defineField({
          name: 'matches',
          title: 'Matches',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'heMatch',
              fields: [
                defineField({ name: 'ftag', title: 'Placeholder tag', type: 'string' }),
                defineField({ name: 'nm', title: 'Name', type: 'string' }),
                defineField({ name: 'rl', title: 'Role line', type: 'string' }),
                defineField({ name: 'rate', title: 'Rate', type: 'string' }),
                imageField('image', 'Photo'),
              ],
              preview: { select: { title: 'nm', subtitle: 'rl', media: 'image' } },
            }),
          ],
        }),
        defineField({ name: 'cta', title: 'CTA', type: 'string' }),
      ],
    }),
    defineField({ name: 'footTrust', title: 'Footer trust chips', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'back', title: 'Back label', type: 'string' }),
    defineField({ name: 'next', title: 'Next label', type: 'string' }),
    imageSlot('img', 'Form-side photo'),
    defineField({ name: 'talkLabel', title: 'Talk label', type: 'string' }),
    defineField({ name: 'talkAi', title: 'AI pill label', type: 'string' }),
    defineField({ name: 'talkBook', title: 'Book pill label', type: 'string' }),
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
    defineField({ name: 'sub', title: 'Sub line', type: 'string' }),
  ],
})

export default defineType({
  name: 'hireEngineersPage',
  title: 'Hire Engineers Page',
  type: 'document',
  description: 'Singleton for /services/software-engineers. Bespoke landing template shape.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'Hire Engineers Page',
      readOnly: true,
      hidden: true,
    }),
    ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),
    ...[
      heroSection,
      offerSection,
      rolesSection,
      howSection,
      vetSection,
      proofSection,
      priceSection,
      findSection,
      finalSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'Hire Engineers Page' }),
  },
})
