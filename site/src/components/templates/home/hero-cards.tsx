'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

import { cn } from '@/components/ui/_utils/cn'
import type { HomeProfile } from './content'

// Hero photo cards with hover-parallax drift. Separated into a client
// component so the rest of HomeTemplate stays server-rendered.
// Motion respects prefers-reduced-motion.
//
// Content (names, roles, flags, photos, skill chips, and the two floating
// pills) is passed in from the resolved home content — Sanity-backed via the
// homePage singleton, with the static HOME_CONTENT as fallback. Only the visual
// LAYOUT (position, rotation, scrim, stacking order) lives here, because that
// is presentation, not editable content.
//
// The `profiles` array maps to the three card slots IN ORDER:
//   profiles[0] -> back card, top-right
//   profiles[1] -> middle card, bottom-right
//   profiles[2] -> front card, bottom-left (the main / largest face)
// Skill chips render from each profile's `tags` (first tag styled lime).

const GLYPH_CHECK = '\u2713'
const GLYPH_BOLT = '\u26A1'
const GLYPH_CLOCK = '\u25F7'

const VETTED_TEXT = 'VETTED BY SENIOR ENG'
// Fallbacks only — the live labels come from hero.floatingPills in Sanity.
const PILL_LIVE_FALLBACK = 'Live pair programming'
const PILL_SHORTLIST_FALLBACK = '7-day shortlist'

interface Slot {
  posStyle: React.CSSProperties
  baseRotate: string
  /** Numeric degrees matching baseRotate — feeds the --card-rot CSS var so the
   * entrance keyframe (globals.css) preserves rotation through the scale-in. */
  rotDeg: number
  scrim: 'top' | 'bottom'
}

const SLOTS: Slot[] = [
  // 0 — back card, top-right
  {
    posStyle: { position: 'absolute', right: 0, top: -8, width: 300, height: 360, zIndex: 1 },
    baseRotate: 'rotate(2.5deg)',
    rotDeg: 2.5,
    scrim: 'top',
  },
  // 1 — middle card, bottom-right (sits in front of the back card)
  {
    posStyle: { position: 'absolute', right: 8, top: 210, width: 300, height: 360, zIndex: 2 },
    baseRotate: 'rotate(3deg)',
    rotDeg: 3,
    scrim: 'bottom',
  },
  // 2 — front card, bottom-left (on top, the main face)
  {
    posStyle: { position: 'absolute', left: 0, top: 112, width: 300, height: 380, zIndex: 3 },
    baseRotate: 'rotate(-3deg)',
    rotDeg: -3,
    scrim: 'bottom',
  },
]

function HoverCard({
  profile,
  slot,
  index,
}: {
  profile: HomeProfile
  slot: Slot
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.current = mq.matches
    const handler = (e: MediaQueryListEvent) => { reduced.current = e.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced.current || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const dx = (e.clientX - rect.left) / rect.width - 0.5
      const dy = (e.clientY - rect.top) / rect.height - 0.5
      ref.current.style.transform = `${slot.baseRotate} translate(${dx * 9}px,${dy * 9 - 7}px)`
    },
    [slot.baseRotate],
  )

  const handleLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = slot.baseRotate
  }, [slot.baseRotate])

  const chips = profile.tags ?? []

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="hero-card-reveal overflow-hidden rounded-[24px]"
      style={
        {
          ...slot.posStyle,
          transform: slot.baseRotate,
          boxShadow: 'inset 0 0 0 10px #22314D, 0 24px 30px rgba(14,27,44,.14)',
          willChange: 'transform',
          transition: 'transform .28s cubic-bezier(.2,.8,.2,1)',
          '--card-rot': `${slot.rotDeg}deg`,
          '--reveal-delay': `${index * 90}ms`,
        } as React.CSSProperties
      }
    >
      {profile.image ? (
        <Image
          src={profile.image}
          alt={profile.name}
          fill
          sizes="300px"
          className="object-cover"
          priority
        />
      ) : null}

      {/* Top scrim — on every card so the name + role always read clearly
       * against the photo. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(6,15,30,.82) 0%, rgba(6,15,30,.45) 24%, rgba(6,15,30,0) 52%)' }}
      />

      {/* Bottom scrim (middle + front cards) */}
      {slot.scrim === 'bottom' && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(0deg, rgba(6,15,30,.98) 0%, rgba(6,15,30,.85) 22%, rgba(6,15,30,0) 60%)' }}
        />
      )}

      {/* Name + flag — always top */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-[16px]">
        <div>
          <div className="text-[19px] font-semibold leading-[24px] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.85)]">
            {profile.name}
          </div>
          <div className="mt-[2px] text-[12.5px] font-medium text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,.9)]">
            {profile.role}
          </div>
        </div>
        {profile.flag ? (
          <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-black/45 text-[14px] backdrop-blur-sm">
            {profile.flag}
          </span>
        ) : null}
      </div>

      {/* Vetted badge + skill chips — bottom (only cards that have tags) */}
      {chips.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[9px] p-[16px]">
          <div className="flex items-center gap-[5px] self-start rounded-full bg-black/55 px-[10px] py-[6px] text-[11px] font-bold uppercase tracking-[0.6px] text-white backdrop-blur-sm">
            <span className="text-brand-primary">{GLYPH_CHECK}</span>
            <span>{VETTED_TEXT}</span>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {chips.map((chip, i) => (
              <span
                key={`${i}-${chip}`}
                className={cn(
                  'rounded-full px-[10px] py-[5px] text-[12px] font-bold',
                  i === 0
                    ? 'bg-brand-primary text-[#060F1E]'
                    : 'bg-black/55 text-white backdrop-blur-sm',
                )}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function HeroCards({
  profiles,
  pills,
}: {
  profiles: readonly HomeProfile[]
  pills?: readonly string[]
}) {
  const cards = profiles.slice(0, SLOTS.length)
  // When the caller passes an explicit pills array (including a 1-pill location
  // hero), honour it exactly. Only the home page's "omit pills" path uses the
  // two-pill fallbacks.
  const resolvedPills =
    pills !== undefined
      ? pills.filter((p) => p.trim().length > 0).slice(0, 2)
      : [PILL_LIVE_FALLBACK, PILL_SHORTLIST_FALLBACK]
  const primaryPill = resolvedPills[0]
  const secondaryPill = resolvedPills[1]

  return (
    <div className="relative h-[518px] overflow-visible">
      {cards.map((profile, i) => (
        <HoverCard key={`${i}-${profile.name}`} profile={profile} slot={SLOTS[i]} index={i} />
      ))}

      {/* Floating pill: bolt — right side, z:5. Fades+rises in ~250ms after the
       * card stack (hero-pill-reveal, globals.css). */}
      {primaryPill ? (
        <span
          className="hero-pill-reveal absolute z-[5] flex cursor-default items-center gap-[8px] rounded-full text-[12px] font-semibold text-[#060F1E] shadow-[0_8px_24px_rgba(14,27,44,.12)]"
          style={{ right: -14, top: 250, background: '#F7F9F0', padding: '7px 14px 7px 7px' }}
        >
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand-primary text-[11px] text-[#060F1E]">
            {resolvedPills.length === 1 ? GLYPH_CLOCK : GLYPH_BOLT}
          </span>
          {primaryPill}
        </span>
      ) : null}

      {/* Floating pill: clock — lower-left, z:5 */}
      {secondaryPill ? (
        <span
          className="hero-pill-reveal absolute z-[5] flex cursor-default items-center gap-[8px] rounded-full bg-white text-[12px] font-semibold text-[#060F1E] shadow-[0_8px_24px_rgba(14,27,44,.12)]"
          style={{ left: 236, top: 322, padding: '7px 14px 7px 7px' }}
        >
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#E8F7D4] text-[11px] text-[#060F1E]">
            {GLYPH_CLOCK}
          </span>
          {secondaryPill}
        </span>
      ) : null}
    </div>
  )
}
