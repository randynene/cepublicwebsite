'use client'

import { useEffect, useRef } from 'react'

// Calendly inline scheduler. The sitewide widget.js loads with a lazy
// strategy (third-party-scripts.tsx), so on a Book A Call page the global
// `window.Calendly` may not exist yet when this component mounts — and it
// may load AFTER this effect runs. Relying on a one-shot getElementById +
// 'load' listener races and silently never mounts. Instead this component
// is self-sufficient: it ensures the stylesheet + script are present, then
// polls for the API before initialising the inline widget.

const CALENDLY_CSS_URL = 'https://assets.calendly.com/assets/external/widget.css'
const CALENDLY_JS_URL = 'https://assets.calendly.com/assets/external/widget.js'

// CE skin for the Calendly iframe. Hex without `#`.
//
// Read Calendly's own booking CSS/JS before changing `text_color`. Two facts
// from their bundle constrain this pair:
//   1. Invitee inputs are `background: var(--colorSurfaceStandard,
//      var(--coreColorNeutral0))` and that token is hard-coded WHITE. It is
//      never derived from `background_color`, so the form boxes stay white
//      however dark the panel is.
//   2. Their theme code sets `--colorTextStandard` to exactly `text_color`,
//      and the input's `color` reads that token. So `text_color` is BOTH the
//      panel text and the text a visitor types into a white box.
//
// A pure-white `text_color` therefore typed white-on-white (the original bug);
// a near-black one fixed typing but greyed out the dark panel. This slate is
// the balance point - it clears 4:1 against the navy panel AND against the
// white input, so nothing on the widget is invisible in either place.
// CE-40 (Aug 2026). Verified in a real browser against the live booking link
// (Playwright, three theme variants, typing into the invitee fields on each):
//
//   dark navy + WHITE text  - panel, calendar and slots look superb, but the
//                             text a visitor types into the white invitee boxes
//                             renders near-white on white. The form is unusable.
//   dark navy + SLATE text  - what shipped before. Nothing is invisible, but the
//                             panel is dim, which is what Seb reported.
//   LIGHT + dark navy text  - every single element is legible: panel, labels,
//                             dropdown, and the typed values. <- chosen
//
// The deciding factor is that `text_color` is one variable doing two jobs: it
// colours the panel text AND the text typed into inputs whose background
// Calendly hard-codes to white. A light surface is the only state where both
// jobs want the same answer. Jake's call: a light widget is acceptable, an
// unusable booking form is not.
//
// Screenshots from the probe are in the session scratchpad; re-run before
// changing these values.
// `primary_color` is NOT the brand lime here, deliberately. Calendly paints the
// selectable dates in primary on a pale tint of itself, and lime-on-white is
// close to invisible - the dates are the primary interaction on this page, so
// they win over the brand accent. Navy reads cleanly and still belongs to CE.
const CE_CALENDLY_THEME = {
  background_color: 'FFFFFF',
  text_color: '1A2B4A',
  primary_color: '1A2B4A',
} as const

type CalendlyInlineApi = {
  initInlineWidget: (options: {
    url: string
    parentElement: HTMLElement
    prefill?: Record<string, string>
    utm?: Record<string, string>
  }) => void
}

/**
 * Apply CE theme params (always — contrast-critical).
 *
 * `hideEventDetails` switches off Calendly's own left-hand details panel so we
 * can render it ourselves in real white (CE-40). See event-details-panel.tsx for
 * why that is the only way to satisfy "make the text brighter white" without
 * making typed input invisible.
 */
export function withCalendlyCeTheme(url: string, opts?: { hideEventDetails?: boolean }): string {
  try {
    const parsed = new URL(url)
    for (const [key, value] of Object.entries(CE_CALENDLY_THEME)) {
      parsed.searchParams.set(key, value)
    }
    if (opts?.hideEventDetails) parsed.searchParams.set('hide_event_type_details', '1')
    return parsed.toString()
  } catch {
    return url
  }
}

function getCalendlyInlineApi(): CalendlyInlineApi | undefined {
  const calendly = (window as unknown as { Calendly?: CalendlyInlineApi }).Calendly
  if (calendly && typeof calendly.initInlineWidget === 'function') {
    return calendly
  }
  return undefined
}

function ensureCalendlyStylesheet(): void {
  if (document.querySelector(`link[href="${CALENDLY_CSS_URL}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = CALENDLY_CSS_URL
  document.head.appendChild(link)
}

function ensureCalendlyScript(): void {
  if (getCalendlyInlineApi()) return
  if (document.querySelector(`script[src^="${CALENDLY_JS_URL}"]`)) return
  const script = document.createElement('script')
  script.src = CALENDLY_JS_URL
  script.async = true
  document.body.appendChild(script)
}

export interface CalendlyInlineEmbedProps {
  url: string
  className?: string
  /** Hide Calendly's own event-details panel; we render our own. */
  hideEventDetails?: boolean
}

/** Inline Calendly scheduler — self-loads Calendly's script + stylesheet. */
export function CalendlyInlineEmbed({
  url,
  className,
  hideEventDetails = false,
}: CalendlyInlineEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const themedUrl = withCalendlyCeTheme(url, { hideEventDetails })

  useEffect(() => {
    const parent = containerRef.current
    if (!parent) return

    ensureCalendlyStylesheet()
    ensureCalendlyScript()
    parent.innerHTML = ''

    let cancelled = false
    let attempts = 0
    let timer = 0
    const maxAttempts = 100 // ~20s at 200ms intervals

    const tryMount = (): void => {
      if (cancelled) return
      const calendly = getCalendlyInlineApi()
      if (calendly) {
        calendly.initInlineWidget({ url: themedUrl, parentElement: parent })
        return
      }
      attempts += 1
      if (attempts >= maxAttempts) return
      timer = window.setTimeout(tryMount, 200)
    }

    timer = window.setTimeout(tryMount, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [themedUrl])

  return (
    <div
      ref={containerRef}
      className={className}
      // Outer plate = page ground (#070D18); the Calendly panel itself is the
      // slightly lifted navy from CE_CALENDLY_THEME. color-scheme:light stops
      // the browser forcing an opaque fill mismatch on the iframe.
      style={{
        minWidth: 320,
        width: '100%',
        height: 900,
        backgroundColor: '#070D18',
        colorScheme: 'light',
      }}
    />
  )
}
