'use client'

import { useMemo, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import type { PricingCalculator } from './content'

// The /pricing cost calculator (design: docs/raw-html/Pricing Page 2.dc.html).
//
// The numeric engine lives here; the benchmark inputs and every label arrive on
// the `content` prop (PricingCalculator, sourced from Sanity or the static
// fallback), per docs/design/PRICING_SCHEMA_PROPOSAL.md §1. The default
// selection (Eastern Europe devs / UK company / GBP) reproduces the design's
// figures exactly; other selections recompute by ratio off the same table.
//
// Layout (fidelity pass): three equal-height columns - [input stack | CE card |
// comparison card] - inside one elevated container; then, as separate blocks on
// the page background, a centered toggle and a standalone breakdown card that
// expands/collapses with a reduced-motion-safe animation.
//
// NOTE (flag for Seb / pre-launch): the non-default benchmark cells in
// CALC_MODEL are design-illustrative and should be reconciled against the live
// /pricing widget by an empirical drive (same method as lib/calculators/hiring-cost).

const GLYPH = { minus: '−', plus: '+', chevron: '▾' } as const

function fmtMoney(gbp: number, symbol: string, rate: number): string {
  return `${symbol}${Math.round(gbp * rate).toLocaleString('en-US')}`
}
function fmtK(gbp: number, symbol: string, rate: number): string {
  return `${symbol}${Math.round((gbp * rate) / 1000).toLocaleString('en-US')}k`
}
function fmtRange(lo: number, hi: number, symbol: string, rate: number): string {
  // Plain hyphen (author-voice rule: no en/em dashes).
  return `${fmtMoney(lo, symbol, rate)}-${fmtMoney(hi, symbol, rate)}`
}

// ── Inline stroke icons (no sprite entry exists for these) ──────────────────
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function ChartUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-6" />
      <path d="M15 7h4v4" />
    </svg>
  )
}

const SELECT =
  'w-full cursor-pointer appearance-none rounded-[12px] border border-[#22314D] bg-[#0A1628] px-4 py-3 pr-10 text-[15px] text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]'

function Field({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
  id: string
}) {
  // Select fills the whole box (padding on the control); chevron is decorative.
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-text-default">
        {label}
      </label>
      <span className="relative block">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-text-default/50"
        >
          {GLYPH.chevron}
        </span>
      </span>
    </div>
  )
}

export function CostCalculator({ content }: { content: PricingCalculator }) {
  const { model } = content
  // Default to the UK cell so the opening view reproduces the design's figures,
  // regardless of the dropdown's option order.
  const defaultCountry =
    model.countries.find((c) => c.id === 'united-kingdom')?.id ?? model.countries[0]?.id ?? ''
  const [devs, setDevs] = useState(1)
  const [countryId, setCountryId] = useState(defaultCountry)
  const [regionId, setRegionId] = useState(model.regions[0]?.id ?? '')
  const [currencyId, setCurrencyId] = useState(model.currencies[0]?.id ?? '')

  const view = useMemo(() => {
    const region = model.regions.find((r) => r.id === regionId) ?? model.regions[0]
    const country = model.countries.find((c) => c.id === countryId) ?? model.countries[0]
    const currency = model.currencies.find((c) => c.id === currencyId) ?? model.currencies[0]
    const { symbol, rate } = currency
    const h = model.hoursPerMonth

    const [ceLo, ceHi] = region.ceMonthly
    const [locLo, locHi] = country.localMonthly
    const ceMid = (ceLo + ceHi) / 2
    const locMid = (locLo + locHi) / 2
    const ceAnnualMid = ceMid * 12 * devs
    const locAnnualMid = locMid * 12 * devs
    const savingsGbp = locAnnualMid - ceAnnualMid
    const pctHigher = Math.round(((locAnnualMid - ceAnnualMid) / locAnnualMid) * 100)

    const breakdownTotal = model.breakdownTotalAmount
    const usCountry = model.countries.find((c) => c.id === 'united-states') ?? country
    const usAnnualMid = ((usCountry.localMonthly[0] + usCountry.localMonthly[1]) / 2) * 12
    const breakdownSavedGbp = usAnnualMid - breakdownTotal * 12

    return {
      symbol,
      rate,
      country,
      ce: {
        low: fmtMoney(ceLo * devs, symbol, rate),
        high: fmtMoney(ceHi * devs, symbol, rate),
        hourYear: `${content.thatsPrefix} ${fmtRange((ceLo / h) * devs, (ceHi / h) * devs, symbol, rate)} ${content.perHourSuffix} or ${fmtK(ceLo * 12 * devs, symbol, rate)}-${fmtK(ceHi * 12 * devs, symbol, rate)} ${content.orYearSuffix}`,
      },
      loc: {
        low: fmtMoney(locLo * devs, symbol, rate),
        high: fmtMoney(locHi * devs, symbol, rate),
        hourYear: `${content.thatsPrefix} ${fmtRange((locLo / h) * devs, (locHi / h) * devs, symbol, rate)} ${content.perHourSuffix} or ${fmtK(locLo * 12 * devs, symbol, rate)}-${fmtK(locHi * 12 * devs, symbol, rate)} ${content.orYearSuffix}`,
        pctHigher: `${pctHigher}% ${content.higherCostSuffix}`,
      },
      savings: `${content.saveAvgPrefix} ${fmtMoney(savingsGbp, symbol, rate)}${content.saveAvgYearSuffix}`,
      breakdown: {
        total: fmtMoney(breakdownTotal, symbol, rate),
        intro: `${content.breakdownIntroPrefix} ${fmtMoney(breakdownTotal, symbol, rate)}/mo, ${content.breakdownIntroSuffix}`,
        saved: content.breakdownSavedTemplate.replace('{amount}', fmtMoney(breakdownSavedGbp, symbol, rate)),
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devs, countryId, regionId, currencyId, model])

  const step = (delta: number) => setDevs((n) => Math.min(20, Math.max(1, n + delta)))

  return (
    <div className="flex flex-col gap-8">
      {/* Calculator lives on the dark background; the form + two cards float as
          separate bubbles on top of it (no wrapping panel). */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[300px_1fr_1fr]">
        {/* Input column - bare dark background */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-text-default">{content.devCountLabel}</span>
            <span className="inline-flex items-center justify-between rounded-[12px] border border-[#22314D] bg-[#0A1628] px-3 py-2">
              <button
                type="button"
                onClick={() => step(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#22314D] text-[18px] text-text-default hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={content.devCountLabel}
              >
                {GLYPH.minus}
              </button>
              <span className="text-[18px] font-semibold tabular-nums text-text-default">{devs}</span>
              <button
                type="button"
                onClick={() => step(1)}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#22314D] text-[18px] text-text-default hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={content.devCountLabel}
              >
                {GLYPH.plus}
              </button>
            </span>
          </div>
          <Field
            id="pricing-calc-country"
            label={content.countryPrompt}
            value={countryId}
            onChange={setCountryId}
            options={model.countries.map((c) => ({ id: c.id, label: c.flag ? `${c.flag} ${c.label}` : c.label }))}
          />
          <Field
            id="pricing-calc-region"
            label={content.regionPrompt}
            value={regionId}
            onChange={setRegionId}
            options={model.regions}
          />
          <Field
            id="pricing-calc-currency"
            label={content.currencyPrompt}
            value={currencyId}
            onChange={setCurrencyId}
            options={model.currencies.map((c) => ({ id: c.id, label: `${c.symbol} ${c.label}` }))}
          />
        </div>

        {/* CE card - #1B2A45 bubble */}
        <div className="flex flex-col overflow-hidden rounded-[24px] shadow-[inset_0_0_0_1px_#22314D]">
          <div className="flex flex-1 flex-col bg-[#1B2A45] p-9">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-text-default">
              {content.ceCardTitle}
              <img src={content.ceLogo} alt={content.ceBrand} className="h-5 w-auto" />
            </p>
            <p className="mt-4 text-[44px] font-extrabold leading-[1.02] tracking-[-1.5px] tabular-nums text-text-default">
              {view.ce.low}
            </p>
            <p className="text-[44px] font-extrabold leading-[1.02] tracking-[-1.5px] tabular-nums text-text-default">
              {content.toWord} {view.ce.high}
              <span className="ml-2 align-middle text-[14px] font-normal tracking-normal text-text-default/60">
                {content.perMonth}
              </span>
            </p>
            <p className="mt-4 text-[13px] tabular-nums text-text-default/60">{view.ce.hourYear}</p>
          </div>
          {/* Full-width lime savings footer band */}
          <div className="mt-auto flex items-start gap-3 bg-brand-primary px-9 py-5 text-[#060F1E]">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              <span className="block text-[16px] font-semibold">{view.savings}</span>
              <span className="mt-0.5 block text-[13px] opacity-80">{content.savingsNote}</span>
            </span>
          </div>
        </div>

        {/* Comparison card - #101B30 bubble */}
        <div className="flex flex-col overflow-hidden rounded-[24px] shadow-[inset_0_0_0_1px_#22314D]">
          <div className="flex flex-1 flex-col bg-[#101B30] p-9">
            <p className="flex items-center justify-between gap-2 text-[15px] font-semibold text-text-default">
              <span>
                {content.localCardTitlePrefix} {view.country.label}
              </span>
              <span aria-hidden="true" className="text-[20px] leading-none">{view.country.flag}</span>
            </p>
            <p className="mt-4 text-[44px] font-extrabold leading-[1.02] tracking-[-1.5px] tabular-nums text-text-default/90">
              {view.loc.low}
            </p>
            <p className="text-[44px] font-extrabold leading-[1.02] tracking-[-1.5px] tabular-nums text-text-default/90">
              {content.toWord} {view.loc.high}
              <span className="ml-2 align-middle text-[14px] font-normal tracking-normal text-text-default/50">
                {content.perMonth}
              </span>
            </p>
            <p className="mt-4 text-[13px] tabular-nums text-text-default/55">{view.loc.hourYear}</p>
          </div>
          {/* Mirrored bottom band */}
          <div className="mt-auto flex items-start gap-3 border-t border-[#22314D] bg-[#101B30] px-9 py-5">
            <ChartUpIcon className="mt-0.5 h-5 w-5 shrink-0 text-white" />
            <span>
              <span className="block text-[16px] font-semibold text-white">{view.loc.pctHigher}</span>
              <span className="mt-0.5 block text-[13px] text-text-default/55">{content.localFootnote}</span>
            </span>
          </div>
        </div>
      </div>

      {/* The show/hide toggle came out on Jake's instruction (Aug 2026).
       *
       * It existed to collapse a long itemised table. CE-29 removed those line
       * items, so the panel is now a single all-in figure - and a button that
       * collapses one number is furniture, not a control. The panel is always
       * open; `breakdownShowLabel` / `breakdownHideLabel` are consequently
       * unread (left in the schema rather than removed mid-flight, same as the
       * orphaned fields in Tech Debt #62/#63). */}
      <div>
        <div>
          <div className="mx-auto max-w-[900px] rounded-[20px] bg-[#101B30] p-6 shadow-[inset_0_0_0_1px_#22314D,0_30px_50px_rgba(0,0,0,.35)] lg:p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[1.6px] text-brand-primary">
              {content.breakdownEyebrow}
            </p>
            <p className="mt-2 text-[15px] text-text-default/70">{view.breakdown.intro}</p>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-[14px] bg-[#1B2A45] px-6 py-5">
              <span className="text-[13px] font-semibold uppercase tracking-[1.2px] text-text-default/70">
                {content.breakdownTotalLabel}
              </span>
              <span className="text-[44px] font-extrabold leading-none tabular-nums text-brand-primary lg:text-[52px]">
                {view.breakdown.total}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[14px] text-text-default/60">{view.breakdown.saved}</p>
              <a
                href={content.breakdownCtaHref}
                className="sf sf-p inline-flex items-center rounded-pill px-5 py-2.5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
              >
                <span className="c">{content.breakdownCta}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
