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

// CE dark/lime skin for the Calendly iframe. Hex without `#` — Calendly's
// supported embed theme params. Layout stays Calendly's canonical UI.
const CE_CALENDLY_THEME = {
  background_color: '101B30',
  text_color: 'ffffff',
  primary_color: 'D4FF3C',
} as const

type CalendlyInlineApi = {
  initInlineWidget: (options: {
    url: string
    parentElement: HTMLElement
    prefill?: Record<string, string>
    utm?: Record<string, string>
  }) => void
}

/** Append CE theme params unless the URL already sets them (Studio override). */
export function withCalendlyCeTheme(url: string): string {
  try {
    const parsed = new URL(url)
    for (const [key, value] of Object.entries(CE_CALENDLY_THEME)) {
      if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value)
    }
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
}

/** Inline Calendly scheduler — self-loads Calendly's script + stylesheet. */
export function CalendlyInlineEmbed({ url, className }: CalendlyInlineEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const themedUrl = withCalendlyCeTheme(url)

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
      // Outer plate = page ground (#070D18). Inner Calendly UI stays #101B30
      // via CE_CALENDLY_THEME. color-scheme:light stops the browser forcing
      // an opaque white iframe fill on a dark host page.
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
