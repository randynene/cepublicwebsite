import { defineArrayMember, defineField, defineType } from 'sanity'

import { imageField, metaFields } from '../_shared'

// ourWorkPage singleton (route /our-work + /uk/our-work). Bespoke shape mirroring
// the template's OurWorkContent (site/src/components/templates/our-work/content.ts).
//
// RECONCILE (23 Jul 2026, Jake request): this singleton used to be the generic
// defineStaticPage (title + body sections + meta), which the /our-work route never
// read - the page rendered from static code instead. It is now a bespoke shape so
// Seb can edit every headline, stat number and caption in Studio, and drop real
// photos into the three decorative "customer photo" tiles.
//
// WHAT IS HERE vs NOT: the customer stories, the logo marquee, the reviews and the
// bento image/video grid are Sanity-driven from their OWN documents (customer story
// + review docs) and are NOT part of this singleton - editing a story edits the
// grid. This singleton holds only the page's fixed copy, the editable stat numbers,
// and the 3 optional decorative photo tiles (stat strip, beyond-hiring, mid CTA).
// Each photo is optional - empty falls back to the striped placeholder, so nothing
// breaks before upload.
//
// NOT in the schema (code-owned, spliced on the site side): the internal link
// targets (ctaHref) and the small UI labels. They are structural routes / furniture,
// not editorial copy, and are kept out of Studio so they cannot be broken.
//
// Seeded by scripts/static/seed-our-work-page.ts. Author-voice rule (no em/en
// dashes) is enforced at seed time. Do NOT re-run the generic capture for
// ourWorkPage (removed from scripts/content/capture-marketing-pages.ts).

const statMember = defineArrayMember({
  type: 'object',
  name: 'owStat',
  title: 'Stat',
  fields: [
    defineField({ name: 'value', title: 'Big number', type: 'string' }),
    defineField({ name: 'lead', title: 'Lead word (in lime)', type: 'string' }),
    defineField({ name: 'rest', title: 'Rest of caption', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'value', subtitle: 'lead' } },
})

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'titleRest', title: 'Heading (rest)', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
  ],
})

const trustedSection = defineField({
  name: 'trusted',
  title: 'Trusted by',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'pre', title: 'Text before highlight', type: 'string' }),
    defineField({ name: 'highlight', title: 'Highlight (in lime)', type: 'string' }),
    defineField({ name: 'post', title: 'Text after highlight', type: 'string' }),
  ],
})

const impactSection = defineField({
  name: 'impact',
  title: 'Customer impact',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
  ],
})

const beyondHiringSection = defineField({
  name: 'beyondHiring',
  title: 'Impact beyond hiring',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'headingLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'headingAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({
      name: 'stats1525',
      title: 'Stat: EBITDA increase',
      type: 'object',
      fields: [
        defineField({ name: 'value', title: 'Big number', type: 'string' }),
        defineField({ name: 'lead', title: 'Lead word (in lime)', type: 'string' }),
        defineField({ name: 'rest', title: 'Rest of caption', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'rating',
      title: 'Stat: satisfaction rating',
      type: 'object',
      description: 'The 4.8/5 number itself comes from the Glassdoor data - only the caption is editable here.',
      fields: [
        defineField({ name: 'lead', title: 'Lead word (in lime)', type: 'string' }),
        defineField({ name: 'rest', title: 'Rest of caption', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'stats300',
      title: 'Stat: tech businesses',
      type: 'object',
      fields: [
        defineField({ name: 'value', title: 'Big number', type: 'string' }),
        defineField({ name: 'lead', title: 'Lead word (in lime)', type: 'string' }),
        defineField({ name: 'rest', title: 'Rest of caption', type: 'text', rows: 2 }),
      ],
    }),
    imageField('photo', 'Photo tile'),
  ],
})

const reviewsSection = defineField({
  name: 'reviews',
  title: 'Reviews heading',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'headingLead', title: 'Heading (lead)', type: 'string' }),
    defineField({ name: 'headingAccent', title: 'Heading (accent)', type: 'string' }),
    defineField({ name: 'headingRest', title: 'Heading (rest)', type: 'string' }),
  ],
})

const midCtaSection = defineField({
  name: 'midCta',
  title: 'Mid-page CTA',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
    defineField({ name: 'micro', title: 'Micro copy', type: 'text', rows: 2 }),
    imageField('photo', 'Photo tile'),
  ],
})

export default defineType({
  name: 'ourWorkPage',
  title: 'Our Work',
  type: 'document',
  description:
    'Singleton for /our-work. NOT redundant with /customer-stories: Search Console has /our-work at position 4.2 on 1,825 impressions, against 12.9 for the hub it resembles. It outranks it. Do not merge the two.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'Our Work',
      readOnly: true,
      hidden: true,
    }),
    // SEO
    ...metaFields({ og: false }).map((f) => ({ ...f, group: 'seo' })),
    // Content sections
    ...[heroSection, trustedSection].map((f) => ({ ...f, group: 'content' })),
    { ...defineField({ name: 'statsPrimary', title: 'Primary stats', type: 'array', of: [statMember] }), group: 'content' },
    { ...imageField('statsPhoto', 'Photo tile (stat strip)'), group: 'content' },
    ...[impactSection, beyondHiringSection, reviewsSection, midCtaSection].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'Our Work' }),
  },
})
