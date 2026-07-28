'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { parseVideoUrl } from '@/components/ui/video-embed'

// Ambient autoplay tile for the Our Work Customer Impact bento.
// Muted + looping Vimeo backdrop (same pattern as pricing TestimonialVideo).
// Click-through stays on the parent <Link> to the customer story.

const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media'

function ambientSrc(id: string): string {
  // background=1 fills the frame (no letterbox chrome). Parent overscans + clips
  // so any residual edge never shows as a white hairline on the tile.
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&autopause=0`
}

export function BentoVideo({
  videoUrl,
  posterUrl,
  title,
  className,
}: {
  videoUrl: string
  posterUrl?: string
  title: string
  className?: string
}) {
  const [ready, setReady] = useState(false)
  const parsed = parseVideoUrl(videoUrl)
  const id = parsed?.provider === 'vimeo' ? parsed.id : null

  useEffect(() => {
    if (!id) return
    const onMessage = (event: MessageEvent) => {
      if (typeof event.origin !== 'string' || !event.origin.includes('player.vimeo.com')) return
      let data: { event?: string } | null = null
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (data?.event === 'ready' || data?.event === 'playing' || data?.event === 'play') {
        setReady(true)
      }
    }
    window.addEventListener('message', onMessage)
    const fallback = window.setTimeout(() => setReady(true), 4000)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(fallback)
    }
  }, [id])

  if (!id) return null

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-[#070D18]', className)}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            ready ? 'opacity-0' : 'opacity-100',
          )}
          loading="eager"
        />
      ) : null}
      <iframe
        src={ambientSrc(id)}
        title={title}
        allow={VIMEO_ALLOW}
        aria-hidden="true"
        tabIndex={-1}
        // Overscan crops Vimeo's letterbox / chrome so no white edge shows
        // through the rounded tile (overflow:hidden on this wrapper + parent).
        className={cn(
          'pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-500 motion-reduce:hidden',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}

export default BentoVideo
