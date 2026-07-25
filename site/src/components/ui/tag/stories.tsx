import type { Meta, StoryObj } from '@storybook/nextjs'

import { Tag } from './index'

const meta = {
  title: 'Primitives/Tag',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <Tag>Hiring Tips</Tag>,
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          decorative (renders &lt;span&gt;)
        </span>
        <div className="flex flex-wrap gap-2">
          <Tag>Hiring Tips</Tag>
          <Tag tone="cc-blue">Scaling Teams</Tag>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          routable (renders &lt;a&gt; via next/link)
        </span>
        <div className="flex flex-wrap gap-2">
          <Tag href="/blog/category/hiring-tips">Hiring Tips</Tag>
          <Tag tone="cc-blue" href="/blog/category/scaling-teams">
            Scaling Teams
          </Tag>
        </div>
      </div>
    </div>
  ),
}
