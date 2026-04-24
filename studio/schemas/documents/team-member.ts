import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, slugField } from '../_shared'

export default defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    slugField('name'),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
    imageField('teamMemberImage', 'Team member image', { required: true }),
    defineField({ name: 'aboutContent', title: 'About content', type: 'portableText' }),
    defineField({
      name: 'timeAtCloudEmployee',
      title: 'Time at Cloud Employee',
      type: 'string',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({ name: 'areasOfExpertise', title: 'Areas of expertise', type: 'portableText' }),
    defineField({ name: 'linkedinLink', title: 'LinkedIn link', type: 'url' }),
    defineField({ name: 'bookACallLink', title: 'Book-a-call link', type: 'url' }),
    defineField({
      name: 'hideFromTeamAboutPage',
      title: 'Hide from Team / About Us page',
      type: 'boolean',
      initialValue: false,
    }),
    ...metaFields({ og: false }),
    localeField(),
  ],
  preview: { select: { title: 'name', subtitle: 'position', media: 'teamMemberImage' } },
})
