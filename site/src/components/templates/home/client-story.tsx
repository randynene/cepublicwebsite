'use client'

// TEMPLATE-HOME — ClientStory section extracted as a client component so it
// can implement the interactive lime glow. The quote, eyebrow, and attribution
// sit at opacity 0.4 by default (via motion-safe: CSS). On mousemove, a
// radial-gradient overlay tracks the cursor and each text element brightens
// by proximity to its own bounding box edges (not center), so the text goes
// to full white the instant the cursor lands over any part of it.
//
// Critical fade rules:
//   • Glow overlay: transition ONLY opacity (background cannot be animated —
//     it snaps). Use negative TOP/BOTTOM inset (-320px) so the circle fades out
//     past the vertical section edges instead of being hard-clipped. Left/right
//     stay flush (0): a horizontal bleed would exceed the viewport and give the
//     whole page a sideways scroll.
//   • Text opacity: set via el.style.opacity (overrides the CSS class). On
//     mouseleave, clear to '' so the motion-safe:opacity-40 class re-applies.
//   • prefers-reduced-motion: the motion-safe: Tailwind variant omits the dim
//     class entirely for reduced-motion users → full opacity, no glow, no JS.

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

import { cn } from '@/components/ui/_utils/cn'
import { HOME_CONTENT, type HomeContent, type HomeLogo } from './content'

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const EYEBROW_CLS =
  'text-[12px] font-semibold uppercase leading-[18.6px] tracking-[1.68px] text-brand-primary'
const MUTED = 'text-[#7F8CA0]'

// Inline logo renderer (mirrors LogoImage in index.tsx; duplicated to keep
// this 'use client' leaf independent of the parent server component).
function InlineLogoImage({ logo, className }: { logo: HomeLogo; className?: string }) {
  const filterCls =
    logo.invert === false
      ? '[filter:grayscale(1)_brightness(1.8)] opacity-95'
      : '[filter:brightness(0)_invert(1)] opacity-100'
  return (
    <Image
      src={logo.src}
      alt={logo.name}
      width={logo.width}
      height={logo.height}
      className={cn('h-auto w-auto object-contain', filterCls, className)}
    />
  )
}

// Radius of the glow circle (px) and how far the overlay extends past the
// section's bounding box. Must be large enough for the circle to fade out
// gracefully past top/bottom edges without clipping.
const GLOW_R = 360
const OVERLAY_INSET = 320

// Euclidean distance from point (cx, cy) to the nearest edge of a DOMRect.
// Returns 0 when the point is inside the rect.
function distToBox(rect: DOMRect, cx: number, cy: number): number {
  const dx = Math.max(rect.left - cx, 0, cx - rect.right)
  const dy = Math.max(rect.top - cy, 0, cy - rect.bottom)
  return Math.sqrt(dx * dx + dy * dy)
}

export function ClientStorySection({ content = HOME_CONTENT }: { content?: HomeContent }) {
  const { clientStory } = content

  const sectionRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLQuoteElement>(null)
  const eyebrowRef = useRef<HTMLParagraphElement>(null)
  const attrRef = useRef<HTMLDivElement>(null)
  const reducedRef = useRef(false)

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (reducedRef.current) return
    const section = sectionRef.current
    const glow = glowRef.current
    if (!section || !glow) return

    const rect = section.getBoundingClientRect()
    // The overlay bleeds OVERLAY_INSET px above and below the section (vertical
    // only — a horizontal bleed would make the overlay wider than the viewport
    // and force a sideways page scroll). So offset the gradient center on Y only;
    // X maps 1:1 because the overlay's left edge sits flush with the section's.
    const ox = e.clientX - rect.left
    const oy = e.clientY - rect.top + OVERLAY_INSET

    // Update gradient background (no transition — set directly, only opacity animates)
    glow.style.background = `radial-gradient(circle ${GLOW_R}px at ${ox}px ${oy}px, rgba(212,255,60,.12), transparent 72%)`
    glow.style.opacity = '1'

    // Brighten text elements by proximity to their nearest bounding-box edge
    const cx = e.clientX
    const cy = e.clientY
    const textRefs = [quoteRef, eyebrowRef, attrRef] as const
    for (const r of textRefs) {
      const el = r.current
      if (!el) continue
      const dist = distToBox(el.getBoundingClientRect(), cx, cy)
      const k = 1 - Math.min(dist, GLOW_R) / GLOW_R
      el.style.opacity = String(0.4 + 0.6 * k)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (reducedRef.current) return
    const glow = glowRef.current
    if (glow) glow.style.opacity = '0'
    // Clear inline style → CSS motion-safe:opacity-40 re-applies
    for (const r of [quoteRef, eyebrowRef, attrRef] as const) {
      if (r.current) r.current.style.opacity = ''
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove as EventListener)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove as EventListener)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#070D18]"
      style={{ paddingTop: '96px', paddingBottom: '112px', overflow: 'visible' }}
    >
      {/* Glow overlay — extends OVERLAY_INSET past the TOP and BOTTOM of the
          section so the gradient circle fades naturally past those edges with no
          hard cut. Left/right stay flush with the section (0) on purpose: a
          horizontal bleed would make this overlay wider than the viewport and
          give the whole page a sideways scroll.
          Transition only opacity (background cannot be animated; it snaps). */}
      <div
        ref={glowRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: -OVERLAY_INSET,
          bottom: -OVERLAY_INSET,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.5s ease',
          zIndex: 0,
        }}
      />

      <div className={BAND} style={{ position: 'relative', zIndex: 1 }}>
        {/* motion-safe:opacity-40: dims text for normal users (overridden by JS
            inline style during hover). Reduced-motion users: class is absent,
            text stays full opacity, no glow. */}
        <p
          ref={eyebrowRef}
          className={cn(EYEBROW_CLS, 'motion-safe:opacity-40')}
        >
          {clientStory.eyebrow}
        </p>

        <blockquote
          ref={quoteRef}
          className="motion-safe:opacity-40 mt-[32px] text-[24px] font-medium leading-[1.22] tracking-[-0.8px] text-white lg:text-[58px] lg:leading-[66px] lg:tracking-[-1.7px]"
        >
          {clientStory.quoteLines[0]}
          <br />
          {clientStory.quoteLines[1]}
          <br />
          {clientStory.quoteLines[2]}
        </blockquote>

        <div
          ref={attrRef}
          className="motion-safe:opacity-40 mt-[36px] flex items-center gap-[16px]"
        >
          <Image
            src={clientStory.avatar}
            alt={clientStory.name}
            width={64}
            height={64}
            className="h-[64px] w-[64px] shrink-0 rounded-full object-cover"
          />
          <div>
            <div className="text-[18px] font-bold leading-[22px] text-white">
              {clientStory.name}
            </div>
            <div className={cn('text-[15px]', MUTED)}>{clientStory.role}</div>
          </div>
          <span aria-hidden className="mx-[6px] h-[44px] w-px shrink-0 bg-[#22314D]" />
          <InlineLogoImage logo={clientStory.logo} className="max-h-[22px]" />
        </div>
      </div>
    </section>
  )
}
