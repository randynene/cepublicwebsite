import type { Meta, StoryObj } from '@storybook/nextjs'

import { Image } from './index'

const meta = {
  title: 'Primitives/Image',
} satisfies Meta

export default meta
type Story = StoryObj

// Plain-URL mode for stories — Sanity-source mode requires a real Sanity
// project + dataset to resolve URLs through the image-url builder. The
// real public asset at /og-default.png ships in site/public/.
export const Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <Image
        src="/og-default.png"
        alt="Sample placeholder image"
        width={400}
        height={210}
      />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          intrinsic (width + height)
        </span>
        <div className="max-w-sm">
          <Image
            src="/og-default.png"
            alt="Sample intrinsic image"
            width={400}
            height={210}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          fill (parent provides aspect-ratio container)
        </span>
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md bg-brand-tertiary/5">
          <Image
            src="/og-default.png"
            alt="Sample fill image"
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          priority (LCP candidate; opt-in only)
        </span>
        <div className="max-w-sm">
          <Image
            src="/og-default.png"
            alt="Sample priority image"
            width={400}
            height={210}
            priority
          />
        </div>
      </div>
    </div>
  ),
}
