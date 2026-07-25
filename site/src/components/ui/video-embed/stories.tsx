import type { Meta, StoryObj } from '@storybook/nextjs'

import { VideoEmbed } from './index'

const meta = {
  title: 'Primitives/VideoEmbed',
} satisfies Meta

export default meta
type Story = StoryObj

// Mock SanityImageSource for the lite-mode poster slot. Plain-URL is not
// supported on the poster prop — `source` must be a Sanity-shaped object.
// The Image primitive will attempt to resolve it via the image-url builder;
// in stories without real Sanity assets, the poster slot may render the
// fallback. Acceptable for dev sandbox per Brief A Hard Rule #1 exception.
const SAMPLE_POSTER = {
  asset: { _ref: 'image-1234567890abcdef-1200x675-png', _type: 'sanity.imageAsset' },
  alt: 'Sample video poster',
}

export const Default: Story = {
  render: () => (
    <div className="max-w-2xl p-6">
      <VideoEmbed
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        poster={SAMPLE_POSTER}
        title="Sample video"
      />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          mode=lite (default — click-to-play)
        </span>
        <div className="max-w-xl">
          <VideoEmbed
            url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            poster={SAMPLE_POSTER}
            title="Sample lite-mode video"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          mode=eager (iframe immediate; ambient autoplay loops)
        </span>
        <div className="max-w-xl">
          <VideoEmbed
            url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            mode="eager"
            title="Sample eager-mode video"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          provider auto-detect (Vimeo URL)
        </span>
        <div className="max-w-xl">
          <VideoEmbed
            url="https://vimeo.com/76979871"
            poster={SAMPLE_POSTER}
            title="Sample Vimeo video"
          />
        </div>
      </div>
    </div>
  ),
}
