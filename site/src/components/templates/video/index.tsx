import type { ReactNode } from 'react'

import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { PortableText } from '@/components/ui/portable-text'
import { Tag } from '@/components/ui/tag'
import { VideoEmbed } from '@/components/ui/video-embed'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { Video } from '@/types/sanity/documents/video'

export interface VideoTemplateProps {
  video: Video
  locale: Locale
}

// Video.html .ce-body — 16px / 25px muted body copy (matches export
// font:400 16px/25px; letter-spacing:-0.08px; color:#B8C2D1).
const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

// Video.html .ce-card — dark elevated surface used by transcript + sidebar.
const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

// Export architecture: sibling sections inside a 1280px frame, each with its
// OWN single 64px horizontal padding layer (band 1280 − 2×64 = 1152 content).
// All spacing utilities below are ARBITRARY px because tokens.css sets
// `--spacing: 0.5rem` (8px/unit), which would double any scale utility.
const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

const bodyComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-[14px] last:mb-0')}>{children}</p>
    ),
  },
}

function ToggleGlyph() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-brand-primary transition-transform duration-200 group-open:rotate-45"
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

export default function VideoTemplate({ video }: VideoTemplateProps) {
  const category = video.type ? UI_STRINGS[`video.type.${video.type}`] : null
  const badgeText = category
    ? UI_STRINGS['video.badgeCategory'].replace('{category}', category)
    : UI_STRINGS['video.badge']

  const label = video.label?.trim() || null
  const poster = video.backupImage

  const tags = Array.isArray(video.tags)
    ? video.tags.filter((tag) => tag.name?.trim())
    : []
  const hasTags = tags.length > 0

  const hasDescription =
    Array.isArray(video.descriptionOfVideo) &&
    video.descriptionOfVideo.length > 0
  const hasTranscript =
    Array.isArray(video.fullVideoTranscript) &&
    video.fullVideoTranscript.length > 0
  const hasLinks =
    Array.isArray(video.linksMentionedInVideo) &&
    video.linksMentionedInVideo.length > 0
  const hasSpeakers =
    Array.isArray(video.linkedinProfilesOfSpeakersInVideo) &&
    video.linkedinProfilesOfSpeakersInVideo.length > 0

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          {/* Header — radial wash ONLY on the badge + h1 block. Breadcrumbs
              omitted visually; BreadcrumbList JSON-LD remains for SEO. */}
          <header
            className={cn(
              'bg-[radial-gradient(120%_60%_at_50%_0%,#0c1830_0%,#070D18_60%)]',
              BAND_PX_CLASS,
              'pt-[32px] text-center lg:pt-[40px]',
            )}
          >
            <div className="mb-[24px] inline-flex items-center gap-[8px] rounded-full border border-brand-primary/25 bg-brand-primary/10 px-[16px] py-[8px] text-[12px] font-semibold uppercase leading-none tracking-[1px] text-brand-primary">
              <span
                aria-hidden="true"
                className="h-[6px] w-[6px] rounded-full bg-brand-primary"
              />
              {badgeText}
            </div>
            <Heading
              as="h1"
              size="h2"
              className="mx-auto mb-[26px] max-w-[900px] text-[58px] font-semibold leading-[61px] tracking-[-1.7px] text-white"
            >
              {video.name}
            </Heading>
          </header>

          {/* Hero embed — lite when a poster exists, eager otherwise (no
              fabricated placeholder when backupImage is null). */}
          <div className={cn(BAND_PX_CLASS, 'pt-[44px]')}>
            <div className="relative">
              {poster?.asset ? (
                <VideoEmbed
                  video={video}
                  mode="lite"
                  poster={poster}
                  title={video.name}
                  aspectRatio="1152/600"
                  className="rounded-[24px] border border-[#22314D] bg-transparent"
                />
              ) : (
                <VideoEmbed
                  video={video}
                  mode="eager"
                  title={video.name}
                  aspectRatio="1152/600"
                  className="rounded-[24px] border border-[#22314D] bg-transparent"
                />
              )}

              {label && (
                <div className="absolute left-[24px] top-[24px] inline-flex items-center gap-[10px] rounded-full border border-[#22314D] bg-[rgba(7,13,24,0.7)] py-[8px] pl-[8px] pr-[16px] backdrop-blur-[8px]">
                  <span className="text-[13px] font-semibold leading-none text-white">
                    {label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {hasTags && (
            <div className={cn(BAND_PX_CLASS, 'flex flex-wrap gap-[10px] pt-[28px]')}>
              {tags.map((tag, index) => (
                <Tag
                  key={`${tag.name}-${index}`}
                  tone="ghost-lime"
                  className="px-[15px]"
                >
                  {tag.name}
                </Tag>
              ))}
            </div>
          )}

          <div
            className={cn(
              BAND_PX_CLASS,
              'grid grid-cols-1 gap-[48px] pt-[56px] pb-[64px] lg:grid-cols-[1fr_380px] lg:items-start',
            )}
          >
            <div>
              {hasDescription && (
                <>
                  <Heading
                    as="h2"
                    size="h4"
                    className="mb-[18px] text-[28px] font-semibold leading-none tracking-[-0.8px] text-white"
                  >
                    {UI_STRINGS['video.aboutHeading']}
                  </Heading>
                  <PortableText
                    value={video.descriptionOfVideo!}
                    components={bodyComponents}
                  />
                </>
              )}

              {hasTranscript && (
                <details className={cn(CARD_CLASS, 'group mt-[40px]')}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-[16px] px-[28px] py-[24px] [&::-webkit-details-marker]:hidden">
                    <span className="text-[19px] font-semibold leading-none tracking-[-0.3px] text-white">
                      {UI_STRINGS['video.transcriptHeading']}
                    </span>
                    <ToggleGlyph />
                  </summary>
                  <div className="px-[28px] pb-[24px]">
                    <PortableText
                      value={video.fullVideoTranscript!}
                      components={bodyComponents}
                    />
                  </div>
                </details>
              )}
            </div>

            <aside>
              {hasLinks && (
                <div className={cn(CARD_CLASS, 'mb-[20px] px-[28px] py-[26px]')}>
                  <h2 className="mb-[6px] text-[17px] font-semibold leading-none tracking-[-0.3px] text-white">
                    {UI_STRINGS['video.linksHeading']}
                  </h2>
                  <PortableText
                    value={video.linksMentionedInVideo!}
                    components={bodyComponents}
                  />
                </div>
              )}

              {hasSpeakers && (
                <div className={cn(CARD_CLASS, 'px-[28px] py-[26px]')}>
                  <h2 className="mb-[18px] text-[17px] font-semibold leading-none tracking-[-0.3px] text-white">
                    {UI_STRINGS['video.speakersHeading']}
                  </h2>
                  <PortableText
                    value={video.linkedinProfilesOfSpeakersInVideo!}
                    components={bodyComponents}
                  />
                </div>
              )}
            </aside>
          </div>
        </div>
      </Container>
    </article>
  )
}
