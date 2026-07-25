import { defineArrayMember, defineType } from 'sanity'

export default defineType({
  name: 'portableText',
  title: 'Portable Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
          { title: 'Underline', value: 'underline' },
          { title: 'Strike', value: 'strike-through' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href', type: 'url', title: 'URL' },
              { name: 'blank', type: 'boolean', title: 'Open in new tab' },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    }),
    defineArrayMember({
      name: 'videoEmbed',
      title: 'Video embed',
      type: 'object',
      fields: [
        {
          name: 'url',
          title: 'Video URL',
          type: 'url',
          validation: (Rule) => Rule.required(),
        },
        { name: 'caption', title: 'Caption', type: 'string' },
      ],
      preview: {
        select: { url: 'url', caption: 'caption' },
        prepare({ url, caption }) {
          return { title: caption ?? '(no caption)', subtitle: url }
        },
      },
    }),
    defineArrayMember({
      name: 'table',
      title: 'Data table',
      type: 'object',
      fields: [
        {
          name: 'headerRows',
          title: 'Header rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'tableHeaderRow',
              fields: [
                {
                  name: 'cells',
                  type: 'array',
                  of: [{ type: 'string' }],
                },
              ],
            },
          ],
        },
        {
          name: 'bodyRows',
          title: 'Body rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'tableBodyRow',
              fields: [
                {
                  name: 'cells',
                  type: 'array',
                  of: [{ type: 'string' }],
                },
              ],
            },
          ],
        },
        { name: 'caption', title: 'Caption', type: 'string' },
        { name: 'boldFirstColumn', title: 'Bold first column', type: 'boolean' },
      ],
      preview: {
        select: {
          caption: 'caption',
          headerRows: 'headerRows',
          bodyRows: 'bodyRows',
        },
        prepare({ caption, headerRows, bodyRows }) {
          const headerCount = Array.isArray(headerRows) ? headerRows.length : 0
          const bodyCount = Array.isArray(bodyRows) ? bodyRows.length : 0
          return {
            title: caption ?? 'Data table',
            subtitle: `${headerCount} header row(s), ${bodyCount} body row(s)`,
          }
        },
      },
    }),
  ],
})
