import type { Meta, StoryObj } from '@storybook/nextjs'

import { Button } from '../button'
import { Icon } from '../icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index'

const meta = {
  title: 'Primitives/Tooltip',
} satisfies Meta

export default meta
type Story = StoryObj

// TooltipProvider wraps the story locally — preview.tsx does not mount it
// globally so non-overlay stories stay free of provider context.
export const Default: Story = {
  render: () => (
    <TooltipProvider delayDuration={300}>
      <div className="p-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="icon-only" size="md" aria-label="More info">
              <Icon name="more-vertical" size="sm" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sample helpful hint</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}

export const States: Story = {
  render: () => (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-6 p-12">
        <div className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default/70">
            closed (hover trigger to open)
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Sample tooltip content</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default/70">
            open (forced via defaultOpen)
          </span>
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <Button>Always-open trigger</Button>
            </TooltipTrigger>
            <TooltipContent>Sample tooltip — open by default</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-body-sm text-text-default/70">
          delayDuration=300ms (Provider override of Radix&apos;s 700ms default).
        </p>
      </div>
    </TooltipProvider>
  ),
}
