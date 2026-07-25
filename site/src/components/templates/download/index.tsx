import type { ReactNode } from 'react'

import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { FaqList } from '@/components/ui/faq-list'
import { Image } from '@/components/ui/image'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { PortableText } from '@/components/ui/portable-text'
import { Tag } from '@/components/ui/tag'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import { toInternalHref } from '@/lib/url'
import type { Download } from '@/types/sanity/documents/download'

import { HowToUseVideo } from './how-to-use-video'

export interface DownloadTemplateProps {
  download: Download
  locale: Locale
}

const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

const EYEBROW_CLASS =
  'text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary'

const bodyComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-[14px] last:mb-0')}>{children}</p>
    ),
  },
}

function TickIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-[13px] text-brand-primary"
    >
      ✓
    </span>
  )
}

function DownloadCtaButtons({ download }: { download: Download }) {
  const button1Text = download.button1Text?.trim()
  const button1Link = download.button1Link?.trim()
  const button2Text = download.button2Text?.trim()
  const button2Link = download.button2Link?.trim()

  const hasButton1 = Boolean(button1Text && button1Link)
  const hasButton2 = Boolean(button2Text && button2Link)

  if (!hasButton1 && !hasButton2) return null

  return (
    <div className="flex flex-wrap gap-[14px]">
      {hasButton1 && (
        <DownloadCtaButton text={button1Text!} link={button1Link!} variant="outline" />
      )}
      {hasButton2 && (
        <DownloadCtaButton text={button2Text!} link={button2Link!} variant="primary" />
      )}
    </div>
  )
}

function DownloadCtaButton({
  text,
  link,
  variant,
}: {
  text: string
  link: string
  variant: 'outline' | 'primary'
}) {
  const { href, isExternal } = toInternalHref(link)

  return (
    <MegaMenuPillLabel
      as="a"
      href={href}
      external={isExternal}
      label={text}
      variant={variant === 'primary' ? 'pill-green' : 'pill-outline-dark'}
      size="cta"
      leadingArrow
    />
  )
}

function FaqsIntro() {
  const intro = UI_STRINGS['download.faqsIntro']
  const email = UI_STRINGS['download.faqsEmail']
  const parts = intro.split('{email}')

  return (
    <p className="m-0 text-[15px] font-normal leading-[23px] tracking-[-0.08px] text-text-secondary">
      {parts[0]}
      <a
        href={`mailto:${email}`}
        className="text-brand-primary no-underline hover:underline"
      >
        {email}
      </a>
      {parts[1] ?? ''}
    </p>
  )
}

export default function DownloadTemplate({ download }: DownloadTemplateProps) {
  const subtitle = download.title?.trim() || null
  const comingSoon = download.comingSoon === true

  const tags = Array.isArray(download.tags)
    ? download.tags.filter((tag) => tag.name?.trim())
    : []
  const hasTags = tags.length > 0

  const youllGetItems = Array.isArray(download.youllGet)
    ? download.youllGet.map((item) => item?.trim()).filter(Boolean)
    : []
  const hasYoullGet = youllGetItems.length > 0
  const hasHeroImage = Boolean(download.headerFooterImage?.asset)

  const hasMainDescription =
    Array.isArray(download.mainDescription) &&
    download.mainDescription.length > 0

  const howToUse = download.howToUseIt
  const howToVideoLink = howToUse?.videoLink?.trim() || null
  const howToThumbnail = howToUse?.videoThumbnail
  const howToTitle = howToUse?.title?.trim() || download.name
  const hasHowToDescription =
    Array.isArray(howToUse?.description) && howToUse.description.length > 0
  const hasHowToUse =
    Boolean(howToUse) &&
    (Boolean(howToVideoLink && howToThumbnail?.asset) ||
      Boolean(howToUse?.title?.trim()) ||
      hasHowToDescription)

  const impact = download.theImpact
  const hasImpactDescription =
    Array.isArray(impact?.description) && impact.description.length > 0
  const hasImpact =
    Boolean(impact) &&
    (Boolean(impact?.image?.asset) ||
      Boolean(impact?.title?.trim()) ||
      hasImpactDescription)

  const faqs = Array.isArray(download.faqs)
    ? download.faqs.filter((faq) => faq.question?.trim())
    : []
  const hasFaqs = faqs.length > 0

  const showHeroCard = hasHeroImage || hasYoullGet

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          {/* Hero — radial wash on badge + headline block only. */}
          <header
            className={cn(
              BAND_PX_CLASS,
              'bg-[radial-gradient(110%_70%_at_0%_0%,#0c1830_0%,#070D18_55%)]',
              'pt-[44px] pb-[48px] lg:pt-[72px] lg:pb-[80px]',
            )}
          >
            <div className="grid grid-cols-1 items-start gap-[40px] lg:grid-cols-2 lg:gap-[56px]">
              <div>
                <div className="mb-[16px] flex items-center gap-[10px] lg:mb-[22px]">
                  <span className={EYEBROW_CLASS}>
                    {UI_STRINGS['download.eyebrowFree']}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-[4px] w-[4px] rounded-full bg-[#32435F]"
                  />
                  <span className="text-[11px] font-medium uppercase leading-none tracking-[1.4px] text-[#7F8CA0] lg:text-[11.5px] lg:tracking-[1.68px]">
                    {UI_STRINGS['download.whatItIs']}
                  </span>
                </div>

                <Heading
                  as="h1"
                  size="h2"
                  className="mb-[16px] text-[34px] font-semibold leading-[38px] tracking-[-1.2px] text-white lg:mb-[22px] lg:text-[52px] lg:leading-[56px] lg:tracking-[-1.8px]"
                >
                  {download.name}
                </Heading>

                {subtitle && (
                  <p className="mb-[16px] text-[20px] font-medium leading-[28px] tracking-[-0.4px] text-text-secondary lg:mb-[22px]">
                    {subtitle}
                  </p>
                )}

                {hasMainDescription && (
                  <div className="mb-[18px] max-w-[520px] lg:mb-[22px]">
                    <PortableText
                      value={download.mainDescription!}
                      components={bodyComponents}
                    />
                  </div>
                )}

                {hasTags && (
                  <div className="mb-[24px] flex flex-wrap gap-[8px] lg:mb-[30px]">
                    {tags.map((tag, index) => (
                      <Tag
                        key={`${tag.name}-${index}`}
                        tone="ghost-lime"
                        className="px-[14px] py-[7px] text-[13px] leading-none"
                      >
                        {tag.name}
                      </Tag>
                    ))}
                  </div>
                )}

                {comingSoon ? (
                  <div>
                    <div className="inline-flex items-center gap-[10px] rounded-full border border-brand-primary/25 bg-brand-primary/10 px-[18px] py-[9px] text-[13px] font-semibold uppercase leading-none tracking-[0.6px] text-brand-primary">
                      <span
                        aria-hidden="true"
                        className="h-[7px] w-[7px] rounded-full bg-brand-primary"
                      />
                      {UI_STRINGS['download.comingSoon']}
                    </div>
                    <p className="mt-[14px] text-[14.5px] font-medium leading-[22px] text-[#7F8CA0]">
                      {UI_STRINGS['download.comingSoonNote']}
                    </p>
                  </div>
                ) : (
                  <DownloadCtaButtons download={download} />
                )}
              </div>

              {showHeroCard && (
                <div className={cn(CARD_CLASS, 'overflow-hidden')}>
                  {hasHeroImage && (
                    <div className="relative h-[200px] overflow-hidden bg-[linear-gradient(150deg,#16223A,#0d1626)] lg:h-[240px]">
                      <Image
                        source={download.headerFooterImage!}
                        alt={
                          download.headerFooterImage!.alt?.trim() ||
                          download.name
                        }
                        fill
                        sizes="(min-width: 1024px) 576px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  {hasYoullGet && (
                    <div className="px-[24px] py-[22px] lg:px-[28px] lg:py-[26px]">
                      <p className="mb-[18px] text-[16px] font-semibold leading-none tracking-[-0.3px] text-white">
                        {UI_STRINGS['download.youllGetHeading']}
                      </p>
                      <ul className="flex flex-col gap-[13px]">
                        {youllGetItems.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-[13px]"
                          >
                            <TickIcon />
                            <span className="text-[14.5px] font-medium leading-[1.3] text-white">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {hasHowToUse && (
            <section
              className={cn(
                BAND_PX_CLASS,
                'grid grid-cols-1 items-center gap-[40px] py-[56px] lg:grid-cols-2 lg:gap-[56px] lg:py-[72px]',
              )}
            >
              {howToVideoLink && howToThumbnail?.asset ? (
                <HowToUseVideo
                  videoLink={howToVideoLink}
                  videoThumbnail={howToThumbnail}
                  title={howToTitle}
                />
              ) : howToThumbnail?.asset ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] border border-[#22314D] bg-[linear-gradient(150deg,#16223A,#0d1626)]">
                  <Image
                    source={howToThumbnail}
                    alt={howToThumbnail.alt?.trim() || howToTitle}
                    fill
                    sizes="(min-width: 1024px) 576px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div>
                <p className={cn(EYEBROW_CLASS, 'mb-[18px]')}>
                  {UI_STRINGS['download.howToUseEyebrow']}
                </p>
                {howToUse?.title?.trim() && (
                  <Heading
                    as="h2"
                    size="h2"
                    className="mb-[20px] text-[34px] font-semibold leading-[40px] tracking-[-1px] text-white lg:text-[46px] lg:leading-[52px] lg:tracking-[-1.4px]"
                  >
                    {howToUse.title}
                  </Heading>
                )}
                {hasHowToDescription && (
                  <PortableText
                    value={howToUse!.description!}
                    components={bodyComponents}
                  />
                )}
              </div>
            </section>
          )}

          {hasImpact && (
            <section
              className={cn(
                BAND_PX_CLASS,
                'border-y border-[#22314D] bg-[#0A1628]',
                'grid grid-cols-1 items-center gap-[40px] py-[56px] lg:grid-cols-2 lg:gap-[56px] lg:py-[80px]',
              )}
            >
              <div>
                <p className={cn(EYEBROW_CLASS, 'mb-[18px]')}>
                  {UI_STRINGS['download.impactEyebrow']}
                </p>
                {impact?.title?.trim() && (
                  <Heading
                    as="h2"
                    size="h2"
                    className="mb-[20px] text-[34px] font-semibold leading-[40px] tracking-[-1px] text-white lg:text-[46px] lg:leading-[52px] lg:tracking-[-1.4px]"
                  >
                    {impact.title}
                  </Heading>
                )}
                {hasImpactDescription && (
                  <div className="mb-[30px] max-w-[500px]">
                    <PortableText
                      value={impact!.description!}
                      components={bodyComponents}
                    />
                  </div>
                )}
                {!comingSoon && <DownloadCtaButtons download={download} />}
              </div>

              {impact?.image?.asset && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-[#22314D] bg-[linear-gradient(150deg,#16223A,#0d1626)] lg:min-h-[320px]">
                  <Image
                    source={impact.image}
                    alt={impact.image.alt?.trim() || download.name}
                    fill
                    sizes="(min-width: 1024px) 576px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
            </section>
          )}

          {hasFaqs && (
            <section
              className={cn(
                BAND_PX_CLASS,
                'grid grid-cols-1 items-start gap-[32px] py-[56px] lg:grid-cols-[340px_1fr] lg:gap-[48px] lg:py-[80px]',
              )}
            >
              <div>
                <Heading
                  as="h2"
                  size="h2"
                  className="mb-[18px] text-[34px] font-semibold leading-[40px] tracking-[-1px] text-white lg:text-[46px] lg:leading-[56px] lg:tracking-[-1.4px]"
                >
                  {UI_STRINGS['download.faqsHeading']}
                </Heading>
                <FaqsIntro />
              </div>

              <FaqList items={faqs} />
            </section>
          )}
        </div>
      </Container>
    </article>
  )
}
