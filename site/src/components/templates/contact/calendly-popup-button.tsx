'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { withCalendlyCeTheme } from '@/components/templates/book-a-call/calendly-inline-embed'

// Calendly popup trigger. The live contact page opens the intro call in
// Calendly's overlay rather than embedding a 700px inline scheduler, because
// the right-hand column is already the enquiry form. Same self-loading
// discipline as CalendlyInlineEmbed: the sitewide widget.js loads lazily, so
// window.Calendly may not exist yet when this mounts.
//
// If Calendly never loads, the button stays a real link to the booking page
// rather than a dead control.

const CALENDLY_CSS_URL = 'https://assets.calendly.com/assets/external/widget.css'
const CALENDLY_JS_URL = 'https://assets.calendly.com/assets/external/widget.js'

// Only used on the fallback path, where the click is a real navigation.
const NEW_TAB = '_blank'

type CalendlyPopupApi = {
  initPopupWidget: (options: { url: string }) => void
}

function getCalendlyPopupApi(): CalendlyPopupApi | undefined {
  const calendly = (window as unknown as { Calendly?: CalendlyPopupApi }).Calendly
  if (calendly && typeof calendly.initPopupWidget === 'function') return calendly
  return undefined
}

export interface CalendlyPopupButtonProps {
  url: string
  className?: string
  children: ReactNode
}

export function CalendlyPopupButton({ url, className, children }: CalendlyPopupButtonProps) {
  const [ready, setReady] = useState(false)
  const pollRef = useRef<number>(0)
  const themedUrl = withCalendlyCeTheme(url)

  useEffect(() => {
    if (!document.querySelector(`link[href="${CALENDLY_CSS_URL}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = CALENDLY_CSS_URL
      document.head.appendChild(link)
    }
    if (!getCalendlyPopupApi() && !document.querySelector(`script[src^="${CALENDLY_JS_URL}"]`)) {
      const script = document.createElement('script')
      script.src = CALENDLY_JS_URL
      script.async = true
      document.body.appendChild(script)
    }

    let cancelled = false
    let attempts = 0
    const maxAttempts = 100 // ~20s at 200ms intervals

    const poll = (): void => {
      if (cancelled) return
      if (getCalendlyPopupApi()) {
        setReady(true)
        return
      }
      attempts += 1
      if (attempts >= maxAttempts) return
      pollRef.current = window.setTimeout(poll, 200)
    }
    pollRef.current = window.setTimeout(poll, 0)

    return () => {
      cancelled = true
      window.clearTimeout(pollRef.current)
    }
  }, [])

  const openPopup = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const calendly = getCalendlyPopupApi()
      if (!calendly) return // let the browser follow the href
      event.preventDefault()
      calendly.initPopupWidget({ url: themedUrl })
    },
    [themedUrl],
  )

  return (
    <a
      href={themedUrl}
      target={ready ? undefined : NEW_TAB}
      rel="noopener noreferrer"
      onClick={openPopup}
      className={className}
    >
      {children}
    </a>
  )
}

export default CalendlyPopupButton
