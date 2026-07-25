import type { Meta, StoryObj } from '@storybook/nextjs'

import { RadioGroup, RadioGroupItem } from './index'

const meta = {
  title: 'Primitives/RadioGroup',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <RadioGroup defaultValue="b">
        {(['a', 'b', 'c'] as const).map((v) => (
          <div key={v} className="flex items-center gap-2">
            <RadioGroupItem value={v} id={`rg-default-${v}`} />
            <label
              htmlFor={`rg-default-${v}`}
              className="text-body text-text-default"
            >
              Option {v.toUpperCase()}
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          unselected
        </span>
        <RadioGroup>
          {(['a', 'b'] as const).map((v) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={`rg-un-${v}`} />
              <label
                htmlFor={`rg-un-${v}`}
                className="text-body text-text-default"
              >
                Option {v.toUpperCase()}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          disabled (whole group)
        </span>
        <RadioGroup defaultValue="a" disabled>
          {(['a', 'b'] as const).map((v) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={`rg-dis-${v}`} />
              <label
                htmlFor={`rg-dis-${v}`}
                className="text-body text-text-default"
              >
                Option {v.toUpperCase()}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  ),
}
