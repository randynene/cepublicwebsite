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
  // No IntersectionObserver support (very old browsers): initialize straight
  // to visible rather than leaving the element permanently gated by CSS (see
  // global visibility rule). Computed once at init, not via a setState-in-
  // effect side-step, to satisfy react-hooks/set-state-in-effect.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
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
