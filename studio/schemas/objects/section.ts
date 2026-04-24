import { defineField, defineType } from 'sanity'

// 12 polymorphic section variants per MYGRATR_SCHEMA_DESIGN_DECISIONS §4.4.
// Each variant is an `object` type referenced from a static singleton's
// `sections: array[section]` field via defineArrayMember({type: 'xxxSection'}).

const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Rich text section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'content',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Rich text' }) },
})

const twoColumnSection = defineType({
  name: 'twoColumnSection',
  title: 'Two-column section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({ name: 'leftContent', type: 'portableText', validation: (Rule) => Rule.required() }),
    defineField({ name: 'rightContent', type: 'portableText', validation: (Rule) => Rule.required() }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Two columns' }) },
})

const ctaSection = defineType({
  name: 'ctaSection',
  title: 'CTA section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.required().max(200) }),
    defineField({ name: 'description', type: 'text', validation: (Rule) => Rule.max(400) }),
    defineField({ name: 'buttonText', type: 'string', validation: (Rule) => Rule.required().max(60) }),
    defineField({ name: 'buttonLink', type: 'url', validation: (Rule) => Rule.required() }),
  ],
  preview: { select: { title: 'heading', subtitle: 'buttonText' } },
})

const imageSection = defineType({
  name: 'imageSection',
  title: 'Image section',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'caption', type: 'string', validation: (Rule) => Rule.max(300) }),
  ],
  preview: { select: { title: 'caption', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'Image', media }) },
})

const videoSection = defineType({
  name: 'videoSection',
  title: 'Video section',
  type: 'object',
  fields: [
    defineField({ name: 'videoUrl', type: 'url', validation: (Rule) => Rule.required() }),
    defineField({ name: 'caption', type: 'string', validation: (Rule) => Rule.max(300) }),
  ],
  preview: { select: { title: 'caption', subtitle: 'videoUrl' }, prepare: ({ title, subtitle }) => ({ title: title || 'Video', subtitle }) },
})

const testimonialSection = defineType({
  name: 'testimonialSection',
  title: 'Testimonial section',
  type: 'object',
  fields: [
    defineField({
      name: 'review',
      type: 'reference',
      to: [{ type: 'review' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'review.nameClient' }, prepare: ({ title }) => ({ title: title ? `Testimonial: ${title}` : 'Testimonial' }) },
})

const benefitsGrid = defineType({
  name: 'benefitsGrid',
  title: 'Benefits grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'benefits',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'benefitValue' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Benefits grid' }) },
})

const staffBenefitsGrid = defineType({
  name: 'staffBenefitsGrid',
  title: 'Staff benefits grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'benefits',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'staffBenefit' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Staff benefits grid' }) },
})

const glassdoorGrid = defineType({
  name: 'glassdoorGrid',
  title: 'Glassdoor reviews grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'reviews',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'glassdoorReview' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Glassdoor grid' }) },
})

const customerStoriesGrid = defineType({
  name: 'customerStoriesGrid',
  title: 'Customer stories grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'stories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'customerStory' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Customer stories grid' }) },
})

const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'faqs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'FAQ' }) },
})

const hubspotFormSection = defineType({
  name: 'hubspotFormSection',
  title: 'HubSpot form section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (Rule) => Rule.max(200) }),
    defineField({
      name: 'formId',
      type: 'string',
      description: 'HubSpot form GUID (e.g. 24f5bd5f-3532-4c4e-908f-1266809bc897)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'portalId',
      type: 'string',
      description: 'Optional override; defaults to siteSettings.hubspotPortalId',
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'formId' }, prepare: ({ title, subtitle }) => ({ title: title || 'HubSpot form', subtitle }) },
})

export const sectionTypes = [
  richTextSection,
  twoColumnSection,
  ctaSection,
  imageSection,
  videoSection,
  testimonialSection,
  benefitsGrid,
  staffBenefitsGrid,
  glassdoorGrid,
  customerStoriesGrid,
  faqSection,
  hubspotFormSection,
] as const

export const SECTION_VARIANT_NAMES = sectionTypes.map((t) => t.name)
