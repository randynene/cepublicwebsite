import type { Meta, StoryObj } from '@storybook/nextjs'

import { ICON_NAMES } from '../_icons/icon-names'
import { Icon } from './index'

const meta = {
  title: 'Primitives/Icon',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <Icon name="chevron-right" size="md" />,
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          size axis (chevron-right reference)
        </span>
        <div className="flex items-end gap-4">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <Icon name="chevron-right" size={size} ariaLabel="Sample" />
              <span className="text-body-sm text-text-default/70">{size}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          all 9 sprite icons (size=lg)
        </span>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {ICON_NAMES.map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-md border border-brand-tertiary/10 p-3"
            >
              <Icon name={name} size="lg" ariaLabel={name} />
              <span className="text-body-sm font-mono text-text-default/70">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}
