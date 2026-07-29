'use client'

import { cn } from '@/components/ui/_utils/cn'
import { Icon } from '@/components/ui/icon'

import { ASK_LABELS } from '../content'
import { FOCUS_RING, MicroLabel } from '../primitives'
import { createPersistedStore } from '../use-persisted'
import type { ProofItem, ProofPanel as ProofPanelData } from '@/lib/ask/types'

// The proof canvas: client stories and did-you-knows, cross-fading.
//
// Three sizes of one idea, because the design uses it three ways:
//   full  - S1/S2, the whole right column before any hiring signal.
//   strip - S3/S4/S5, a band under the brief once the brief owns the top.
//   card  - S9, a card above the thread on a phone.
//
// Rotation is CSS-only (globals.css `.ask-rotator-card`): a fixed 24s loop with
// each card delayed by 24s/count, so exactly one is legible at a time and the
// whole thing costs no JavaScript. Under reduced motion the animation never starts
// and the panel holds on its active card.

type ProofSize = 'full' | 'strip' | 'card'

const QUOTE_CLASS: Record<ProofSize, string> = {
  full: 'font-serif text-[34px] italic leading-[46px] tracking-[-0.5px] text-white max-w-[600px]',
  strip: 'font-serif text-[21px] italic leading-[31px] text-white max-w-[560px]',
  card: 'font-serif text-[15px] italic leading-[23px] text-white',
}

const FACT_CLASS: Record<ProofSize, string> = {
  full: 'text-[34px] font-semibold leading-[46px] tracking-[-1.1px] text-white max-w-[600px]',
  strip: 'text-[21px] font-semibold leading-[31px] tracking-[-0.6px] text-white max-w-[560px]',
  card: 'text-[15px] font-semibold leading-[23px] text-white',
}

const SUPPORT_CLASS: Record<ProofSize, string> = {
  full: 'text-[15px] leading-[24px] text-text-secondary max-w-[520px]',
  strip: 'text-[13px] leading-none text-text-tertiary',
  card: 'text-[11.5px] leading-none text-text-tertiary',
}

/** Lime highlight on the emphasised run of a did-you-know sentence. */
const ACCENT_SEGMENT = 'text-brand-primary'

const GAP_CLASS: Record<ProofSize, string> = {
  full: 'gap-[26px]',
  strip: 'gap-[16px]',
  card: 'gap-[10px]',
}

function Attribution({ item, size }: { item: ProofItem; size: ProofSize }) {
  if (item.kind !== 'client-story') return null

  // The full-height panel gives the author a placeholder disc and two lines; the
  // compact sizes collapse to a single muted line.
  if (size === 'full') {
    return (
      <div className="flex items-center gap-[16px]">
        <div
          aria-hidden="true"
          className="size-[44px] rounded-full border border-border-subtle bg-surface-tertiary"
        />
        <div>
          <div className="mb-[6px] text-[15px] font-semibold leading-none text-white">
            {item.author}
          </div>
          {item.role ? (
            <div className="text-[13.5px] leading-none text-text-tertiary">
              {item.role}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  const line = item.role ? `${item.author} · ${item.role}` : item.author
  return <div className={SUPPORT_CLASS[size]}>{line}</div>
}

function ProofCard({
  item,
  size,
  active,
  rotating,
  delaySeconds,
  className,
}: {
  item: ProofItem
  size: ProofSize
  active: boolean
  rotating: boolean
  delaySeconds: number
  className?: string
}) {
  const eyebrowSize = size === 'full' ? 'md' : 'sm'
  const eyebrowClass =
    size === 'card' ? 'text-[9.5px] tracking-[1.3px]' : undefined
  return (
    <div
      className={cn(
        'ask-rotator-card absolute inset-0 flex flex-col justify-center',
        GAP_CLASS[size],
        className,
      )}
      data-active={active}
      data-rotating={rotating}
      style={rotating ? { animationDelay: `${delaySeconds}s` } : undefined}
      // Only the visible card is announced; the others are the same marketing
      // message queued behind it.
      aria-hidden={!active}
    >
      <MicroLabel size={eyebrowSize} tone="accent" className={eyebrowClass}>
        {item.eyebrow}
      </MicroLabel>

      {item.kind === 'client-story' ? (
        <blockquote className={QUOTE_CLASS[size]}>{item.quote}</blockquote>
      ) : (
        <p className={FACT_CLASS[size]}>
          {item.segments.map((segment, index) => {
            const segmentClass = segment.accent ? ACCENT_SEGMENT : undefined
            return (
              <span key={index} className={segmentClass}>
                {segment.text}
              </span>
            )
          })}
        </p>
      )}

      {item.kind === 'did-you-know' && item.support ? (
        <p className={SUPPORT_CLASS[size]}>{item.support}</p>
      ) : null}

      <Attribution item={item} size={size} />
    </div>
  )
}

// The proof band is dismissible once the brief owns the canvas: by that point the
// visitor is working, and a rotating testimonial beside their own brief is the
// thing most likely to be in the way. The choice is remembered, so it stays shut
// for the rest of the session rather than reappearing on the next state change.
//
// The full-height S1/S2 panel is deliberately NOT dismissible - closing it would
// leave an empty canvas with nothing to replace it.
const proofDismissed = createPersistedStore<boolean>({
  key: 'ask.proofDismissed',
  fallback: false,
  decode: (raw) => raw === '1',
  encode: (value) => (value ? '1' : '0'),
})

function DismissProofButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label={ASK_LABELS.dismissProof}
      onClick={() => proofDismissed.set(true)}
      className={cn(
        'absolute z-[2] inline-flex size-[24px] items-center justify-center rounded-full border border-border-subtle bg-[#101B30]/80 text-text-tertiary transition-colors duration-reveal ease-reveal hover:border-brand-primary hover:text-white motion-reduce:transition-none',
        FOCUS_RING,
        className,
      )}
    >
      <Icon name="close" size="sm" className="size-[10px]" />
    </button>
  )
}

function Dots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div aria-hidden="true" className="flex gap-[6px]">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            'block size-[5px] rounded-full',
            index === activeIndex ? 'bg-brand-primary' : 'bg-border-subtle',
          )}
        />
      ))}
    </div>
  )
}

/** The full-height proof column (S1, S2). */
export function ProofCanvas({ proof }: { proof: ProofPanelData }) {
  const cycle = 24 / Math.max(1, proof.items.length)
  return (
    <div className="flex min-h-0 flex-1 flex-col px-[34px] pb-[30px] pt-[26px] @max-[62rem]:px-[16px] @max-[62rem]:pb-[20px] @max-[62rem]:pt-[16px]">
      <div className="flex shrink-0 items-center justify-between">
        {proof.eyebrow ? <MicroLabel>{proof.eyebrow}</MicroLabel> : <span />}
        {proof.rotating ? (
          <Dots count={proof.items.length} activeIndex={proof.activeIndex} />
        ) : null}
      </div>

      <div className="relative mt-[22px] min-h-0 flex-1">
        {proof.items.map((item, index) => (
          <ProofCard
            key={item.id}
            item={item}
            size="full"
            active={index === proof.activeIndex}
            rotating={proof.rotating}
            delaySeconds={-(index * cycle)}
          />
        ))}
      </div>

      {/* When the panel is frozen the dots move below it, as the S2 frame draws. */}
      {proof.rotating ? null : (
        <div className="mt-[8px] shrink-0">
          <Dots count={proof.items.length} activeIndex={proof.activeIndex} />
        </div>
      )}

      {proof.footer ? (
        <div className="mt-[20px] flex shrink-0 items-center gap-[22px] border-t border-[#1a2740] pt-[20px]">
          <span className="flex-1 text-[13px] leading-[1.4] text-text-tertiary">
            {proof.footer.text}
          </span>
          <span className="whitespace-nowrap text-[13px] font-semibold leading-none text-brand-primary">
            {proof.footer.linkLabel}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/** The short band that keeps proof rotating once the brief owns the canvas. */
export function ProofStrip({
  proof,
  height,
}: {
  proof: ProofPanelData
  height: number
}) {
  const cycle = 24 / Math.max(1, proof.items.length)
  const dismissed = proofDismissed.use()
  if (dismissed) return null

  return (
    <div
      className="relative shrink-0 overflow-hidden border-t border-[#1a2740] bg-[#0E1A2E]"
      style={{ height }}
    >
      <DismissProofButton className="right-[16px] top-[14px]" />
      {proof.items.map((item, index) => (
        <ProofCard
          key={item.id}
          item={item}
          size="strip"
          active={index === proof.activeIndex}
          rotating={proof.rotating}
          delaySeconds={-(index * cycle)}
          className="px-[32px] py-[24px]"
        />
      ))}
    </div>
  )
}

/** Compact proof card that sits above the thread on a phone (S9). */
export function ProofCardMobile({ proof }: { proof: ProofPanelData }) {
  const cycle = 24 / Math.max(1, proof.items.length)
  const dismissed = proofDismissed.use()
  if (dismissed) return null

  return (
    <div className="relative mx-[12px] mt-[12px] h-[118px] shrink-0 overflow-hidden rounded-[14px] border border-[#1a2740] bg-[#0E1A2E]">
      <DismissProofButton className="right-[10px] top-[10px]" />
      {proof.items.map((item, index) => (
        <ProofCard
          key={item.id}
          item={item}
          size="card"
          active={index === proof.activeIndex}
          rotating={proof.rotating}
          delaySeconds={-(index * cycle)}
          className="p-[16px]"
        />
      ))}
    </div>
  )
}
