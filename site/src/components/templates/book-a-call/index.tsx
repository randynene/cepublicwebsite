import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { cn } from '@/components/ui/_utils/cn'
import { extractSchedulingUrl } from '@/lib/booking/scheduling-url'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { BookACall } from '@/types/sanity/documents/book-a-call'

import { CalendlyInlineEmbed } from './calendly-inline-embed'
import { HubSpotMeetingsEmbed } from './hubspot-meetings-embed'

export interface BookACallTemplateProps {
  page: BookACall
  locale: Locale
}

const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

function SchedulingEmbed({ url }: { url: string }) {
  if (/meetings\.hubspot\.com/i.test(url)) {
    return <HubSpotMeetingsEmbed url={url} className="w-full" />
  }
  if (/calendly\.com/i.test(url)) {
    return <CalendlyInlineEmbed url={url} className="w-full" />
  }
  return null
}

export default function BookACallTemplate({ page }: BookACallTemplateProps) {
  const schedulingUrl = extractSchedulingUrl(page.calendlyEmbed)

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          <header
            className={cn(
              'bg-[radial-gradient(120%_70%_at_50%_0%,#0c1830_0%,#070D18_58%)]',
              BAND_PX_CLASS,
              'pb-[48px] pt-[48px] text-center lg:pb-[56px] lg:pt-[84px]',
            )}
          >
            <Heading
              as="h1"
              className="mx-auto max-w-[900px] text-[40px] font-semibold leading-[42px] tracking-[-1.6px] text-white lg:text-[67px] lg:leading-[70px] lg:tracking-[-2.52px]"
            >
              {UI_STRINGS['bookACall.h1Prefix']}{' '}
              <span className="font-serif italic font-normal text-brand-primary">
                {page.firstName}
              </span>
            </Heading>
          </header>

          {schedulingUrl && (
            <section className={cn(BAND_PX_CLASS, 'pb-[72px] lg:pb-[96px]')}>
              <SchedulingEmbed url={schedulingUrl} />
            </section>
          )}
        </div>
      </Container>
    </article>
  )
}
