import type { Meta, StoryObj } from '@storybook/nextjs'

import { Input } from './index'

const meta = {
  title: 'Primitives/Input',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="max-w-sm p-6">
      <Input type="email" placeholder="Your email…" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          default
        </span>
        <Input type="text" placeholder="Default input…" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          aria-invalid (error ring)
        </span>
        <Input type="email" placeholder="Your email…" aria-invalid="true" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          disabled
        </span>
        <Input type="text" placeholder="Disabled input" disabled />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          with value
        </span>
        <Input type="text" defaultValue="Sample value" />
      </div>
      <p className="text-body-sm text-text-default/70">
        Hover/focus visible on interaction — focus-visible ring uses
        --color-ring (alias of brand-primary).
      </p>
    </div>
  ),
}
