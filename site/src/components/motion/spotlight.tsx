'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'

// Cursor-following lime spotlight, generalised from the homepage ClientStory
// section. A radial-gradient overlay tracks the cursor; only elements marked
// `data-spot-item` dim at rest and brighten while the cursor is over the
// section. The CALLER controls which elements dim (add data-spot-item + a
// `motion-safe:opacity-*` class) - the cards/CTAs must NOT be marked, so they
// stay full-bright. prefers-reduced-motion users get full opacity, no glow.
//
// Reserve it for statement moments and decision grids on the `#070D18` ground.
// It is the wrong tool for forms, calculators, marquees and accordions, where
// the section already owns the visitor's cursor.

const GLOW_R = 360
const OVERLAY_INSET = 320

export function Spotlight({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const reducedRef = useRef(false)

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const items = useCallback(
    () => sectionRef.current?.querySelectorAll<HTMLElement>('[data-spot-item]') ?? [],
    [],
  )

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (reducedRef.current) return
      const section = sectionRef.current
      const glow = glowRef.current
      if (!section || !glow) return
      const rect = section.getBoundingClientRect()
      // The overlay bleeds vertically only, so X maps 1:1 to the section and
      // only Y carries the inset offset. See the overlay style below.
      const ox = e.clientX - rect.left
      const oy = e.clientY - rect.top + OVERLAY_INSET
      glow.style.background = `radial-gradient(circle ${GLOW_R}px at ${ox}px ${oy}px, rgba(212,255,60,.16), transparent 72%)`
      glow.style.opacity = '1'
      for (const el of items()) el.style.opacity = '1'
    },
    [items],
  )

  const onLeave = useCallback(() => {
    if (reducedRef.current) return
    if (glowRef.current) glowRef.current.style.opacity = '0'
    // Clear inline opacity so the caller's motion-safe:opacity-* class re-dims.
    for (const el of items()) el.style.opacity = ''
  }, [items])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    el.addEventListener('mousemove', onMove as EventListener)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove as EventListener)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [onMove, onLeave])

  return (
    <section ref={sectionRef} className={cn('relative overflow-visible bg-[#070D18]', className)}>
      {/* Bleeds above and below the section so the glow circle fades past those
          edges instead of being hard-clipped. Left and right stay FLUSH: this
          used to be `inset: -320px`, which made the overlay 640px wider than
          the section and gave the whole home page a 320px sideways scroll.
          home/client-story.tsx — the section this component was generalised
          from — always had it this way and documented the reason. */}
      <div
        ref={glowRef}
        aria-hidden="true"
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
      <div className="relative z-[1]">{children}</div>
    </section>
  )
}
