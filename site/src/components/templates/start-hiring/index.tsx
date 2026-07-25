import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { HubSpotFormEmbed } from '@/components/ui/hubspot-form-embed'
import { Text } from '@/components/ui/text'
import type { StartHiringStep } from '@/lib/sanity/queries/start-hiring-step'

// One step of the /start-hiring enquiry funnel.
//
// The page is deliberately spare: a heading, an optional lead, and the form.
// These are the pages where someone is part-way through telling Cloud Employee
// what they need, and anything that is not the question in front of them is a
// reason to stop answering.
//
// The HubSpot form owns the submission AND the redirect to the next step, so
// there is no next-step link here and no client-side navigation to write. Getting
// the form id right is the entire job; getting it wrong loses the enquiry with no
// error anywhere.

export default function StartHiringTemplate({ step }: { step: StartHiringStep }) {
  return (
    <Container as="section" className="py-16 lg:py-24">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Text
            as="p"
            size="small"
            className="uppercase tracking-wider text-brand-primary font-medium"
          >
            {`Step ${step.order} of ${step.totalSteps}`}
          </Text>

          {/* A plain, non-interactive progress bar. The funnel is linear and
              HubSpot drives the navigation, so this reports progress rather than
              offering it — there is nothing here to click. */}
          <div
            role="progressbar"
            aria-valuenow={step.order}
            aria-valuemin={1}
            aria-valuemax={step.totalSteps}
            aria-label={`Step ${step.order} of ${step.totalSteps}`}
            className="h-1 w-full overflow-hidden rounded-pill bg-brand-tertiary/15"
          >
            <div
              className="h-full rounded-pill bg-brand-primary transition-[width] duration-reveal ease-reveal motion-reduce:transition-none"
              style={{ width: `${(step.order / step.totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Heading as="h1">{step.heading}</Heading>

        {step.lead ? (
          <Text as="p" size="lead" className="text-text-default/80">
            {step.lead}
          </Text>
        ) : null}

        {/* The final step is the confirmation page and carries no form. */}
        {step.hubspotFormId ? (
          <div className="mt-2">
            <HubSpotFormEmbed formId={step.hubspotFormId} />
          </div>
        ) : null}
      </div>
    </Container>
  )
}
