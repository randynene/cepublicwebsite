'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { parseVideoUrl } from '@/components/ui/video-embed'

import type { HomeContent } from './content'

// Process-section video card.
//
// Behaviour (per Jake's brief):
//   1. The video plays MUTED and LOOPING in the background as soon as the page
//      loads — an ambient, animated backdrop with no sound and no controls.
//   2. The lime play button + "Watch the 90-second overview" CTA stay visible
//      on top, signalling that the real video has NOT started yet.
//   3. Clicking anywhere on the card loads the full Vimeo player and plays the
//      video FROM THE START, with sound and controls.
//
// Reduced-motion users see the still poster instead of the ambient loop
// (`motion-reduce:hidden` on the backdrop); click-to-play still works for all.

type VideoContent = HomeContent['process']['video']

const GLYPH_PLAY = '\u25B6' // ▶

// Muted, looping, chrome-less ambient backdrop. Vimeo `background=1` forces
// mute + loop + autoplay + hides all player UI, and covers (crops to fill) its
// container — exactly the "animated video in the background" effect.
function ambientSrc(id: string): string {
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&autopause=0`
}

// Full player: from the start, WITH sound, with controls.
function playSrc(id: string): string {
  return `https://player.vimeo.com/video/${id}?autoplay=1&autopause=0&badge=0&byline=0&portrait=0&title=0`
}

const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media'

export function ProcessVideo({
  video,
  videoUrl,
}: {
  video: VideoContent
  videoUrl: string
}) {
  const [playing, setPlaying] = useState(false)
  // Vimeo shows a white loading screen inside the iframe before playback
  // begins; `playerReady` lets us cover that with a dark spinner until the
  // video is genuinely PLAYING (not just when the iframe HTML has loaded).
  const [playerReady, setPlayerReady] = useState(false)
  const playerRef = useRef<HTMLIFrameElement>(null)

  // Ask the Vimeo player to tell us when it starts playing, then drop the
  // loading cover on the real `playing` event (first frame painted) — this is
  // what removes the white flash `onLoad` alone leaves behind. A generous
  // timeout is a safety net so the spinner can never get stuck.
  useEffect(() => {
    if (!playing) return

    const register = () => {
      const win = playerRef.current?.contentWindow
      if (!win) return
      for (const value of ['playing', 'play']) {
        win.postMessage(JSON.stringify({ method: 'addEventListener', value }), '*')
      }
    }

    const onMessage = (event: MessageEvent) => {
      if (typeof event.origin !== 'string' || !event.origin.includes('player.vimeo.com')) return
      let data: { event?: string } | null = null
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (!data) return
      if (data.event === 'ready') register()
      else if (data.event === 'playing' || data.event === 'play') setPlayerReady(true)
    }

    window.addEventListener('message', onMessage)
    const fallback = window.setTimeout(() => setPlayerReady(true), 6000)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(fallback)
    }
  }, [playing])

  const parsed = parseVideoUrl(videoUrl)
  const id = parsed?.provider === 'vimeo' ? parsed.id : null
  const showAmbient = Boolean(id) && !playing

  return (
    <div className="relative flex min-h-[720px] flex-col justify-between overflow-hidden rounded-[16px] bg-[#05080F] p-[28px] lg:p-[36px]">
      {/* Base layer: poster still (shown for reduced-motion users + as the
       * frame behind the video while it loads). */}
      <Image
        src={video.poster.src}
        alt={video.name}
        fill
        sizes="(max-width: 1280px) 100vw, 1216px"
        className="object-cover object-top"
      />

      {/* Ambient muted background video — plays from page load. Sized a few px
       * larger than the container and centred so its edges bleed past the
       * rounded clip (kills the light seam Vimeo draws at the top). Hidden for
       * reduced-motion users, who keep the still poster above. */}
      {showAmbient && id ? (
        <iframe
          src={ambientSrc(id)}
          title={video.name}
          allow={VIMEO_ALLOW}
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[calc(100%+6px)] w-[calc(100%+6px)] -translate-x-1/2 -translate-y-1/2 border-0 motion-reduce:hidden"
        />
      ) : null}

      {/* Bottom-up scrim so the caption + name stay legible over the video */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, #05080F 0%, rgba(5,8,15,.30) 40%, transparent 100%)',
        }}
      />

      {/* Caption (top). CE-23: enlarge so the "90-second explainer" line reads
       * clearly over the moving footage. */}
      <div className="relative flex items-center gap-[12px]">
        <span aria-hidden="true" className="h-[12px] w-[12px] rounded-full bg-brand-primary" />
        <p className="text-[20px] font-medium leading-[28px] tracking-[-0.08px] text-white lg:text-[24px] lg:leading-[32px]">
          {video.caption}
        </p>
      </div>

      {/* Centre play glyph (decorative — the click target is the overlay button) */}
      <span
        aria-hidden="true"
        className="play-pulse absolute left-1/2 top-[54%] flex h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-primary text-[24px] text-[#060F1E] shadow-[0_10px_40px_rgba(212,255,60,0.35)] transition-transform group-hover:scale-105"
      >
        {GLYPH_PLAY}
      </span>

      {/* Name / role (bottom-left) + CTA pushed to the far right, same level */}
      <div className="relative flex flex-col items-start gap-[16px] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[26px] font-semibold leading-[32px] text-white lg:text-[30px] lg:leading-[36px]">
            {video.name}
          </div>
          <div className="text-[15px] font-normal text-white/70 lg:text-[16px]">
            {video.roleLine}
          </div>
        </div>
        {/* The CTA is the whole point of the card, so it carries the size. */}
        <span className="inline-flex items-center gap-[10px] rounded-full bg-brand-primary px-[26px] py-[16px] text-[16px] font-bold text-[#060F1E] lg:text-[18px]">
          <span aria-hidden="true">{GLYPH_PLAY}</span>
          {video.cta}
        </span>
      </div>

      {/* Full-card click target: plays the real video (from the start, sound on) */}
      {!playing ? (
        <button
          type="button"
          onClick={() => {
            setPlayerReady(false)
            setPlaying(true)
          }}
          aria-label={`${video.cta}: ${video.name}`}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
        />
      ) : null}

      {/* Real player — replaces the poster/overlay, plays with sound from 0.
       * Overscanned + centred like the ambient loop so no light seam shows at
       * the top edge while it plays. */}
      {playing && id ? (
        <iframe
          ref={playerRef}
          src={playSrc(id)}
          title={video.name}
          allow={VIMEO_ALLOW}
          allowFullScreen
          onLoad={() => {
            const win = playerRef.current?.contentWindow
            if (!win) return
            for (const value of ['playing', 'play']) {
              win.postMessage(JSON.stringify({ method: 'addEventListener', value }), '*')
            }
          }}
          className="absolute left-1/2 top-1/2 z-30 h-[calc(100%+6px)] w-[calc(100%+6px)] -translate-x-1/2 -translate-y-1/2 border-0"
        />
      ) : null}

      {/* Loading cover — hides Vimeo's white loading screen behind a dark panel
       * + lime spinner until the embed reports it has loaded. */}
      {playing && !playerReady ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#05080F]">
          <span
            aria-hidden="true"
            className="h-[48px] w-[48px] animate-spin rounded-full border-[3px] border-brand-primary/25 border-t-brand-primary"
          />
        </div>
      ) : null}
    </div>
  )
}

export default ProcessVideo
