import { cn } from '@/components/ui/_utils/cn'
import { ACCENT, BAND_1280, Eyebrow } from './shared'

// "The alternative" comparison section - 1:1 port of Technology Detail 2 (reference).
// Fixed template content (same on every technology detail page). Cell states:
// yes = solid lime pill, partial = lime-outline pill, no = grey dash pill.

type Cell = 'yes' | 'partial' | 'no'

const COPY = {
  eyebrow: 'The alternative',
  lead: 'Get speed, fit and in-house feel',
  accent: 'without the hiring grind.',
  legend: 'Solid lime = yes · outline lime = partial · grey dash = no',
} as const

const COLUMNS = ['Cloud Employee', 'In-house hiring', 'Dev agencies', 'Freelancers'] as const

const ROWS: { label: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { label: 'Speed to hire', cells: ['yes', 'no', 'partial', 'yes'] },
  { label: 'Flexibility to scale', cells: ['yes', 'no', 'partial', 'yes'] },
  { label: 'Developer fit (embedded)', cells: ['yes', 'yes', 'partial', 'no'] },
  { label: 'Full-time, only for you', cells: ['yes', 'yes', 'no', 'no'] },
  { label: 'No overhead or upfront fees', cells: ['yes', 'no', 'no', 'partial'] },
]

const GRID = 'grid grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] items-center'
const GLYPH = { check: '✓', dash: '-' } as const

// 30px status pill.
function Pill({ state }: { state: Cell }) {
  const base = 'flex h-[30px] w-[30px] items-center justify-center rounded-full text-[15px] font-bold leading-none'
  if (state === 'yes') return <span aria-label="Yes" className={cn(base, 'bg-brand-primary text-[#060F1E]')}>{GLYPH.check}</span>
  if (state === 'partial') return <span aria-label="Partial" className={cn(base, 'border border-brand-primary/50 bg-transparent text-brand-primary')}>{GLYPH.check}</span>
  return <span aria-label="No" className={cn(base, 'bg-[#1B2A45] text-[#7F8CA0]')}>{GLYPH.dash}</span>
}

export function AlternativeSection() {
  return (
    <section className={cn(BAND_1280, 'py-[56px]')}>
      <div className="text-center">
        <Eyebrow className="text-center">{COPY.eyebrow}</Eyebrow>
        <h2 className="mx-auto mt-4 max-w-[820px] text-[34px] font-semibold leading-[1.1] tracking-[-1.4px] text-white lg:text-[46px] lg:leading-[54px]">
          {COPY.lead} <span className={ACCENT}>{COPY.accent}</span>
        </h2>
      </div>

      {/* Comparison table */}
      <div className="mx-auto mt-12 max-w-[1000px] overflow-x-auto">
        <div className="min-w-[720px] overflow-hidden rounded-[20px] border border-[#22314D]">
          {/* Header row */}
          <div className={GRID}>
            <span aria-hidden="true" className="px-7 py-6" />
            {COLUMNS.map((c, i) => (
              <span
                key={c}
                className={cn(
                  'px-4 py-6 text-center text-[15px]',
                  i === 0
                    ? 'border-x border-t border-brand-primary/25 border-t-brand-primary/35 bg-brand-primary/[0.06] font-bold text-brand-primary'
                    : 'font-semibold text-white',
                )}
              >
                {c}
              </span>
            ))}
          </div>
          {/* Data rows */}
          {ROWS.map((row) => (
            <div key={row.label} className={cn(GRID, 'border-t border-[#22314D]')}>
              <span className="px-7 py-[22px] text-[15px] font-semibold leading-[21px] text-white">{row.label}</span>
              {row.cells.map((state, i) => (
                <span
                  key={COLUMNS[i]}
                  className={cn(
                    'flex justify-center px-4 py-[22px]',
                    i === 0 && 'border-x border-brand-primary/25 bg-brand-primary/[0.06]',
                  )}
                >
                  <Pill state={state} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center font-mono text-[12px] leading-[18px] text-[#5B6577]">{COPY.legend}</p>
    </section>
  )
}
