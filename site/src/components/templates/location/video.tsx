'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { parseVideoUrl } from '@/components/ui/video-embed'

// Location video media card.
//
// Preferred path — local `videoSrc` (mp4):
//   1. Page load → muted autoplay loop (background animation, no controls)
//   2. Click play → restart at 0:00 with sound + native controls
//
// Fallback — remote YouTube/Vimeo/Loom `videoUrl` (when no mp4 is set):
//   same click-to-play behaviour via a fresh iframe (starts at 0:00).
//
// Frame is locked to 16:9 with the same padding-top wrap the live CE homepage
// uses for Seb's embed, so mobile never squashes the picture.

/** Optional Vimeo privacy hash (`?h=…`) required by some private embeds. */
function vimeoHash(url: string): string | null {
  const m = url.match(/[?&]h=([a-f0-9]+)/i)
  return m?.[1] ?? null
}

function vimeoQuery(sourceUrl: string, extras: string): string {
  const hash = vimeoHash(sourceUrl)
  const h = hash ? `&h=${hash}` : ''
  return `badge=0&autopause=0&player_id=0&app_id=58479&${extras}${h}`
}

function interactiveSrc(provider: string, id: string, sourceUrl: string): string {
  if (provider === 'vimeo') {
    return `https://player.vimeo.com/video/${id}?${vimeoQuery(sourceUrl, 'autoplay=1&muted=0')}`
  }
  if (provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&playsinline=1&rel=0`
  }
  if (provider === 'loom') {
    return `https://www.loom.com/embed/${id}?autoplay=1`
  }
  return `https://www.linkedin.com/embed/feed/update/urn:li:share:${id}`
}

/** Muted looping backdrop (homepage ProcessVideo-style) while the poster chrome is visible. */
function ambientSrc(provider: string, id: string, sourceUrl: string): string | null {
  if (provider === 'vimeo') {
    // background=1 = mute + loop + autoplay + no chrome; fill/cover the frame.
    return `https://player.vimeo.com/video/${id}?${vimeoQuery(sourceUrl, 'background=1&autoplay=1&loop=1&muted=1')}`
  }
  if (provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&controls=0&rel=0`
  }
  return null
}

const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media'

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

/** 16:9 frame — black ground so ambient Vimeo never flashes white while loading. */
function VideoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[16px] bg-[#05080F]" style={{ paddingTop: '56.25%' }}>
      {children}
    </div>
  )
}

function NativeLocationVideo({
  image,
  presenter,
  pullQuote,
  videoSrc,
  title,
}: {
  image: string
  presenter: string
  pullQuote: string
  videoSrc: string
  title: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  // Keep muted ambient looping until the visitor explicitly hits play.
  useEffect(() => {
    const el = videoRef.current
    if (!el || playing) return
    el.muted = true
    el.loop = true
    el.playsInline = true
    void el.play().catch(() => {
      // Autoplay can be blocked; poster + play button remain.
    })
  }, [playing, videoSrc])

  function handlePlay() {
    const el = videoRef.current
    if (!el) return
    setPlaying(true)
    el.loop = false
    el.muted = false
    el.controls = true
    el.currentTime = 0
    void el.play().catch(() => {
      /* user can use native controls */
    })
  }

  return (
    <div className="relative w-full rounded-[20px] border border-[#22314D] bg-[#101B30]">
      <div className="p-4">
        <VideoFrame>
          <video
            ref={videoRef}
            src={videoSrc}
            poster={image}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover object-center"
            aria-label={title}
          />

          {!playing ? (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060F1E]/75 via-transparent to-[#060F1E]/20"
              />

              <span className="pointer-events-none absolute left-4 top-4 inline-flex max-w-[85%] items-center gap-2 rounded-pill bg-[#060F1E]/80 px-3 py-1.5 text-[11px] font-medium text-white sm:left-5 sm:top-5 sm:px-4 sm:py-2 sm:text-[12px]">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#FF4D4D]" />
                <span className="truncate">{presenter}</span>
              </span>

              <button
                type="button"
                onClick={handlePlay}
                className="absolute inset-0 flex cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Play video: ${title}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-primary text-[#060F1E] shadow-[0_0_0_12px_rgba(212,255,60,0.18)] transition-transform hover:scale-105 lg:h-[92px] lg:w-[92px]"
                >
                  <PlayGlyph className="h-7 w-7 lg:h-8 lg:w-8" />
                </span>
              </button>

              <span className="pointer-events-none absolute bottom-3 left-1/2 max-w-[92%] -translate-x-1/2 rounded-pill bg-[#060F1E]/80 px-3 py-1.5 text-center text-[12px] font-medium text-white sm:bottom-4 sm:px-4 sm:py-2 sm:text-[13px]">
                {pullQuote}
              </span>
            </>
          ) : null}
        </VideoFrame>
      </div>
    </div>
  )
}

function EmbedLocationVideo({
  image,
  presenter,
  pullQuote,
  videoUrl,
  title,
}: {
  image: string
  presenter: string
  pullQuote: string
  videoUrl: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  const parsed = parseVideoUrl(videoUrl)
  const playable = Boolean(parsed)
  const ambient =
    parsed && !playing ? ambientSrc(parsed.provider, parsed.id, videoUrl) : null

  if (playing && parsed) {
    return (
      <div className="w-full rounded-[20px] border border-[#22314D] bg-[#101B30]">
        <div className="p-4">
          <VideoFrame>
            <iframe
              key={`play-${parsed.provider}-${parsed.id}`}
              src={interactiveSrc(parsed.provider, parsed.id, videoUrl)}
              title={title}
              allow={
                parsed.provider === 'vimeo'
                  ? VIMEO_ALLOW
                  : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
              }
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full border-0"
            />
          </VideoFrame>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-[20px] border border-[#22314D] bg-[#101B30]">
      <div className="p-4">
        <VideoFrame>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
          />

          {ambient ? (
            <iframe
              src={ambient}
              title={title}
              allow={VIMEO_ALLOW}
              aria-hidden="true"
              tabIndex={-1}
              // Oversized + centred so Vimeo's light edge seam sits outside the clip.
              className="pointer-events-none absolute left-1/2 top-1/2 h-[calc(100%+6px)] w-[calc(100%+6px)] -translate-x-1/2 -translate-y-1/2 border-0 motion-reduce:hidden"
            />
          ) : null}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060F1E]/75 via-transparent to-[#060F1E]/20"
          />

          <span className="pointer-events-none absolute left-4 top-4 inline-flex max-w-[85%] items-center gap-2 rounded-pill bg-[#060F1E]/80 px-3 py-1.5 text-[11px] font-medium text-white sm:left-5 sm:top-5 sm:px-4 sm:py-2 sm:text-[12px]">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#FF4D4D]" />
            <span className="truncate">{presenter}</span>
          </span>

          {playable ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label={`Play video: ${title}`}
            >
              <span
                aria-hidden="true"
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-primary text-[#060F1E] shadow-[0_0_0_12px_rgba(212,255,60,0.18)] transition-transform hover:scale-105 lg:h-[92px] lg:w-[92px]"
              >
                <PlayGlyph className="h-7 w-7 lg:h-8 lg:w-8" />
              </span>
            </button>
          ) : (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                aria-hidden="true"
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-primary text-[#060F1E] shadow-[0_0_0_12px_rgba(212,255,60,0.18)] lg:h-[92px] lg:w-[92px]"
              >
                <PlayGlyph className="h-7 w-7 lg:h-8 lg:w-8" />
              </span>
            </span>
          )}

          <span className="pointer-events-none absolute bottom-3 left-1/2 max-w-[92%] -translate-x-1/2 rounded-pill bg-[#060F1E]/80 px-3 py-1.5 text-center text-[12px] font-medium text-white sm:bottom-4 sm:px-4 sm:py-2 sm:text-[13px]">
            {pullQuote}
          </span>
        </VideoFrame>
      </div>
    </div>
  )
}

export function LocationVideo({
  image,
  presenter,
  pullQuote,
  videoUrl,
  videoSrc,
  title,
}: {
  image: string
  presenter: string
  pullQuote: string
  videoUrl?: string
  /** Local mp4 path — preferred for muted ambient autoplay without embed domain issues. */
  videoSrc?: string
  title: string
}) {
  const localSrc = videoSrc?.trim()
  if (localSrc) {
    return (
      <NativeLocationVideo
        image={image}
        presenter={presenter}
        pullQuote={pullQuote}
        videoSrc={localSrc}
        title={title}
      />
    )
  }

  const remote = videoUrl?.trim()
  if (remote) {
    return (
      <EmbedLocationVideo
        image={image}
        presenter={presenter}
        pullQuote={pullQuote}
        videoUrl={remote}
        title={title}
      />
    )
  }

  return (
    <EmbedLocationVideo
      image={image}
      presenter={presenter}
      pullQuote={pullQuote}
      videoUrl=""
      title={title}
    />
  )
}
