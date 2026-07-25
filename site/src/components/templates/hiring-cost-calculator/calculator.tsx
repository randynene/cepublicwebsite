'use client'

import { useMemo, useState } from 'react'

import { Text } from '@/components/ui/text'
import {
  COMPANY_REGIONS,
  CURRENCIES,
  MAX_DEVELOPERS,
  TALENT_REGIONS,
  formatMoney,
  formatThousands,
  hiringCost,
  type CompanyRegion,
  type Currency,
  type TalentRegion,
} from '@/lib/calculators/hiring-cost'
import { UI_STRINGS } from '@/lib/ui-strings'

// The hiring-cost widget: what a developer costs through Cloud Employee, and what
// you save against hiring one locally.
//
// The arithmetic is in lib/calculators/hiring-cost.ts and is verified against the
// live widget on every run of `npm run verify:hiring-cost` - 900 figures across
// every region, currency and headcount, including the 50-developer clamp. This file
// is only the form.

const COMPANY_LABEL: Record<CompanyRegion, string> = {
  usa: UI_STRINGS['hiringCost.companyUsa'],
  uk: UI_STRINGS['hiringCost.companyUk'],
  australia: UI_STRINGS['hiringCost.companyAustralia'],
  europe: UI_STRINGS['hiringCost.companyEurope'],
}

const TALENT_LABEL: Record<TalentRegion, string> = {
  latam: UI_STRINGS['hiringCost.talentLatam'],
  easternEurope: UI_STRINGS['hiringCost.talentEasternEurope'],
  philippines: UI_STRINGS['hiringCost.talentPhilippines'],
}

const CURRENCY_LABEL: Record<Currency, string> = {
  USD: UI_STRINGS['hiringCost.currencyUsd'],
  GBP: UI_STRINGS['hiringCost.currencyGbp'],
  AUD: UI_STRINGS['hiringCost.currencyAud'],
  EUR: UI_STRINGS['hiringCost.currencyEur'],
  CAD: UI_STRINGS['hiringCost.currencyCad'],
}

const FIELD =
  'h11 w-full rounded-pill border border-[#22314D] bg-[#070D18] px-4 py-3 text-body-sm text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function HiringCostCalculator() {
  const [developers, setDevelopers] = useState(1)
  const [company, setCompany] = useState<CompanyRegion>('usa')
  const [talent, setTalent] = useState<TalentRegion>('philippines')
  const [currency, setCurrency] = useState<Currency>('USD')

  const result = useMemo(
    () => hiringCost(developers, company, talent, currency),
    [developers, company, talent, currency],
  )

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Inputs */}
      <div className="flex flex-col gap-5 rounded-[20px] border border-[#22314D] bg-[#101B30] p-6 lg:p-8">
        <label className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default">
            {UI_STRINGS['hiringCost.developersLabel']}
          </span>
          <input
            type="number"
            min={1}
            max={MAX_DEVELOPERS}
            value={developers}
            // Clamped, exactly as the live widget clamps it. Someone who types 200
            // otherwise sees a saving of twenty million dollars and stops believing
            // the page.
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              setDevelopers(
                Number.isFinite(n) ? Math.min(MAX_DEVELOPERS, Math.max(1, n)) : 1,
              )
            }}
            className={FIELD}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default">
            {UI_STRINGS['hiringCost.companyLabel']}
          </span>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value as CompanyRegion)}
            className={FIELD}
          >
            {COMPANY_REGIONS.map((r) => (
              <option key={r} value={r}>
                {COMPANY_LABEL[r]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default">
            {UI_STRINGS['hiringCost.talentLabel']}
          </span>
          <select
            value={talent}
            onChange={(e) => setTalent(e.target.value as TalentRegion)}
            className={FIELD}
          >
            {TALENT_REGIONS.map((r) => (
              <option key={r} value={r}>
                {TALENT_LABEL[r]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-default">
            {UI_STRINGS['hiringCost.currencyLabel']}
          </span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={FIELD}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Result */}
      <div className="flex flex-col justify-center gap-6 rounded-[20px] border border-brand-primary/25 bg-brand-primary/5 p-6 lg:p-8">
        <div>
          <Text as="p" size="small" className="text-text-default/70">
            {UI_STRINGS['hiringCost.hiringWith']}
          </Text>
          <p className="mt-1 font-semibold tabular-nums text-h3 text-text-default">
            {formatMoney(result.monthly.min, currency)}
            <span className="mx-2 text-text-default/50">
              {UI_STRINGS['hiringCost.to']}
            </span>
            {formatMoney(result.monthly.max, currency)}
            <span className="ml-2 text-body-sm font-normal text-text-default/60">
              {UI_STRINGS['hiringCost.perMonth']}
            </span>
          </p>
          <Text as="p" size="small" className="mt-2 tabular-nums text-text-default/60">
            {UI_STRINGS['hiringCost.thatsPerHour']
              .replace('{min}', formatMoney(result.hourly.min, currency))
              .replace('{max}', formatMoney(result.hourly.max, currency))
              .replace('{yearMin}', formatThousands(result.yearly.min, currency))
              .replace('{yearMax}', formatThousands(result.yearly.max, currency))}
          </Text>
        </div>

        <div className="border-t border-brand-primary/20 pt-6">
          <Text
            as="p"
            size="small"
            className="uppercase tracking-wider text-brand-primary font-medium"
          >
            {UI_STRINGS['hiringCost.saveEyebrow']}
          </Text>
          <p className="mt-1 font-semibold tabular-nums text-h2 text-brand-primary">
            {formatMoney(result.savings, currency)}
            <span className="ml-2 align-middle text-body-sm font-normal text-text-default/70">
              {UI_STRINGS['hiringCost.perYear']}
            </span>
          </p>
          <Text as="p" size="small" className="mt-2 text-text-default/60">
            {UI_STRINGS['hiringCost.allInclusive']}
          </Text>
        </div>
      </div>
    </div>
  )
}
