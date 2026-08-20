'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
}

/**
 * Tiny IntersectionObserver wrapper for scroll-triggered reveals. Fires once:
 * as soon as the element crosses the threshold it unobserves itself, so the
 * returned `inView` flag never flips back to false on scroll-up (reveal
 * animations play exactly once).
 *
 * No dependency on framer-motion — this + CSS transitions is the whole
 * motion layer (see reveal.tsx + globals.css motion-layer block).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
): [RefObject<T | null>, boolean] {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = options
  const ref = useRef<T>(null)
  // Deterministic `false` on both the server render and the first client
  // render avoids a hydration mismatch on the `is-in-view` class (Tech Debt
  // #57) — `typeof IntersectionObserver` differs between the two
  // environments, so it can't drive the initial state. The CSS gate is
  // `html.motion-ready .reveal`, and that class only lands post-hydration
  // (globals.css motion-layer block), so starting hidden-from-CSS's
  // perspective here is a no-op visually.
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // No IntersectionObserver support (very old browsers): reveal
      // immediately rather than leaving the element permanently gated. This
      // environment fact is unknowable at render time (SSR has no DOM at
      // all), so there is no earlier point to set it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true)
      return
    }
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.unobserve(el)
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView]
}
