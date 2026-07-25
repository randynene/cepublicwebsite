'use client'

import { useState } from 'react'

import { parseVideoUrl } from '@/components/ui/video-embed'

// Location video media card. When `videoUrl` is a YouTube/Vimeo/Loom link the
// poster becomes click-to-play (poster -> iframe swap on click). When it is
// empty the poster shows as a static still with a decorative play button
// (the pre-wiring behaviour). The surrounding section copy stays in the server
// template; only this media card is a client component.

function embedSrc(provider: string, id: string): string {
  if (provider === 'vimeo') return `https://player.vimeo.com/video/${id}?autoplay=1`
  if (provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
  if (provider === 'loom') return `https://www.loom.com/embed/${id}?autoplay=1`
  return `https://www.linkedin.com/embed/feed/update/urn:li:share:${id}`
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export function LocationVideo({
  image,
  presenter,
  pullQuote,
  videoUrl,
  title,
}: {
  image: string
  presenter: string
  pullQuote: string
  videoUrl?: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  const parsed = videoUrl ? parseVideoUrl(videoUrl) : null
  const playable = Boolean(parsed)

  if (playing && parsed) {
    return (
      <div className="rounded-[20px] border border-[#22314D] bg-[#101B30] p-4">
        <div className="relative overflow-hidden rounded-[16px] bg-[#0A1628]" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            src={embedSrc(parsed.provider, parsed.id)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    )
  }

  const Poster = (
    <div className="relative overflow-hidden rounded-[16px] bg-[#0A1628]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="h-auto max-h-[620px] w-full object-cover" loading="lazy" />
      <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-pill bg-[#060F1E]/80 px-4 py-2 text-[12px] font-medium text-white">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#FF4D4D]" />
        {presenter}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-brand-primary text-[#060F1E] shadow-[0_0_0_14px_rgba(212,255,60,0.18)]"
        >
          <PlayGlyph className="h-8 w-8" />
        </span>
      </span>
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-pill bg-[#060F1E]/80 px-4 py-2 text-[13px] font-medium text-white">
        {pullQuote}
      </span>
    </div>
  )

  return (
    <div className="relative rounded-[20px] border border-[#22314D] bg-[#101B30] p-4">
      {playable ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="block w-full cursor-pointer rounded-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={`Play video: ${title}`}
        >
          {Poster}
        </button>
      ) : (
        Poster
      )}
    </div>
  )
}
