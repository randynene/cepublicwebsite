import type { Meta, StoryObj } from '@storybook/nextjs'

import {
  MegaMenuPillLabel,
  type MegaMenuPillLabelVariant,
} from './index'

const meta = {
  title: 'Primitives/MegaMenuPillLabel',
} satisfies Meta

export default meta
type Story = StoryObj

const VARIANTS: MegaMenuPillLabelVariant[] = [
  'pill-green',
  'pill-dark',
  'pill-gradient',
  'pill-navy',
  'pill-outline-light',
  'pill-outline-dark',
]

const SAMPLE_LABEL: Record<MegaMenuPillLabelVariant, string> = {
  'pill-green': 'Staff Augmentation',
  'pill-dark': 'By Technology',
  'pill-gradient': 'AI Services',
  'pill-navy': 'Product Builds',
  'pill-outline-light': 'Our Expertise',
  'pill-outline-dark': 'AI Services',
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      {VARIANTS.map((variant) => {
        const onDark =
          variant === 'pill-outline-light' || variant === 'pill-outline-dark'
        return (
          <div
            key={variant}
            className="flex flex-col gap-3 rounded-lg p-4"
            style={
              onDark
                ? { background: 'var(--color-brand-tertiary)' }
                : undefined
            }
          >
            <span
              className="text-body-sm font-medium"
              style={{
                color: onDark
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(33,33,33,0.7)',
              }}
            >
              {variant}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {/* Anchor form */}
              <MegaMenuPillLabel
                as="a"
                href="#"
                variant={variant}
                label={`${SAMPLE_LABEL[variant]} (as=a)`}
              />
              {/* Span form */}
              <MegaMenuPillLabel
                as="span"
                variant={variant}
                label={`${SAMPLE_LABEL[variant]} (as=span)`}
              />
              {/* hasArrow form (anchor) */}
              <MegaMenuPillLabel
                as="a"
                href="#"
                variant={variant}
                hasArrow
                label={`${SAMPLE_LABEL[variant]} (hasArrow)`}
              />
            </div>
          </div>
        )
      })}
    </div>
  ),
}

export const FooterArrangement: Story = {
  render: () => (
    <div
      className="flex flex-col gap-4 rounded-lg p-6"
      style={{ background: 'var(--color-brand-tertiary)' }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <MegaMenuPillLabel
          as="span"
          variant="pill-outline-light"
          hasArrow
          label="Our Expertise"
        />
        <MegaMenuPillLabel
          as="span"
          variant="pill-outline-light"
          hasArrow
          label="Learn more"
        />
        <MegaMenuPillLabel
          as="span"
          variant="pill-outline-light"
          label="Talent Locations"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <MegaMenuPillLabel
          as="a"
          href="/services/project-builds"
          variant="pill-outline-light"
          hasArrow
          label="Project Builds"
        />
        <MegaMenuPillLabel
          as="a"
          href="/services/ai"
          variant="pill-outline-light"
          hasArrow
          label="AI Services"
        />
      </div>
    </div>
  ),
}
