import type { Meta, StoryObj } from '@storybook/nextjs'

import { Button } from '../button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './index'

const meta = {
  title: 'Primitives/Dialog',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Sample dialog title</DialogTitle>
          <DialogDescription>
            Sample dialog description text. Confirm or cancel using the actions
            below.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="primary-yellow">Cancel</Button>
            </DialogClose>
            <Button>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <span className="text-body-sm font-medium text-text-default/70">
        closed (click trigger to open)
      </span>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Sample dialog</DialogTitle>
          <DialogDescription>
            Click outside or press Escape to dismiss. Built-in × close button
            sits at top-right.
          </DialogDescription>
        </DialogContent>
      </Dialog>
      <span className="text-body-sm font-medium text-text-default/70">
        open by default
      </span>
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>Re-open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Sample dialog (open)</DialogTitle>
          <DialogDescription>
            Sample description for the open-by-default state. Focus is trapped
            inside the panel.
          </DialogDescription>
        </DialogContent>
      </Dialog>
      <p className="text-body-sm text-text-default/70">
        Hover/focus visible on interaction — focus ring on Cancel/Confirm buttons.
      </p>
    </div>
  ),
}
