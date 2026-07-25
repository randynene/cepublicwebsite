// Story placeholder — Tier-1 composite component not yet implemented (lands
// at TEMPLATE-* phases per Step 3 brief HALT 1 lock L4). Story renders
// primitive decomposition per §3 Tech stack with mock data per §6 Data
// binding. NO library wiring per Brief A Hard Rule #7. Update at the first
// TEMPLATE-* phase that mounts <FadeReveal> (likely TEMPLATE-HOME) to
// reflect actual implementation.
//
// Spec: docs/design/components/section-fade-reveal-global.md
// §3 Tech stack: GSAP 3.12.5 + ScrollTrigger plugin orchestrating
//   yPercent + opacity tweens on arbitrary children. NO primitive
//   composition — this is a render utility (see render-utility
//   classification in CONVENTIONS.md / CAPABILITY_LOG.md).
// §6 Data binding: N/A — render utility (Path A mechanical trigger,
//   HALT 3 Step 3 brief).
// §4 Timing (GSAP-attribute-selector orchestration; shim-extracted from
//   gsap-home.json entries 4–9 + cross-referenced with
//   ce-template-custom-code.json source):
//     [fade-animation] (parent + child stagger):
//       yPercent: 10 → 0, opacity: 0 → 1, stagger 0.1s, ease power2.out,
//       ScrollTrigger { start: "top 90%" }, implicit duration ~500ms.
//     [cms-fade-animation] (single element, no stagger):
//       yPercent: 10 → 0, opacity: 0 → 1, ease power2.out,
//       ScrollTrigger { start: "top 90%" }, implicit duration ~500ms.
//
// Scaffold deviation: GSAP + ScrollTrigger are library wiring. This story
// renders the wrapper-shape pattern with placeholder children in their
// FINAL state (yPercent 0, opacity 1) — no animation, no scroll observer.
// Per spec §7 SSR note: children must render in final state on first paint
// to avoid flash-of-hidden-content / LCP block; the scaffold preview
// matches that final-state shape exactly.

import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Tier-1/section-fade-reveal-global',
} satisfies Meta

export default meta
type Story = StoryObj

function ScaffoldNote() {
  return (
    <div className="rounded-md border border-brand-tertiary/20 bg-brand-tertiary/5 p-4 text-body-sm text-text-default">
      <p className="font-medium">
        Scaffold-stage preview — render utility, lands at first TEMPLATE-* phase that mounts the wrapper.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Library: GSAP 3.12.5 + ScrollTrigger plugin (dynamic-imported on demand).</li>
        <li>
          <code>[fade-animation]</code>: yPercent 10→0 + opacity 0→1 + stagger
          0.1s + power2.out + ScrollTrigger top 90% (children-stagger mode).
        </li>
        <li>
          <code>[cms-fade-animation]</code>: same config, no stagger
          (single-element mode).
        </li>
        <li>Implicit duration ~500ms (GSAP 3.12.5 default; verify at TEMPLATE-* capture pass).</li>
        <li>Render utility — §6 Data binding declares &quot;N/A — render utility&quot; per HALT 3 Path A trigger.</li>
        <li>SSR + reduced-motion render children in final state (no FOHC, no LCP block).</li>
      </ul>
    </div>
  )
}

// Wrapper-shape preview — does NOT animate. Captures the API shape that
// TEMPLATE-* will eventually wire to GSAP+ScrollTrigger inside useEffect.
function FadeRevealStub({
  mode = 'stagger',
  children,
}: {
  mode?: 'stagger' | 'single'
  children: React.ReactNode
}) {
  return (
    <div
      data-fade-mode={mode}
      className="flex flex-col gap-3 rounded-md border border-dashed border-brand-primary/30 p-4"
    >
      <span className="text-body-sm font-mono text-brand-primary">
        &lt;FadeReveal mode=&quot;{mode}&quot;&gt; (stub — final state)
      </span>
      {children}
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <ScaffoldNote />
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          mode=stagger — wraps a parent; children animate one-by-one
        </span>
        <FadeRevealStub mode="stagger">
          <h2 className="text-h2 font-medium">Sample section heading</h2>
          <p className="text-body">Sample supporting paragraph text.</p>
          <div className="grid grid-cols-3 gap-3">
            {(['a', 'b', 'c'] as const).map((k) => (
              <div
                key={k}
                className="flex h-20 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary"
              >
                Sample child {k.toUpperCase()}
              </div>
            ))}
          </div>
        </FadeRevealStub>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          mode=single — wraps an individual element (no stagger)
        </span>
        <FadeRevealStub mode="single">
          <div className="flex h-20 items-center justify-center rounded-md bg-brand-secondary/30 text-text-default">
            Sample CMS-card child
          </div>
        </FadeRevealStub>
      </div>
      <p className="text-body-sm text-text-default/70">
        Working impl: <code>useEffect</code> wires{' '}
        <code>gsap.from(children, {'{ ... }'})</code> with a ScrollTrigger on
        the wrapper element; <code>gsap.context()</code> + <code>ctx.revert()</code>{' '}
        on cleanup; <code>useReducedMotion()</code> short-circuits to final state.
      </p>
    </div>
  ),
}
