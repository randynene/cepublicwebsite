'use client'

import Link from 'next/link'

import { CtaButton } from '@/components/ui/cta-button'
import { buildLocalePath, type Locale } from '@/lib/locale-path'

import { ASK_LABELS, GLYPH } from './content'

// The /ask header: logo, Back to site, Talk to a human. Three things, nothing else.
//
// No mega-nav, no announcement bar, no footer. /ask is a conversation surface, and
// the sitewide chrome gives the visitor five ways to leave it before they have said
// anything. The opt-out is wired in src/app/layout.tsx (see isAskPath).
//
// Both controls are `CtaButton`, which is the same archetype the sitewide header
// uses for its own CTA - so they carry the identical hover language (globals.css
// "ACCENT CHIP CLUSTER"): a deeper lime sweeps across the solid pill while its arrow
// slides out and the pill lifts on a lime shadow, and lime sweeps into the outline
// chip while its label flips dark. `MegaMenuPillLabel` (the `.sf-*` sweep) was here
// first and looked close, but it is a different archetype with a different fill.
//
// Two deliberate differences from the sitewide header:
//
//   - Talk to a human is a <button>, not a link to /book-a-call. On this page it
//     opens the booking canvas in place, so the conversation and the brief survive
//     the booking.
//   - Back to site exists BECAUSE this header is a dead end otherwise. Stripping the
//     nav removes every route out, and leaving the logo as the only exit is not
//     discoverable enough for a page a visitor may land on cold.

// Matched size for the pair. `min-w` rather than a fixed width, and generous enough
// that neither pill grows on hover: the solid archetype trades padding-right for gap
// as its arrow slides out, and at 190px both the resting and the hovered content fit
// inside the same box, so nothing beside them can shift.
//
// `!` throughout because CtaButton's own size variant carries viewport-tier padding
// (`min-[1360px]:px-[24px]`) and the sweep's hover rules live in unlayered CSS, both
// of which outrank a plain utility. Same idiom as the CTA overrides in
// templates/home and templates/how-it-works.
const CTA_SHAPE = [
  // Compact tier: no matched width, because below 576px Back to site is an icon and
  // there is nothing to match it to.
  '!h-[38px] !py-0 !text-[13px] @max-[30rem]:!px-[13px]',
  // Both labels visible from 576px, which is the narrowest width that fits the logo
  // plus two 160px pills. Sized so the hovered content still fits (see above).
  '@min-[36rem]:!min-w-[160px]',
  // Full size.
  '@min-[62rem]:!h-[46px] @min-[62rem]:!min-w-[190px] @min-[62rem]:!text-[15px]',
].join(' ')

export function AskHeader({
  locale,
  onSchedule,
}: {
  locale: Locale
  onSchedule: () => void
}) {
  const home = buildLocalePath('/', locale)

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-[10px] border-b border-[#1a2740] px-[10px] @min-[30rem]:px-[16px] @min-[62rem]:h-[76px] @min-[62rem]:gap-[12px] @min-[62rem]:px-[24px]">
      <Link
        href={home}
        aria-label={ASK_LABELS.logoHome}
        className="inline-flex shrink-0 items-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[2px] focus-visible:ring-offset-bg-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ce-logo.svg"
          alt=""
          aria-hidden="true"
          className="block h-[18px] w-auto @min-[30rem]:h-[24px] @min-[62rem]:h-[30px]"
        />
      </Link>

      <div className="flex shrink-0 items-center gap-[8px] @min-[62rem]:gap-[12px]">
        {/* Below 576px the three controls cannot share a line without clipping the
            CTA, so Back to site drops its label and keeps a back arrow below 576px. It stays the
            same control with the same accessible name either way. */}
        <CtaButton
          as="a"
          href={home}
          aria-label={ASK_LABELS.backToSite}
          variant="outline"
          label={GLYPH.arrowLeft}
          className={`${CTA_SHAPE} !px-[13px] @min-[36rem]:hidden`}
        />
        <CtaButton
          as="a"
          href={home}
          variant="outline"
          label={ASK_LABELS.backToSite}
          className={`hidden ${CTA_SHAPE} @min-[36rem]:inline-flex`}
        />
        <CtaButton
          as="button"
          onClick={onSchedule}
          variant="solid"
          label={ASK_LABELS.talkToHuman}
          className={CTA_SHAPE}
        />
      </div>
    </header>
  )
}
