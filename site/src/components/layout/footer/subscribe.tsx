import type { Subscribe } from '@/lib/sanity/queries/footer'

import { FooterSubscribeForm } from './subscribe-form'

// Footer.html frame subscribe — input #1B2A45 / border #32435F / h-54px;
// lime submit pill (#D4FF3C) with arrow circle. HubSpot form wired via
// FooterSubscribeForm; export-matching shell visible until embed mounts.

// The real HubSpot form ('NewsLetter Subscribe (via cloudemployee.io)', 104
// submissions). The previous value here — deac2450-... — was NOT a HubSpot form
// id at all: the live Webflow site posts its newsletter through
// hubspotonwebflow.com, a third-party bridge, and that GUID belonged to the
// bridge. HubSpot 404'd it, so hbspt.forms.create rendered nothing and every
// newsletter signup on the new site went nowhere, silently.
const DEFAULT_SUBSCRIBE_FORM_ID = 'b411a11f-1548-4cf7-887e-26fac7824006'

export function FooterSubscribe({ subscribe }: { subscribe?: Subscribe | null }) {
  if (!subscribe?.heading && !subscribe?.description && !subscribe?.formId) return null

  const formId = subscribe?.formId || DEFAULT_SUBSCRIBE_FORM_ID
  const submitLabel = subscribe?.submitLabel ?? 'Subscribe'

  return (
    <>
      {/* Desktop — spans columns 3–4; 8px below link grid per Footer.html */}
      <div className="mt-[8px] hidden lg:grid lg:grid-cols-[1.05fr_1fr_0.85fr_1.1fr] lg:gap-[40px]">
        <div className="col-start-3 col-end-5">
          <SubscribeInner subscribe={subscribe} formId={formId} submitLabel={submitLabel} />
        </div>
      </div>

      {/* Mobile — full width stack */}
      <div className="mt-9 lg:hidden">
        <SubscribeInner subscribe={subscribe} formId={formId} submitLabel={submitLabel} />
      </div>
    </>
  )
}

function SubscribeInner({
  subscribe,
  formId,
  submitLabel,
}: {
  subscribe?: Subscribe | null
  formId: string
  submitLabel: string
}) {
  return (
    <>
      {subscribe?.heading ? (
        <div className="mb-[10px] text-[19px] font-semibold leading-none tracking-[-0.4px] text-text-default">
          {subscribe.heading}
        </div>
      ) : null}
      {subscribe?.description ? (
        <p className="mb-5 max-w-[430px] text-[14.5px] leading-[22px] tracking-[-0.08px] text-[#B8C2D1] lg:mb-5">
          {subscribe.description}
        </p>
      ) : null}
      <FooterSubscribeForm formId={formId} submitLabel={submitLabel} />
    </>
  )
}
