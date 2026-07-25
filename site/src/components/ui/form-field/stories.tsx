'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import { FormProvider, useForm } from 'react-hook-form'

import { Input } from '../input'
import { Textarea } from '../textarea'
import { FormField } from './index'

const meta = {
  title: 'Primitives/FormField',
} satisfies Meta

export default meta
type Story = StoryObj

// Standalone usage — no FormProvider; FormField gracefully falls through.
export const Default: Story = {
  render: () => (
    <div className="max-w-sm p-6">
      <FormField name="email" label="Email" required description="Work email">
        <Input type="email" placeholder="you@example.com" />
      </FormField>
    </div>
  ),
}

// Wrapper helper — surfaces an rhf error for the States story.
function WithErrors({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: { email: '', message: '' },
    errors: {
      email: { type: 'manual', message: 'Sample error — invalid email format' },
    },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          required + description (no error)
        </span>
        <FormField
          name="email"
          label="Email"
          required
          description="Sample helper text"
        >
          <Input type="email" placeholder="you@example.com" />
        </FormField>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          with rhf-driven error
        </span>
        <WithErrors>
          <FormField name="email" label="Email" required>
            <Input type="email" placeholder="you@example.com" />
          </FormField>
        </WithErrors>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          textarea variant
        </span>
        <FormField
          name="message"
          label="Message"
          required
          description="Tell us about your sample request."
        >
          <Textarea placeholder="Sample message…" />
        </FormField>
      </div>
    </div>
  ),
}
