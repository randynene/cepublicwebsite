import type { Meta, StoryObj } from '@storybook/nextjs'

import { Textarea } from './index'

const meta = {
  title: 'Primitives/Textarea',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="max-w-sm p-6">
      <Textarea placeholder="Your message…" />
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
        <Textarea placeholder="Default textarea…" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          aria-invalid (error ring)
        </span>
        <Textarea placeholder="Your message…" aria-invalid="true" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          disabled
        </span>
        <Textarea placeholder="Disabled textarea" disabled />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          with value
        </span>
        <Textarea defaultValue="Sample multi-line value used to demonstrate the resize-y handle." />
      </div>
      <p className="text-body-sm text-text-default/70">
        Hover/focus visible on interaction. Vertical resize via the bottom-right
        handle (resize-y).
      </p>
    </div>
  ),
}
