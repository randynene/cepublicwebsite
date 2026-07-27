'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'

// Cursor-following lime spotlight, generalised from the homepage ClientStory
// section. A radial-gradient overlay tracks the cursor; only elements marked
// `data-spot-item` dim at rest and brighten while the cursor is over the
// section. The CALLER controls which elements dim (add data-spot-item + a
// `motion-safe:opacity-*` class) - the cards/CTAs must NOT be marked, so they
// stay full-bright. prefers-reduced-motion users get full opacity, no glow.

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
      const ox = e.clientX - rect.left + OVERLAY_INSET
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
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: -OVERLAY_INSET, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.5s ease', zIndex: 0 }}
      />
      <div className="relative z-[1]">{children}</div>
    </section>
  )
}
