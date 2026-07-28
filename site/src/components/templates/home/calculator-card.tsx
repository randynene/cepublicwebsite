'use client'

import { useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { CountUp } from '@/components/motion/count-up'
import { Reveal } from '@/components/motion/reveal'
import { ChatLink } from '@/components/shared/chat-link'
import { CHAT_HREF } from '@/lib/chat'
import {
  computeNextHireCost,
  NEXT_HIRE_REGION_OPTIONS,
  NEXT_HIRE_ROLE_OPTIONS,
  NEXT_HIRE_SENIORITY_OPTIONS,
} from '@/lib/calculators/next-hire'
import type { HomeContent } from './content'

// TEMPLATE-HOME — pricing calculator card.
//
// This used to be static markup (three styled <div>s that LOOKED like selects
// but could not be opened). It is now a real client widget on the shared
// lib/calculators/next-hire engine, so the home page and
// /services/software-engineers return identical figures.
//
// Behaviour matches the Hire Engineers calculator: the opening figures are the
// authored ones from Sanity (calculator.price / calculator.saving) and the
// maths only takes over once the visitor changes a dropdown. That keeps the
// at-rest page identical to the design.
//
// Seniority is the one field whose visible label differs from the engine key
// ("Senior level" reads better on the page than "Senior"), so it carries an
// explicit label -> key map.

const MUTED = 'text-[#7F8CA0]'

/** Down-chevron glyph, matching the static markup this card replaced. */
const CHEVRON = '\u2304'
/** Trailing arrow on the chat CTA — Seb asked for the arrow on the 28 Jul call. */
const ARROW = '\u2192'

const SENIORITY_LABELS: Record<string, string> = {
  Senior: 'Senior level',
  Mid: 'Mid level',
  'Lead / Staff': 'Lead / Staff',
}

type FieldKind = 'role' | 'region' | 'seniority'

/** Match an authored field label ("Role" / "Region" / "Seniority") to a kind.
 *  Falls back to position so a renamed label never breaks the widget. */
function fieldKind(label: string, index: number): FieldKind {
  const l = label.trim().toLowerCase()
  if (l.startsWith('role')) return 'role'
  if (l.startsWith('region')) return 'region'
  if (l.startsWith('senior')) return 'seniority'
  return (['role', 'region', 'seniority'] as const)[index] ?? 'role'
}

/** Pick the starting option: the authored value when it is a real engine key,
 *  otherwise the first option. */
function initial(options: string[], authored: string | undefined, labels?: Record<string, string>) {
  if (!authored) return options[0]
  const match = options.find(
    (o) => o === authored || labels?.[o]?.toLowerCase() === authored.trim().toLowerCase(),
  )
  return match ?? options[0]
}

const SELECT_SHELL =
  'flex items-center justify-between rounded-[12px] border border-[#22314D] bg-[#16233B] px-[16px] py-[12px] transition-colors focus-within:border-brand-primary/60'

export function HomeCalculatorCard({ calculator }: { calculator: HomeContent['calculator'] }) {
  const fields = calculator.fields ?? []
  const authored: Partial<Record<FieldKind, string>> = {}
  fields.forEach((f, i) => {
    authored[fieldKind(f.label, i)] = f.value
  })

  const [role, setRole] = useState(() =>
    initial(NEXT_HIRE_ROLE_OPTIONS, authored.role),
  )
  const [region, setRegion] = useState(() =>
    initial(NEXT_HIRE_REGION_OPTIONS, authored.region),
  )
  const [seniority, setSeniority] = useState(() =>
    initial(NEXT_HIRE_SENIORITY_OPTIONS, authored.seniority, SENIORITY_LABELS),
  )
  const [touched, setTouched] = useState(false)

  const computed = computeNextHireCost(role, region, seniority)
  const price = touched ? computed.monthly : calculator.price
  const saving = touched ? `${computed.savedPerYear}/yr saved` : calculator.saving
  // The corner badge repeats the saving ("SAVE $85,200/YR"), so its figure has
  // to track the panel or the two contradict each other after a change.
  const badgeSave = touched
    ? calculator.badgeSave.replace(/\$[\d,]+/, computed.savedPerYear)
    : calculator.badgeSave

  const controls: {
    kind: FieldKind
    label: string
    value: string
    options: string[]
    labels?: Record<string, string>
    onChange: (v: string) => void
  }[] = [
    {
      kind: 'role',
      label: fields.find((f, i) => fieldKind(f.label, i) === 'role')?.label ?? 'Role',
      value: role,
      options: NEXT_HIRE_ROLE_OPTIONS,
      onChange: setRole,
    },
    {
      kind: 'region',
      label: fields.find((f, i) => fieldKind(f.label, i) === 'region')?.label ?? 'Region',
      value: region,
      options: NEXT_HIRE_REGION_OPTIONS,
      onChange: setRegion,
    },
    {
      kind: 'seniority',
      label: fields.find((f, i) => fieldKind(f.label, i) === 'seniority')?.label ?? 'Seniority',
      value: seniority,
      options: NEXT_HIRE_SENIORITY_OPTIONS,
      labels: SENIORITY_LABELS,
      onChange: setSeniority,
    },
  ]

  return (
    <Reveal className="relative mt-[40px] grid rounded-[32px] border border-[#22314D] bg-[#101B30] lg:grid-cols-[1.4fr_1fr]">
      {/* Left: real <select> fields, label floating above each box.
       * The <label> must NOT wrap the <select>: Chrome forwards the label's
       * click to the control, which opens then instantly re-closes the native
       * popup. htmlFor + id keeps the association without the double-toggle. */}
      <div className="flex flex-col gap-[18px] p-[28px] lg:p-[40px]">
        {controls.map((c) => (
          <div key={c.kind} className="flex flex-col gap-[8px]">
            <label
              htmlFor={`home-calc-${c.kind}`}
              className={cn('text-[11px] font-semibold uppercase tracking-[1.2px]', MUTED)}
            >
              {c.label}
            </label>
            <div className={SELECT_SHELL}>
              <select
                id={`home-calc-${c.kind}`}
                value={c.value}
                onChange={(e) => {
                  setTouched(true)
                  c.onChange(e.target.value)
                }}
                className="w-full cursor-pointer appearance-none bg-transparent text-[17px] font-semibold text-white outline-none"
              >
                {c.options.map((o) => (
                  <option key={o} value={o} className="bg-[#16233B] text-white">
                    {c.labels?.[o] ?? o}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none ml-[10px] text-[16px] leading-none text-brand-primary"
              >
                {CHEVRON}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right: lime result panel */}
      <div className="relative flex flex-col justify-center rounded-[0_32px_32px_0] bg-brand-primary p-[28px] text-[#060F1E] lg:p-[40px]">
        <div className="text-[11px] font-bold uppercase tracking-[1.2px]">
          {calculator.resultLabel}
        </div>
        <div className="mt-[8px] flex items-end gap-[8px]">
          <span className="text-[44px] font-extrabold leading-none tracking-[-2px] tabular-nums lg:text-[56px]">
            {touched ? price : <CountUp value={price} />}
          </span>
          <span className="mb-[6px] text-[18px] font-medium">{calculator.priceSuffix}</span>
        </div>
        <div className="my-[18px] h-px w-full bg-[#060F1E]/20" />
        <div className="flex flex-col gap-[4px]">
          <span className="text-[13px] font-medium opacity-70">{calculator.comparison}</span>
          <span className="text-[15px] font-bold tabular-nums">{saving}</span>
        </div>
        {/* This used to scroll to #process (the video), which is not what the
         * label promised. It now opens the chat, which is where a visitor who
         * wants a figure they can trust actually gets one. */}
        <ChatLink
          href={CHAT_HREF}
          className="mt-[24px] inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-[#060F1E] px-[18px] py-[14px] text-[15px] font-bold text-white transition-colors hover:bg-[#0D1A31]"
        >
          {calculator.cta}
          <span aria-hidden>{ARROW}</span>
        </ChatLink>
      </div>

      {/* Save badge: tilted 6deg, popped in, sits proud of the card corner */}
      <Reveal
        as="span"
        variant="pop"
        rotate={6}
        delay={200}
        className="absolute right-[24px] top-[-24px] z-[10] flex h-[92px] w-[92px] rotate-[6deg] flex-col items-center justify-center rounded-full bg-white p-[8px] text-center text-[#060F1E] shadow-[0_10px_30px_rgba(0,0,0,.35)]"
      >
        <span className="text-[11px] font-extrabold uppercase leading-[13px]">
              {badgeSave}
            </span>
        <span className="mt-[3px] text-[9px] font-semibold">{calculator.badgeSub}</span>
      </Reveal>
    </Reveal>
  )
}
