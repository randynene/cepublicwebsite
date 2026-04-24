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
      defineField({
        name: 'featuredArticles',
        title: 'Featured articles',
        type: 'array',
        of: [{ type: 'reference', to: [{ type: 'blogPost' }] }],
        validation: (Rule) => Rule.max(2),
      }),
      defineField({ name: 'introContent', title: 'Intro content', type: 'portableText' }),
      defineField({
        name: 'topicsHeader',
        title: 'Topics header',
        type: 'string',
        description: 'e.g. "Latest in the Scaling Teams Hub"',
        validation: (Rule) => Rule.max(200),
      }),
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
        validation: (Rule) => Rule.max(2),
      }),
      defineField({ name: 'introContent', title: 'Intro content', type: 'portableText' }),
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
        validation: (Rule) => Rule.required().min(1),
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
      ...metaFields(),
    ],
  })
}
