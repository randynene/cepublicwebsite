import type { Meta, StoryObj } from '@storybook/nextjs'

import { Container } from './index'

const meta = {
  title: 'Primitives/Container',
} satisfies Meta

export default meta
type Story = StoryObj

function Sample({ label }: { label: string }) {
  return (
    <div className="flex h-24 items-center justify-center bg-brand-primary/10 text-body font-medium text-brand-primary">
      {label}
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <Container>
      <Sample label="default — 1384px max-width + responsive padding" />
    </Container>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 bg-brand-tertiary/5 py-6">
      {(['narrow', 'default', 'wide', 'full'] as const).map((width) => (
        <Container key={width} width={width}>
          <Sample
            label={`width=${width}${
              width === 'narrow'
                ? ' (1100px)'
                : width === 'default'
                ? ' (1384px + px-6 sm:px-8)'
                : width === 'wide'
                ? ' (1440px)'
                : ' (no max-width)'
            }`}
          />
        </Container>
      ))}
      <Container as="section">
        <Sample label="as=section (polymorphic root)" />
      </Container>
    </div>
  ),
}
