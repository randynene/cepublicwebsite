'use client'

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { useInView } from './use-in-view'

/**
 * Decrypt / scramble-then-settle text reveal.
 *
 * Glyph set and 45ms frame cadence recovered verbatim from the "08 · DECRYPT
 * REVEAL" effect in the Motion Lab reference. Characters then lock into place
 * left to right. Spaces are never scrambled.
 */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@/<>*'
const FRAME_MS = 45
/** Frames of pure scramble before the first character locks (~315ms). */
const HOLD_FRAMES = 7
/** Rough settle budget. A fixed per-character cadence would make a long
 *  section heading run twice as long as the short hero word; scaling to the
 *  phrase length keeps every instance at roughly the same, readable pace. */
const TARGET_SETTLE_MS = 1250

const framesPerChar = (length: number) => {
  if (length < 1) return 1
  return Math.min(3, Math.max(1, Math.round(TARGET_SETTLE_MS / (FRAME_MS * length))))
}

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

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

/**
 * Progressive-enhancement scramble reveal. The REAL, final text is what ships
 * in the server HTML, so no-JS, reduced-motion, SEO crawlers and screen readers
 * always get the true string with zero layout shift.
 *
 * Two phases, so the reader never sees the finished word before the effect:
 *   1. PRIME (layout effect, on mount) — the server HTML is held invisible by
 *      the `[data-decrypt-hold]` rule in globals.css from the moment it is
 *      parsed. On mount we lock each character box to its painted width, swap
 *      in the first frame of glyphs, and only then drop the attribute. The
 *      first thing ever painted on a JS-capable browser is scrambled text.
 *   2. SETTLE (on entering the viewport) — glyphs cycle for a short hold, then
 *      characters lock left to right until the real phrase is back. Fires
 *      exactly once (useInView unobserves after the first intersection).
 * Below-the-fold instances therefore sit as scrambled text until they are
 * scrolled to, rather than showing the answer and then hiding it again.
 *
 * Under reduced motion PRIME does nothing but drop the hold attribute, so the
 * word is simply present and static.
 *
 * Accessibility: each animating glyph span is aria-hidden and the wrapper
 * carries aria-label with the full final phrase, so assistive tech announces
 * the intended words rather than the transient scramble.
 *
 * CLS: character boxes are pinned to their already-painted widths for the
 * duration, so swapping in wider glyphs can never rewrap the line or push the
 * layout below. The pins are released once the phrase has settled, so a late
 * web-font swap can still reflow the word normally.
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

  const primedRef = useRef(false)
  useIsomorphicLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const dropHold = () => root.removeAttribute('data-decrypt-hold')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dropHold()
      return
    }

    const spans = charRefs.current
    // Measure first, write second — interleaving reads and writes would force a
    // reflow per character.
    const widths = spans.map((el) => (el ? el.getBoundingClientRect().width : 0))
    for (let i = 0; i < flatChars.length; i += 1) {
      const el = spans[i]
      if (!el) continue
      el.style.width = `${widths[i]}px`
      if (flatChars[i] !== ' ') el.textContent = randomGlyph()
    }
    primedRef.current = true
    dropHold()
    // Mount-only: the hold must be lifted on the first client paint, and
    // `segments` arrives as a fresh array literal on every parent render (see
    // the note on the settle effect below).
  }, [])

  const startedRef = useRef(false)
  useEffect(() => {
    if (!inView || startedRef.current || !primedRef.current) return
    startedRef.current = true

    const spans = charRefs.current
    const perChar = framesPerChar(flatChars.length)
    let frame = 0
    const id = window.setInterval(() => {
      frame += 1
      const settled = frame <= HOLD_FRAMES ? 0 : Math.floor((frame - HOLD_FRAMES) / perChar)
      for (let i = 0; i < flatChars.length; i += 1) {
        const el = spans[i]
        if (!el) continue
        if (flatChars[i] === ' ') {
          el.textContent = ' '
          continue
        }
        el.textContent = i < settled ? flatChars[i] : randomGlyph()
      }
      if (settled >= flatChars.length) {
        window.clearInterval(id)
        for (let i = 0; i < flatChars.length; i += 1) {
          const el = spans[i]
          if (!el) continue
          el.textContent = flatChars[i]
          el.style.width = ''
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
    <span ref={ref} className={cn(className)} aria-label={fullText} data-decrypt-hold>
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
