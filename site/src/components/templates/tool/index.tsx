import type { ReactNode } from 'react'

import { Container } from '@/components/ui/container'
import { FaqList } from '@/components/ui/faq-list'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { PortableText } from '@/components/ui/portable-text'
import { Tag } from '@/components/ui/tag'
import { VideoEmbed } from '@/components/ui/video-embed'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { Tool } from '@/types/sanity/documents/tool'
import type { PortableText as PortableTextValue } from '@/types/sanity/shared'

export interface ToolTemplateProps {
  tool: Tool
  locale: Locale
}

const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

const EYEBROW_CLASS =
  'text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary'

const ASSET_FRAME_CLASS =
  'relative overflow-hidden rounded-[24px] border border-[#22314D] bg-[linear-gradient(150deg,#16223A,#0d1626)]'

const headerBlurbComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p
        className={cn(
          BODY_MUTED_CLASS,
          'mx-auto mb-[14px] max-w-[620px] text-[17px] leading-[27px] last:mb-0',
        )}
      >
        {children}
      </p>
    ),
  },
}

const descriptionComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-[18px] last:mb-0')}>{children}</p>
    ),
  },
}

const embedComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-[14px] last:mb-0')}>{children}</p>
    ),
  },
}

function hasPortableText(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function isRenderableLink(link: string | null | undefined): link is string {
  return typeof link === 'string' && link.trim().length > 0
}

function extractVideoEmbedUrl(blocks: PortableTextValue | null | undefined): string | null {
  if (!blocks) return null
  for (const block of blocks) {
    if (block._type === 'videoEmbed') {
      const url = (block as { url?: string }).url
      if (url?.trim()) return url.trim()
    }
    if (block._type === 'block') {
      const markDefs = (block as { markDefs?: Array<{ _type?: string; href?: string }> })
        .markDefs
      for (const def of markDefs ?? []) {
        if (def._type === 'link' && def.href?.trim()) {
          const href = def.href.trim()
          if (/loom\.com\/(?:share|embed)\/[a-f0-9]+/i.test(href)) return href
        }
      }
    }
  }
  return null
}

function PlayButton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const outer =
    size === 'lg'
      ? 'h-[92px] w-[92px] shadow-[0_0_0_12px_rgba(212,255,60,0.12)]'
      : 'h-[64px] w-[64px] shadow-[0_0_0_8px_rgba(212,255,60,0.12)]'
  const triangle =
    size === 'lg'
      ? 'border-y-[14px] border-l-[24px] ml-[6px]'
      : 'border-y-[10px] border-l-[17px] ml-[4px]'

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-primary',
        outer,
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          'block h-0 w-0 border-solid border-transparent',
          triangle,
          'border-l-[#060F1E]',
        )}
      />
    </div>
  )
}

function VideoWalkthroughSection({
  tool,
  videoUrl,
}: {
  tool: Tool
  videoUrl: string | null
}) {
  const hasThumbnail = Boolean(tool.thumbnail?.asset)

  return (
    <section className={cn(BAND_PX_CLASS, 'pb-[80px] pt-[8px]')}>
      <div className="mb-[30px] text-center">
        <p className={cn(EYEBROW_CLASS, 'mb-[14px]')}>
          {UI_STRINGS['tool.videoEyebrow']}
        </p>
        <Heading
          as="h2"
          className="text-[28px] font-semibold leading-[32px] tracking-[-0.9px] text-white lg:text-[38px] lg:leading-[44px] lg:tracking-[-1.1px]"
        >
          {UI_STRINGS['tool.videoHeadingPrefix']}
          <span className="font-serif italic font-normal text-brand-primary">
            {UI_STRINGS['tool.videoHeadingAccent']}
          </span>
        </Heading>
      </div>

      <div
        className={cn(
          ASSET_FRAME_CLASS,
          'flex min-h-[220px] items-center justify-center lg:min-h-[560px]',
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_11px,rgba(127,140,160,0.06)_11px,rgba(127,140,160,0.06)_22px)]"
        />

        {videoUrl ? (
          <div className="relative z-[1] h-full min-h-[220px] w-full lg:min-h-[560px]">
            <VideoEmbed
              url={videoUrl}
              mode="eager"
              title={tool.name}
              aspectRatio="16/9"
              className="h-full min-h-[220px] w-full rounded-[24px] lg:min-h-[560px]"
            />
            <div className="pointer-events-none absolute left-[14px] top-[14px] z-[2] inline-flex items-center gap-[7px] rounded-full border border-[#22314D] bg-[rgba(7,13,24,0.78)] px-[12px] py-[7px] text-[11px] font-semibold leading-none text-white lg:left-[22px] lg:top-[22px] lg:gap-[9px] lg:px-[16px] lg:py-[9px] lg:text-[13px]">
              <span className="h-[6px] w-[6px] rounded-full bg-brand-primary lg:h-[7px] lg:w-[7px]" />
              {UI_STRINGS['tool.walkthroughPill']}
            </div>
          </div>
        ) : hasThumbnail ? (
          <>
            <Image
              source={tool.thumbnail!}
              alt={tool.thumbnail!.alt?.trim() || tool.name}
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute left-[14px] top-[14px] z-[2] inline-flex items-center gap-[7px] rounded-full border border-[#22314D] bg-[rgba(7,13,24,0.78)] px-[12px] py-[7px] text-[11px] font-semibold leading-none text-white lg:left-[22px] lg:top-[22px] lg:gap-[9px] lg:px-[16px] lg:py-[9px] lg:text-[13px]">
              <span className="h-[6px] w-[6px] rounded-full bg-brand-primary lg:h-[7px] lg:w-[7px]" />
              {UI_STRINGS['tool.walkthroughPill']}
            </div>
            <div className="relative z-[2]">
              <PlayButton size="lg" />
            </div>
          </>
        ) : (
          <div className="relative z-[1] flex flex-col items-center gap-[16px]">
            <PlayButton size="lg" />
          </div>
        )}
      </div>
    </section>
  )
}

function ToolEmbedSection({ tool }: { tool: Tool }) {
  const hasToolEmbed = hasPortableText(tool.toolEmbed)

  return (
    <section className={cn(BAND_PX_CLASS, 'pb-[80px]')}>
      <div className={cn(CARD_CLASS, 'bg-[#0A1628] p-[14px] lg:p-[18px]')}>
        <div className="flex items-center justify-between px-[6px] pb-[12px] pt-[4px] lg:px-[10px] lg:pb-[16px]">
          <div className="flex items-center gap-[8px] lg:gap-[9px]">
            <span className="flex gap-[5px] lg:gap-[6px]" aria-hidden="true">
              <span className="h-[9px] w-[9px] rounded-full bg-[#22314D] lg:h-[11px] lg:w-[11px]" />
              <span className="h-[9px] w-[9px] rounded-full bg-[#22314D] lg:h-[11px] lg:w-[11px]" />
              <span className="h-[9px] w-[9px] rounded-full bg-brand-primary lg:h-[11px] lg:w-[11px]" />
            </span>
            <span className="ml-[4px] text-[12px] font-semibold leading-none tracking-[0.3px] text-text-secondary lg:ml-[6px] lg:text-[13px]">
              {UI_STRINGS['tool.liveToolLabel']}
            </span>
          </div>
          <span className="text-[11px] font-semibold uppercase leading-none tracking-[1px] text-[#7F8CA0]">
            {UI_STRINGS['tool.tryItBelow']}
          </span>
        </div>

        <div
          className={cn(
            ASSET_FRAME_CLASS,
            'flex min-h-[320px] items-center justify-center rounded-[12px] lg:min-h-[520px] lg:rounded-[14px]',
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_11px,rgba(127,140,160,0.06)_11px,rgba(127,140,160,0.06)_22px)]"
          />

          {hasToolEmbed ? (
            <div className="relative z-[1] w-full px-[20px] py-[24px] lg:px-[36px] lg:py-[32px]">
              <PortableText value={tool.toolEmbed!} components={embedComponents} />
            </div>
          ) : (
            <div className="relative z-[1] px-[20px] text-center">
              <div className="mx-auto mb-[14px] flex h-[54px] w-[54px] items-center justify-center rounded-[14px] border border-brand-primary/25 bg-brand-primary/10 text-[22px] text-brand-primary lg:mb-[16px] lg:h-[64px] lg:w-[64px] lg:rounded-[16px] lg:text-[26px]">
                ◳
              </div>
              <p className="mb-[6px] text-[15px] font-semibold leading-[1.4] text-white lg:text-[16px]">
                {UI_STRINGS['tool.interactiveLabel'].replace('{name}', tool.name)}
              </p>
              <p className="text-[13px] leading-[1.4] text-[#7F8CA0] lg:text-[13.5px]">
                {UI_STRINGS['tool.embedPlaceholder']}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ToolFaqsIntro() {
  const intro = UI_STRINGS['tool.faqsIntro']
  const email = UI_STRINGS['tool.faqsEmail']
  const parts = intro.split('{email}')

  return (
    <p className="m-0 text-[14px] font-normal leading-[22px] tracking-[-0.08px] text-text-secondary lg:text-[15px] lg:leading-[23px]">
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

export default function ToolTemplate({ tool }: ToolTemplateProps) {
  const tags = Array.isArray(tool.tags)
    ? tool.tags.filter((tag) => tag.name?.trim())
    : []
  const hasTags = tags.length > 0

  const hasHeaderBlurb = hasPortableText(tool.headerBlurb)
  const hasDescription = hasPortableText(tool.description)
  const hasFaqs =
    Array.isArray(tool.faqs) &&
    tool.faqs.filter((faq) => faq.question?.trim()).length > 0

  const hasButton1 =
    tool.button1Text?.trim() && isRenderableLink(tool.button1Link)
  const hasButton2 =
    tool.button2Text?.trim() && isRenderableLink(tool.button2Link)
  const hasCtas = hasButton1 || hasButton2

  const videoUrl =
    extractVideoEmbedUrl(tool.videoOverview) ??
    extractVideoEmbedUrl(tool.toolEmbed)

  const showVideoSection =
    hasPortableText(tool.videoOverview) ||
    Boolean(tool.thumbnail?.asset) ||
    Boolean(videoUrl)

  const hasToolEmbed = hasPortableText(tool.toolEmbed)

  const faqItems = (tool.faqs ?? []).filter((faq) => faq.question?.trim())

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          <header
            className={cn(
              'bg-[radial-gradient(120%_70%_at_50%_0%,#0c1830_0%,#070D18_58%)]',
              BAND_PX_CLASS,
              'pb-[72px] pt-[48px] text-center lg:pb-[72px] lg:pt-[84px]',
            )}
          >
            <div className="mb-[18px] flex justify-center lg:mb-[24px]">
              <span className="inline-flex items-center rounded-full border border-brand-primary/25 bg-brand-primary/10 px-[14px] py-[7px] text-[12px] font-medium leading-none tracking-[-0.08px] text-brand-primary lg:text-[13px]">
                {UI_STRINGS['tool.badge']}
              </span>
            </div>

            <Heading
              as="h1"
              size="h2"
              className="mx-auto mb-[12px] max-w-[840px] text-[40px] font-semibold leading-[42px] tracking-[-1.6px] text-white lg:mb-[16px] lg:text-[67px] lg:leading-[70px] lg:tracking-[-2.52px]"
            >
              {tool.name}
            </Heading>

            {tool.subHeader?.trim() && (
              <p className="mx-auto mb-[18px] max-w-[760px] text-[20px] font-semibold leading-[26px] tracking-[-0.5px] text-white lg:mb-[26px] lg:text-[26px] lg:leading-[32px] lg:tracking-[-0.7px]">
                {tool.subHeader}
              </p>
            )}

            {hasHeaderBlurb && (
              <div className="mb-[20px] lg:mb-[22px]">
                <PortableText
                  value={tool.headerBlurb!}
                  components={headerBlurbComponents}
                />
              </div>
            )}

            {hasTags && (
              <div className="mb-[24px] flex flex-wrap justify-center gap-[8px] lg:mb-[34px]">
                {tags.map((tag, index) => (
                  <Tag
                    key={`${tag.name}-${index}`}
                    tone="ghost-lime"
                    className="px-[12px] py-[6px] text-[12px] leading-none lg:px-[14px] lg:py-[7px] lg:text-[13px]"
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            )}

            {hasCtas && (
              <div className="flex flex-wrap items-center justify-center gap-[11px] lg:gap-[14px]">
                {hasButton1 && (
                  <MegaMenuPillLabel
                    as="a"
                    href={tool.button1Link!}
                    variant="pill-green"
                    size="cta"
                    leadingArrow
                    leadingGlyph="→"
                    label={tool.button1Text!.trim()}
                  />
                )}
                {hasButton2 && (
                  <MegaMenuPillLabel
                    as="a"
                    href={tool.button2Link!}
                    variant="pill-outline-dark"
                    size="cta"
                    leadingArrow
                    leadingGlyph="↗"
                    label={tool.button2Text!.trim()}
                  />
                )}
              </div>
            )}
          </header>

          {showVideoSection && (
            <VideoWalkthroughSection tool={tool} videoUrl={videoUrl} />
          )}

          {hasDescription && (
            <section
              className={cn(
                BAND_PX_CLASS,
                'grid grid-cols-1 items-start gap-[32px] pb-[56px] lg:grid-cols-[280px_1fr] lg:gap-[48px]',
              )}
            >
              <div>
                <p className={cn(EYEBROW_CLASS, 'mb-[12px] lg:mb-[16px]')}>
                  {UI_STRINGS['tool.aboutEyebrow']}
                </p>
                <Heading
                  as="h2"
                  className="text-[26px] font-semibold leading-[30px] tracking-[-0.8px] text-white lg:text-[32px] lg:leading-[38px] lg:tracking-[-0.9px]"
                >
                  {UI_STRINGS['tool.aboutHeadingPrefix']}
                  <span className="font-serif italic font-normal text-brand-primary">
                    {UI_STRINGS['tool.aboutHeadingAccent']}
                  </span>
                </Heading>
              </div>
              <div>
                <PortableText
                  value={tool.description!}
                  components={descriptionComponents}
                />
              </div>
            </section>
          )}

          {hasToolEmbed && <ToolEmbedSection tool={tool} />}

          {hasFaqs && (
            <section
              className={cn(
                BAND_PX_CLASS,
                'grid grid-cols-1 items-start gap-[32px] py-[44px] lg:grid-cols-[340px_1fr] lg:gap-[48px] lg:py-[80px]',
              )}
            >
              <div>
                <Heading
                  as="h2"
                  size="h2"
                  className="mb-[14px] text-[30px] font-semibold leading-[34px] tracking-[-1px] text-white lg:mb-[18px] lg:text-[46px] lg:leading-[56px] lg:tracking-[-1.4px]"
                >
                  {UI_STRINGS['tool.faqsHeadingPrefix']}
                  <span className="font-serif italic font-normal text-brand-primary">
                    {UI_STRINGS['tool.faqsHeadingAccent']}
                  </span>
                </Heading>
                <ToolFaqsIntro />
              </div>
              <FaqList items={faqItems} />
            </section>
          )}
        </div>
      </Container>
    </article>
  )
}
