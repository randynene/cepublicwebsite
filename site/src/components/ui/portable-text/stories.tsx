import type { Meta, StoryObj } from '@storybook/nextjs'

import { PortableText } from './index'

const meta = {
  title: 'Primitives/PortableText',
} satisfies Meta

export default meta
type Story = StoryObj

// Generic placeholder Portable Text fixture — exercises every default
// renderer (block styles, list styles, marks, link annotation). NOT real
// CE marketing copy per Brief A Hard Rule #1 exception.
const sampleBlocks = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'h2',
    children: [{ _type: 'span', _key: 's1', text: 'Sample H2 heading', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's2', text: 'Sample paragraph with ', marks: [] },
      { _type: 'span', _key: 's3', text: 'bold', marks: ['strong'] },
      { _type: 'span', _key: 's4', text: ' and ', marks: [] },
      { _type: 'span', _key: 's5', text: 'italic', marks: ['em'] },
      { _type: 'span', _key: 's6', text: ' marks plus a ', marks: [] },
      { _type: 'span', _key: 's7', text: 'link annotation', marks: ['link-1'] },
      { _type: 'span', _key: 's8', text: '.', marks: [] },
    ],
    markDefs: [
      { _type: 'link', _key: 'link-1', href: 'https://example.com', blank: true },
    ],
  },
  {
    _type: 'block',
    _key: 'b3',
    style: 'h3',
    children: [{ _type: 'span', _key: 's9', text: 'Sample H3 (renders at h4 visual)', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'b4',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: 's10', text: 'Sample bullet item one', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'b5',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: 's11', text: 'Sample bullet item two', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'b6',
    style: 'h4',
    children: [{ _type: 'span', _key: 's12', text: 'Sample H4 heading', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'b7',
    style: 'blockquote',
    children: [
      {
        _type: 'span',
        _key: 's13',
        text: 'Sample blockquote — full 4-side border with auto open-quote glyph per CE pattern.',
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'b8',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's14', text: 'Sample paragraph with inline ', marks: [] },
      { _type: 'span', _key: 's15', text: 'code', marks: ['code'] },
      { _type: 'span', _key: 's16', text: ' formatting.', marks: [] },
    ],
    markDefs: [],
  },
]

export const Default: Story = {
  render: () => (
    <div className="max-w-2xl p-6">
      <PortableText value={sampleBlocks} />
    </div>
  ),
}
