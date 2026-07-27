'use client'

import { useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'

// Location start quiz (PH reference step 1). Dark card with role pills; Next is
// disabled until a role is selected, then navigates to ctaHref (?role=).

const GLYPH = { arrow: '→' } as const

export interface LocationStartQuizProps {
  eyebrow: string
  title: string
  titleAccent?: string
  subtitle: string
  stepLabel: string
  prompt: string
  hint: string
  roles: string[]
  cta: string
  ctaHref: string
  /** Prefix for the footer status once a role is picked, e.g. "Selected: ". */
  selectedPrefix: string
  /** Footer status shown before any role is picked. */
  emptyStatus: string
}

export function LocationStartQuiz({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  stepLabel,
  prompt,
  hint,
  roles,
  cta,
  ctaHref,
  selectedPrefix,
  emptyStatus,
}: LocationStartQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const status = selected ? selectedPrefix + selected : emptyStatus

  function goNext() {
    if (!selected) return
    const url = new URL(ctaHref, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    url.searchParams.set('role', selected)
    window.location.href = `${url.pathname}${url.search}${url.hash}`
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col items-center gap-4">
      {/* data-spot-item: the parent Spotlight dims this heading block at rest.
          The quiz card below is an input surface and stays full-bright. */}
      <div
        data-spot-item
        className="flex flex-col items-center gap-4 transition-opacity duration-300 motion-safe:opacity-50"
      >
        <p className="text-center text-[12px] font-semibold uppercase tracking-[1.68px] text-brand-primary">{eyebrow}</p>
        <h2 className="text-center text-[34px] font-semibold leading-[1.08] tracking-[-1.4px] text-white lg:text-[52px] lg:leading-[56px]">
          {title}{' '}
          {titleAccent ? <span className="font-serif font-normal italic text-brand-primary">{titleAccent}</span> : null}
        </h2>
        <p className="text-center text-[17px] text-[#B8C2D1]">{subtitle}</p>
      </div>

      <div className="mt-4 w-full overflow-hidden rounded-[24px] border border-[#22314D] bg-[#101B30] shadow-[0_30px_50px_rgba(0,0,0,0.35)]">
        <div className="h-[5px] bg-brand-primary" />
        <div className="px-6 py-10 sm:px-10 lg:px-14">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#7F8CA0]">{stepLabel}</p>
          <h3 className="text-[24px] font-semibold tracking-[-0.8px] text-white lg:text-[30px]">{prompt}</h3>
          <p className="mb-8 mt-2 text-[16px] text-[#B8C2D1]">{hint}</p>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {roles.map((role) => {
              const active = selected === role
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelected(role)}
                  className={cn(
                    'flex h-[92px] flex-col justify-center rounded-[14px] border px-4 text-left transition-colors',
                    active
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-[#22314D] bg-[#1B2A45] hover:border-brand-primary/40',
                  )}
                >
                  <span className="text-[16px] font-bold text-white">{role}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[#22314D] pt-6">
            <span className="text-[13px] text-[#7F8CA0]">{status}</span>
            <button
              type="button"
              disabled={!selected}
              onClick={goNext}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-6 py-[14px] text-[15px] font-semibold transition-opacity',
                selected
                  ? 'bg-brand-primary text-[#060F1E] hover:opacity-90'
                  : 'cursor-not-allowed bg-[#1B2A45] text-[#6B7589]',
              )}
            >
              {cta}
              <span aria-hidden="true">{GLYPH.arrow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
