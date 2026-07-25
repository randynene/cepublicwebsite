import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { BookACall } from '@/types/sanity/documents/book-a-call'
import type { PortableText as PortableTextValue } from '@/types/sanity/shared'

import { CalendlyInlineEmbed } from './calendly-inline-embed'
import { HubSpotMeetingsEmbed } from './hubspot-meetings-embed'

export interface BookACallTemplateProps {
  page: BookACall
  locale: Locale
}

const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

function extractSchedulingUrl(
  blocks: PortableTextValue | null | undefined,
): string | null {
  if (!blocks) return null
  for (const block of blocks) {
    if (block._type === 'videoEmbed') {
      const url = (block as { url?: string }).url
      if (url?.trim()) return url.trim()
    }
  }
  return null
}

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
