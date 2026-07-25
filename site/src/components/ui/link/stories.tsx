import type { Meta, StoryObj } from '@storybook/nextjs'

import { Link } from './index'

const meta = {
  title: 'Primitives/Link',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <Link href="/services">Our services</Link>,
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          tone (on light surface)
        </span>
        <div className="flex flex-col gap-2 bg-surface-elevated p-4">
          <Link href="/services">default — brand teal</Link>
          <Link href="/services" tone="cc-blue">
            cc-blue — navy
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          tone (on dark surface)
        </span>
        <div className="flex flex-col gap-2 bg-brand-tertiary p-4">
          <Link href="/services" tone="cc-white">
            cc-white — on dark
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          external (opens new tab)
        </span>
        <Link href="https://example.com" external>
          External link
        </Link>
      </div>
    </div>
  ),
}
