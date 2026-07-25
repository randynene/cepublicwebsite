import type { Meta, StoryObj } from '@storybook/nextjs'

import { Divider } from './index'

const meta = {
  title: 'Primitives/Divider',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <Divider />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          orientation=horizontal (renders &lt;hr&gt;)
        </span>
        <div className="max-w-md">
          <Divider />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          orientation=vertical (renders &lt;span role=&quot;separator&quot;&gt;)
        </span>
        <div className="flex h-12 items-stretch gap-3 text-body text-text-default">
          <span>Sample left</span>
          <Divider orientation="vertical" />
          <span>Sample middle</span>
          <Divider orientation="vertical" />
          <span>Sample right</span>
        </div>
      </div>
    </div>
  ),
}
