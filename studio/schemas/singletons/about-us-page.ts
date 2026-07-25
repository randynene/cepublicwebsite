import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// aboutUsPage singleton (route /about-us + /uk/about-us).
//
// Bespoke shape (Our Work pattern) — NOT the generic defineStaticPage shell.
// Page copy + stats + founder image live here. Team grid, values, reviews, and
// trusted-by logos are queried from their own documents (teamMember /
// benefitValue / review / customerStory) so editing a person edits the grid.
//
// Seeded by scripts/static/seed-about-us-page.ts. Do NOT re-run generic
// capture-marketing for aboutUsPage (it skips CMS card grids on purpose).

const statMember = defineArrayMember({
  type: 'object',
  name: 'auStat',
  title: 'Stat',
  fields: [
    defineField({ name: 'value', title: 'Big number', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
  preview: { select: { title: 'value', subtitle: 'label' } },
})

export default defineType({
  name: 'aboutUsPage',
  title: 'About Us Page',
  type: 'document',
  description: 'Singleton for /about-us. Bespoke About Us template — team/values/reviews from their own docs.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'About Us Page',
      readOnly: true,
      hidden: true,
    }),
    ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
        defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
        defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
        defineField({
          name: 'ctaHref',
          title: 'CTA link',
          type: 'string',
          description: 'Path on this site, e.g. /book-a-call',
          initialValue: '/book-a-call',
        }),
      ],
    }),
    defineField({
      name: 'trusted',
      title: 'Trusted by',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'pre', title: 'Text before highlight', type: 'string' }),
        defineField({ name: 'highlight', title: 'Highlight (lime)', type: 'string' }),
        defineField({ name: 'post', title: 'Text after highlight', type: 'string' }),
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      group: 'content',
      of: [statMember],
    }),
    { ...imageField('founderImage', 'Founder / story image'), group: 'content' },
    defineField({
      name: 'story',
      title: 'Our story',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
        defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 5 }),
      ],
    }),
    defineField({
      name: 'team',
      title: 'Team section',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      description: 'Heading only — people come from teamMember docs (hideFromTeamAboutPage respected).',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
        defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'values',
      title: 'Values section',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      description: 'Heading only — cards come from benefitValue docs with category = values.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
        defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'reviews',
      title: 'Reviews section',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      description: 'Heading only — cards come from review docs.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
        defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'midCta',
      title: 'Mid CTA',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
        defineField({
          name: 'ctaHref',
          title: 'CTA link',
          type: 'string',
          initialValue: '/book-a-call',
        }),
        defineField({ name: 'micro', title: 'Microcopy', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'About Us Page' }),
  },
})
