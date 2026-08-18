'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'

import {
  MOLLY_VIDEO_COVER,
  MOLLY_VIDEO_SRC,
  WORK_WITH_MOLLY_CONTENT,
} from './content'

// Molly's intro video card.
//
// WHY THIS IS A NATIVE <video> AND NOT THE TELLA IFRAME.
//
// The first build embedded Tella's own player. Probed in a real browser, that
// embed always mounts TWO video elements: a 5-second, muted, looping teaser cut
// (`thumb.mp4`) which plays immediately, and the real 101-second video, which
// stays paused until you click Tella's play button INSIDE their iframe. That is
// what "it plays in silence in the background and the thing is not working"
// was - the silent animated loop, not the video.
//
// Tella has no autoplay escape hatch. `?a=1`, `?autoplay=1` and a bare URL were
// all tested, including with Chrome's autoplay policy disabled entirely, and
// every one of them left the real video paused at 0:00. Their `muted` param IS
// read (it reaches the real element), so the params are not being ignored -
// they simply do not offer autoplay. And a cross-origin iframe cannot be
// clicked from here, so there is no way to spend our visitor's click on their
// button.
//
// So the video is served from our own origin instead: pulled once from Tella's
// HLS rendition and re-encoded to 1280x720 H.264 (7.5MB, `molly-intro.mp4`).
// One click now starts the real video, with sound, first time. It also takes a
// third-party player out of the hero, which the site has too many of already
// (Tech Debt #29).
//
// The unmuted play works because `play()` is called inside the click handler,
// so it carries the user's activation. It is NOT set to autoplay on load, which
// browsers would rightly block.
//
// THE COVER IS JAKE'S OWN ASSET (docs/design/molly_Container3.jpg), so the card
// at rest is the design rather than an approximation of it. The red badge and
// the play button are baked into those pixels, which is why this component no
// longer draws either one - drawing them again would double them up. The knock-
// on effects are deliberate and worth knowing about:
//   - the play button does not respond to hover, because it is part of the
//     image. The whole cover is still one button, so the hit target and the
//     keyboard focus ring are unchanged.
//   - the cover is rendered from his SVG at 3x rather than from the 559px
//     screenshot he first sent, so it is sharp at retina sizes. content.ts
//     carries the exact rasterisation recipe.
//
// Re-record note: `MOLLY_VIDEO_URL` in content.ts records where the video came
// from.

const VIDEO = WORK_WITH_MOLLY_CONTENT.video

const CARD =
  'relative overflow-hidden rounded-[24px] border border-[#22314D] bg-[#101B30]'

export function MollyVideoCard({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function start(): void {
    setPlaying(true)
    // Fire and forget: if the browser refuses (it should not, this is inside a
    // click), the controls are already on screen and the visitor can press play.
    void videoRef.current?.play().catch(() => undefined)
  }

  return (
    <div className={cn(CARD, className)}>
      {/* 529:326 is the cover's own aspect, so it fills the frame exactly and
          object-cover never has to re-crop artwork that was already cropped
          deliberately - at the wrong ratio it was shaving the red badge off
          the left edge. The cover is 1280x789, the same 1.623. */}
      <div className="relative aspect-[529/326] w-full bg-black">
        <video
          ref={videoRef}
          src={MOLLY_VIDEO_SRC}
          // No `poster` attribute: the cover is the next/image below, which is
          // optimised and responsive. The <video> only shows once it is playing.
          preload="none"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            playing ? 'opacity-100' : 'opacity-0',
          )}
        />

        {!playing && (
          <button
            type="button"
            onClick={start}
            aria-label={VIDEO.playLabel}
            className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {/* Badge and play button are in the artwork - see the note above. */}
            <Image
              src={MOLLY_VIDEO_COVER}
              alt={VIDEO.name}
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
              priority
            />
          </button>
        )}
      </div>

      {/* Identity strip under the frame. Rendered in HTML rather than baked
          into the poster so it stays legible, translatable and selectable. */}
      <div className="flex flex-wrap items-end justify-between gap-[16px] px-[22px] pb-[22px] pt-[18px]">
        <span className="block">
          <span className="block text-[17px] font-semibold text-white">{VIDEO.name}</span>
          <span className="block text-[13.5px] text-[#B8C2D1]">{VIDEO.company}</span>
          <span className="block text-[13.5px] text-[#B8C2D1]">{VIDEO.role}</span>
        </span>
        <span className="rounded-[12px] border border-[#22314D] bg-[#16233B] px-[14px] py-[10px] text-[13.5px] leading-[19px] text-[#B8C2D1]">
          {VIDEO.quote}
        </span>
      </div>
    </div>
  )
}
