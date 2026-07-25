'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'

import { Button } from '../button'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './index'

const meta = {
  title: 'Primitives/Toast',
} satisfies Meta

export default meta
type Story = StoryObj

function StoryShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider duration={Infinity}>
      <div className="p-6">{children}</div>
      <ToastViewport />
    </ToastProvider>
  )
}

export const Default: Story = {
  render: () => {
    return (
      <StoryShell>
        <Toast open>
          <div className="flex flex-col gap-1">
            <ToastTitle>Saved</ToastTitle>
            <ToastDescription>Your sample changes are live.</ToastDescription>
          </div>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose />
        </Toast>
      </StoryShell>
    )
  },
}

function tones() {
  return [
    { tone: 'default' as const, title: 'Default' },
    { tone: 'success' as const, title: 'Success' },
    { tone: 'warning' as const, title: 'Warning' },
    { tone: 'error' as const, title: 'Error' },
  ]
}

export const AllVariants: Story = {
  render: () => (
    <StoryShell>
      <div className="flex flex-col gap-3">
        {tones().map(({ tone, title }) => (
          <Toast key={tone} tone={tone} open>
            <div className="flex flex-col gap-1">
              <ToastTitle>{title}</ToastTitle>
              <ToastDescription>
                Sample description for the {tone} tone.
              </ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        ))}
      </div>
    </StoryShell>
  ),
}

function StatefulToast() {
  const [open, setOpen] = useState(false)
  return (
    <ToastProvider>
      <div className="flex flex-col gap-2 p-6">
        <span className="text-body-sm font-medium text-text-default/70">
          fire toast (auto-dismisses after 5s)
        </span>
        <Button onClick={() => setOpen(true)}>Show toast</Button>
        <Toast open={open} onOpenChange={setOpen} tone="success">
          <div className="flex flex-col gap-1">
            <ToastTitle>Sample success</ToastTitle>
            <ToastDescription>
              Toast was fired from a button click.
            </ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </div>
      <ToastViewport />
    </ToastProvider>
  )
}

export const States: Story = {
  render: () => <StatefulToast />,
}
