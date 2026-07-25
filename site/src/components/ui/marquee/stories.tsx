import type { Meta, StoryObj } from '@storybook/nextjs'

import { Marquee } from './index'

const meta = {
  title: 'Primitives/Marquee',
} satisfies Meta

export default meta
type Story = StoryObj

const PILLS = [
  'Sample One',
  'Sample Two',
  'Sample Three',
  'Sample Four',
  'Sample Five',
  'Sample Six',
] as const

function Pill({ label }: { label: string }) {
  return (
    <span className="mx-3 inline-flex h-12 items-center rounded-full bg-brand-primary/10 px-6 text-body font-medium text-brand-primary">
      {label}
    </span>
  )
}

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <Marquee>
        {PILLS.map((p) => (
          <Pill key={p} label={p} />
        ))}
      </Marquee>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      {(['left', 'right'] as const).map((direction) => (
        <div key={direction} className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default/70">
            direction={direction}, speed=normal
          </span>
          <Marquee direction={direction} speed="normal">
            {PILLS.map((p) => (
              <Pill key={p} label={p} />
            ))}
          </Marquee>
        </div>
      ))}
      {(['slow', 'normal', 'fast'] as const).map((speed) => (
        <div key={speed} className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default/70">
            speed={speed} (direction=left)
          </span>
          <Marquee speed={speed}>
            {PILLS.map((p) => (
              <Pill key={p} label={p} />
            ))}
          </Marquee>
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          direction=up (vertical, fixed-height container)
        </span>
        <div className="h-40 overflow-hidden">
          <Marquee direction="up" speed="slow">
            {PILLS.map((p) => (
              <div key={p} className="my-2">
                <Pill label={p} />
              </div>
            ))}
          </Marquee>
        </div>
      </div>
      <p className="text-body-sm text-text-default/70">
        pauseOnHover defaults true — hover the track to verify the animation pauses.
      </p>
    </div>
  ),
}
