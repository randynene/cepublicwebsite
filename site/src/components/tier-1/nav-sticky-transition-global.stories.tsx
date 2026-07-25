// Story placeholder — Tier-1 composite component not yet implemented (lands
// at TEMPLATE-* phases per Step 3 brief HALT 1 lock L4). Story renders
// primitive decomposition per §3 Tech stack with mock data per §6 Data
// binding. NO library wiring per Brief A Hard Rule #7. Update at
// TEMPLATE-NAV phase to reflect actual implementation.
//
// Spec: docs/design/components/nav-sticky-transition-global.md
// §3 Tech stack: GSAP 3.12.5 + ScrollTrigger + plain JS toggle
//   composing A2 Link / D3 DropdownMenu / Icon / A1 Button.
// §4 Timing (GSAP-mixed; shim missed ScrollTrigger.create — extracted from
//   ce-template-custom-code.json source):
//   ScrollTrigger.create({ trigger: ccHero, start: "top top",
//   end: "bottom bottom", onLeave/onEnterBack: class-flips }).
//   CSS transition durations on .active-nav / .active-logo / .is-open
//   are TBD-pending-capture (resolve at TEMPLATE-NAV via DevTools).
//
// Scaffold deviation: ScrollTrigger.create() is library wiring. This story
// renders both visual end-states (transparent-over-hero, active-over-content)
// statically as side-by-side previews. No scroll listener, no class flip.

import type { Meta, StoryObj } from '@storybook/nextjs'

import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Link } from '../ui/link'

const meta = {
  title: 'Tier-1/nav-sticky-transition-global',
} satisfies Meta

export default meta
type Story = StoryObj

function ScaffoldNote() {
  return (
    <div className="rounded-md border border-brand-tertiary/20 bg-brand-tertiary/5 p-4 text-body-sm text-text-default">
      <p className="font-medium">Scaffold-stage preview — TEMPLATE-NAV pending.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Library: GSAP 3.12.5 + ScrollTrigger plugin observe <code>.cc-hero</code>.
        </li>
        <li>
          <code>onLeave</code> adds <code>.active-nav</code> /{' '}
          <code>.active-logo</code> / <code>.invert</code> class-flips;{' '}
          <code>onEnterBack</code> reverses.
        </li>
        <li>
          Mobile menu: plain JS toggles <code>.is-open</code> on click.
        </li>
        <li>
          GROQ:{' '}
          <code>
            *[_type == &quot;navigation&quot;][0]{'{ primaryLinks, ctaButton, localeDropdown }'}
          </code>
        </li>
        <li>
          CSS transition durations on the flip targets — TBD-pending-capture at TEMPLATE-NAV.
        </li>
      </ul>
    </div>
  )
}

const sampleNav = {
  primaryLinks: [
    { label: 'Sample Services', url: '/services' },
    { label: 'Sample Technology', url: '/technology' },
    { label: 'Sample Resources', url: '/resources' },
    { label: 'Sample About', url: '/about' },
  ],
  ctaButton: { label: 'Book a Call', url: '/book' },
}

function NavBar({ active }: { active: boolean }) {
  return (
    <nav
      aria-label="Primary navigation preview"
      className={
        active
          ? 'flex items-center justify-between gap-6 rounded-md bg-surface-elevated px-6 py-3 shadow-elevated'
          : 'flex items-center justify-between gap-6 rounded-md bg-brand-tertiary px-6 py-3 text-text-on-dark'
      }
    >
      <span className="font-medium">[Sample logo]</span>
      <ul className="hidden items-center gap-4 md:flex">
        {sampleNav.primaryLinks.map((it) => (
          <li key={it.url}>
            <Link
              href={it.url}
              tone={active ? 'cc-blue' : 'cc-white'}
              className="flex items-center gap-1 hover:no-underline"
            >
              {it.label}
              <Icon
                name="chevron-right"
                size="sm"
                className={
                  active ? 'rotate-90' : 'rotate-90 [filter:invert(1)]'
                }
              />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        {active ? (
          <Button size="sm">{sampleNav.ctaButton.label}</Button>
        ) : (
          <Button size="sm" variant="primary-yellow">
            {sampleNav.ctaButton.label}
          </Button>
        )}
      </div>
    </nav>
  )
}

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <ScaffoldNote />
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          state: at-hero (transparent over .cc-hero)
        </span>
        <NavBar active={false} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          state: past-hero (active over content — .active-nav class set)
        </span>
        <NavBar active={true} />
      </div>
      <p className="text-body-sm text-text-default/70">
        Working impl: ScrollTrigger flips class on <code>.cc-hero</code> bottom;
        CSS transitions handle the visual swap.
      </p>
    </div>
  ),
}
