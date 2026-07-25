// Story placeholder — Tier-1 composite component not yet implemented (lands
// at TEMPLATE-* phases per Step 3 brief HALT 1 lock L4). Story renders
// primitive decomposition per §3 Tech stack with mock data per §6 Data
// binding. NO library wiring per Brief A Hard Rule #7. Update at
// TEMPLATE-HOME phase to reflect actual implementation.
//
// Spec: docs/design/components/home-hero-scale-in.md
// §3 Tech stack: GSAP 3.12.5 (no plugins) animating E1 Image only.
// §4 Timing (GSAP-clean; shim-extracted from gsap-home.json entry 10):
//   gsap.fromTo('img.hero-img.align-top',
//     { scale: 1.2 },
//     { scale: 1, duration: 1.5, ease: 'power2.out' });
//   1500ms power2.out, runs once per useEffect mount, no replay on scroll.
//
// Scaffold deviation: GSAP fromTo is library wiring. This story renders the
// hero image at scale 1.0 (final state) statically. Animation runs at
// TEMPLATE-HOME via dynamic-imported GSAP inside useEffect.

import type { Meta, StoryObj } from '@storybook/nextjs'

import { Image } from '../ui/image'

const meta = {
  title: 'Tier-1/home-hero-scale-in',
} satisfies Meta

export default meta
type Story = StoryObj

function ScaffoldNote() {
  return (
    <div className="rounded-md border border-brand-tertiary/20 bg-brand-tertiary/5 p-4 text-body-sm text-text-default">
      <p className="font-medium">Scaffold-stage preview — TEMPLATE-HOME pending.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Library: GSAP 3.12.5 (no plugins) animates E1 Image scale 1.2 → 1.</li>
        <li>Duration 1500ms · easing power2.out · runs once per mount.</li>
        <li>
          GROQ: <code>*[_type == &quot;homePage&quot;][0]{'{ heroImage }'}</code>
        </li>
        <li>
          Image uses <code>priority</code> + <code>fetchPriority=&quot;high&quot;</code>{' '}
          — transform doesn&apos;t block LCP.
        </li>
        <li>
          Reduced-motion: animation skipped via{' '}
          <code>useReducedMotion()</code>; image renders at scale 1.0 immediately.
        </li>
      </ul>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <ScaffoldNote />
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          static preview — final state (scale 1.0)
        </span>
        <div className="relative aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-md bg-brand-tertiary">
          <Image
            src="/og-default.png"
            alt="Sample hero image"
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            priority
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-text-default/60 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>
      <p className="text-body-sm text-text-default/70">
        Working impl: <code>gsap.fromTo</code> the same image element from
        scale 1.2 to 1.0 over 1.5s on mount. Decorative siblings
        (<code>.circle-hero</code>, <code>.gradient-top</code>) stay static.
      </p>
    </div>
  ),
}
