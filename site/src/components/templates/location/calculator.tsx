'use client'

import { useMemo, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'

// Location pricing calculator (design: docs/raw-html/location/*.html).
//
// Role + seniority drive an all-in monthly estimate and the "vs hiring in the US"
// saving. The default (Senior Backend Engineer / Senior level) reproduces the
// reference's $5,400/mo + $85,200/yr saved. Math is local and updates live;
// nothing talks to a backend.
//
// TODO(wiring): rates are illustrative placeholders matching the reference; a
// later pass sources them (Sanity or the verified calculator model).

const GLYPH = { chevron: '⌄' } as const

const ROLES = [
  { id: 'backend', label: 'Senior Backend Engineer', base: 5400 },
  { id: 'fullstack', label: 'Full-Stack Engineer', base: 5200 },
  { id: 'frontend', label: 'Frontend Engineer', base: 5000 },
  { id: 'data', label: 'Data Engineer', base: 5600 },
  { id: 'ml', label: 'ML / AI Engineer', base: 6200 },
] as const

// Senior+ only — location pages market senior engineers (5+ years). Mid level
// was removed so the calculator matches the page promise.
const SENIORITY = [
  { id: 'senior', label: 'Senior level', mult: 1 },
  { id: 'lead', label: 'Lead / Staff', mult: 1.28 },
] as const

const REGIONS = [
  { id: 'latam', label: 'Latin America', mult: 1 },
  { id: 'mexico', label: 'Mexico', mult: 1.02 },
  { id: 'brazil', label: 'Brazil', mult: 1.04 },
  { id: 'argentina', label: 'Argentina', mult: 0.97 },
  { id: 'colombia', label: 'Colombia', mult: 0.95 },
] as const

// Loaded local annual cost as a multiple of the CE all-in ANNUAL cost. Default
// tuned so the LATAM default (backend/senior, $5,400/mo) yields ~$85,200/yr
// saved, matching the reference. Per-region override via the `comparisonMultiple`
// prop (EE ~2.10, PH ~3.18).
const US_ANNUAL_MULTIPLE = 2.3148

function fmtMoney(n: number, symbol: string): string {
  return `${symbol}${Math.round(n).toLocaleString('en-US')}`
}

const SELECT =
  'w-full cursor-pointer appearance-none rounded-[12px] border border-[#22314D] bg-[#0A1628] px-4 py-4 pr-10 text-[16px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]'

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
  options: readonly { id: string; label: string }[]
  id: string
}) {
  // htmlFor (not wrapping <label>) so Chrome does not open-then-close the native
  // popup. The <select> carries its own padding so the whole box is the hit target;
  // the chevron is decorative only (pointer-events-none).
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[1.4px] text-text-default/50"
      >
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
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-text-default/50"
        >
          {GLYPH.chevron}
        </span>
      </span>
    </div>
  )
}

export interface CalcRegionOption {
  id: string
  label: string
  mult: number
}

export interface CalcRole {
  id: string
  label: string
  base: number
}

export interface CalcSeniorityOption {
  id: string
  label: string
  mult: number
}

export function LocationCalculator({
  labels,
  regions = REGIONS as unknown as CalcRegionOption[],
  roles = ROLES as unknown as CalcRole[],
  seniorityOptions = SENIORITY as unknown as CalcSeniorityOption[],
  currency = '$',
  comparisonMultiple = US_ANNUAL_MULTIPLE,
}: {
  labels: {
    roleLabel: string
    regionLabel: string
    seniorityLabel: string
    regionValue: string
    monthlyEyebrow: string
    monthlySuffix: string
    savedPrefix: string
    savedSuffix: string
    cta: string
    ctaHref: string
  }
  // Per-region option set + cost multipliers, so each location page shows its own
  // region (and figure) instead of the LATAM default.
  regions?: CalcRegionOption[]
  // Role options in the region's currency (PH is in GBP).
  roles?: CalcRole[]
  // Seniority options (PH is senior-focused: Senior + Lead only).
  seniorityOptions?: CalcSeniorityOption[]
  currency?: string
  comparisonMultiple?: number
}) {
  const defaultSeniorityId =
    seniorityOptions.find((s) => s.id === 'senior')?.id ?? seniorityOptions[0]?.id ?? 'senior'
  const [roleId, setRoleId] = useState(roles[0]?.id ?? 'backend')
  const [regionId, setRegionId] = useState(regions[0]?.id ?? 'latam')
  const [seniorityId, setSeniorityId] = useState(defaultSeniorityId)

  const view = useMemo(() => {
    const role = roles.find((r) => r.id === roleId) ?? roles[0]
    const region = regions.find((r) => r.id === regionId) ?? regions[0]
    const sen =
      seniorityOptions.find((s) => s.id === seniorityId) ??
      seniorityOptions.find((s) => s.id === 'senior') ??
      seniorityOptions[0]
    const monthly = role.base * (sen?.mult ?? 1) * (region?.mult ?? 1)
    const ceAnnual = monthly * 12
    // comparisonMultiple is the loaded LOCAL annual cost as a multiple of the CE
    // all-in annual cost (LATAM ~2.315 -> ~$85,200 saved on $5,400/mo).
    const saved = ceAnnual * comparisonMultiple - ceAnnual
    return { monthly: fmtMoney(monthly, currency), saved: fmtMoney(saved, currency) }
  }, [roleId, regionId, seniorityId, regions, roles, seniorityOptions, currency, comparisonMultiple])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Inputs */}
      <div className="flex flex-col gap-5 rounded-[20px] border border-[#22314D] bg-[#0A1628] p-6 lg:p-8">
        <Field
          id="loc-calc-role"
          label={labels.roleLabel}
          value={roleId}
          onChange={setRoleId}
          options={roles}
        />
        <Field
          id="loc-calc-region"
          label={labels.regionLabel}
          value={regionId}
          onChange={setRegionId}
          options={regions}
        />
        <Field
          id="loc-calc-seniority"
          label={labels.seniorityLabel}
          value={seniorityId}
          onChange={setSeniorityId}
          options={seniorityOptions}
        />
      </div>

      {/* Result - lime card */}
      <div className="relative flex flex-col justify-between rounded-[20px] bg-brand-primary p-6 text-[#0A1628] lg:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[#0A1628]/60">{labels.monthlyEyebrow}</p>
          <p className="mt-2 text-[56px] font-extrabold leading-none tracking-[-2px] tabular-nums">{view.monthly}</p>
          <p className="mt-1 text-[14px] font-medium text-[#0A1628]/70">{labels.monthlySuffix}</p>
        </div>
        <div className="mt-6 border-t border-[#0A1628]/15 pt-4">
          <p className="text-[13px] text-[#0A1628]/70">{labels.savedPrefix}</p>
          <p className="text-[20px] font-bold tabular-nums">
            {view.saved}
            <span className="ml-1 text-[13px] font-medium text-[#0A1628]/70">{labels.savedSuffix}</span>
          </p>
        </div>
        <a
          href={labels.ctaHref}
          className={cn(
            'sf sf-s mt-6 inline-flex items-center justify-center rounded-pill px-6 py-3 text-[15px] font-semibold',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1628] focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary',
          )}
        >
          <span className="c">{labels.cta}</span>
        </a>
      </div>
    </div>
  )
}
