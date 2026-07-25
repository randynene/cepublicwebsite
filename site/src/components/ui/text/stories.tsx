import type { Meta, StoryObj } from '@storybook/nextjs'

import { Text } from './index'

const meta = {
  title: 'Primitives/Text',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <Text>Sample body copy at the default size and weight.</Text>,
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          size axis
        </span>
        <Text size="small">size=small — 14px caption text.</Text>
        <Text size="default">
          size=default — 16px dominant body text across the site.
        </Text>
        <Text size="lead">size=lead — 18px intro/lead paragraph.</Text>
        <Text size="large">
          size=large — 20px medium-weight (testimonial body).
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          as axis
        </span>
        <Text as="p">as=p — paragraph (default).</Text>
        <Text as="span">as=span — inline body text.</Text>
        <Text as="div">as=div — block container.</Text>
        <Text as="em">as=em — emphasised inline text.</Text>
        <Text as="strong">as=strong — bold inline text.</Text>
      </div>
    </div>
  ),
}
