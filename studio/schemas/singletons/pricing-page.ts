import { defineArrayMember, defineField, defineType } from 'sanity'

import { metaFields } from '../_shared'

// pricingPage singleton (route /pricing). Bespoke shape mirroring the locked
// "/pricing" design (docs/raw-html/Pricing Page 2.dc.html). Every section is a
// nested object so the schema, the GROQ projection, and the site-side mapper
// stay 1:1 with the template's PricingContent shape (site/src/components/
// templates/pricing/content.ts).
//
// THE CALCULATOR SPLIT (docs/design/PRICING_SCHEMA_PROPOSAL.md §1): the numeric
// engine lives in Next.js (cost-calculator.tsx); Sanity owns the BENCHMARK
// INPUTS to it - the region/country monthly ranges, currency rates, and the
// per-engineer breakdown rows - plus all surrounding copy. Editing a benchmark
// in Studio changes the numbers the calculator shows without a deploy.
//
// Seeded by scripts/static/seed-pricing-page.ts. Author-voice rule (no em/en
// dashes) enforced at seed time. Replaces the earlier defineStaticPage stub.

// ── Reusable member shapes ─────────────────────────────────────────────────

const pillMember = defineArrayMember({
  type: 'object',
  name: 'trustPill',
  title: 'Pill',
  fields: [
    defineField({ name: 'value', title: 'Value', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
  ],
  preview: { select: { title: 'value', subtitle: 'label' } },
})

const rangeFields = [
  defineField({ name: 'monthlyLow', title: 'Monthly low (GBP)', type: 'number', validation: (R) => R.required() }),
  defineField({ name: 'monthlyHigh', title: 'Monthly high (GBP)', type: 'number', validation: (R) => R.required() }),
]

const regionMember = defineArrayMember({
  type: 'object',
  name: 'calcRegion',
  title: 'Talent region',
  fields: [
    defineField({ name: 'id', title: 'ID (slug)', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
    ...rangeFields,
  ],
  preview: { select: { title: 'label', subtitle: 'id' } },
})

const countryMember = defineArrayMember({
  type: 'object',
  name: 'calcCountry',
  title: 'Company country',
  fields: [
    defineField({ name: 'id', title: 'ID (slug)', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'flag', title: 'Flag (emoji)', type: 'string' }),
    ...rangeFields,
  ],
  preview: { select: { title: 'label', subtitle: 'id' } },
})

const currencyMember = defineArrayMember({
  type: 'object',
  name: 'calcCurrency',
  title: 'Currency',
  fields: [
    defineField({ name: 'id', title: 'ID (slug)', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'symbol', title: 'Symbol', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'rate', title: 'Rate vs GBP', type: 'number', validation: (R) => R.required() }),
  ],
  preview: { select: { title: 'label', subtitle: 'symbol' } },
})

const benefitMember = defineArrayMember({
  type: 'object',
  name: 'benefitCard',
  title: 'Benefit',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
    defineField({ name: 'icon', title: 'Icon key', type: 'string' }),
  ],
  preview: { select: { title: 'title' } },
})

const faqMember = defineArrayMember({
  type: 'object',
  name: 'pricingFaq',
  title: 'FAQ',
  fields: [
    defineField({ name: 'number', title: 'Number', type: 'string' }),
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (R) => R.required() }),
  ],
  preview: { select: { title: 'question', subtitle: 'number' } },
})

// ── Sections ────────────────────────────────────────────────────────────────

const heroSection = defineField({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'paragraph', title: 'Paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'pills', title: 'Trust pills', type: 'array', of: [pillMember] }),
    defineField({
      name: 'candidate',
      title: 'Candidate card',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        defineField({ name: 'role', title: 'Role', type: 'string' }),
        defineField({ name: 'vettedLabel', title: 'Vetted label', type: 'string' }),
        defineField({ name: 'skills', title: 'Skills', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'flag', title: 'Flag (country code)', type: 'string' }),
        defineField({ name: 'image', title: 'Photo path/URL', type: 'string' }),
        defineField({ name: 'imageAlt', title: 'Photo alt', type: 'string' }),
      ],
    }),
  ],
})

const calculatorSection = defineField({
  name: 'calculator',
  title: 'Calculator',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'devCountLabel', title: 'Developer-count label', type: 'string' }),
    defineField({ name: 'countryPrompt', title: 'Country prompt', type: 'string' }),
    defineField({ name: 'regionPrompt', title: 'Region prompt', type: 'string' }),
    defineField({ name: 'currencyPrompt', title: 'Currency prompt', type: 'string' }),
    defineField({ name: 'ceCardTitle', title: 'CE card title', type: 'string' }),
    defineField({ name: 'ceLogo', title: 'CE logo path/URL', type: 'string' }),
    defineField({ name: 'ceBrand', title: 'CE brand name', type: 'string' }),
    defineField({ name: 'localCardTitlePrefix', title: 'Local card title prefix', type: 'string' }),
    defineField({ name: 'savingsNote', title: 'Savings note', type: 'string' }),
    defineField({ name: 'ceFootnote', title: 'CE footnote', type: 'string' }),
    defineField({ name: 'localFootnote', title: 'Local footnote', type: 'string' }),
    defineField({ name: 'toWord', title: 'Connector: to', type: 'string' }),
    defineField({ name: 'perMonth', title: 'Connector: / month', type: 'string' }),
    defineField({ name: 'thatsPrefix', title: "Connector: That's", type: 'string' }),
    defineField({ name: 'perHourSuffix', title: 'Connector: / hour', type: 'string' }),
    defineField({ name: 'orYearSuffix', title: 'Connector: / year', type: 'string' }),
    defineField({ name: 'saveAvgPrefix', title: 'Savings prefix', type: 'string' }),
    defineField({ name: 'saveAvgYearSuffix', title: 'Savings suffix', type: 'string' }),
    defineField({ name: 'higherCostSuffix', title: 'Higher-cost suffix', type: 'string' }),
    defineField({ name: 'breakdownShowLabel', title: 'Breakdown show label', type: 'string' }),
    defineField({ name: 'breakdownHideLabel', title: 'Breakdown hide label', type: 'string' }),
    defineField({ name: 'breakdownEyebrow', title: 'Breakdown eyebrow', type: 'string' }),
    defineField({ name: 'breakdownIntroPrefix', title: 'Breakdown intro prefix', type: 'string' }),
    defineField({ name: 'breakdownIntroSuffix', title: 'Breakdown intro suffix', type: 'string' }),
    defineField({ name: 'breakdownTotalLabel', title: 'Breakdown total label', type: 'string' }),
    defineField({ name: 'breakdownSavedTemplate', title: 'Breakdown saved template ({amount})', type: 'string' }),
    defineField({ name: 'breakdownCta', title: 'Breakdown CTA label', type: 'string' }),
    defineField({ name: 'breakdownCtaHref', title: 'Breakdown CTA href', type: 'string' }),
    defineField({
      name: 'model',
      title: 'Benchmark model',
      type: 'object',
      description:
        'Benchmark inputs to the calculator engine. All money is GBP per developer per month.',
      fields: [
        defineField({ name: 'regions', title: 'Talent regions', type: 'array', of: [regionMember] }),
        defineField({ name: 'countries', title: 'Company countries', type: 'array', of: [countryMember] }),
        defineField({ name: 'currencies', title: 'Currencies', type: 'array', of: [currencyMember] }),
        defineField({ name: 'breakdownRole', title: 'Breakdown role', type: 'string' }),
        // CE-29 (Aug 2026): `breakdownRows` removed. It itemised base salary,
        // employer taxes, benefits and the Cloud Employee management fee, which
        // published CE's gross margin on an indexable page. The all-in total is
        // now stated directly. Do not reintroduce a per-line split.
        defineField({
          name: 'breakdownTotalAmount',
          title: 'All-in rate (GBP/mo)',
          type: 'number',
          description: 'All-in monthly cost per developer. Stated as a single total, never itemised.',
        }),
        defineField({ name: 'hoursPerMonth', title: 'Hours per month', type: 'number' }),
      ],
    }),
  ],
})

const benefitsSection = defineField({
  name: 'benefits',
  title: 'Benefits',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'cards', title: 'Cards', type: 'array', of: [benefitMember] }),
  ],
})

const fixedFeeSection = defineField({
  name: 'fixedFee',
  title: 'Fixed fee',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'statement', title: 'Statement', type: 'text', rows: 2 }),
    defineField({ name: 'bullets', title: 'Bullets', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'cta', title: 'CTA label', type: 'string' }),
    defineField({ name: 'ctaHref', title: 'CTA href', type: 'string' }),
    defineField({ name: 'disclaimer', title: 'Disclaimer', type: 'text', rows: 6 }),
  ],
})

const deRiskSection = defineField({
  name: 'deRisk',
  title: 'De-risk marquee',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'string' }] }),
  ],
})

const glassdoorSection = defineField({
  name: 'glassdoor',
  title: 'Glassdoor rating',
  type: 'object',
  fields: [
    defineField({ name: 'rating', title: 'Rating', type: 'string' }),
    defineField({ name: 'reviewsLabel', title: 'Reviews label', type: 'string' }),
    defineField({ name: 'logo', title: 'Glassdoor logo path/URL', type: 'string' }),
    defineField({ name: 'wordmark', title: 'Glassdoor wordmark text', type: 'string' }),
  ],
})

const logoMember = defineArrayMember({
  type: 'object',
  name: 'clientLogo',
  title: 'Client logo',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'src', title: 'Logo path/URL', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'height', title: 'Height (px)', type: 'number' }),
  ],
  preview: { select: { title: 'name' } },
})

const logoBarSection = defineField({
  name: 'logoBar',
  title: 'Logo bar',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'logos', title: 'Logos', type: 'array', of: [logoMember] }),
  ],
})

const testimonialSection = defineField({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'titleLead', title: 'Title (lead)', type: 'string' }),
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 3 }),
    defineField({ name: 'stats', title: 'Stats', type: 'array', of: [pillMember] }),
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'companyLogo', title: 'Company logo path/URL', type: 'string' }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (Vimeo / YouTube)',
      type: 'string',
      description: 'Plays muted + looping as the card backdrop, with sound on click.',
    }),
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
    defineField({ name: 'titleAccent', title: 'Title (accent word)', type: 'string' }),
    defineField({ name: 'helpEyebrow', title: 'Help eyebrow', type: 'string' }),
    defineField({ name: 'helpBody', title: 'Help body', type: 'text', rows: 2 }),
    defineField({ name: 'helpCta', title: 'Help CTA label', type: 'string' }),
    defineField({ name: 'helpCtaHref', title: 'Help CTA href', type: 'string' }),
    defineField({ name: 'items', title: 'Items', type: 'array', of: [faqMember] }),
  ],
})

export default defineType({
  name: 'pricingPage',
  title: 'Pricing Page',
  type: 'document',
  description: 'Singleton for /pricing. Bespoke template shape + calculator benchmark model.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'Pricing Page',
      readOnly: true,
      hidden: true,
    }),
    ...metaFields().map((f) => ({ ...f, group: 'seo' })),
    ...[
      heroSection,
      calculatorSection,
      benefitsSection,
      fixedFeeSection,
      deRiskSection,
      glassdoorSection,
      logoBarSection,
      testimonialSection,
      faqSection,
    ].map((f) => ({ ...f, group: 'content' })),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'Pricing Page' }),
  },
})
