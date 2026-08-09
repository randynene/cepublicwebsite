'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'

import { cn } from '@/components/ui/_utils/cn'
import { withSanityImageParams } from '@/lib/sanity/image-params'
import type { HiwPerson } from './content'

// Hero engineer cards for How It Works — two cards flanking the centered
// headline (left and right of it). Each drifts a few px toward the cursor
// on hover and eases back on leave. Motion respects prefers-reduced-motion.
// Split into a client component so the rest of the template stays server-side.

const GLYPH_CHECK = '✓'

export function HeroCard({
  person,
  vetted,
  className,
}: {
  person: HiwPerson
  vetted: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useRef(false)
  const base = `rotate(${person.rotate}deg)`

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.current = mq.matches
    const handler = (e: MediaQueryListEvent) => {
      reduced.current = e.matches
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced.current || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const dx = (e.clientX - rect.left) / rect.width - 0.5
      const dy = (e.clientY - rect.top) / rect.height - 0.5
      ref.current.style.transform = `${base} translate(${dx * 9}px,${dy * 9 - 6}px)`
    },
    [base],
  )

  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = base
  }, [base])

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('relative aspect-[3/3.6] w-full overflow-hidden rounded-[24px]', className)}
      style={{
        transform: base,
        boxShadow: 'inset 0 0 0 10px #22314D, 0 24px 30px rgba(14,27,44,.14)',
        willChange: 'transform',
        transition: 'transform .28s cubic-bezier(.2,.8,.2,1)',
      }}
    >
      <Image
        src={withSanityImageParams(person.image, { width: 700 })}
        alt={person.imageAlt}
        fill
        sizes="(max-width: 1024px) 60vw, 300px"
        className="object-cover"
        priority
      />
      {/* Top scrim — name legibility */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,15,30,.55) 0%, rgba(6,15,30,0) 34%), linear-gradient(0deg, rgba(6,15,30,.98) 0%, rgba(6,15,30,.82) 20%, rgba(6,15,30,0) 58%)',
        }}
      />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-[16px]">
        <div>
          <div className="text-[19px] font-semibold leading-[24px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">
            {person.name}
          </div>
          <div className="mt-[2px] text-[12.5px] font-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">
            {person.role}
          </div>
        </div>
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-black/45 text-[14px] backdrop-blur-sm">
          {person.flag}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[9px] p-[16px]">
        <div className="flex items-center gap-[5px] self-start rounded-full bg-black/55 px-[10px] py-[6px] text-[11px] font-bold uppercase tracking-[0.6px] text-white backdrop-blur-sm">
          <span aria-hidden className="text-brand-primary">
            {GLYPH_CHECK}
          </span>
          <span>{vetted}</span>
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {person.tags.map((tag, i) => (
            <span
              key={tag}
              className={cn(
                'rounded-full px-[10px] py-[5px] text-[12px] font-bold',
                i === 0 ? 'bg-brand-primary text-[#060F1E]' : 'bg-black/55 text-white backdrop-blur-sm',
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
