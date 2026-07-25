import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// homePage singleton (route /). Bespoke shape mirroring the 14-section
// "Cloud Employee Home DARK V2" design. Every section is a nested object so
// the schema, the GROQ projection, and the site-side mapper stay 1:1 with the
// template's HomeContent shape. All copy is plain string/text (the template
// renders it verbatim); all photos/logos are Sanity image assets so Seb can
// swap them in Studio. Seeded by scripts/static/seed-home-page.ts.
//
// Design source: docs/raw-html/Home.html + docs/raw-html-pdf/Home Page.pdf.
// Author-voice rule (no em/en dashes) is enforced at seed time.

// ── Reusable array-member object shapes ─────────────────────────────────

const statMember = defineArrayMember({
  type: 'object',
  name: 'stat',
  title: 'Stat',
  fields: [
    defineField({ name: 'value', title: 'Value', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
  ],
  preview: { select: { title: 'value', subtitle: 'label' } },
})

const profileMember = defineArrayMember({
  type: 'object',
  name: 'profile',
  title: 'Engineer profile',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'flag', title: 'Flag emoji', type: 'string' }),
    defineField({ name: 'tags', title: 'Skill tags', type: 'array', of: [{ type: 'string' }] }),
    imageField('image', 'Photo'),
    defineField({
      name: 'objectPosition',
      title: 'Photo crop position',
      type: 'string',
      description: 'CSS object-position for the hero-card crop (e.g. "center"). Defaults to center.',
      initialValue: 'center',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
})

const whereWeWorkHubMember = defineArrayMember({
  type: 'object',
  name: 'whereWeWorkHub',
  title: 'Hub',
  fields: [
    defineField({ name: 'name', title: 'Hub name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      validation: (R) => R.required(),
      description: 'Path on this site, e.g. /services/latam-developers',
    }),
    imageField('image', 'Photo'),
    defineField({
      name: 'imageUrl',
      title: 'Photo URL (fallback)',
      type: 'url',
      description: 'Used only when Photo asset is empty (e.g. temporary placeholder).',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'href', media: 'image' } },
})

const logoMember = defineArrayMember({
  type: 'object',
  name: 'logo',
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
      description: 'Rendered max-height in the trusted-by strip. Defaults to 22 if empty.',
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

// ── Section objects ─────────────────────────────────────────────────────

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({
      name: 'paragraphLines',
      title: 'Paragraph (one line per array item)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'primaryCta', title: 'Primary CTA', type: 'string' }),
    defineField({ name: 'secondaryCta', title: 'Secondary CTA', type: 'string' }),
    defineField({ name: 'bottomPills', title: 'Bottom pills', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'floatingPills', title: 'Floating pills', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'profiles',
      title: 'Hero slideshow profiles',
      type: 'array',
      of: [profileMember],
      description:
        'Auto-cycling “matched engineer” card on desktop (and the lead photo on mobile). Order = slideshow order.',
    }),
  ],
})

const whereWeWorkSection = defineField({
  name: 'whereWeWork',
  title: 'Where we work',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'paragraph', title: 'Paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'hubs', title: 'Hubs', type: 'array', of: [whereWeWorkHubMember] }),
  ],
})

const trustedBySection = defineField({
  name: 'trustedBy',
  title: 'Trusted by',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'labelLine1', title: 'Label line 1', type: 'string' }),
    defineField({ name: 'labelLine2', title: 'Label line 2', type: 'string' }),
    defineField({ name: 'logos', title: 'Logos', type: 'array', of: [logoMember] }),
  ],
})

const clientStorySection = defineField({
  name: 'clientStory',
  title: 'Client story',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({
      name: 'quoteLines',
      title: 'Quote (one line per array item)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    imageField('avatar', 'Avatar'),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        imageField('image', 'Logo'),
      ],
    }),
  ],
})

const reasonFields = [
  defineField({ name: 'title', title: 'Title', type: 'string' }),
  defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
  defineField({
    name: 'icon',
    title: 'Icon',
    type: 'string',
    options: { list: ['spark', 'user', 'pin', 'shield'] },
  }),
  defineField({ name: 'proof', title: 'Proof line (optional)', type: 'string' }),
]

const whyDifferentSection = defineField({
  name: 'whyDifferent',
  title: 'Why different',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'paragraph', title: 'Paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'lead', title: 'Lead reason', type: 'object', fields: reasonFields }),
    imageField('leadImage', 'Lead image'),
    defineField({
      name: 'reasons',
      title: 'Reasons',
      type: 'array',
      of: [{ type: 'object', name: 'reason', fields: reasonFields, preview: { select: { title: 'title' } } }],
    }),
  ],
})

const processSection = defineField({
  name: 'process',
  title: 'Process',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'step',
          fields: [
            defineField({ name: 'number', title: 'Number', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
            defineField({ name: 'cta', title: 'CTA line', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'number' } },
        },
      ],
    }),
    defineField({
      name: 'video',
      title: 'Video card',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        defineField({ name: 'roleLine', title: 'Role line', type: 'string' }),
        defineField({ name: 'caption', title: 'Caption', type: 'string' }),
        defineField({ name: 'subtitle', title: 'Subtitle', type: 'string' }),
        defineField({ name: 'cta', title: 'CTA', type: 'string' }),
        imageField('poster', 'Poster image'),
        defineField({
          name: 'videoUrl',
          title: 'Video URL',
          type: 'url',
          description: 'YouTube/Vimeo/Loom/mp4. Leave empty for a static poster.',
          validation: (R) => R.uri({ scheme: ['http', 'https'] }),
        }),
      ],
    }),
  ],
})

const testimonialsSection = defineField({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 4 }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'role', title: 'Role', type: 'string' }),
            defineField({
              name: 'logo',
              title: 'Logo',
              type: 'object',
              fields: [
                defineField({ name: 'name', title: 'Name', type: 'string' }),
                imageField('image', 'Logo'),
              ],
            }),
            imageField('image', 'Photo'),
            defineField({ name: 'stats', title: 'Stats', type: 'array', of: [statMember] }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
        },
      ],
    }),
  ],
})

const includedSection = defineField({
  name: 'included',
  title: "What's included",
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({
      name: 'you',
      title: 'You column',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'string' }] }),
      ],
    }),
    defineField({
      name: 'us',
      title: 'Us column',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'string' }] }),
      ],
    }),
    defineField({ name: 'footnote', title: 'Footnote', type: 'text', rows: 2 }),
  ],
})

const calculatorSection = defineField({
  name: 'calculator',
  title: 'Pricing calculator',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({
      name: 'fields',
      title: 'Fields',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'calcField',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'value', title: 'Value', type: 'string' }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        },
      ],
    }),
    defineField({ name: 'resultLabel', title: 'Result label', type: 'string' }),
    defineField({ name: 'price', title: 'Price', type: 'string' }),
    defineField({ name: 'priceSuffix', title: 'Price suffix', type: 'string' }),
    defineField({ name: 'comparison', title: 'Comparison', type: 'string' }),
    defineField({ name: 'saving', title: 'Saving', type: 'string' }),
    defineField({ name: 'badgeSave', title: 'Badge (save)', type: 'string' }),
    defineField({ name: 'badgeSub', title: 'Badge (sub)', type: 'string' }),
    defineField({ name: 'cta', title: 'CTA', type: 'string' }),
    defineField({ name: 'footnote', title: 'Footnote', type: 'text', rows: 2 }),
  ],
})

const realEngineersSection = defineField({
  name: 'realEngineers',
  title: 'Real engineers',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'badge', title: 'Badge', type: 'string' }),
    defineField({ name: 'profiles', title: 'Profiles', type: 'array', of: [profileMember] }),
  ],
})

const readyToFindSection = defineField({
  name: 'readyToFind',
  title: 'Ready to find (matcher)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'paragraph', title: 'Paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'steps', title: 'Step labels', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'question', title: 'Question', type: 'string' }),
    defineField({ name: 'questionSub', title: 'Question sub', type: 'string' }),
    defineField({ name: 'roles', title: 'Roles', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'bottomPills', title: 'Bottom pills', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'nextLabel', title: 'Next label', type: 'string' }),
    defineField({
      name: 'matching',
      title: 'Matching panel',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'unlocks', title: 'Unlocks', type: 'string' }),
        defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
        defineField({ name: 'stats', title: 'Stats', type: 'array', of: [statMember] }),
      ],
    }),
    defineField({ name: 'talkPrompt', title: 'Talk prompt', type: 'string' }),
    defineField({ name: 'talkCtas', title: 'Talk CTAs', type: 'array', of: [{ type: 'string' }] }),
  ],
})

const locationsSection = defineField({
  name: 'locations',
  title: 'Locations',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'placeholder', title: 'Placeholder label', type: 'string' }),
    defineField({ name: 'cards', title: 'Card labels', type: 'array', of: [{ type: 'string' }] }),
  ],
})

const faqSection = defineField({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent)', type: 'string' }),
    defineField({ name: 'fallbackLabel', title: 'Fallback label', type: 'string' }),
    defineField({ name: 'fallbackBody', title: 'Fallback body', type: 'text', rows: 2 }),
    defineField({ name: 'fallbackCta', title: 'Fallback CTA', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faqEntry',
          fields: [
            defineField({ name: 'number', title: 'Number', type: 'string' }),
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'question', subtitle: 'number' } },
        },
      ],
    }),
  ],
})

export default defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  description: 'Singleton for /. Bespoke 14-section home template shape.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'Home Page',
      readOnly: true,
      hidden: true,
    }),
    // SEO
    ...metaFields().map((f) => ({ ...f, group: 'seo' })),
    // Content sections
    ...[
      heroSection,
      trustedBySection,
      clientStorySection,
      whyDifferentSection,
      processSection,
      testimonialsSection,
      includedSection,
      calculatorSection,
      realEngineersSection,
      readyToFindSection,
      whereWeWorkSection,
      locationsSection,
      faqSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'Home Page' }),
  },
})
