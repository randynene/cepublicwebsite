'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { parseVideoUrl } from '@/components/ui/video-embed'

// Pricing testimonial video panel.
//
// Same behaviour as the home Process video (site/src/components/templates/home/
// process-video.tsx): the clip runs muted + looping as an ambient backdrop, the
// lime play button signals the real video has not started, and a click loads the
// full Vimeo player from the start with sound. No poster asset is needed - the
// design's "video still" IS a frame of this clip.
//
// Reduced-motion users get the first frame instead of the loop (the ambient
// iframe is hidden), and click-to-play still works for everyone.

const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media'

function ambientSrc(id: string): string {
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&autopause=0`
}

function playSrc(id: string): string {
  return `https://player.vimeo.com/video/${id}?autoplay=1&autopause=0&badge=0&byline=0&portrait=0&title=0`
}

export function TestimonialVideo({
  videoUrl,
  caption,
  title,
  playLabel,
  poster,
}: {
  videoUrl: string
  caption: string
  title: string
  playLabel: string
  poster?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  // The ambient iframe stays transparent until the Vimeo player says it is
  // ready. A network block or a bot challenge never reports ready, so in that
  // case the poster + play button stay on screen instead of the error page.
  const [ambientReady, setAmbientReady] = useState(false)
  const playerRef = useRef<HTMLIFrameElement>(null)

  // Vimeo paints a white loading screen before playback starts; listen for the
  // real `playing` event so the dark cover only lifts on the first frame.
  useEffect(() => {
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
      if (data.event === 'ready') {
        setAmbientReady(true)
        register()
      } else if (data.event === 'playing' || data.event === 'play') {
        setPlayerReady(true)
      }
    }

    window.addEventListener('message', onMessage)
    const fallback = playing ? window.setTimeout(() => setPlayerReady(true), 6000) : undefined
    return () => {
      window.removeEventListener('message', onMessage)
      if (fallback) window.clearTimeout(fallback)
    }
  }, [playing])

  const parsed = parseVideoUrl(videoUrl)
  const id = parsed?.provider === 'vimeo' ? parsed.id : null
  const showAmbient = Boolean(id) && !playing

  return (
    <div className="relative min-h-[300px] overflow-hidden bg-[#1B2A45] lg:min-h-0">
      {poster ? (
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : null}

      {showAmbient && id ? (
        <iframe
          src={ambientSrc(id)}
          title={title}
          allow={VIMEO_ALLOW}
          aria-hidden="true"
          tabIndex={-1}
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2 h-[calc(100%+6px)] w-[calc(100%+6px)] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-500 motion-reduce:hidden',
            ambientReady ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}

      {/* Caption pill (top-left) */}
      <div className="absolute left-[16px] top-[16px] z-10 flex max-w-[calc(100%-32px)] items-center gap-[8px] rounded-pill bg-[#101B30]/90 px-[14px] py-[8px]">
        <span aria-hidden="true" className="h-[8px] w-[8px] shrink-0 rounded-full bg-[#FF3B30]" />
        <span className="truncate text-[11px] font-bold leading-[16px] text-white lg:text-[13px]">
          {caption}
        </span>
      </div>

      {/* Play affordance - decorative; the click target is the overlay button */}
      {!playing ? (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-primary shadow-[0_0_0_12px_rgba(212,255,60,0.15)] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none lg:h-[96px] lg:w-[96px]"
        >
          <span className="ml-[6px] h-0 w-0 border-y-[13px] border-l-[22px] border-y-transparent border-l-[#070D18]" />
        </span>
      ) : null}

      {!playing ? (
        <button
          type="button"
          onClick={() => {
            setPlayerReady(false)
            setPlaying(true)
          }}
          aria-label={playLabel}
          className="group absolute inset-0 z-20 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
        />
      ) : null}

      {playing && id ? (
        <iframe
          ref={playerRef}
          src={playSrc(id)}
          title={title}
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

export default TestimonialVideo
