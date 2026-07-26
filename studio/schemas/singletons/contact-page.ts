import { defineArrayMember, defineField, defineType } from 'sanity'

import { metaFields } from '../_shared'

// contactPage singleton (route /contact + /uk/contact).
//
// Bespoke shape (About Us / Our Work pattern) — NOT the generic
// defineStaticPage shell. Live structure: hero prose + quick-contact strip on
// the left, HubSpot form on the right, then the Our Locations office grid.
//
// The form is a REAL HubSpot form, not a demo. `form.hubspotFormId` holds the
// GUID; the live Webflow page posts through the hubspotonwebflow.com bridge, so
// the id in the live page markup is the BRIDGE's id and 404s against HubSpot.
// The real form is "Contact Request (via cloudemployee.io/contact)".
// npm run launch:verify-hubspot-forms checks it still resolves.
//
// Seeded by scripts/static/seed-contact-page.ts. Do NOT re-run generic
// capture-marketing for contactPage — it would flatten the offices and the
// quick-contact strip into rich text.

const quickLinkMember = defineArrayMember({
  type: 'object',
  name: 'contactQuickLink',
  title: 'Quick contact link',
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description: 'Chooses the icon and the click behaviour. Calendly opens the booking popup.',
      options: {
        list: [
          { title: 'Schedule (Calendly popup)', value: 'calendly' },
          { title: 'Phone', value: 'phone' },
          { title: 'Email', value: 'email' },
          { title: 'Plain link', value: 'link' },
        ],
        layout: 'radio',
      },
      initialValue: 'link',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'value',
      title: 'Destination',
      type: 'string',
      description:
        'Calendly: the full Calendly URL. Phone: the number to dial. Email: the address. Link: a path or URL.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'value' } },
})

const officeMember = defineArrayMember({
  type: 'object',
  name: 'contactOffice',
  title: 'Office',
  fields: [
    defineField({
      name: 'name',
      title: 'Office name',
      type: 'string',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'address',
      title: 'Registered name and address',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
  ],
  preview: { select: { title: 'name', subtitle: 'address' } },
})

export default defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  description: 'Singleton for /contact. Bespoke Contact template — HubSpot form, Calendly, offices.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'Contact Page',
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
        defineField({
          name: 'titleAccent',
          title: 'Heading (accent)',
          type: 'string',
          description: 'Rendered in the lime serif italic. Leave empty for a single-weight heading.',
        }),
        defineField({
          name: 'paragraphs',
          title: 'Intro paragraphs',
          type: 'array',
          of: [{ type: 'text', rows: 4 }],
          description: 'One entry per paragraph, in order.',
        }),
      ],
    }),
    defineField({
      name: 'contactStrip',
      title: 'Quick contact strip',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      description: 'The pills under the intro copy: schedule a call, phone, email.',
      fields: [
        defineField({ name: 'links', title: 'Links', type: 'array', of: [quickLinkMember] }),
        defineField({
          name: 'note',
          title: 'Note under the pills',
          type: 'string',
          description: 'Live chat hours, for example.',
        }),
      ],
    }),
    defineField({
      name: 'form',
      title: 'Enquiry form',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'heading',
          title: 'Heading above the form',
          type: 'string',
          description: 'Optional. Live has no heading here.',
        }),
        defineField({
          name: 'hubspotFormId',
          title: 'HubSpot form GUID',
          type: 'string',
          description:
            'The real HubSpot form GUID, not the hubspotonwebflow.com bridge id from the old site. Verified by npm run launch:verify-hubspot-forms.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'portalId',
          title: 'HubSpot portal ID override',
          type: 'string',
          description: 'Leave empty. Defaults to the sitewide portal (22809822).',
        }),
      ],
    }),
    defineField({
      name: 'offices',
      title: 'Offices',
      type: 'object',
      group: 'content',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'items', title: 'Offices', type: 'array', of: [officeMember] }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: (title as string) || 'Contact Page' }),
  },
})
