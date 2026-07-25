import type { Meta, StoryObj } from '@storybook/nextjs'

import { Heading } from '../heading'
import { Link } from '../link'
import { Text } from '../text'
import { Card, CardContent, CardFooter, CardHeader } from './index'

const meta = {
  title: 'Primitives/Card',
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="max-w-sm p-6">
      <Card>
        <CardContent>
          <Heading as="h3" size="h4">
            Card title
          </Heading>
          <Text>
            Sample card body text demonstrating the default tone and layout.
          </Text>
        </CardContent>
        <CardFooter>
          <Link href="/sample">Read more</Link>
        </CardFooter>
      </Card>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
      {(['default', 'muted'] as const).map((tone) => (
        <div key={tone} className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default/70">
            tone={tone}
          </span>
          <Card tone={tone}>
            <CardContent>
              <Heading as="h3" size="h4">
                Sample heading
              </Heading>
              <Text>Sample body text for the {tone} card variant.</Text>
            </CardContent>
            <CardFooter>
              <Link href="/sample">Read more</Link>
            </CardFooter>
          </Card>
        </div>
      ))}
      <div className="flex flex-col gap-2 md:col-span-2">
        <span className="text-body-sm font-medium text-text-default/70">
          as=&quot;article&quot; with bleed CardHeader
        </span>
        <Card as="article">
          <CardHeader bleed>
            <div
              className="flex h-40 items-center justify-center bg-brand-primary/10 text-text-default/70"
              aria-hidden="true"
            >
              [bleed media slot]
            </div>
          </CardHeader>
          <CardContent>
            <Heading as="h3" size="h4">
              Article-shaped card
            </Heading>
            <Text>Polymorphic root, edge-to-edge media via bleed prop.</Text>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
}
