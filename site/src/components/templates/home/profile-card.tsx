'use client'

import { useEffect, useRef, useState } from 'react'

import type { ProfileCardPerson } from './content'

// Home hero — auto-cycling "matched engineer" profile card. Faithful port of
// the locked reference (handoff brief + the bundled "CloudEmployee Hero.html"
// export, Jul 2026).
//
// The photo is TWO stacked <img> layers (never one) so a swap is always a
// real photo-to-photo crossfade — the outgoing and incoming photo cross over
// each other, and the card's blue photo-area background is never exposed.
// Name / role / flag / chips sit on TOP of the photo and swap under cover of
// that same crossfade (fade out -> swap text -> fade back in), so they too
// never expose the background. The "MATCHED" pill and the two stat blocks
// are template-fixed — not per-person.
//
// React owns every mutation via state (never direct DOM writes): a ref
// mirrors the "active layer" / "current index" values purely so the
// setInterval closure always reads the latest value without going stale.

const ADVANCE_MS = 3600
const PHOTO_FADE_MS = 900
const TEXT_SWAP_MS = 400

const MATCHED_LABEL = '\u2713 MATCHED'
const HOW_THEY_WORK_LABEL = 'HOW THEY WORK'
const STAT_1_VALUE = '7 days'
const STAT_1_LABEL = 'to your first match'
const STAT_2_VALUE = '2:1'
const STAT_2_LABEL = '2 profiles, 1 hire'

const TEXT_TRANSITION = 'opacity .4s ease, transform .45s cubic-bezier(.2,.8,.2,1)'
const FLAG_TRANSITION = 'opacity .4s ease, transform .5s cubic-bezier(.2,.8,.2,1)'

interface Layer {
  image: string
  pos: string
}

export function ProfileCard({ profiles }: { profiles: readonly ProfileCardPerson[] }) {
  const first = profiles[0]
  // Both layers start on the FIRST person's photo — never an empty src (that
  // fires a failed request) and never a mismatched pair mid-load.
  const [layers, setLayers] = useState<[Layer, Layer]>([
    { image: first.image, pos: first.pos },
    { image: first.image, pos: first.pos },
  ])
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isOut, setIsOut] = useState(false)

  const indexRef = useRef(0)
  const activeLayerRef = useRef<0 | 1>(0)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  useEffect(() => {
    // Preload every photo on mount so later swaps are instant, never a
    // loading/blank frame.
    profiles.forEach((p) => {
      const preload = new window.Image()
      preload.src = p.image
    })

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || profiles.length < 2) return

    const advance = () => {
      const nextIndex = (indexRef.current + 1) % profiles.length
      const next = profiles[nextIndex]
      const hiddenLayer: 0 | 1 = activeLayerRef.current === 0 ? 1 : 0

      setLayers((prev) => {
        const updated = [...prev] as [Layer, Layer]
        updated[hiddenLayer] = { image: next.image, pos: next.pos }
        return updated
      })

      // Two nested rAFs: the first commits the incoming layer's new src (at
      // opacity 0) to the DOM, the second waits for the browser to paint that
      // frame. Only then do we flip opacity — this is what makes it a true
      // crossfade instead of a pop, and guarantees both layers always hold a
      // real image (no blank/background frame is ever visible).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActiveLayer(hiddenLayer)
          activeLayerRef.current = hiddenLayer
        })
      })

      // Text/flag/chips sit over the photo, so fading them under cover of
      // the photo crossfade never exposes the card's blue background either.
      setIsOut(true)
      const textTimer = setTimeout(() => {
        setDisplayedIndex(nextIndex)
        requestAnimationFrame(() => setIsOut(false))
      }, TEXT_SWAP_MS)
      timersRef.current.push(textTimer)

      indexRef.current = nextIndex
    }

    const interval = setInterval(advance, ADVANCE_MS)
    timersRef.current.push(interval)

    return () => {
      timersRef.current.forEach((t) => {
        clearTimeout(t)
        clearInterval(t)
      })
      timersRef.current = []
    }
  }, [profiles])

  const displayed = profiles[displayedIndex] ?? first

  const textStyle = (extraTransform: string) => ({
    transition: TEXT_TRANSITION,
    opacity: isOut ? 0 : 1,
    transform: isOut ? extraTransform : 'translateY(0)',
  })

  return (
    <div
      className="relative h-[457px] w-[488px] max-w-full flex-shrink-0 overflow-hidden rounded-[24px] bg-[#101B30]"
      style={{ boxShadow: 'inset 0 0 0 1px #22314D, 0 24px 36px rgba(0,0,0,.3)' }}
    >
      {/* Photo area — two stacked layers for the crossfade. */}
      <div className="relative h-[280px] overflow-hidden bg-[#1B2A45]">
        {layers.map((layer, i) => (
          // Two raw <img> layers driven entirely by React state (src /
          // opacity), never direct DOM mutation. next/image's model doesn't
          // fit the dual-layer opacity choreography this crossfade depends on.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={layer.image}
            alt={i === activeLayer ? displayed.name : ''}
            aria-hidden={i !== activeLayer}
            width={488}
            height={280}
            loading="eager"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: layer.pos,
              opacity: i === activeLayer ? 1 : 0,
              transition: `opacity ${PHOTO_FADE_MS}ms ease`,
            }}
          />
        ))}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[161px]"
          style={{ background: 'linear-gradient(180deg, rgba(6,15,30,0), rgba(6,15,30,.92))' }}
        />
        <div className="absolute bottom-[24px] left-[24px] flex flex-col items-start gap-[3px]">
          <span
            className="text-[20px] font-semibold leading-none text-white"
            style={textStyle('translateY(8px)')}
          >
            {displayed.name}
          </span>
          <span
            className="text-[13.5px] font-normal leading-none text-[#D5DDE8]"
            style={textStyle('translateY(8px)')}
          >
            {displayed.role}
          </span>
        </div>
        <span
          className="absolute bottom-[25px] right-[21px] flex h-[30px] w-[30px] items-center justify-center rounded-full text-[30px] leading-none"
          style={{
            boxShadow: '0 0 0 4px rgba(255,255,255,.2)',
            overflow: 'hidden',
            transition: FLAG_TRANSITION,
            opacity: isOut ? 0 : 1,
            transform: isOut ? 'scale(.8)' : 'scale(1)',
          }}
        >
          {displayed.flag}
        </span>
        {/* MATCHED pill — static, never changes. */}
        <div
          className="absolute right-[19px] top-[13px] inline-flex items-center rounded-full px-[12px] py-[5px]"
          style={{ background: 'rgba(255,255,255,.72)' }}
        >
          <span className="text-[12px] font-bold leading-[18px] tracking-[0.5px] text-[#060F1E]">
            {MATCHED_LABEL}
          </span>
        </div>
      </div>

      {/* Body — chips swap per-person (under cover); the stat row is fixed. */}
      <div className="flex flex-col gap-[24px] px-[32px] pb-[32px] pt-[28px]">
        <div className="flex flex-col gap-[12px]">
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#6B7589]">
            {HOW_THEY_WORK_LABEL}
          </span>
          <div className="flex flex-row flex-wrap gap-[8px]" style={textStyle('translateY(8px)')}>
            {displayed.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full px-[13px] py-[7px] text-[13px] font-medium text-[#B8C2D1]"
                style={{ boxShadow: 'inset 0 0 0 1px #22314D' }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex w-[200px] flex-col gap-[3px]">
            <span className="text-[17px] font-extrabold leading-none text-white">{STAT_1_VALUE}</span>
            <span className="text-[12px] font-normal leading-none text-[#6B7589]">{STAT_1_LABEL}</span>
          </div>
          <div className="flex w-[200px] flex-col gap-[3px]">
            <span className="text-[17px] font-extrabold leading-none text-white">{STAT_2_VALUE}</span>
            <span className="text-[12px] font-normal leading-none text-[#6B7589]">{STAT_2_LABEL}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
