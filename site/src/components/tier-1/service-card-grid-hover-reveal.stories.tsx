// Story placeholder — Tier-1 composite component not yet implemented (lands
// at TEMPLATE-* phases per Step 3 brief HALT 1 lock L4). Story renders
// primitive decomposition per §3 Tech stack with mock data per §6 Data
// binding. NO library wiring per Brief A Hard Rule #7. Update at
// TEMPLATE-SERVICE phase to reflect actual implementation.
//
// Spec: docs/design/components/service-card-grid-hover-reveal.md
// §3 Tech stack: pure CSS — composing A4 Card / A1 Button / B1 Heading /
//   B2 Text / E1 Image. NO library; live site is also CSS-only.
// §4 Timing (CSS-source-extracted): all hover transitions 200ms linear.
//   Card lift translateY(0 → -16px) + shadow 0 2px 16px #0003.
//   CTA button padding-left 40 → 45px.
//   Arrow icon opacity swap (TBD-pending-capture at TEMPLATE-SERVICE).
//
// Scaffold deviation note: §3 says CSS-only — no library wiring needed.
// The hover transitions in this story ARE the working implementation
// (rendered CSS, not JS-driven). What lands at TEMPLATE-SERVICE is the
// Sanity GROQ wiring + service.slug routing + thumbnail fallback +
// reduced-motion media query. The visual hover behaviour you see here
// matches the live-site pattern.

import type { Meta, StoryObj } from '@storybook/nextjs'

import { Button } from '../ui/button'
import { Heading } from '../ui/heading'
import { Image } from '../ui/image'
import { Text } from '../ui/text'

const meta = {
  title: 'Tier-1/service-card-grid-hover-reveal',
} satisfies Meta

export default meta
type Story = StoryObj

function ScaffoldNote() {
  return (
    <div className="rounded-md border border-brand-tertiary/20 bg-brand-tertiary/5 p-4 text-body-sm text-text-default">
      <p className="font-medium">
        Scaffold-stage preview — TEMPLATE-SERVICE pending.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Library: none (CSS-only — visual behaviour matches live site).</li>
        <li>
          Hover: 200ms linear · card translateY(-16px) + box-shadow ·
          CTA padding-left 40→45px.
        </li>
        <li>
          GROQ:{' '}
          <code>
            *[_type == &quot;service&quot;] | order(coalesce(order, 9999) asc)
          </code>
        </li>
        <li>
          Schema-vs-reality: <code>folds[0].subhead</code> projection assumed
          for description preview — verify at TEMPLATE-SERVICE.
        </li>
        <li>
          Reduced-motion override (<code>prefers-reduced-motion: reduce</code>)
          collapses transitions to 0ms — wired at TEMPLATE-SERVICE.
        </li>
      </ul>
    </div>
  )
}

const sampleServices = [
  {
    _id: 'svc-1',
    slug: 'sample-one',
    name: 'Sample Service One',
    shortLabel: 'Sample One',
    description: 'Sample fold-zero subhead text used as the description preview.',
    prefix: 'hire',
  },
  {
    _id: 'svc-2',
    slug: 'sample-two',
    name: 'Sample Service Two',
    shortLabel: 'Sample Two',
    description: 'Sample fold-zero subhead for the second card in the grid.',
    prefix: 'build',
  },
  {
    _id: 'svc-3',
    slug: 'sample-three',
    name: 'Sample Service Three',
    shortLabel: 'Sample Three',
    description: 'Sample fold-zero subhead for the third card in the grid.',
    prefix: 'expert',
  },
]

const PREFIX_LABEL: Record<string, string> = {
  hire: 'Hire Now',
  build: 'Build with Sample',
  expert: 'Expert in Sample',
  endToEnd: 'End-to-end Sample',
}

function ServiceCard({ svc }: { svc: (typeof sampleServices)[number] }) {
  return (
    <a
      href={`/services/${svc.slug}`}
      className="group relative flex h-80 flex-col overflow-hidden rounded-lg bg-brand-tertiary text-text-on-dark transition-all duration-200 ease-linear hover:-translate-y-4 hover:shadow-[0_2px_16px_#0003] focus-visible:-translate-y-4 focus-visible:shadow-[0_2px_16px_#0003] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
      aria-label={svc.name}
    >
      <div
        className="absolute inset-0 z-0 bg-brand-primary/30"
        aria-hidden="true"
      >
        <Image src="/og-default.png" alt="" fill sizes="33vw" />
      </div>
      <div
        className="absolute inset-0 z-10 bg-gradient-to-t from-text-default/70 via-text-default/30 to-transparent"
        aria-hidden="true"
      />
      <div className="relative z-20 mt-auto flex flex-col gap-3 p-6">
        <Heading as="h3" size="h4" className="text-text-on-dark">
          {svc.shortLabel}
        </Heading>
        <Text size="small" className="text-text-on-dark/90">
          {svc.description}
        </Text>
        <span className="inline-flex w-fit items-center gap-2 rounded-button bg-brand-secondary px-10 py-1.5 text-body-sm font-medium text-text-dark transition-all duration-200 ease-linear group-hover:pl-[45px] group-focus-visible:pl-[45px]">
          {PREFIX_LABEL[svc.prefix] ?? 'Learn More'}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </a>
  )
}

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <ScaffoldNote />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleServices.map((svc) => (
          <ServiceCard key={svc._id} svc={svc} />
        ))}
      </div>
      <p className="text-body-sm text-text-default/70">
        Hover or focus a card to see the lift + button-widen treatment — they
        run via CSS transition, no JS. Arrow-icon opacity swap is
        TBD-pending-capture at TEMPLATE-SERVICE.
      </p>
    </div>
  ),
}

// Alias for the inventory's documented variant axis (single visual variant) —
// kept for the brief's AllVariants convention even when there's only one.
export const AllVariants: Story = Default
