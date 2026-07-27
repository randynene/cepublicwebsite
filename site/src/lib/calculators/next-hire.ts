// "What would your next engineer cost?" calculator engine.
//
// Lookup tables copied verbatim from the source <script> on the Hire Engineers
// design export. They were previously inlined in
// components/templates/hire-engineers/content.ts; they live here now so the
// Home page calculator and the Hire Engineers calculator produce identical
// figures from one set of rates instead of drifting apart.
//
// The Location pages use a DIFFERENT model (per-region multipliers + a loaded
// local-cost multiple) in components/templates/location/calculator.tsx, and the
// /pricing + /hiring-cost-calculator pages use the verified CE cost model in
// lib/calculators/hiring-cost.ts. Those are deliberately separate.

export const NEXT_HIRE_RATES = {
  base: {
    'Senior Backend Engineer': 5400,
    'Senior Frontend Engineer': 5200,
    'Senior Full-Stack Engineer': 5600,
    'DevOps Engineer': 6200,
    'AI / ML Engineer': 6800,
  } as Record<string, number>,
  rMult: { 'Latin America': 1.0, Europe: 1.18, Philippines: 0.82 } as Record<string, number>,
  sMult: { Senior: 1.0, Mid: 0.78, 'Lead / Staff': 1.32 } as Record<string, number>,
  usA: {
    'Senior Backend Engineer': 175000,
    'Senior Frontend Engineer': 168000,
    'Senior Full-Stack Engineer': 180000,
    'DevOps Engineer': 198000,
    'AI / ML Engineer': 215000,
  } as Record<string, number>,
} as const

export const NEXT_HIRE_ROLE_OPTIONS = Object.keys(NEXT_HIRE_RATES.base)
export const NEXT_HIRE_REGION_OPTIONS = Object.keys(NEXT_HIRE_RATES.rMult)
export const NEXT_HIRE_SENIORITY_OPTIONS = Object.keys(NEXT_HIRE_RATES.sMult)

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
const round50 = (n: number) => Math.round(n / 50) * 50

/** Monthly all-in cost + annual saving vs a US hire, both pre-formatted. */
export function computeNextHireCost(
  role: string,
  region: string,
  seniority: string,
): { monthly: string; savedPerYear: string } {
  const base = NEXT_HIRE_RATES.base[role] ?? 0
  const rMult = NEXT_HIRE_RATES.rMult[region] ?? 1
  const sMult = NEXT_HIRE_RATES.sMult[seniority] ?? 1
  const monthly = round50(base * rMult * sMult)
  const saved = Math.max(0, (NEXT_HIRE_RATES.usA[role] ?? 0) * sMult - monthly * 12)
  return { monthly: money(monthly), savedPerYear: money(round50(saved)) }
}
