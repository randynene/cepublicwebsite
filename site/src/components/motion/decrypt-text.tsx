'use client'

import { Fragment, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { useInView } from './use-in-view'

/**
 * Decrypt / scramble-then-settle text reveal.
 *
 * Parameters recovered verbatim from the "08 · DECRYPT REVEAL" effect in the
 * Motion Lab reference (the `runDecrypt()` variant applied to "rigorously
 * vetted"): a fixed glyph set, a 45ms frame cadence, and one character locking
 * into place every 2 frames (left to right). Spaces are never scrambled.
 */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@/<>*'
const FRAME_MS = 45
const FRAMES_PER_CHAR = 2

export interface DecryptSegment {
  /** The characters to render for this run. */
  text: string
  /** When true the run is wrapped in an <em> (keeps the italic serif accent). */
  em?: boolean
  /** Optional class applied to a <span> wrapping this run (e.g. an accent style). */
  className?: string
  /** When true a <br /> is rendered immediately BEFORE this run. */
  break?: boolean
}

interface DecryptTextProps {
  /** Ordered runs of text. Concatenated they form the full readable phrase. */
  segments: DecryptSegment[]
  className?: string
}

const CHAR_STYLE: CSSProperties = { display: 'inline-block', whiteSpace: 'pre' }

/**
 * Progressive-enhancement scramble reveal, mirroring the count-up.tsx gate:
 * the REAL, final text is rendered on first (server) paint, so no-JS,
 * reduced-motion, SEO crawlers and screen readers always get the true string
 * with zero layout shift. Only after mount, once in view and if the user has
 * no reduced-motion preference, does the effect cycle glyphs and settle back
 * to the final text. Fires exactly once (useInView unobserves after the first
 * intersection); never loops.
 *
 * Accessibility: each animating glyph span is aria-hidden and the wrapper
 * carries aria-label with the full final phrase, so assistive tech announces
 * the intended words rather than the transient scramble.
 *
 * CLS: at animation start each character box is locked to its already-painted
 * width, so swapping in wider glyphs can never rewrap the line or push the
 * layout below.
 */
export function DecryptText({ segments, className }: DecryptTextProps) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])

  // A break renders as a visual line-break with no space glyph, so add a space
  // in the accessible label (otherwise AT reads "...vettedby..." run together).
  const fullText = useMemo(
    () => segments.map((s) => (s.break ? ' ' : '') + s.text).join(''),
    [segments],
  )
  const flatChars = useMemo(() => {
    const out: string[] = []
    for (const seg of segments) for (const ch of seg.text) out.push(ch)
    return out
  }, [segments])

  const startedRef = useRef(false)
  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const spans = charRefs.current
    // Lock every character box to its painted (final) width so glyph swaps
    // never reflow the line — zero CLS.
    for (const el of spans) {
      if (el) el.style.width = `${el.getBoundingClientRect().width}px`
    }

    let frame = 0
    const id = window.setInterval(() => {
      frame += 1
      const settled = Math.floor(frame / FRAMES_PER_CHAR)
      for (let i = 0; i < flatChars.length; i += 1) {
        const el = spans[i]
        if (!el) continue
        if (flatChars[i] === ' ') {
          el.textContent = ' '
          continue
        }
        el.textContent =
          i < settled ? flatChars[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      if (settled >= flatChars.length) {
        window.clearInterval(id)
        for (let i = 0; i < flatChars.length; i += 1) {
          const el = spans[i]
          if (el) el.textContent = flatChars[i]
        }
      }
    }, FRAME_MS)

    return () => window.clearInterval(id)
    // Depend on `inView` ONLY. The hero passes `segments` as a fresh array
    // literal every render, so `flatChars` (a useMemo over segments) gets a new
    // identity each render. Listing it here re-ran this effect on unrelated
    // re-renders; the cleanup cleared the scramble interval while the
    // `startedRef` guard blocked the restart, freezing the word mid-scramble
    // (the "eYNU*GQ" stuck-gibberish bug). `inView` flips false->true exactly
    // once (useInView unobserves), so the effect runs once and the closure
    // captures the static `flatChars` correctly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  let globalIndex = -1
  return (
    <span ref={ref} className={cn(className)} aria-label={fullText}>
      {segments.map((seg, si) => {
        const chars = Array.from(seg.text).map((ch, ci) => {
          globalIndex += 1
          const i = globalIndex
          return (
            <span
              key={ci}
              ref={(el) => {
                charRefs.current[i] = el
              }}
              aria-hidden
              style={CHAR_STYLE}
            >
              {ch}
            </span>
          )
        })
        let run: ReactNode = chars
        if (seg.em) run = <em>{chars}</em>
        else if (seg.className) run = <span className={seg.className}>{chars}</span>
        return (
          <Fragment key={si}>
            {seg.break ? <br /> : null}
            {run}
          </Fragment>
        )
      })}
    </span>
  )
}
