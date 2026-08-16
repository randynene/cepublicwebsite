'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import type { PricingCalculator } from './content'
import { CostCalculator } from './cost-calculator'

// Email gate over the /pricing cost calculator (design: docs/design/
// pricing-calculator/pricing-calculator-gate.html).
//
// WHAT THIS IS. A wrapper, not a rewrite. The calculator keeps its layout, its
// arithmetic and its content contract; this component renders it blurred and
// inert, puts a card over it asking for a currency and a work email, and on
// submit drops the blur and pushes the chosen currency into the calculator's own
// dropdown. Two fields, nothing else: every extra field is a visitor lost, and
// the currency is not really a form field - it is the first click of using the
// thing they came for.
//
// FAILURE POSTURE. The unlock NEVER depends on the network. If /api/pricing-unlock
// is down or throws, the visitor still gets their numbers; losing the lead is our
// problem, and a buyer staring at a blurred calculator because our CRM plumbing
// broke is a worse outcome than a missing row. Same posture as the quick hiring
// form (see the note at the top of src/app/api/lead/route.ts).
//
// WHY IT RENDERS THE CALCULATOR ITSELF rather than taking it as `children`. The
// gate owns the currency the visitor picks, so the calculator has to receive it
// from here. A render-prop child would express that, but children-as-a-function
// cannot cross the RSC boundary: the section that composes this (index.tsx) is a
// Server Component, and a function is not serialisable, so it throws at request
// time ("Functions are not valid as a child of Client Components") - a failure a
// green `next build` does NOT catch, because /pricing is dynamic and therefore
// never rendered during the build. Importing the calculator keeps both halves on
// the client and keeps this a wrapper: the gate never reaches into the
// calculator's state, it just hands it a starting currency.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STORAGE_KEY = 'ce_pricing_unlock'
/** Decorative; kept out of the Sanity-owned copy, same as cost-calculator's GLYPH. */
const ARROW = ' →'

/** Mono micro-label, shared by the status line and the currency heading. */
const MICRO = 'font-plex text-[10px] font-medium uppercase leading-none tracking-[1.4px] text-[#7F8CA0]'
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]'

interface StoredUnlock {
  email: string
  currency: string
  at: number
}

// ── The unlock, as an external store ────────────────────────────────────────
// localStorage is exactly what useSyncExternalStore is for, and reading it this
// way (rather than in an effect) is what keeps SSR honest: getServerSnapshot
// returns null, so the server always renders the locked state and the client's
// first commit swaps in the stored unlock without a hydration mismatch and
// without a second render pass calling setState.
const listeners = new Set<() => void>()
let cached: string | null = null
let read = false

function subscribeToUnlock(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

/**
 * DEV ONLY. `?gate=open` (optionally `&currency=usd`) renders the unlocked
 * state without filling the form, so the design can be reviewed without
 * clearing site data between looks.
 *
 * Guarded on NODE_ENV so it cannot exist in a production bundle: the gate is
 * soft (it is a lead capture, not a paywall), but a URL that visibly skips it
 * is the kind of thing that ends up shared, and then the capture is pointless.
 * It deliberately does NOT write to localStorage - close the tab and it is gone.
 */
function devPreviewUnlock(): string | null {
  if (process.env.NODE_ENV !== 'development') return null
  const params = new URLSearchParams(window.location.search)
  if (params.get('gate') !== 'open') return null
  return JSON.stringify({
    email: 'preview@cloudemployee.io',
    currency: params.get('currency') ?? 'gbp',
    at: 0,
  })
}

/** Must be cheap and referentially stable, hence the cache. */
function unlockSnapshot(): string | null {
  if (!read) {
    read = true
    try {
      cached = devPreviewUnlock() ?? window.localStorage.getItem(STORAGE_KEY)
    } catch {
      // Private mode or a blocked origin. Treat as never unlocked: showing the
      // gate again is cheap, a thrown error on every render is not.
      cached = null
    }
  }
  return cached
}

/** Server (and the first client render) never has an unlock. */
function unlockServerSnapshot(): string | null {
  return null
}

function writeUnlock(value: StoredUnlock): void {
  cached = JSON.stringify(value)
  try {
    window.localStorage.setItem(STORAGE_KEY, cached)
  } catch {
    // Unlocked for this session only; they re-enter an email next visit.
  }
  for (const l of listeners) l()
}

function parseUnlock(raw: string | null): StoredUnlock | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredUnlock>
    return typeof parsed?.email === 'string' ? (parsed as StoredUnlock) : null
  } catch {
    return null
  }
}

export function CalculatorGate({ content }: { content: PricingCalculator }) {
  const { gate, model } = content
  const currencies = model.currencies
  const fallbackCurrency = currencies[0]?.id ?? ''

  const stored = parseUnlock(useSyncExternalStore(subscribeToUnlock, unlockSnapshot, unlockServerSnapshot))
  const unlocked = stored !== null

  // Tile selection while locked. The stored unlock takes over once granted, so
  // there is no second copy of this state to keep in sync.
  const [picked, setPicked] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  const selectedCurrency = picked ?? fallbackCurrency
  const unlockedCurrency =
    stored && currencies.some((c) => c.id === stored.currency) ? stored.currency : undefined

  // Land focus on the email field: the currency tiles have a sensible default,
  // and typing is the only thing actually being asked for.
  //
  // preventScroll is load-bearing, not a nicety. Without it the browser scrolls
  // the focused input into view on mount, which yanked every visitor landing on
  // /pricing straight past the hero and down to the calculator.
  useEffect(() => {
    if (!unlocked) emailRef.current?.focus({ preventScroll: true })
  }, [unlocked])

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError(true)
      emailRef.current?.focus()
      return
    }
    setSubmitting(true)
    try {
      await fetch('/api/pricing-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          currency: selectedCurrency,
          path: window.location.pathname,
        }),
      })
    } catch {
      // Deliberately swallowed. See the failure-posture note at the top.
    }
    // Same `form_submit` event GTM already listens for on the HubSpot embeds,
    // tagged so this funnel can be told apart from the others.
    ;(window as { dataLayer?: Array<Record<string, unknown>> }).dataLayer?.push({
      event: 'form_submit',
      form: 'pricing_unlock',
      currency: selectedCurrency,
    })
    setSubmitting(false)
    // Last, and outside the try: this is what actually opens the calculator.
    writeUnlock({ email: trimmed, currency: selectedCurrency, at: Date.now() })
  }

  // Roving selection across the tiles, as a radiogroup should behave.
  function onTileKeyDown(e: React.KeyboardEvent, index: number): void {
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
    if (!forward && !back) return
    e.preventDefault()
    setPicked(currencies[(index + (forward ? 1 : -1) + currencies.length) % currencies.length].id)
  }

  const [unlockedBefore, unlockedAfter] = gate.unlockedTemplate.split('{email}')

  return (
    <div className="flex flex-col gap-7">
      {/* Calculator and gate are stacked in ONE grid cell rather than the gate
          being absolutely positioned over the calculator.
          Why: the all-in-rate panel was removed (Aug 2026), which left the
          calculator shorter than the gate card. Under absolute positioning the
          card overhung it by ~100px top and bottom, spilling past the scrim
          into dead space. Sharing a cell makes the TALLER of the two set the
          height, so the card is fully contained, the scrim covers all of it,
          and the short calculator centres behind it - with no magic numbers to
          re-tune if either side's content changes again. */}
      <div className="grid justify-items-center [&>*]:col-start-1 [&>*]:row-start-1">
        {/* The calculator itself. Blurred, unfocusable and hidden from the
            accessibility tree while locked, so nothing behind the card is
            reachable by tab or readable by a screen reader. */}
        <div
          aria-hidden={!unlocked}
          inert={!unlocked}
          className={cn(
            'w-full self-center transition-[filter] duration-300 ease-out motion-reduce:transition-none',
            !unlocked && 'pointer-events-none select-none blur-[11px]',
          )}
        >
          <CostCalculator content={content} initialCurrencyId={unlockedCurrency} />
        </div>

        {!unlocked && (
          <>
            {/* Scrim. Stretches to the full cell, so it covers the card no
                matter which of the two is taller. */}
            <div aria-hidden="true" className="-m-4 self-stretch justify-self-stretch rounded-[28px] bg-[#070D18]/55" />
            <form
              onSubmit={submit}
              noValidate
              className="pricing-gate-card z-10 w-full max-w-[680px] self-center rounded-[22px] border border-[#22314D] bg-[#0B1424] p-6 shadow-[0_32px_80px_rgba(0,0,0,.66)] sm:p-8"
            >
              <p className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand-primary motion-reduce:animate-none"
                />
                <span className={MICRO}>{gate.statusLabel}</span>
              </p>

              <h3 className="mt-3.5 text-[28px] font-semibold leading-[35px] tracking-[-0.8px] text-white">
                {gate.heading}
              </h3>
              <p className="mt-2 text-[15px] leading-[24px] text-[#B8C2D1] [text-wrap:pretty]">{gate.body}</p>

              <p className={cn(MICRO, 'mt-5')} id={`${errorId}-currency`}>
                {gate.currencyLabel}
              </p>
              <div role="radiogroup" aria-labelledby={`${errorId}-currency`} className="mt-2.5 grid grid-cols-3 gap-2.5">
                {currencies.map((c, i) => {
                  const on = c.id === selectedCurrency
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      tabIndex={on ? 0 : -1}
                      onClick={() => setPicked(c.id)}
                      onKeyDown={(e) => onTileKeyDown(e, i)}
                      className={cn(
                        'flex cursor-pointer flex-col items-center gap-1.5 rounded-[13px] border px-3 py-3 transition-colors duration-200 motion-reduce:transition-none',
                        FOCUS,
                        on
                          ? 'border-brand-primary bg-brand-primary/10'
                          : 'border-[#22314D] bg-[#101C31] hover:border-[#33456A]',
                      )}
                    >
                      <span
                        className={cn('text-[22px] font-semibold leading-none', on ? 'text-white' : 'text-[#B8C2D1]')}
                      >
                        {c.symbol}
                      </span>
                      <span
                        className={cn(
                          'text-[11.5px] font-medium leading-none tracking-[0.6px]',
                          on ? 'text-brand-primary' : 'text-[#7F8CA0]',
                        )}
                      >
                        {c.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <input
                ref={emailRef}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(false)
                }}
                placeholder={gate.emailPlaceholder}
                aria-label={gate.emailPlaceholder}
                aria-invalid={error}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  'mt-4 w-full rounded-[12px] border bg-[#0E1A2E] px-[18px] py-2 text-[15px] leading-none text-white placeholder:text-[#5f6b7d]',
                  FOCUS,
                  error ? 'border-[#FF8F8F]' : 'border-[#2b3a56]',
                )}
              />
              {error && (
                <p id={errorId} role="alert" className="mt-2 text-[13px] leading-[18px] text-[#FF8F8F]">
                  {gate.emailError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'mt-3 w-full rounded-pill bg-brand-primary py-2 text-[15.5px] font-bold leading-none text-[#060F1E] transition-colors duration-200 hover:bg-[#e6ff7a] motion-reduce:transition-none',
                  FOCUS,
                  submitting && 'cursor-wait opacity-70',
                )}
              >
                <span>{submitting ? gate.submittingLabel : gate.submitLabel}</span>
                {!submitting && <span aria-hidden="true">{ARROW}</span>}
              </button>

              <p className="mt-3 text-center text-[12px] leading-[18px] text-[#4b5567]">{gate.reassurance}</p>
            </form>
          </>
        )}
      </div>

      {stored && (
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[16px] border border-[#22314D] bg-[#101B30] px-[26px] py-5">
          <p className="text-[14.5px] leading-[1.4] text-[#B8C2D1]">
            <span>{unlockedBefore}</span>
            <b className="font-semibold text-white">{stored.email}</b>
            <span>{unlockedAfter}</span>
          </p>
          <a
            href={gate.unlockedCtaHref}
            className={cn(
              'inline-flex items-center rounded-pill bg-brand-primary px-[22px] py-[13px] text-[14px] font-bold leading-none text-[#060F1E] transition-colors duration-200 hover:bg-[#e6ff7a] motion-reduce:transition-none',
              FOCUS,
            )}
          >
            <span>{gate.unlockedCta}</span>
            <span aria-hidden="true">{ARROW}</span>
          </a>
        </div>
      )}
    </div>
  )
}
