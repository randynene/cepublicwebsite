import type { Meta, StoryObj } from '@storybook/nextjs'

import { Checkbox } from './index'

const meta = {
  title: 'Primitives/Checkbox',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-6">
      <Checkbox id="cb-default" defaultChecked aria-label="Sample checkbox" />
      <label htmlFor="cb-default" className="text-body text-text-default">
        I agree to the sample terms
      </label>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex items-center gap-2">
        <Checkbox id="cb-unchecked" aria-label="Unchecked" />
        <label htmlFor="cb-unchecked" className="text-body text-text-default">
          unchecked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-checked" defaultChecked aria-label="Checked" />
        <label htmlFor="cb-checked" className="text-body text-text-default">
          checked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="cb-indeterminate"
          checked="indeterminate"
          aria-label="Indeterminate"
        />
        <label
          htmlFor="cb-indeterminate"
          className="text-body text-text-default"
        >
          indeterminate
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="cb-error"
          aria-label="Error"
          aria-invalid="true"
        />
        <label htmlFor="cb-error" className="text-body text-text-default">
          aria-invalid (error ring)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-disabled" disabled aria-label="Disabled" />
        <label htmlFor="cb-disabled" className="text-body text-text-default">
          disabled
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="cb-disabled-checked"
          disabled
          defaultChecked
          aria-label="Disabled checked"
        />
        <label
          htmlFor="cb-disabled-checked"
          className="text-body text-text-default"
        >
          disabled + checked
        </label>
      </div>
      <p className="text-body-sm text-text-default/70">
        Hover/focus visible on interaction — focus-visible ring on keyboard tab.
      </p>
    </div>
  ),
}
