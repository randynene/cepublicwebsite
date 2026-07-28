'use client'

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { useInView } from './use-in-view'

/**
 * Typewriter reveal for the lime accent word in a page hero.
 *
 * Replaces the decrypt/scramble reveal per Seb's 28 Jul review: the scramble
 * read as noise, where typing the word out letter by letter puts the emphasis
 * on the word itself.
 *
 * Same guarantees as the decrypt reveal it replaces:
 *   - The REAL text ships in the server HTML, so crawlers, no-JS browsers,
 *     reduced-motion users and screen readers always get the true string.
 *   - Zero layout shift. Characters are never added or removed, only flipped
 *     between hidden and visible, so the line box is identical throughout.
 *     That also means a mid-sentence accent word holds its gap rather than
 *     pushing the rest of the sentence around as it types.
 *   - The wrapper is held invisible before hydration by the
 *     `[data-typewriter-hold]` rule in globals.css, so a browser that is going
 *     to run the effect never paints the finished word first.
 */

/** Per character. 9 characters ("engineers") lands at ~630ms. */
const STEP_MS = 70
/** Beat before the first character, so typing starts after the eye arrives. */
const START_DELAY_MS = 200
/** How long the caret keeps blinking once the word is complete. */
const CARET_LINGER_MS = 2400

export interface TypewriterSegment {
  /** The characters to render for this run. */
  text: string
  /** When true the run is wrapped in an <em> (keeps a scoped-CSS italic accent). */
  em?: boolean
  /** Optional class applied to a <span> wrapping this run (e.g. an accent style). */
  className?: string
  /** When true a <br /> is rendered immediately BEFORE this run. */
  break?: boolean
}

interface TypewriterTextProps {
  /** Ordered runs of text. Concatenated they form the full readable phrase. */
  segments: TypewriterSegment[]
  className?: string
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function TypewriterText({ segments, className }: TypewriterTextProps) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])

  // A break renders as a visual line-break with no space glyph, so add a space
  // in the accessible label (otherwise AT reads the two lines run together).
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
    const dropHold = () => root.removeAttribute('data-typewriter-hold')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dropHold()
      return
    }

    // Hide the characters individually rather than the wrapper: the wrapper
    // keeps its box, so nothing below can move when they come back.
    for (const el of charRefs.current) {
      if (el) el.style.visibility = 'hidden'
    }
    primedRef.current = true
    dropHold()
    // Mount-only: the hold must be lifted on the first client paint, and
    // `segments` arrives as a fresh array literal on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startedRef = useRef(false)
  useEffect(() => {
    if (!inView || startedRef.current || !primedRef.current) return
    startedRef.current = true

    const spans = charRefs.current
    const timers: number[] = []
    let typed = 0

    const setCaret = (index: number, mode: 'on' | 'blink' | null) => {
      const el = spans[index]
      if (!el) return
      if (mode) el.dataset.typewriterCaret = mode
      else delete el.dataset.typewriterCaret
    }

    const start = window.setTimeout(() => {
      const id = window.setInterval(() => {
        const el = spans[typed]
        if (el) {
          el.style.visibility = 'visible'
          // The caret trails the most recently typed character, so it never
          // needs measuring against a character that is not painted yet.
          setCaret(typed - 1, null)
          setCaret(typed, 'on')
        }
        typed += 1
        if (typed >= flatChars.length) {
          window.clearInterval(id)
          setCaret(flatChars.length - 1, 'blink')
          const done = window.setTimeout(
            () => setCaret(flatChars.length - 1, null),
            CARET_LINGER_MS,
          )
          timers.push(done)
        }
      }, STEP_MS)
      timers.push(id)
    }, START_DELAY_MS)
    timers.push(start)

    return () => {
      for (const t of timers) {
        window.clearTimeout(t)
        window.clearInterval(t)
      }
    }
    // Depend on `inView` ONLY, for the reason documented on the decrypt reveal:
    // `segments` is a fresh array literal on every parent render, so listing
    // `flatChars` here re-runs the effect on unrelated re-renders and the
    // cleanup kills the interval mid-word while the `startedRef` guard blocks
    // the restart. `inView` flips false->true exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  let globalIndex = -1
  return (
    <span ref={ref} className={cn(className)} aria-label={fullText} data-typewriter-hold>
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
              // inline-block so visibility can be set per character and the
              // caret box-shadow has an edge to sit against; pre keeps spaces.
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
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
