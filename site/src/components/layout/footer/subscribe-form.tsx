'use client'

import { useState } from 'react'

import { HubSpotFormEmbed } from '@/components/ui/hubspot-form-embed'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/components/ui/_utils/cn'

const FOOTER_SUBSCRIBE_FORM_CLASS = cn(
  '!min-h-0',
  '[&_.hs-form]:flex [&_.hs-form]:flex-col [&_.hs-form]:gap-3 lg:[&_.hs-form]:flex-row lg:[&_.hs-form]:items-center lg:[&_.hs-form]:gap-[10px]',
  '[&_.hs-form-field]:mb-0 [&_.hs-form-field]:min-w-0 [&_.hs-form-field]:flex-1',
  '[&_.hs-form-field]:flex [&_.hs-form-field]:flex-col',
  '[&_.hs-form-label]:sr-only',
  '[&_.hs-field-desc]:sr-only',
  '[&_.legal-consent-container]:sr-only',
  '[&_.hs-input]:block [&_.hs-input]:h-[54px] [&_.hs-input]:w-full [&_.hs-input]:rounded-pill',
  '[&_.hs-input]:border [&_.hs-input]:border-[#32435F] [&_.hs-input]:bg-[#1B2A45]',
  '[&_.hs-input]:px-6 [&_.hs-input]:text-[14.5px] [&_.hs-input]:leading-none [&_.hs-input]:text-text-default',
  '[&_.hs-input]:placeholder:text-[#7F8CA0]',
  '[&_.hs-input]:outline-none [&_.hs-input]:focus-visible:ring-2 [&_.hs-input]:focus-visible:ring-brand-primary',
  // Submit — same compact pill as Header "Schedule a Call" (size="cta").
  // SWEEP-CTA (Jul 2026): HubSpot mounts this as a real `<input
  // type="submit">`, not JSX we own, so the animated wipe (`.sf`, which
  // needs a `.c` child + `::before` layer) can't be applied here. This is
  // the same colour-invert END STATE as `sf-p`'s hover (ink bg, lime text/
  // icon) via a plain transition instead, so it still reads as "the same
  // family of button" even without the directional sweep.
  '[&_.hs-button]:inline-flex [&_.hs-button]:h-auto [&_.hs-button]:w-full [&_.hs-button]:shrink-0',
  '[&_.hs-button]:items-center [&_.hs-button]:justify-center [&_.hs-button]:gap-1.5',
  '[&_.hs-button]:rounded-pill [&_.hs-button]:bg-brand-primary',
  '[&_.hs-button]:py-[4px] [&_.hs-button]:pl-[4px] [&_.hs-button]:pr-3.5 lg:[&_.hs-button]:w-auto',
  '[&_.hs-button]:text-[13px] [&_.hs-button]:font-bold [&_.hs-button]:leading-none [&_.hs-button]:tracking-[-0.08px]',
  '[&_.hs-button]:text-[#060F1E] [&_.hs-button]:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.45)]',
  '[&_.hs-button]:transition-colors [&_.hs-button]:duration-[350ms] [&_.hs-button]:motion-reduce:transition-none',
  '[&_.hs-button]:hover:bg-text-dark [&_.hs-button]:hover:text-brand-primary',
  '[&_.hs-button]:before:inline-flex [&_.hs-button]:before:h-5 [&_.hs-button]:before:w-5 [&_.hs-button]:before:shrink-0',
  '[&_.hs-button]:before:items-center [&_.hs-button]:before:justify-center [&_.hs-button]:before:rounded-full',
  '[&_.hs-button]:before:bg-[#060F1E] [&_.hs-button]:before:text-[10px] [&_.hs-button]:before:leading-none',
  '[&_.hs-button]:before:text-brand-primary [&_.hs-button]:before:content-["↗"]',
  '[&_.hs-button]:before:transition-colors [&_.hs-button]:before:duration-[350ms]',
  '[&_.hs-button]:hover:before:bg-brand-primary [&_.hs-button]:hover:before:text-text-dark',
)

function SubscribePlaceholder({ submitLabel }: { submitLabel: string }) {
  return (
    <div
      className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-[10px]"
      aria-hidden="true"
    >
      <div className="flex h-[54px] min-w-0 flex-1 items-center rounded-pill border border-[#32435F] bg-[#1B2A45] px-6 text-[14.5px] leading-none text-[#7F8CA0]">
        Your email here...
      </div>
      <div className="sf sf-p inline-flex shrink-0 items-center gap-1.5 rounded-pill py-[4px] pl-[4px] pr-3.5 text-[13px] font-bold leading-none tracking-[-0.08px] shadow-[0_2px_8px_-3px_rgba(0,0,0,0.45)] lg:w-auto">
        <span aria-hidden="true" className="ic h-5 w-5 text-[10px]">
          <Icon name="chevron-right" size="sm" className="size-2.5 -rotate-45" />
        </span>
        <span className="c">{submitLabel}</span>
      </div>
    </div>
  )
}

export function FooterSubscribeForm({
  formId,
  submitLabel = 'Subscribe',
}: {
  formId: string
  submitLabel?: string
}) {
  const [ready, setReady] = useState(false)

  return (
    <div className="relative max-w-[500px]">
      {!ready ? <SubscribePlaceholder submitLabel={submitLabel} /> : null}
      <div className={cn(!ready && 'pointer-events-none absolute inset-0 opacity-0')}>
        <HubSpotFormEmbed
          formId={formId}
          portalId="22809822"
          className={cn('max-w-[500px]', FOOTER_SUBSCRIBE_FORM_CLASS)}
          onReady={() => setReady(true)}
        />
      </div>
    </div>
  )
}
