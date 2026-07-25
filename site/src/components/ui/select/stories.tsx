import type { Meta, StoryObj } from '@storybook/nextjs'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index'

const meta = {
  title: 'Primitives/Select',
} satisfies Meta

export default meta
type Story = StoryObj

const items = [
  { value: '0-1', label: '0–1 years' },
  { value: '2-5', label: '2–5 years' },
  { value: '5+', label: '5+ years' },
]

export const Default: Story = {
  render: () => (
    <div className="max-w-sm p-6">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={it.value} value={it.value}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          default (placeholder)
        </span>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          with value selected
        </span>
        <Select defaultValue="2-5">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          aria-invalid (error ring)
        </span>
        <Select>
          <SelectTrigger aria-invalid="true">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          disabled
        </span>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-text-default/70">
          grouped + separator
        </span>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Pick experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="0-1">0–1 years</SelectItem>
              <SelectItem value="2-5">2–5 years</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="5+">5+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-body-sm text-text-default/70">
        Click the trigger to open the portal-rendered dropdown and exercise
        item highlight + keyboard nav.
      </p>
    </div>
  ),
}
