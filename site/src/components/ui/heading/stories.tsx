import type { Meta, StoryObj } from '@storybook/nextjs'

import { Heading } from './index'

const meta = {
  title: 'Primitives/Heading',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <Heading as="h1">Page title</Heading>,
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          size axis (semantic h2 wrapper)
        </span>
        <div className="flex flex-col gap-3">
          {(['display', 'h1', 'h2', 'h4', 'eyebrow'] as const).map((size) => (
            <Heading key={size} as="h2" size={size}>
              size={size}
            </Heading>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          as axis with default size mapping
        </span>
        <Heading as="h1">as=h1 → defaults to size=h1</Heading>
        <Heading as="h2">as=h2 → defaults to size=h2</Heading>
        <Heading as="h3">as=h3 → defaults to size=h2 (h3 dropped)</Heading>
        <Heading as="h4">as=h4 → defaults to size=h4</Heading>
        <Heading as="h5">as=h5 → defaults to size=h4</Heading>
        <Heading as="h6">as=h6 → defaults to size=h4</Heading>
        <Heading as="span" size="eyebrow">
          as=span + size=eyebrow (non-heading semantic)
        </Heading>
        <Heading as="p" size="h4">
          as=p + size=h4 (p with heading visual)
        </Heading>
      </div>
    </div>
  ),
}
