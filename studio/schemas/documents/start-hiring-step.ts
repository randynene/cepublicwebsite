import { defineField, defineType } from 'sanity'

import { metaFields, retiredField, slugField } from '../_shared'

// The /start-hiring lead-capture funnel: 8 live pages, one per step.
//
// We knew about two of them. The other six were invisible to every source the
// parity corpus was built from — they have no backlinks, no rankings and are not
// in the sitemap — and only surfaced when we started reading the page list out of
// Webflow directly. Seven-ninths of Cloud Employee's enquiry flow would have been
// dropped at cutover without an error anywhere.
//
// A document type per step, not eight singletons: the pages are identical in
// shape (heading, lead, one HubSpot form) and differ only in content, so one
// route at /start-hiring/[step] renders all of them.
//
// hubspotFormId IS the wiring. Each step embeds a distinct HubSpot form on portal
// 22809822, and HubSpot itself owns both the submission and the redirect to the
// next step. Rebuild the page with the right form id and the enquiry lands exactly
// where it lands today. Rebuild it with the wrong one, or none, and submissions
// vanish silently — which is why the field is required and why it is not
// something to "fill in later".
export default defineType({
  name: 'startHiringStep',
  title: 'Start Hiring — Funnel Step',
  type: 'document',
  description:
    'One step of the /start-hiring enquiry funnel. Rendered at /start-hiring/<slug>.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The H1. e.g. "Do you have a set monthly budget?"',
      validation: (Rule) => Rule.required().max(200),
    }),
    slugField('heading'),
    defineField({
      name: 'order',
      title: 'Step order',
      type: 'number',
      description: 'Position in the funnel, from 1. Drives the progress indicator.',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'lead',
      title: 'Lead paragraph',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'ukOnly',
      title: 'UK only',
      type: 'boolean',
      initialValue: false,
      description:
        'The two locales do not run the same funnel. /uk/start-hiring/get-started is a real first step in the UK ("Let\'s Find Your Developer", HubSpot Part 1/8), while the US redirects that URL straight into contact-info. So the UK funnel is 9 steps and the US one is 8, and the step numbering differs between them.',
    }),
    defineField({
      name: 'hubspotFormId',
      title: 'HubSpot form ID',
      type: 'string',
      description:
        'The HubSpot form GUID for this step. Submissions and the redirect to the next step are both owned by HubSpot. The final "thanks" step has no form.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { slug?: { current?: string } } | undefined
          const isThanks = doc?.slug?.current === 'thanks'
          if (isThanks) return true
          if (!value) {
            return 'Required on every step except "thanks". Without it the form does not render and the enquiry is lost with no error.'
          }
          return true
        }),
    }),
    // Deliberately NOT metaFields(). That helper requires a 140-160 character
    // meta description, which is the right rule for a page you want ranked and
    // the wrong one here: every funnel step is `noindex` on the live site and
    // absent from its sitemap, as a lead-capture flow should be. Google is told
    // not to look at these pages, so demanding SEO copy for them would mean
    // inventing 160 characters of prose nobody will ever read, purely to satisfy
    // a validator. The route emits noindex to match.
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 2,
    }),
    retiredField(),
  ],
  orderings: [
    {
      title: 'Funnel order',
      name: 'funnelOrder',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'heading', order: 'order', slug: 'slug.current' },
    prepare: ({ title, order, slug }) => ({
      title: `${order}. ${title}`,
      subtitle: `/start-hiring/${slug}`,
    }),
  },
})
