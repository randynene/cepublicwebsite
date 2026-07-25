'use client'

import { useState, type ReactNode } from 'react'

import { Image, type SanityImageSource } from '../image'
import { cn } from '../_utils/cn'

// E2 VideoEmbed — Vimeo + YouTube wrapper (autonomous batch).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-video-embeds.mjs):
//
//   - DEV-25: Brief inventory said "Vimeo only". Probe contradicts:
//     CE uses YOUTUBE DOMINANTLY (7/8 = 88%) + 1 Vimeo (12%). Brief
//     assumption rejected; E2 supports both providers via auto-detection.
//
//   - Two distinct video usage modes observed:
//       * Ambient loops (5 of 8): autoplay+mute+loop+controls=0
//         decorative hero backgrounds. Need iframe loaded eagerly.
//       * User-initiated playback (3 of 8): full controls, lite-embed
//         (poster + click-to-play) is a migration improvement (saves
//         ~500KB per video page; CE loads all iframes eagerly).
//
//   - Migration improvement (per Decision D2): ALL CE iframes load
//     loading=eager. Lite-embed pattern (poster→iframe swap) is
//     standard modern UX for user-initiated playback. Eager-mode
//     escape hatch for ambient autoplay loops where iframe must
//     start immediately.
//
//   - 16:9 aspect ratio dominant (1.778 ratio observed on Vimeo
//     player; YouTube player rendered widths/heights vary slightly
//     because of CE's container constraints, but all videos are
//     16:9 native). Default `aspectRatio="16/9"` with override prop.
//
//   - YouTube embed domain: youtube-nocookie.com (privacy-respecting,
//     GDPR-friendly variant of youtube.com/embed). Functionally
//     equivalent for our use cases.

// =============================================================================
// URL parsing — provider + id extraction
// =============================================================================

type VideoProvider = 'vimeo' | 'youtube' | 'linkedin' | 'loom'

interface ParsedVideoUrl {
  provider: VideoProvider
  id: string
}

export function parseVideoUrl(url: string): ParsedVideoUrl | null {
  // Vimeo: player.vimeo.com/video/{id}, vimeo.com/{id}
  const vimeoMatch = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) return { provider: 'vimeo', id: vimeoMatch[1] }
  // YouTube: youtube.com/watch?v={id}, youtube.com/embed/{id}, youtu.be/{id},
  // youtube-nocookie.com/embed/{id}
  const ytMatch = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/,
  )
  if (ytMatch) return { provider: 'youtube', id: ytMatch[1] }
  // LinkedIn: www.linkedin.com/embed/feed/update/urn:li:share:{id}
  //   `urn:li:share:` is literal in the path; {id} is the numeric share ID.
  //   CONTENT-1E sweep found 2 production instances in blogPost.content.
  //   LinkedIn embeds render the feed post inline; no autoplay affordance.
  const liMatch = url.match(
    /linkedin\.com\/embed\/feed\/update\/urn:li:share:(\d+)/,
  )
  if (liMatch) return { provider: 'linkedin', id: liMatch[1] }
  // Loom: loom.com/share/{id}, loom.com/embed/{id}
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/i)
  if (loomMatch) return { provider: 'loom', id: loomMatch[1] }
  return null
}

function buildEmbedUrl(parsed: ParsedVideoUrl, autoplay: boolean): string {
  if (parsed.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${parsed.id}${autoplay ? '?autoplay=1' : ''}`
  }
  if (parsed.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${parsed.id}${autoplay ? '?autoplay=1' : ''}`
  }
  if (parsed.provider === 'loom') {
    return `https://www.loom.com/embed/${parsed.id}${autoplay ? '?autoplay=1' : ''}`
  }
  // LinkedIn — autoplay is ignored (LinkedIn ignores the query param). Embed
  // URL has no autoplay-equivalent.
  return `https://www.linkedin.com/embed/feed/update/urn:li:share:${parsed.id}`
}

const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media'
const YOUTUBE_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
const LINKEDIN_ALLOW = 'fullscreen; clipboard-write; encrypted-media'
const LOOM_ALLOW = 'autoplay; fullscreen; picture-in-picture'

function iframeAllow(provider: VideoProvider): string {
  if (provider === 'vimeo') return VIMEO_ALLOW
  if (provider === 'youtube') return YOUTUBE_ALLOW
  if (provider === 'loom') return LOOM_ALLOW
  return LINKEDIN_ALLOW
}

// Sanity video doc shape — matches studio/schemas/documents/video.ts.
// Accepting the full doc lets templates pass `video={videoDoc}` directly.
export interface SanityVideoDoc {
  mainVideoEmbedLink?: string | null
  backupImage?: SanityImageSource | null
  name?: string | null
}

type CommonProps = {
  /** Aspect ratio CSS string (e.g. '16/9'). Defaults to '16/9'. */
  aspectRatio?: string
  className?: string
}

// Source: either a Sanity video doc OR a direct URL.
type SanityVideoSource = { video: SanityVideoDoc; url?: never }
type DirectUrlSource = { url: string; video?: never }

// Mode: lite (poster + click-to-play) OR eager (iframe immediate).
// Lite REQUIRES poster + title; eager only requires title.
type LiteMode = {
  mode?: 'lite'
  poster: SanityImageSource
  title: string
}
type EagerMode = {
  mode: 'eager'
  poster?: never
  title: string
}

export type VideoEmbedProps =
  & CommonProps
  & (SanityVideoSource | DirectUrlSource)
  & (LiteMode | EagerMode)

// =============================================================================
// VideoEmbed
// =============================================================================

export function VideoEmbed(props: VideoEmbedProps): ReactNode {
  const { aspectRatio = '16/9', className, title } = props
  const mode = props.mode ?? 'lite'

  // Resolve URL — either the direct prop, or pull from the Sanity doc.
  const url = 'url' in props && props.url
    ? props.url
    : 'video' in props && props.video?.mainVideoEmbedLink
      ? props.video.mainVideoEmbedLink
      : null

  if (!url) return null

  const parsed = parseVideoUrl(url)
  if (!parsed) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[VideoEmbed] could not parse video URL:', url)
    }
    return null
  }

  const aspectStyle = { aspectRatio } as React.CSSProperties

  // Eager mode — render iframe immediately. Used for ambient autoplay loops
  // where the iframe must start as soon as the page renders.
  if (mode === 'eager') {
    return (
      <div
        className={cn('relative w-full overflow-hidden rounded-md bg-bg-primary', className)}
        style={aspectStyle}
      >
        <iframe
          src={buildEmbedUrl(parsed, true)}
          title={title}
          allow={iframeAllow(parsed.provider)}
          allowFullScreen
          loading="eager"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  // Lite mode — render poster + play overlay; swap to iframe on click.
  // Poster is required at the type level for lite mode.
  return (
    <LiteVideoEmbed
      parsed={parsed}
      poster={(props as LiteMode).poster}
      title={title}
      aspectStyle={aspectStyle}
      className={className}
    />
  )
}

// =============================================================================
// LiteVideoEmbed — internal lite-embed component
// =============================================================================

interface LiteVideoEmbedProps {
  parsed: ParsedVideoUrl
  poster: SanityImageSource
  title: string
  aspectStyle: React.CSSProperties
  className?: string
}

function LiteVideoEmbed({
  parsed,
  poster,
  title,
  aspectStyle,
  className,
}: LiteVideoEmbedProps) {
  const [loaded, setLoaded] = useState(false)

  if (loaded) {
    return (
      <div
        className={cn('relative w-full overflow-hidden rounded-md bg-bg-primary', className)}
        style={aspectStyle}
      >
        <iframe
          src={buildEmbedUrl(parsed, true)}
          title={title}
          allow={iframeAllow(parsed.provider)}
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className={cn(
        'group relative block w-full overflow-hidden rounded-md',
        'cursor-pointer bg-bg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        className,
      )}
      style={aspectStyle}
      aria-label={`Play video: ${title}`}
    >
      <Image
        source={poster}
        alt=""
        fill
        sizes="(min-width: 1024px) 80vw, 100vw"
        className="object-cover transition-transform duration-reveal ease-reveal group-hover:scale-105"
      />
      {/* Dark overlay for play-button contrast */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-bg-primary/30 transition-colors duration-reveal ease-reveal group-hover:bg-bg-primary/40"
      />
      {/* Play-button glyph — inline SVG (sprite has no `play` icon yet) */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center',
          'rounded-full bg-surface-elevated/95 text-brand-primary',
          'transition-transform duration-reveal ease-reveal group-hover:scale-110',
        )}
      >
        <svg
          className="ml-1 h-6 w-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  )
}

export default VideoEmbed
