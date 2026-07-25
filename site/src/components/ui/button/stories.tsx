import type { Meta, StoryObj } from '@storybook/nextjs'

import { Icon } from '../icon'
import { Button } from './index'

const meta = {
  title: 'Primitives/Button',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <Button>Schedule a Call</Button>,
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      {(['primary-teal', 'primary-yellow', 'primary-navy'] as const).map(
        (variant) => (
          <div key={variant} className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-text-default/70">
              {variant}
            </span>
            <div className="flex items-end gap-3">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        ),
      )}
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          icon-only (aria-label required)
        </span>
        <div className="flex items-end gap-3">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button
              key={size}
              variant="icon-only"
              size={size}
              aria-label="Copy link"
            >
              <Icon name="copy-link" size={size === 'lg' ? 'md' : 'sm'} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  ),
}
