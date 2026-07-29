import { ASK_LABELS, GLYPH } from '../content'
import { Chip, DashedChip, MicroLabel, ProfileMark } from '../primitives'
import type { BriefCanvas } from '@/lib/ask/types'

// S10 - the brief on a phone. Pinned above the thread, condensed to the four
// things worth carrying at that width: who, the shape of the engagement, the stack
// so far, and how complete the brief is.
//
// It REPLACES the proof card rather than stacking under it. There is room for one
// card above the conversation, and once a brief exists the brief is the more useful
// of the two.

export function BriefCardMobile({ canvas }: { canvas: BriefCanvas }) {
  const { brief, display, prompts } = canvas
  const strength = Math.max(0, Math.min(100, Math.round(brief.strength)))
  const percent = `${strength}%`
  const expandLabel = `${ASK_LABELS.expand} ${GLYPH.chevronUp}`

  return (
    <div className="mx-[12px] mt-[12px] shrink-0 rounded-[16px] border border-[#2c3f33] bg-section-bg-card p-[16px]">
      <div className="mb-[14px] flex items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <span
            aria-hidden="true"
            className="block size-[6px] rounded-full bg-brand-primary"
          />
          <MicroLabel tone="accent" className="text-[10px] tracking-[1.3px]">
            {display.label}
          </MicroLabel>
        </div>
        {/* Expanding to the full brief is a P2 interaction. In P1 this is the
            affordance the design shows, not yet a control. */}
        <span className="whitespace-nowrap text-[11.5px] font-medium leading-none text-text-tertiary">
          {expandLabel}
        </span>
      </div>

      <div className="mb-[14px] flex items-center gap-[14px]">
        <ProfileMark size="sm" />
        <div>
          <h2 className="mb-[5px] text-[17px] font-semibold leading-[1.2] tracking-[-0.4px] text-white">
            {display.title}
          </h2>
          {display.summaryLine ? (
            <p className="text-[12.5px] leading-none text-text-tertiary">
              {display.summaryLine}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mb-[14px] flex flex-wrap gap-[6px]">
        {(brief.techStacks ?? []).map((stack) => (
          <Chip key={stack} size="sm" className="px-[10px] py-[7px]">
            {stack}
          </Chip>
        ))}
        {prompts.stack ? (
          <DashedChip size="sm" className="px-[10px] py-[7px]">
            {prompts.stack}
          </DashedChip>
        ) : null}
      </div>

      <div className="flex items-center gap-[10px]">
        <div
          role="progressbar"
          aria-label={ASK_LABELS.briefStrength}
          aria-valuenow={strength}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-[5px] flex-1 overflow-hidden rounded-pill bg-surface-tertiary"
        >
          <div
            className="h-full rounded-pill bg-brand-primary transition-[width] duration-reveal ease-reveal motion-reduce:transition-none"
            style={{ width: percent }}
          />
        </div>
        <span className="text-[11px] font-medium leading-none text-text-tertiary">
          {percent}
        </span>
      </div>
    </div>
  )
}
