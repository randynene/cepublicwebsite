'use client'

import { useEffect, useRef } from 'react'

import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { cn } from '@/components/ui/_utils/cn'

import { GLYPH } from './content'
import { FOCUS_RING } from './primitives'
import type { ChatEntry } from '@/lib/ask/types'

// The chat column. Bottom-anchored, because a conversation that has only two
// turns should sit above the composer rather than floating at the top of an empty
// column - that is what `justify-end` on the thread buys.
//
// Two conventions worth knowing before editing the classes below:
//
//   1. Sizes are arbitrary pixel values, not Tailwind's numeric scale. This
//      project sets `--spacing: 0.5rem` (tokens.css), so `p-4` is 32px, not 16px,
//      and `rounded-2xl` is 80px. Every template in the repo works in arbitrary
//      values for the same reason.
//   2. Mobile sizes are CONTAINER queries (`@max-[62rem]:`), not viewport media
//      queries. The debug switcher previews the phone frames inside a 390px box on
//      a desktop viewport, and only container queries respond to that box.

/** Lime block caret marking a turn Clara is still writing. */
function StreamingCaret() {
  return (
    <span aria-hidden="true" className="ask-caret text-brand-primary">
      {GLYPH.caret}
    </span>
  )
}

function ClaraAvatar() {
  return (
    <span className="flex size-[28px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary @max-[62rem]:size-[24px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ask/clara-mark.svg"
        alt=""
        aria-hidden="true"
        className="block size-[14px] @max-[62rem]:size-[12px]"
      />
    </span>
  )
}

function ClaraTurn({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex gap-[13px] @max-[62rem]:gap-[11px]">
      <ClaraAvatar />
      <p className="flex-1 pt-[2px] text-[15.5px] leading-[25px] text-[#E6ECF5] @max-[62rem]:pt-0 @max-[62rem]:text-[14.5px] @max-[62rem]:leading-[23px]">
        {text}
        {streaming ? <StreamingCaret /> : null}
      </p>
    </div>
  )
}

const BUBBLE_BASE =
  'self-end max-w-[78%] rounded-[16px_16px_4px_16px] px-[17px] py-[13px] text-[15px] leading-[23px] @max-[62rem]:max-w-[80%] @max-[62rem]:rounded-[14px_14px_4px_14px] @max-[62rem]:px-[15px] @max-[62rem]:py-[12px] @max-[62rem]:text-[14.5px] @max-[62rem]:leading-[22px]'

function VisitorTurn({ text }: { text: string }) {
  return (
    <p className={cn(BUBBLE_BASE, 'bg-surface-tertiary text-white')}>{text}</p>
  )
}

/**
 * A voice transcript that has not been sent. Dashed outline plus a live caret, so
 * it can never be mistaken for something Clara has already received.
 */
function VisitorDraft({ text }: { text: string }) {
  return (
    <p
      className={cn(
        BUBBLE_BASE,
        'border border-dashed border-[#2c3f33] text-text-secondary',
      )}
    >
      {text}
      <StreamingCaret />
    </p>
  )
}

// Indents that line a row up with Clara's text rather than her avatar:
// avatar width + gap.
const CLARA_INDENT = 'pl-[41px] @max-[62rem]:pl-[35px]'
const CLARA_INDENT_MARGIN = 'ml-[41px] @max-[62rem]:ml-[35px]'

function BriefUpdateNote({ text }: { text: string }) {
  return (
    <div className={cn('flex items-center gap-[9px]', CLARA_INDENT)}>
      <span
        aria-hidden="true"
        className="block size-[5px] shrink-0 rounded-full bg-brand-primary"
      />
      <span className="text-[12.5px] leading-none text-text-tertiary">
        {text}
      </span>
    </div>
  )
}

/**
 * The soft human handoff (S6). Option A language only: the brief is strong
 * enough for a conversation. It must never claim a matched engineer.
 */
function OfferCard({
  title,
  body,
  ctaLabel,
  onSchedule,
}: {
  title: string
  body: string
  ctaLabel: string
  onSchedule: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-[16px] border border-[#2c3f33] bg-[#0F1B12] px-[20px] py-[18px]',
        CLARA_INDENT_MARGIN,
      )}
    >
      <p className="mb-[6px] text-[15px] font-semibold leading-[1.35] text-white">
        {title}
      </p>
      <p className="mb-[14px] text-[13.5px] leading-[20px] text-text-secondary">
        {body}
      </p>
      <MegaMenuPillLabel
        as="button"
        onClick={onSchedule}
        variant="pill-green"
        size="cta"
        leadingArrow
        leadingGlyph={GLYPH.arrow}
        label={ctaLabel}
        className="!text-[14px]"
      />
    </div>
  )
}

/**
 * Follow-up prompts. In P1 they load the composer rather than sending, so the
 * control behaves like a real one during review without needing a Clara turn.
 */
function SuggestionRow({
  items,
  onSelect,
}: {
  items: string[]
  onSelect: (value: string) => void
}) {
  return (
    <div className={cn('flex flex-wrap gap-[8px]', CLARA_INDENT)}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            'rounded-pill border border-border-subtle px-[13px] py-[9px] text-[12.5px] font-medium leading-none text-text-secondary transition-colors duration-reveal ease-reveal hover:border-brand-primary hover:text-white motion-reduce:transition-none',
            FOCUS_RING,
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function ChatThread({
  entries,
  onSchedule,
  onSuggestion,
}: {
  entries: ChatEntry[]
  onSchedule: () => void
  onSuggestion: (value: string) => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const lastEntry = entries[entries.length - 1]
  const scrollKey = `${entries.length}:${lastEntry?.id ?? ''}:${
    lastEntry && lastEntry.kind === 'clara' ? lastEntry.text.length : 0
  }`

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [scrollKey])

  return (
    <div
      // aria-live is deliberately absent. Announcing every streamed token would
      // be hostile; completed turns are visible in the thread for AT users.
      className="ask-scroll flex min-h-0 flex-1 flex-col justify-end gap-[20px] overflow-y-auto overscroll-contain py-[28px] @max-[62rem]:gap-[16px] @max-[62rem]:px-[14px] @max-[62rem]:py-[16px]"
    >
      {entries.map((entry) => {
        switch (entry.kind) {
          case 'clara':
            return (
              <ClaraTurn
                key={entry.id}
                text={entry.text}
                streaming={entry.streaming}
              />
            )
          case 'visitor':
            return <VisitorTurn key={entry.id} text={entry.text} />
          case 'visitor-draft':
            return <VisitorDraft key={entry.id} text={entry.text} />
          case 'brief-update':
            return <BriefUpdateNote key={entry.id} text={entry.text} />
          case 'offer':
            return (
              <OfferCard
                key={entry.id}
                title={entry.title}
                body={entry.body}
                ctaLabel={entry.ctaLabel}
                onSchedule={onSchedule}
              />
            )
          case 'suggestions':
            return (
              <SuggestionRow
                key={entry.id}
                items={entry.items}
                onSelect={onSuggestion}
              />
            )
        }
      })}
      <div ref={endRef} aria-hidden="true" className="h-px w-full shrink-0" />
    </div>
  )
}
