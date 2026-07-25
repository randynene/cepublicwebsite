'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'

import { Button } from '../button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './index'

const meta = {
  title: 'Primitives/DropdownMenu',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Sample actions</DropdownMenuLabel>
          <DropdownMenuItem>Sample item one</DropdownMenuItem>
          <DropdownMenuItem>Sample item two</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sample item three</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}

function StatefulDropdown() {
  const [showA, setShowA] = useState(true)
  const [showB, setShowB] = useState(false)
  const [radio, setRadio] = useState('option-a')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Open with state</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Sample filters</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={showA}
          onCheckedChange={(v) => setShowA(!!v)}
        >
          Sample toggle A
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showB}
          onCheckedChange={(v) => setShowB(!!v)}
        >
          Sample toggle B
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sample sort</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={radio} onValueChange={setRadio}>
          <DropdownMenuRadioItem value="option-a">
            Option A
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="option-b">
            Option B
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          closed (click trigger to open)
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open simple menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Sample item one</DropdownMenuItem>
            <DropdownMenuItem disabled>
              Sample item two (disabled)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          checkbox + radio items (stateful)
        </span>
        <StatefulDropdown />
      </div>
      <p className="text-body-sm text-text-default/70">
        Item highlight pattern matches Select
        (data-[highlighted]:bg-surface-base + brand-primary text).
      </p>
    </div>
  ),
}
