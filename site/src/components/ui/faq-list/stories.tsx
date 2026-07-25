import type { Meta, StoryObj } from '@storybook/react'

import { FaqList } from './index'

const SAMPLE_FAQS = [
  {
    _key: 'faq-1',
    question: 'What is Culture Match?',
    answer: [
      {
        _key: 'a1',
        _type: 'block' as const,
        style: 'normal' as const,
        markDefs: [],
        children: [
          {
            _key: 'a1c',
            _type: 'span' as const,
            marks: [],
            text: 'Culture Match is a short set of questions that highlights how a developer prefers to work.',
          },
        ],
      },
    ],
  },
  {
    _key: 'faq-2',
    question: 'What do the results look like?',
    answer: [
      {
        _key: 'a2',
        _type: 'block' as const,
        style: 'normal' as const,
        markDefs: [],
        children: [
          {
            _key: 'a2c',
            _type: 'span' as const,
            marks: [],
            text: 'You get a clear, plain-language snapshot of working style across key dimensions.',
          },
        ],
      },
    ],
  },
]

const meta: Meta<typeof FaqList> = {
  title: 'Primitives/FaqList',
  component: FaqList,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#070D18' }] },
  },
}

export default meta
type Story = StoryObj<typeof FaqList>

export const DarkTemplateFaq: Story = {
  name: 'Dark template FAQ (lime +/×)',
  render: () => (
    <div className="mx-auto max-w-xl bg-[#070D18] p-8">
      <FaqList items={SAMPLE_FAQS} />
    </div>
  ),
}
