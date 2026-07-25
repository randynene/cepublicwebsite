'use client'

import { useEffect, useRef, useState } from 'react'

import { useInView } from './use-in-view'

interface ParsedValue {
  prefix: string
  target: number
  decimals: number
  suffix: string
  hasComma: boolean
}

// Handles prefixes/suffixes ($8M, 40%, 5,400) and thousands separators.
// Returns null when no numeric run is found — caller falls back to the
// static string untouched.
function parseValue(raw: string): ParsedValue | null {
  const match = raw.match(/^([^\d]*)([\d,]*\d(?:\.\d+)?)([^\d]*)$/)
  if (!match) return null
  const [, prefix, numStr, suffix] = match
  const cleaned = numStr.replace(/,/g, '')
  const target = Number.parseFloat(cleaned)
  if (Number.isNaN(target)) return null
  const decimals = cleaned.includes('.') ? cleaned.split('.')[1].length : 0
  return { prefix, target, decimals, suffix, hasComma: numStr.includes(',') }
}

function formatCurrent(n: number, parsed: ParsedValue): string {
  const rounded = parsed.decimals > 0 ? n.toFixed(parsed.decimals) : String(Math.round(n))
  if (!parsed.hasComma) return `${parsed.prefix}${rounded}${parsed.suffix}`
  const [intPart, decPart] = rounded.split('.')
  const withCommas = Number(intPart).toLocaleString('en-US')
  return `${parsed.prefix}${decPart ? `${withCommas}.${decPart}` : withCommas}${parsed.suffix}`
}

/**
 * Animates a number from 0 up to `value` once it enters view. The final,
 * true value is always the passed `value` string on first (server) render —
 * this only visually re-paints the number client-side, then snaps back to
 * the exact original string at the end. No-JS / reduced-motion users see
 * the static real value the whole time; nothing is ever fabricated.
 */
export function CountUp({
  value,
  duration = 1200,
  className,
}: {
  value: string
  duration?: number
  className?: string
}) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [display, setDisplay] = useState(value)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const parsed = parseValue(value)
    if (!parsed) return

    const target = parsed // narrow once, capture the non-null alias below
    const start = performance.now()
    let raf = 0

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      if (t < 1) {
        setDisplay(formatCurrent(target.target * eased, target))
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
