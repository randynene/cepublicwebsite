// Ask Clara — the small repeated shapes of the canvas.
//
// Kept together because the brief cards, the proof panels and the booking summary
// all draw from the same handful: a mono micro-label, a solid or dashed chip, the
// strength meter, and the abstract profile marks.
//
// The profile marks matter more than they look: the design deliberately never
// shows a headshot for a hire that does not exist yet, so a geometric mark stands
// in for the person. Do not swap these for photos or avatars.

import { cn } from '@/components/ui/_utils/cn'

/**
 * Focus ring for the small controls on this page.
 *
 * The sitewide idiom is `ring-offset-2`, but this project sets `--spacing: 0.5rem`
 * so that resolves to a 16px offset - fine on a hero CTA, but on a 32px chat
 * control it would overlap whatever sits beside it. Everything on `/ask` uses this
 * 2px offset instead.
 */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[2px] focus-visible:ring-offset-bg-primary'

/**
 * Uppercase mono label. `size="sm"` is the field-level label inside a card;
 * `size="md"` is the panel eyebrow.
 */
export function MicroLabel({
  children,
  size = 'md',
  tone = 'muted',
  className,
}: {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'muted' | 'accent'
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-plex uppercase leading-none',
        size === 'sm' && 'text-[10px] font-medium tracking-[1.2px]',
        size === 'md' && 'text-[10.5px] font-medium tracking-[1.4px]',
        size === 'lg' && 'text-[10.5px] font-semibold tracking-[1.4px]',
        tone === 'muted' && 'text-text-tertiary',
        tone === 'accent' && 'text-brand-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A captured value: solid fill, light border, white text. */
export function Chip({
  children,
  size = 'md',
  className,
}: {
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border border-[#2c3f33] bg-surface-tertiary font-medium leading-none text-white',
        size === 'sm' && 'px-[9px] py-[6px] text-[11.5px]',
        size === 'md' && 'px-[12px] py-[8px] text-[12.5px]',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * A field Clara has not captured yet. Dashed, dimmed, and phrased as a question
 * so it reads as "still being asked" rather than as an error or a zero.
 */
export function DashedChip({
  children,
  size = 'md',
  className,
}: {
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border border-dashed border-[#2b3a56] font-medium leading-none text-[#5f6b7d]',
        size === 'sm' && 'px-[9px] py-[6px] text-[11.5px]',
        size === 'md' && 'px-[12px] py-[8px] text-[12.5px]',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** The same idea as DashedChip, in the shape of a field value rather than a pill. */
export function DashedValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-[9px] border border-dashed border-[#2b3a56] px-[11px] py-[5px] text-[13px] leading-[1.3] text-[#5f6b7d]">
      {children}
    </span>
  )
}

/** A captured field: mono label above, white value below. */
export function BriefField({
  label,
  value,
  pending,
}: {
  label: string
  value: string | null
  pending?: string
}) {
  return (
    <div>
      <MicroLabel size="sm" className="mb-[7px] block">
        {label}
      </MicroLabel>
      {value ? (
        <div className="text-[15px] font-semibold leading-[1.3] text-white">
          {value}
        </div>
      ) : (
        <DashedValue>{pending ?? ASK_PENDING_FALLBACK}</DashedValue>
      )}
    </div>
  )
}

/** Used when a field is unknown and the fixture gave no question to show. */
export const ASK_PENDING_FALLBACK = 'Clara will ask next'

export function StrengthMeter({
  label,
  strength,
  className,
}: {
  label: string
  strength: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(strength)))
  const percent = `${clamped}%`
  return (
    <div className={cn('w-[180px]', className)}>
      <div className="mb-[7px] flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase leading-none tracking-[0.6px] text-text-tertiary">
          {label}
        </span>
        <span className="text-[12px] font-semibold leading-none text-brand-primary">
          {percent}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-[5px] overflow-hidden rounded-pill bg-surface-tertiary"
      >
        <div
          className="h-full rounded-pill bg-brand-primary transition-[width] duration-reveal ease-reveal motion-reduce:transition-none"
          style={{ width: percent }}
        />
      </div>
    </div>
  )
}

const PROFILE_MARK_SIZES = {
  lg: {
    box: 76,
    radius: 18,
    head: 26,
    headTop: 18,
    shoulderWidth: 48,
    shoulderHeight: 34,
    shoulderTop: 50,
  },
  md: {
    box: 72,
    radius: 18,
    head: 24,
    headTop: 16,
    shoulderWidth: 46,
    shoulderHeight: 32,
    shoulderTop: 46,
  },
  sm: {
    box: 52,
    radius: 14,
    head: 18,
    headTop: 11,
    shoulderWidth: 34,
    shoulderHeight: 24,
    shoulderTop: 33,
  },
} as const

/**
 * Stand-in for a single hire. An abstract head-and-shoulders in lime, never a
 * photograph - there is no real person attached to a brief yet and the design is
 * explicit that we must not imply one.
 */
export function ProfileMark({
  size = 'lg',
  className,
}: {
  size?: keyof typeof PROFILE_MARK_SIZES
  className?: string
}) {
  const spec = PROFILE_MARK_SIZES[size]
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative shrink-0 overflow-hidden border border-[#2c3f33] bg-[#16223A]',
        className,
      )}
      style={{
        width: spec.box,
        height: spec.box,
        borderRadius: spec.radius,
      }}
    >
      <span
        className="absolute left-1/2 block rounded-full bg-brand-primary"
        style={{
          width: spec.head,
          height: spec.head,
          top: spec.headTop,
          marginLeft: -spec.head / 2,
        }}
      />
      <span
        className="absolute left-1/2 block bg-brand-primary opacity-85"
        style={{
          width: spec.shoulderWidth,
          height: spec.shoulderHeight,
          top: spec.shoulderTop,
          marginLeft: -spec.shoulderWidth / 2,
          borderRadius: `${spec.shoulderWidth / 2}px ${spec.shoulderWidth / 2}px 0 0`,
        }}
      />
    </div>
  )
}

/**
 * Stand-in for a group of hires: three overlapping discs with the middle one in
 * lime. Reads as "a squad" without inventing individual people.
 */
const GROUP_MARK_SIZES = {
  lg: {
    box: { width: 112, height: 64 },
    discs: [
      { left: 0, top: 14, size: 38, accent: false },
      { left: 26, top: 8, size: 44, accent: true },
      { left: 58, top: 14, size: 38, accent: false },
    ],
  },
  sm: {
    box: { width: 96, height: 52 },
    discs: [
      { left: 0, top: 10, size: 32, accent: false },
      { left: 22, top: 6, size: 38, accent: true },
      { left: 50, top: 10, size: 32, accent: false },
    ],
  },
} as const

export function GroupMark({
  size = 'lg',
  ringColor,
  className,
}: {
  size?: keyof typeof GROUP_MARK_SIZES
  /** Matches the panel behind the mark so the discs read as separated. */
  ringColor: string
  className?: string
}) {
  const { box, discs } = GROUP_MARK_SIZES[size]
  return (
    <div
      aria-hidden="true"
      className={cn('relative shrink-0', className)}
      style={{ width: box.width, height: box.height }}
    >
      {discs.map((disc) => (
        <span
          key={disc.left}
          className={cn(
            'absolute block rounded-full',
            disc.accent ? 'bg-brand-primary' : 'bg-surface-tertiary',
          )}
          style={{
            left: disc.left,
            top: disc.top,
            width: disc.size,
            height: disc.size,
            border: `2px solid ${ringColor}`,
          }}
        />
      ))}
    </div>
  )
}
