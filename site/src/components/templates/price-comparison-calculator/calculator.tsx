'use client'

import { useEffect, useMemo, useState } from 'react'

import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { cn } from '@/components/ui/_utils/cn'
import {
  compare,
  formatCurrency,
  MAX_PER_ROLE,
  ROLES,
  type CalculatorRate,
  type Period,
  type Region,
  type Role,
} from '@/lib/calculators/price-comparison'
import { UI_STRINGS } from '@/lib/ui-strings'

// The in-house vs Cloud Employee comparison.
//
// Behaviour is matched to the live calculator, including the parts that look like
// accidents and are not:
//
//   - the state lives in the URL (?region=&junior=&mid=&senior=&mode=), so a result
//     can be sent to a CFO in a link. That is the whole point of the page, and it
//     is the one feature you would never guess from a screenshot.
//   - it opens on one mid-level engineer, not an empty form. A calculator showing
//     zeroes teaches nobody anything.
//   - the UK page opens on the UK region.
//   - headcount is clamped to 0-100 per role.
//
// The arithmetic is NOT here. It is pure, in lib/calculators/price-comparison.ts,
// and verified to reproduce the live calculator's figures exactly across 60
// scenarios. This file only turns numbers into a table.

const ROLE_LABEL: Record<Role, string> = {
  junior: UI_STRINGS['calculator.roleJunior'],
  mid: UI_STRINGS['calculator.roleMid'],
  senior: UI_STRINGS['calculator.roleSenior'],
}

const REGION_LABEL: Record<Region, string> = {
  usa: UI_STRINGS['calculator.regionUsa'],
  uk: UI_STRINGS['calculator.regionUk'],
}

type Props = {
  rates: CalculatorRate[]
  /** The UK route opens on the UK rate card, as the live page does. */
  defaultRegion: Region
}

export function PriceComparisonCalculator({ rates, defaultRegion }: Props) {
  const [region, setRegion] = useState<Region>(defaultRegion)
  const [period, setPeriod] = useState<Period>('monthly')
  const [quantities, setQuantities] = useState<Record<Role, number>>({
    junior: 0,
    mid: 1,
    senior: 0,
  })

  // Read the URL once, on mount.
  //
  // Not during render: the server has no query string, so seeding state from it
  // would make the server and the first client render disagree, and React would
  // throw a hydration error on a page whose entire job is to be linkable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const r = params.get('region')
    if (r === 'usa' || r === 'uk') setRegion(r)
    if (params.get('mode') === 'annual') setPeriod('annual')

    const fromUrl: Partial<Record<Role, number>> = {}
    for (const role of ROLES) {
      const raw = params.get(role)
      const n = raw === null ? NaN : Number.parseInt(raw, 10)
      if (Number.isFinite(n)) fromUrl[role] = Math.min(MAX_PER_ROLE, Math.max(0, n))
    }
    if (Object.keys(fromUrl).length > 0) {
      setQuantities((q) => ({ ...q, ...fromUrl }))
    }
  }, [])

  // Write the URL back on every change, so the result is a link you can send.
  // replaceState, not push: dragging a number from 1 to 7 must not put six entries
  // in the visitor's back button.
  useEffect(() => {
    const params = new URLSearchParams({
      region,
      mode: period,
      junior: String(quantities.junior),
      mid: String(quantities.mid),
      senior: String(quantities.senior),
    })
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }, [region, period, quantities])

  const result = useMemo(
    () => compare(rates, region, quantities, period),
    [rates, region, quantities, period],
  )

  const setQty = (role: Role, raw: string) => {
    const n = Number.parseInt(raw, 10)
    const value = Number.isFinite(n) ? Math.min(MAX_PER_ROLE, Math.max(0, n)) : 0
    setQuantities((q) => ({ ...q, [role]: value }))
  }

  const periodLabel =
    period === 'monthly'
      ? UI_STRINGS['calculator.perMonth']
      : UI_STRINGS['calculator.perYear']

  return (
    <div className="flex flex-col gap-10">
      {/* Inputs */}
      <div className="rounded-[20px] border border-[#22314D] bg-[#101B30] p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-text-default">
              {UI_STRINGS['calculator.regionLabel']}
            </span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              className="h-11 rounded-pill border border-[#22314D] bg-[#070D18] px-4 text-body-sm text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="usa">{REGION_LABEL.usa}</option>
              <option value="uk">{REGION_LABEL.uk}</option>
            </select>
          </label>

          {ROLES.map((role) => (
            <label key={role} className="flex flex-col gap-2">
              <span className="text-body-sm font-medium text-text-default">
                {ROLE_LABEL[role]}
              </span>
              <input
                type="number"
                min={0}
                max={MAX_PER_ROLE}
                value={quantities[role]}
                onChange={(e) => setQty(role, e.target.value)}
                className="h-11 rounded-pill border border-[#22314D] bg-[#070D18] px-4 text-body-sm text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={period === 'annual'}
            onClick={() => setPeriod((p) => (p === 'monthly' ? 'annual' : 'monthly'))}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              period === 'annual'
                ? 'border-brand-primary bg-brand-primary'
                : 'border-[#22314D] bg-[#070D18]',
            )}
          >
            <span
              className={cn(
                'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200',
                period === 'annual' ? 'left-6 bg-text-dark' : 'left-1 bg-text-default/60',
              )}
            />
          </button>
          <Text as="span" size="small" className="text-text-default/80">
            {UI_STRINGS['calculator.showAnnual']}
          </Text>
        </div>
      </div>

      {/* Headline saving */}
      <div className="rounded-[20px] border border-brand-primary/25 bg-brand-primary/5 p-6 lg:p-8">
        <Text as="p" size="small" className="uppercase tracking-wider text-brand-primary font-medium">
          {UI_STRINGS['calculator.savingsEyebrow']}
        </Text>
        <p className="mt-2 font-semibold tabular-nums text-h2 text-brand-primary">
          {formatCurrency(result.totalSavings, region)}
          <span className="ml-2 align-middle text-body-sm font-normal text-text-default/70">
            {periodLabel}
          </span>
        </p>
        <Text as="p" size="small" className="mt-3 text-text-default/70">
          {UI_STRINGS['calculator.savingsCompare']
            .replace('{inHouse}', formatCurrency(result.inHouseTotal, region))
            .replace('{cloudEmployee}', formatCurrency(result.cloudEmployeeTotal, region))}
        </Text>
      </div>

      {/* Per-role breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">
            {UI_STRINGS['calculator.tableCaption'].replace('{region}', REGION_LABEL[region])}
          </caption>
          <thead>
            <tr className="border-b border-[#22314D]">
              <th scope="col" className="py-3 pr-4 text-body-sm font-medium text-text-default/70">
                {UI_STRINGS['calculator.colCost']}
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className="py-3 pr-4 text-right text-body-sm font-medium text-text-default/70 tabular-nums"
                >
                  {ROLE_LABEL[role]}
                  <span className="ml-1 text-text-default/40">
                    {UI_STRINGS['calculator.headcount'].replace(
                      '{n}',
                      String(result.roles.find((r) => r.role === role)?.quantity ?? 0),
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* One row per cost line, columns are the three seniorities. The line
                items are identical across roles within a region, so the first role
                that has any defines the row order. */}
            {(result.roles.find((r) => r.lineItems.length > 0)?.lineItems ?? []).map((item) => (
              <tr key={item.key} className="border-b border-[#22314D]/50">
                <th scope="row" className="py-3 pr-4 text-body-sm font-normal text-text-default/80">
                  {item.label}
                </th>
                {ROLES.map((role) => {
                  const row = result.roles.find((r) => r.role === role)
                  const cell = row?.lineItems.find((i) => i.key === item.key)
                  return (
                    <td
                      key={role}
                      className="py-3 pr-4 text-right text-body-sm tabular-nums text-text-default"
                    >
                      {formatCurrency(cell?.amount ?? 0, region)}
                    </td>
                  )
                })}
              </tr>
            ))}

            <tr className="border-b border-[#22314D]">
              <th scope="row" className="py-3 pr-4 text-body-sm font-semibold text-text-default">
                {UI_STRINGS['calculator.inHouseTotal']}
              </th>
              {ROLES.map((role) => (
                <td
                  key={role}
                  className="py-3 pr-4 text-right text-body-sm font-semibold tabular-nums text-text-default"
                >
                  {formatCurrency(
                    result.roles.find((r) => r.role === role)?.inHouseTotal ?? 0,
                    region,
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-b border-[#22314D]">
              <th scope="row" className="py-3 pr-4 text-body-sm font-semibold text-brand-primary">
                {UI_STRINGS['calculator.cloudEmployeeTotal']}
              </th>
              {ROLES.map((role) => (
                <td
                  key={role}
                  className="py-3 pr-4 text-right text-body-sm font-semibold tabular-nums text-brand-primary"
                >
                  {formatCurrency(
                    result.roles.find((r) => r.role === role)?.cloudEmployeeTotal ?? 0,
                    region,
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row" className="py-3 pr-4 text-body-sm font-semibold text-text-default">
                {UI_STRINGS['calculator.youSave']}
              </th>
              {ROLES.map((role) => {
                const row = result.roles.find((r) => r.role === role)
                return (
                  <td
                    key={role}
                    className="py-3 pr-4 text-right text-body-sm font-semibold tabular-nums text-text-default"
                  >
                    {formatCurrency(row?.savings ?? 0, region)}
                    {row?.savingsPct !== null && row?.savingsPct !== undefined ? (
                      <span className="ml-2 text-brand-primary">
                        {row.savingsPct.toFixed(1)}%
                      </span>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <Text as="p" size="small" className="text-text-default/50">
        {UI_STRINGS['calculator.disclaimer']}
      </Text>
    </div>
  )
}
