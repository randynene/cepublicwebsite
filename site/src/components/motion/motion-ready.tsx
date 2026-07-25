'use client'

import { useEffect } from 'react'

/**
 * Mount-effect flag, rendered once near the root layout. Adds `motion-ready`
 * to <html> after hydration. Every reveal/pulse rule in the motion layer
 * (globals.css) is gated behind `html.motion-ready` — so with JS disabled,
 * or before this effect has run, all motion-layer content renders in its
 * final, fully visible state. Renders no DOM of its own.
 */
export function MotionReady() {
  useEffect(() => {
    document.documentElement.classList.add('motion-ready')
  }, [])
  return null
}
