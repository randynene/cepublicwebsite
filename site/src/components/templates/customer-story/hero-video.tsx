'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { UI_STRINGS } from '@/lib/ui-strings'

// Customer story hero video (CE-62).
//
// Two faults were reported against this frame and both are fixed here.
//
// 1. White bars down the left and right. The frame was aspect-[1152/600]
//    (ratio 1.92) and the films are 16:9 (1.775), so Vimeo pillarboxed the
//    picture inside it: at 600px tall a 16:9 clip is 1066px wide in an 1152px
//    box, leaving 43px of player background down each side. The frame is 16:9
//    here so the picture fills it exactly. Overscanning to cover would also
//    have removed the bars, but these are talking-head interviews with the
//    subtitles burned into the lower third, and cropping is what would clip
//    them.
//
// 2. No way to play it. The embed ran with Vimeo's `background=1`, which is a
//    decorative-wallpaper mode: it strips every control and forces mute by
//    design, so there was no play button to find.
//
// The behaviour matches the pricing testimonial and home process videos: the
// clip runs muted and looping as its own poster, a lime play button says the
// real thing has not started, and a click loads the full player FROM THE START
// with sound. Restarting matters - taking over the ambient loop in place would
// drop the viewer wherever it happened to be.
//
// Reduced-motion users get a still first frame instead of the loop, and
// click-to-play still works for them.

const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media'

function ambientSrc(id: string): string {
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&autopause=0`
}

function playSrc(id: string): string {
  return `https://player.vimeo.com/video/${id}?autoplay=1&autopause=0&badge=0&byline=0&portrait=0&title=0`
}

export function CustomerStoryHeroVideo({
  vimeoId,
  title,
}: {
  vimeoId: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  // The ambient loop stays transparent until Vimeo reports ready. A network
  // block or a bot challenge never reports ready, and in that case the dark
  // frame and the play button stay put rather than an error page showing
  // through.
  const [ambientReady, setAmbientReady] = useState(false)
  const playerRef = useRef<HTMLIFrameElement>(null)

  // Vimeo paints a white loading screen before playback starts, so the cover
  // only lifts on the real `playing` event rather than on load.
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

  return (
    <>
      {!playing ? (
        <iframe
          src={ambientSrc(vimeoId)}
          title={title}
          allow={VIMEO_ALLOW}
          aria-hidden="true"
          tabIndex={-1}
          // Safety net. The fade waits on Vimeo's `ready` postMessage, which is
          // the right signal but not a guaranteed one - it never arrives in
          // headless browsers, and there is no reason to assume every real
          // client is different. Before this change the loop was ungated and
          // always visible, so a missed `ready` would have turned a playing
          // video into an empty box. Revealing it on load too means the worst
          // case is exactly what the page does today.
          onLoad={() => setAmbientReady(true)}
          className={cn(
            'pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-500 motion-reduce:hidden',
            ambientReady ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}

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
          aria-label={UI_STRINGS['customerStory.playVideo']}
          className="group absolute inset-0 z-20 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
        />
      ) : null}

      {playing ? (
        <iframe
          ref={playerRef}
          src={playSrc(vimeoId)}
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
          className="absolute inset-0 z-30 h-full w-full border-0"
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
    </>
  )
}

export default CustomerStoryHeroVideo
