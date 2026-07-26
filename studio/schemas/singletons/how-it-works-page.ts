import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// howItWorksPage singleton (route /how-it-works). Bespoke shape mirroring the
// locked "How It Works" design (docs/raw-html/How It Works.html). Every section
// is a nested object so the schema, the GROQ projection, and the site-side
// mapper stay 1:1 with the template's HiwContent shape. Copy is plain
// string/text (rendered verbatim); photos are Sanity image assets so Seb can
// swap them in Studio. A handful of fields are UI/animation control values,
// not editorial copy - person card tilt (rotate), funnel bar width + highlight,
// testimonial card variant - and are documented as such below.
//
// Seeded by scripts/static/seed-how-it-works-page.ts. Author-voice rule
// (no em/en dashes) is enforced at seed time.

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

// `#chat` is the site-wide token for "open the Clara chat widget". The widget
// has no URL of its own, so the site renders a link to the booking page and
// upgrades the click to open the chat. See site/src/lib/chat.ts.
const CHAT_HREF_HINT = 'A path such as /book-a-call, or #chat to open the AI chat widget.'

const talkCtaMember = defineArrayMember({
  type: 'object',
  name: 'talkCta',
  title: 'Talk CTA',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'href',
      title: 'Destination',
      type: 'string',
      description: CHAT_HREF_HINT,
      validation: (R) => R.required(),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})

const labelValueMember = defineArrayMember({
  type: 'object',
  name: 'labelValue',
  title: 'Field',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'value', title: 'Value', type: 'string' }),
  ],
  preview: { select: { title: 'label', subtitle: 'value' } },
})

// ── Hero ────────────────────────────────────────────────────────────────

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'paragraph', title: 'Paragraph', type: 'text', rows: 2 }),
    defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
    defineField({
      name: 'ctaHref',
      title: 'CTA href',
      type: 'string',
      description: 'Anchor or path. Defaults to the stages anchor (#stages).',
    }),
    defineField({ name: 'bottomPills', title: 'Bottom pills', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'vetted', title: 'Card badge label', type: 'string' }),
    defineField({
      name: 'people',
      title: 'Hero engineer cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'heroPerson',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'role', title: 'Role', type: 'string' }),
            defineField({ name: 'flag', title: 'Flag emoji', type: 'string' }),
            defineField({ name: 'tags', title: 'Skill tags', type: 'array', of: [{ type: 'string' }] }),
            imageField('image', 'Photo'),
            defineField({
              name: 'rotate',
              title: 'Card tilt (degrees)',
              type: 'number',
              description: 'Resting rotation of the card, e.g. 3 or -3. Decorative.',
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
        },
      ],
    }),
  ],
})

// ── Stages ──────────────────────────────────────────────────────────────

const stagesSection = defineField({
  name: 'stages',
  title: 'The four stages',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Stages',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'stage',
          fields: [
            defineField({ name: 'stage', title: 'Stage label', type: 'string', description: 'e.g. "Stage 1"' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
            defineField({ name: 'checks', title: 'Check items', type: 'array', of: [{ type: 'string' }] }),
            imageField('image', 'Photo (stages 2 & 3 only)', { altRequired: false }),
          ],
          preview: { select: { title: 'title', subtitle: 'stage', media: 'image' } },
        },
      ],
    }),
    // Stage 1 illustrative "Matching Brief" scoping card.
    defineField({
      name: 'brief',
      title: 'Stage 1 - Matching Brief card',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'status', title: 'Status line', type: 'string' }),
        defineField({ name: 'timer', title: 'Timer', type: 'string' }),
        defineField({ name: 'role', title: 'Role', type: 'string' }),
        defineField({ name: 'scopedBy', title: 'Scoped-by line', type: 'string' }),
        defineField({ name: 'stackLabel', title: 'Stack label', type: 'string' }),
        defineField({ name: 'stack', title: 'Stack chips', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'fields', title: 'Fields', type: 'array', of: [labelValueMember] }),
        defineField({ name: 'searchingNote', title: 'Searching note', type: 'string' }),
        defineField({ name: 'resultNote', title: 'Result note', type: 'string' }),
      ],
    }),
    // Stage 2 illustrative funnel.
    defineField({
      name: 'funnel',
      title: 'Stage 2 - Funnel card',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'funnelRow',
              fields: [
                defineField({ name: 'label', title: 'Label', type: 'string' }),
                defineField({ name: 'value', title: 'Value (count-up target)', type: 'string' }),
                defineField({
                  name: 'barWidth',
                  title: 'Bar width (CSS)',
                  type: 'string',
                  description: 'Decorative bar-fill width, e.g. "68%". Not shown as text.',
                }),
                defineField({
                  name: 'highlight',
                  title: 'Highlight (lime)',
                  type: 'boolean',
                  description: 'Highlights the final matched row in lime.',
                }),
              ],
              preview: { select: { title: 'label', subtitle: 'value' } },
            },
          ],
        }),
      ],
    }),
    // Stage 4 illustrative "Everything, handled" checklist card.
    defineField({
      name: 'handled',
      title: 'Stage 4 - Everything handled card',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'status', title: 'Status pill', type: 'string' }),
        defineField({
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'handledRow',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'sub', title: 'Sub', type: 'string' }),
              ],
              preview: { select: { title: 'title', subtitle: 'sub' } },
            },
          ],
        }),
        defineField({ name: 'footnote', title: 'Footnote', type: 'string' }),
        defineField({ name: 'footprint', title: 'Footprint line', type: 'string' }),
      ],
    }),
    // Stage 4 outcome stats strip.
    defineField({ name: 'stats', title: 'Outcome stats', type: 'array', of: [statMember] }),
  ],
})

// ── De-risk marquee ─────────────────────────────────────────────────────

const deRiskSection = defineField({
  name: 'deRisk',
  title: 'De-risk marquee',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'items', title: 'Marquee items', type: 'array', of: [{ type: 'string' }] }),
  ],
})

// ── Testimonials ────────────────────────────────────────────────────────

const testimonialsSection = defineField({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
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
              name: 'variant',
              title: 'Card variant',
              type: 'string',
              options: { list: ['photo', 'quote'], layout: 'radio' },
              description: 'photo = full-bleed member photo card; quote = solid quote-only card.',
            }),
            imageField('image', 'Photo (photo card) / avatar (quote card)', { altRequired: false }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
        },
      ],
    }),
  ],
})

// ── Matcher (Engineer Match Quiz preview) ───────────────────────────────

const matcherSection = defineField({
  name: 'matcher',
  title: 'Matcher preview',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
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
    defineField({
      name: 'talkCtas',
      title: 'Talk CTAs',
      description: 'The two pills under the matcher card. Each one needs a destination.',
      type: 'array',
      of: [talkCtaMember],
    }),
    defineField({
      name: 'bookHref',
      title: 'Book-a-call href',
      type: 'string',
      description: 'Path for the "Book a call" CTA. Defaults to /book-a-call.',
    }),
  ],
})

// ── FAQ ─────────────────────────────────────────────────────────────────

const faqSection = defineField({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'fallbackLabel', title: 'Fallback label', type: 'string' }),
    defineField({ name: 'fallbackBody', title: 'Fallback body', type: 'text', rows: 2 }),
    defineField({ name: 'fallbackCta', title: 'Fallback CTA label', type: 'string' }),
    defineField({
      name: 'fallbackCtaHref',
      title: 'Fallback CTA destination',
      type: 'string',
      description: CHAT_HREF_HINT,
    }),
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
  name: 'howItWorksPage',
  title: 'How It Works Page',
  type: 'document',
  description: 'Singleton for /how-it-works. Bespoke six-section template shape.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'How It Works Page',
      readOnly: true,
      hidden: true,
    }),
    // SEO
    ...metaFields().map((f) => ({ ...f, group: 'seo' })),
    // Content sections
    ...[
      heroSection,
      stagesSection,
      deRiskSection,
      testimonialsSection,
      matcherSection,
      faqSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'How It Works Page' }),
  },
})
