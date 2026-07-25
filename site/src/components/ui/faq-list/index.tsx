import type { ReactNode } from 'react'

import { PortableText } from '@/components/ui/portable-text'
import { cn } from '@/components/ui/_utils/cn'
import type { FaqItem } from '@/types/sanity/shared'

const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

/** Lime circle +/× toggle — canonical FAQ affordance on dark templates (Tool.html, Download.html). */
export function FaqToggleGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full',
        'border border-brand-primary/25 bg-brand-primary/10 text-brand-primary',
        'transition-transform duration-200 group-open:rotate-45',
        className,
      )}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M8 3.5v9M3.5 8h9" />
      </svg>
    </span>
  )
}

export interface FaqListProps {
  items: FaqItem[]
  className?: string
  answerClassName?: string
}

/** Server-rendered FAQ accordion — native `<details>` + lime toggle (not Radix Accordion). */
export function FaqList({ items, className, answerClassName }: FaqListProps) {
  return (
    <div className={cn('flex flex-col gap-[12px]', className)}>
      {items.map((faq, idx) => (
        <details key={faq._key ?? idx} className={cn(CARD_CLASS, 'group')}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-[20px] px-[20px] py-[20px] lg:px-[24px] [&::-webkit-details-marker]:hidden">
            <span className="text-[16px] font-semibold leading-[1.4] tracking-[-0.2px] text-white">
              {faq.question}
            </span>
            <FaqToggleGlyph />
          </summary>
          <div className={cn('px-[20px] pb-[22px] lg:px-[24px]', answerClassName)}>
            <PortableText
              value={faq.answer}
              components={{
                block: {
                  normal: ({ children }: { children?: ReactNode }) => (
                    <p className="m-0 text-[14.5px] font-normal leading-[23px] tracking-[-0.08px] text-text-secondary">
                      {children}
                    </p>
                  ),
                },
              }}
            />
          </div>
        </details>
      ))}
    </div>
  )
}

export default FaqList
