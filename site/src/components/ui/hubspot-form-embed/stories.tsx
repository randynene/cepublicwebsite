import type { Meta, StoryObj } from '@storybook/nextjs'

import { HubSpotFormEmbed } from './index'

const meta = {
  title: 'Primitives/HubSpotFormEmbed',
} satisfies Meta

export default meta
type Story = StoryObj

// Storybook does not have real HubSpot credentials, so the deterministic
// state to demo is the error fallback. Passing portalId="" forces immediate
// error rendering (per HALT 6 Decision 5 — empty portal triggers fallback
// without waiting on the 8s timeout).
export const Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <HubSpotFormEmbed
        formId="00000000-0000-0000-0000-000000000000"
        portalId=""
        fallbackEmail="hello@example.com"
      />
    </div>
  ),
}
