'use client'

import { useState } from 'react'

import { Image } from '@/components/ui/image'
import { VideoEmbed, parseVideoUrl } from '@/components/ui/video-embed'
import { cn } from '@/components/ui/_utils/cn'
import type { SanityImage } from '@/types/sanity/shared'

interface HowToUseVideoProps {
  videoLink: string
  videoThumbnail: SanityImage
  title: string
  className?: string
}

export function HowToUseVideo({
  videoLink,
  videoThumbnail,
  title,
  className,
}: HowToUseVideoProps) {
  const parsed = parseVideoUrl(videoLink)

  if (parsed) {
    return (
      <VideoEmbed
        url={videoLink}
        mode="lite"
        poster={videoThumbnail}
        title={title}
        aspectRatio="16/9"
        className={cn(
          'overflow-hidden rounded-[20px] border border-[#22314D]',
          className,
        )}
      />
    )
  }

  return (
    <GenericEmbedLite
      videoLink={videoLink}
      videoThumbnail={videoThumbnail}
      title={title}
      className={className}
    />
  )
}

function GenericEmbedLite({
  videoLink,
  videoThumbnail,
  title,
  className,
}: HowToUseVideoProps) {
  const [active, setActive] = useState(false)

  if (active) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-[20px] border border-[#22314D]',
          className,
        )}
        style={{ aspectRatio: '16/9' }}
      >
        <iframe
          src={videoLink}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className={cn(
        'group relative block w-full overflow-hidden rounded-[20px] border border-[#22314D] bg-[linear-gradient(150deg,#16223A,#0d1626)] text-left',
        className,
      )}
      style={{ aspectRatio: '16/9' }}
      aria-label={title}
    >
      {videoThumbnail.asset && (
        <Image
          source={videoThumbnail}
          alt={videoThumbnail.alt?.trim() || title}
          fill
          sizes="(min-width: 1024px) 576px, 100vw"
          className="object-cover"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-[rgba(7,13,24,0.35)]">
        <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-brand-primary shadow-[0_0_0_10px_rgba(212,255,60,0.12)]">
          <span
            aria-hidden="true"
            className="ml-[5px] h-0 w-0 border-y-[12px] border-l-[20px] border-y-transparent border-l-[#060F1E]"
          />
        </span>
      </span>
    </button>
  )
}
