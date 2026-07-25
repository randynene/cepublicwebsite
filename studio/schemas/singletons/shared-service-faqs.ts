import { defineField, defineType } from 'sanity'

// Shared FAQ block for the Service + Technology detail pages.
//
// The live cloudemployee.io site shows the SAME FAQ block on every service page
// (three themed groups) and the first group on every technology page. Rather than
// duplicate that copy onto 124 documents, it lives here once and every page reads
// it by default. A page only stops reading it if that page's own `faqs` field is
// filled (the per-page override), which then replaces the shared block for that
// page. This keeps launch parity with live while leaving a clean per-page AEO
// upgrade path.
//
//   Service detail (default)    -> serviceModel + productBuilds + consulting
//   Technology detail (default) -> serviceModel only
export default defineType({
  name: 'sharedServiceFaqs',
  title: 'Shared Service & Technology FAQs',
  type: 'document',
  fields: [
    defineField({
      name: 'serviceModel',
      title: 'Service model FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description:
        'Shown on ALL service pages and ALL technology pages (unless a page has its own override).',
    }),
    defineField({
      name: 'productBuilds',
      title: 'Product build FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description: 'Shown on all service pages (below the service-model group).',
    }),
    defineField({
      name: 'consulting',
      title: 'Consulting FAQs',
      type: 'array',
      of: [{ type: 'faqItem' }],
      description: 'Shown on all service pages (below the product-build group).',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Shared Service & Technology FAQs' }),
  },
})
