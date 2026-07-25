// Factory functions for the four singleton shapes in
// MYGRATR_SCHEMA_DESIGN_DECISIONS §4.1-§4.4 and §5. Every singleton lives
// in its own file but delegates its schema shape to one of these factories
// to keep cross-cutting fields (hero, meta, sections) consistent.
import {
  defineField,
  defineType,
  type FieldDefinition,
  type SchemaTypeDefinition,
} from 'sanity'

import { imageField, localeField, metaFields } from '../_shared'

function heroFields(opts: { description?: 'required' | 'optional' } = {}): FieldDefinition[] {
  const heroDescription =
    opts.description === 'required'
      ? defineField({
          name: 'heroDescription',
          title: 'Hero description',
          type: 'portableText',
          validation: (Rule) => Rule.required(),
        })
      : defineField({
          name: 'heroDescription',
          title: 'Hero description',
          type: 'portableText',
        })
  return [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
    heroDescription,
    imageField('heroImage', 'Hero image'),
  ]
}

// Hubs carry FAQs on the live site, and until now only the calculator pages could
// hold them, so every hub FAQ was being dropped on the floor at migration.
//
// That is expensive in a way that is easy to miss. The six Knowledge Hubs
// (/staff-augmentation, /nearshoring-offshoring, ...) are the pages Google sends
// people to, and their FAQ blocks are the part an answer engine can actually quote:
// a direct question with a direct answer. Shipping the hubs without them keeps the
// rankings and loses the thing the rankings were for.
//
// Rendering these emits FAQPage JSON-LD, which is why they are structured items
// rather than a slab of rich text: a heading followed by a paragraph is invisible
// to a crawler looking for a question and an answer.
function hubFaqField(): FieldDefinition[] {
  return [
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description: 'Rendered at the foot of the hub and emitted as FAQPage JSON-LD.',
      validation: (Rule) => Rule.max(20),
    }),
  ]
}

// §4.1 — Blog hub (7 total: blogHub + 6 category hubs)
export function defineBlogHub(opts: {
  name: string
  title: string
  route: string
}): SchemaTypeDefinition {
  return defineType({
    name: opts.name,
    title: opts.title,
    type: 'document',
    description: `Singleton for ${opts.route}. Blog hub shape per §4.1.`,
    fields: [
      ...heroFields({ description: 'required' }),
      // Five, not two.
      //
      // The D3 hub design lays the featured block out as ONE large card plus FOUR
      // small ones down the side. The schema capped it at two, which was set before
      // the design existed, so a faithful build was impossible without noticing this
      // first - and "noticing" would otherwise have meant a template quietly
      // rendering three fewer cards than the design shows.
      defineField({
        name: 'featuredArticles',
        title: 'Featured articles',
        type: 'array',
        of: [{ type: 'reference', to: [{ type: 'blogPost' }] }],
        description:
          'Up to 5. The first is the large hero card; the rest fill the four smaller cards beside it.',
        validation: (Rule) => Rule.max(5),
      }),
      defineField({ name: 'introContent', title: 'Intro content', type: 'portableText' }),
      defineField({
        name: 'topicsHeader',
        title: 'Topics header',
        type: 'string',
        description: 'e.g. "Latest in the Scaling Teams Hub"',
        validation: (Rule) => Rule.max(200),
      }),
      ...hubFaqField(),
      ...metaFields(),
    ],
  })
}

// §4.2 & §4.3 — Resource and collection-index hubs
// Each hub specifies which document type(s) its featuredItems array references.
export function defineCollectionHub(opts: {
  name: string
  title: string
  route: string
  featuredTypes: string[]
  descriptionRequired?: boolean
}): SchemaTypeDefinition {
  return defineType({
    name: opts.name,
    title: opts.title,
    type: 'document',
    description: `Singleton for ${opts.route}. Collection hub shape per §4.2/§4.3.`,
    fields: [
      ...heroFields({ description: opts.descriptionRequired ? 'required' : 'optional' }),
      // Five, matching defineBlogHub: the D3 hub design's featured block is one
      // large card plus four small ones. See the note there.
      defineField({
        name: 'featuredItems',
        title: 'Featured items',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: opts.featuredTypes.map((t) => ({ type: t })),
          },
        ],
        description:
          'Up to 5. The first is the large hero card; the rest fill the four smaller cards beside it.',
        validation: (Rule) => Rule.max(5),
      }),
      defineField({ name: 'introContent', title: 'Intro content', type: 'portableText' }),
      ...hubFaqField(),
      ...metaFields(),
    ],
  })
}

// §4.4 — Static content singleton (sections array + locale)
export function defineStaticPage(opts: {
  name: string
  title: string
  route: string
  description?: string
}): SchemaTypeDefinition {
  return defineType({
    name: opts.name,
    title: opts.title,
    type: 'document',
    description: opts.description ?? `Singleton for ${opts.route}. Static content shape per §4.4.`,
    fields: [
      ...heroFields(),
      defineField({
        name: 'calendlyUrl',
        title: 'Calendly booking widget',
        type: 'url',
        description:
          'Renders an inline Calendly booking widget below the hero. Every post-conversion page (/book-a-call, the thank-you pages, /contact) carries one on the live site, and on /book-a-call it IS the page: a headline over a booking widget and no prose at all.',
      }),
      defineField({
        name: 'sections',
        title: 'Sections',
        type: 'array',
        of: [
          { type: 'richTextSection' },
          { type: 'twoColumnSection' },
          { type: 'ctaSection' },
          { type: 'imageSection' },
          { type: 'videoSection' },
          { type: 'testimonialSection' },
          { type: 'benefitsGrid' },
          { type: 'staffBenefitsGrid' },
          { type: 'glassdoorGrid' },
          { type: 'customerStoriesGrid' },
          { type: 'faqSection' },
          { type: 'hubspotFormSection' },
        ],
        // Optional: SCHEMA-1 stubs seeded without sections, which blocked
        // Publish for Seb (Home Page meta is filled; sections was null).
        // Templates treat missing/empty sections as "render nothing".
      }),
      ...metaFields(),
      localeField(),
    ],
  })
}

// §5 — Tier 3 calculator page (marketing copy wrapper for hardcoded calc logic)
export function defineCalculatorPage(opts: {
  name: string
  title: string
  route: string
}): SchemaTypeDefinition {
  return defineType({
    name: opts.name,
    title: opts.title,
    type: 'document',
    description: `Singleton for ${opts.route}. Marketing copy only — calculator logic is hardcoded in Next.js (§5).`,
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: (Rule) => Rule.required().max(200),
      }),
      defineField({
        name: 'eyebrow',
        title: 'Eyebrow',
        type: 'string',
        validation: (Rule) => Rule.max(160),
      }),
      defineField({ name: 'heroDescription', title: 'Hero description', type: 'portableText' }),
      defineField({
        name: 'belowCalculatorContent',
        title: 'Below-calculator content',
        type: 'portableText',
      }),
      defineField({
        name: 'faqs',
        title: 'FAQs',
        type: 'array',
        of: [{ type: 'faqItem' }],
        validation: (Rule) => Rule.max(10),
      }),
      // The rate card the calculator runs on.
      //
      // In Sanity, not in code, because these are market salary figures with a year
      // on them. They will be out of date within twelve months, and the person who
      // notices is Seb, not a developer. A calculator quoting stale salaries is
      // worse than no calculator: it is confidently wrong in public, on the page
      // CE uses to argue about money.
      //
      // The formulas stay in code (they are tax law, not editorial), the numbers
      // live here. See site/src/lib/calculators/price-comparison.ts.
      defineField({
        name: 'rates',
        title: 'Rate card',
        type: 'array',
        of: [{ type: 'calculatorRate' }],
        description:
          'One row per region and seniority. Drives the in-house vs Cloud Employee comparison.',
      }),
      ...metaFields(),
    ],
  })
}
