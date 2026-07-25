import { defineField, defineType } from 'sanity'

import { imageField, localeField, metaFields, retiredField, slugField } from '../_shared'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    slugField('name'),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Fireside Chats', value: 'firesideChats' },
          { title: 'Working With Us', value: 'workingWithUs' },
          { title: 'Interviews', value: 'interviews' },
        ],
      },
    }),
    defineField({
      name: 'team',
      title: 'Team',
      type: 'string',
      options: {
        list: [
          { title: 'Talent Success', value: 'talentSuccess' },
          { title: 'Client Success', value: 'clientSuccess' },
          { title: 'People & Culture', value: 'peopleAndCulture' },
          { title: 'Engineering', value: 'engineering' },
          { title: 'Leadership', value: 'leadership' },
          { title: 'Talent Recruitment', value: 'talentRecruitment' },
          { title: 'Technical Vetting', value: 'technicalVetting' },
          { title: 'HR / Compliance / Legal', value: 'hrComplianceLegal' },
          { title: 'Learning & Development', value: 'learningDevelopment' },
          { title: 'Employee Experience', value: 'employeeExperience' },
        ],
      },
    }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),

    defineField({ name: 'mainVideoEmbedLink', title: 'Main video embed link', type: 'url' }),
    defineField({
      name: 'backgroundVideoPreviewLink',
      title: 'Background video preview link',
      type: 'string',
      description: 'Webflow type is PlainText — preserved as string to avoid migration failures on malformed values. Validate/normalise post-launch.',
    }),
    defineField({
      name: 'vimeoYoutubeStandardLink',
      title: 'Vimeo/YouTube standard link',
      type: 'string',
      description: 'Webflow type is PlainText — preserved as string (see above).',
    }),
    imageField('backupImage', 'Backup image', { required: true }),

    defineField({ name: 'descriptionOfVideo', title: 'Description', type: 'portableText' }),
    defineField({ name: 'fullVideoTranscript', title: 'Full transcript', type: 'portableText' }),
    defineField({ name: 'linksMentionedInVideo', title: 'Links mentioned', type: 'portableText' }),
    defineField({
      name: 'linkedinProfilesOfSpeakersInVideo',
      title: 'LinkedIn profiles of speakers',
      type: 'portableText',
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tag' }],
          options: { filter: 'category == "videoLibrary"' },
        },
      ],
    }),

    ...metaFields({ og: false }),
    localeField(),
    retiredField(),
  ],
  preview: { select: { title: 'name', subtitle: 'label', media: 'backupImage' } },
})
