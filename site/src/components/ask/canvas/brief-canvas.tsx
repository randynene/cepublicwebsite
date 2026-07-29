'use client'

import { cn } from '@/components/ui/_utils/cn'

import { ASK_LABELS, GLYPH } from '../content'
import {
  BriefField,
  Chip,
  DashedChip,
  DashedValue,
  GroupMark,
  MicroLabel,
  ProfileMark,
  StrengthMeter,
} from '../primitives'
import { BriefActions } from './brief-actions'
import { ProofStrip } from './proof-panel'
import { resolveBriefShape } from '@/lib/ask/brief'
import type { BriefCanvas as BriefCanvasData } from '@/lib/ask/types'

// The living brief: one canvas, three shapes.
//
//   single  - one profile card, fields filling in (S3)
//   team    - a grouped mark plus a role-mix board (S4)
//   product - a scope checklist and a suggested pod (S5)
//
// The shape comes from the brief's `intent`, never from which fixture is loaded,
// so a Clara turn that reshapes a single hire into a squad moves the canvas on its
// own - the S3 to S4 transition is exactly that.
//
// Two rules the design is emphatic about, and the code keeps:
//   1. Unknown fields render as dashed prompts, never as 0 or an error.
//   2. No headshots and no "matched engineer" language anywhere.
//
// Sizes are arbitrary pixel values because `--spacing` is 0.5rem here; see the
// note in chat-thread.tsx.

const CARD = 'rounded-[18px] border border-[#2c3f33] bg-section-bg-card'

/** Eyebrow, headline and strength meter above the card. */
function BriefHeader({ canvas }: { canvas: BriefCanvasData }) {
  const { display, brief } = canvas
  // Composed outside JSX: the UI_STRINGS gate (react/jsx-no-literals) rejects
  // string building inside a JSX expression container, so the assembled label
  // arrives as an identifier.
  const eyebrow = `${display.label} ${ASK_LABELS.liveSuffix}`
  return (
    <div className="flex items-end justify-between gap-[16px]">
      <div>
        <div className="mb-[9px] flex items-center gap-[9px]">
          <span
            aria-hidden="true"
            className="block size-[6px] rounded-full bg-brand-primary"
          />
          <MicroLabel size="lg" tone="accent">
            {eyebrow}
          </MicroLabel>
        </div>
        {display.headline ? (
          <h2 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.8px] text-white">
            {display.headline}
          </h2>
        ) : null}
      </div>
      <StrengthMeter
        label={ASK_LABELS.briefStrength}
        strength={brief.strength}
        className="shrink-0"
      />
    </div>
  )
}

function StackRow({
  label,
  stacks,
  prompt,
}: {
  label: string
  stacks: string[] | undefined
  prompt?: string
}) {
  if (!stacks?.length && !prompt) return null
  return (
    <div>
      <MicroLabel size="sm" className="mb-[10px] block">
        {label}
      </MicroLabel>
      <div className="flex flex-wrap gap-[7px]">
        {(stacks ?? []).map((stack) => (
          <Chip key={stack}>{stack}</Chip>
        ))}
        {prompt ? <DashedChip>{prompt}</DashedChip> : null}
      </div>
    </div>
  )
}

function BriefSingle({ canvas }: { canvas: BriefCanvasData }) {
  const { brief, display, prompts } = canvas
  return (
    <div className={cn(CARD, 'px-[26px] py-[24px]')}>
      <div className="mb-[22px] flex items-center gap-[20px]">
        <ProfileMark size="lg" />
        <div className="flex-1">
          <h3 className="mb-[10px] text-[24px] font-semibold leading-[1.15] tracking-[-0.7px] text-white">
            {display.title}
          </h3>
          <div className="flex flex-wrap items-center gap-[10px]">
            {display.seniorityBadge ? (
              <span className="rounded-pill bg-brand-primary px-[11px] py-[6px] text-[11.5px] font-bold leading-none text-text-dark">
                {display.seniorityBadge}
              </span>
            ) : null}
            {display.headcountLine ? (
              <span className="text-[13px] leading-none text-text-tertiary">
                {display.headcountLine}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-[20px]">
        <StackRow
          label={ASK_LABELS.techStack}
          stacks={brief.techStacks}
          prompt={prompts.stack}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-[24px] gap-y-[16px] border-t border-border-subtle pt-[20px]">
        <BriefField
          label={ASK_LABELS.regionOverlap}
          value={display.regionLine}
          pending={prompts.fields?.[ASK_LABELS.regionOverlap]}
        />
        <BriefField
          label={ASK_LABELS.teamContext}
          value={display.teamContextLine}
          pending={prompts.fields?.[ASK_LABELS.teamContext]}
        />
        <BriefField
          label={ASK_LABELS.engagement}
          value={display.engagementLine}
          pending={prompts.fields?.[ASK_LABELS.engagement]}
        />
        <BriefField
          label={ASK_LABELS.timeline}
          value={display.timelineLine}
          pending={prompts.fields?.[ASK_LABELS.timeline]}
        />
      </div>
    </div>
  )
}

function BriefTeam({ canvas }: { canvas: BriefCanvasData }) {
  const { brief, display, prompts, squadNote } = canvas
  const roles = brief.roles ?? []
  const mixLine = display.squadMix ? `· ${display.squadMix}` : null
  return (
    <>
      <div className={cn(CARD, 'flex items-center gap-[22px] px-[24px] py-[22px]')}>
        {/* Ring colour matches the canvas ground so the discs read as separate. */}
        <GroupMark ringColor="#0B1424" />
        <div className="flex-1">
          <div className="mb-[8px] flex flex-wrap items-baseline gap-[10px]">
            {display.squadCount ? (
              <span className="text-[34px] font-semibold leading-none tracking-[-1.4px] text-white">
                {display.squadCount}
              </span>
            ) : null}
            <span className="text-[17px] font-semibold leading-none tracking-[-0.4px] text-white">
              {ASK_LABELS.engineers}
            </span>
            {mixLine ? (
              <span className="text-[14px] leading-none text-text-tertiary">
                {mixLine}
              </span>
            ) : null}
          </div>
          {squadNote ? (
            <p className="text-[13.5px] leading-[1.4] text-text-tertiary">
              {squadNote}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[11px]">
        {roles.map((role) => {
          const countBadge = `${GLYPH.multiply}${role.count}`
          return (
          <div key={role.title} className={cn(CARD, 'rounded-[14px] p-[16px]')}>
            <div className="mb-[11px] flex items-center justify-between gap-[8px]">
              <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.8px] text-brand-primary">
                {role.title}
              </span>
              <span className="rounded-[5px] bg-brand-primary px-[7px] py-[4px] text-[11px] font-bold leading-none text-text-dark">
                {countBadge}
              </span>
            </div>
            {role.seniority ? (
              <div className="mb-[11px] text-[15px] font-semibold leading-[1.25] text-white">
                {role.seniority}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-[6px]">
              {(role.stacks ?? []).map((stack) => (
                <Chip
                  key={stack}
                  size="sm"
                  className="border-transparent text-text-secondary"
                >
                  {stack}
                </Chip>
              ))}
            </div>
          </div>
          )
        })}

        {prompts.roleSlot ? (
          <div className="flex flex-col rounded-[14px] border border-dashed border-[#2b3a56] p-[16px]">
            <div className="mb-[11px] text-[11px] font-semibold uppercase leading-none tracking-[0.8px] text-[#5f6b7d]">
              {prompts.roleSlot.title}
            </div>
            <p className="text-[13px] leading-[1.4] text-[#5f6b7d]">
              {prompts.roleSlot.body}
            </p>
            <span className="mt-auto font-plex text-[10px] font-medium leading-none tracking-[0.6px] text-[#3f4a5c]">
              {prompts.roleSlot.note}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-[20px] rounded-[14px] border border-border-subtle bg-section-bg-card px-[20px] py-[18px]">
        <div>
          <MicroLabel size="sm" className="mb-[9px] block">
            {ASK_LABELS.sharedStack}
          </MicroLabel>
          <div className="flex flex-wrap gap-[6px]">
            {(brief.techStacks ?? []).map((stack) => (
              <Chip key={stack} className="px-[11px] py-[7px] text-[12px]">
                {stack}
              </Chip>
            ))}
          </div>
        </div>
        <BriefField label={ASK_LABELS.regions} value={display.regionName} />
        <BriefField label={ASK_LABELS.start} value={display.timelineLine} />
      </div>
    </>
  )
}

function BriefProduct({ canvas }: { canvas: BriefCanvasData }) {
  const { brief, display, prompts } = canvas
  return (
    <>
      <div className={cn(CARD, 'rounded-[16px] px-[22px] py-[20px]')}>
        <MicroLabel size="sm" className="mb-[12px] block">
          {ASK_LABELS.mustHaves}
        </MicroLabel>
        <div className="grid grid-cols-2 gap-[10px]">
          {(brief.mustHaves ?? []).map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-[10px] rounded-[10px] bg-[#16223A] px-[13px] py-[11px]"
            >
              <span
                aria-hidden="true"
                className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold leading-none text-text-dark"
              >
                {GLYPH.check}
              </span>
              <span className="text-[13.5px] font-medium leading-[1.3] text-white">
                {item.label}
              </span>
            </div>
          ))}
          {prompts.mustHave ? (
            <div className="flex items-center gap-[10px] rounded-[10px] border border-dashed border-[#2b3a56] px-[13px] py-[11px]">
              <span
                aria-hidden="true"
                className="block size-[16px] shrink-0 rounded-full border border-dashed border-[#2b3a56]"
              />
              <span className="text-[13.5px] font-medium leading-[1.3] text-[#5f6b7d]">
                {prompts.mustHave}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[11px]">
        <div className="rounded-[14px] border border-border-subtle bg-section-bg-card px-[18px] py-[16px]">
          <MicroLabel size="sm" className="mb-[11px] block">
            {ASK_LABELS.complianceFlags}
          </MicroLabel>
          <div className="flex flex-wrap gap-[6px]">
            {(brief.complianceFlags ?? []).map((flag) => (
              <Chip key={flag} className="px-[11px] py-[7px] text-[12px]">
                {flag}
              </Chip>
            ))}
            {prompts.compliance ? (
              <DashedChip className="px-[11px] py-[7px] text-[12px]">
                {prompts.compliance}
              </DashedChip>
            ) : null}
          </div>
        </div>
        <div className="rounded-[14px] border border-border-subtle bg-section-bg-card px-[18px] py-[16px]">
          <MicroLabel size="sm" className="mb-[11px] block">
            {ASK_LABELS.suggestedStack}
          </MicroLabel>
          <div className="flex flex-wrap gap-[6px]">
            {(brief.techStacks ?? []).map((stack) => (
              <Chip key={stack} className="px-[11px] py-[7px] text-[12px]">
                {stack}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {brief.suggestedPod?.length ? (
        <div className="rounded-[16px] border border-[#2c3f33] bg-[#0F1B12] px-[20px] py-[18px]">
          <div className="mb-[14px] flex items-center justify-between gap-[12px]">
            <MicroLabel size="sm" tone="accent">
              {ASK_LABELS.suggestedPod}
            </MicroLabel>
            {/* Always labelled as a suggestion: Clara proposes a shape, a human
                confirms it. */}
            <span className="text-[12px] leading-none text-text-tertiary">
              {ASK_LABELS.suggestedPodNote}
            </span>
          </div>
          <div className="flex items-center gap-[18px]">
            <GroupMark size="sm" ringColor="#0F1B12" />
            <div className="grid flex-1 grid-cols-3 gap-[14px]">
              {brief.suggestedPod.map((slot) => {
                const slotLabel = `${slot.count} ${GLYPH.multiply} ${slot.role}`
                return (
                <div key={slot.role}>
                  <div className="mb-[5px] text-[15px] font-semibold leading-[1.2] text-white">
                    {slotLabel}
                  </div>
                  {slot.note ? (
                    <div className="text-[12px] leading-[1.3] text-text-tertiary">
                      {slot.note}
                    </div>
                  ) : null}
                </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-auto grid grid-cols-3 gap-[20px] border-t border-[#1a2740] pt-[16px]">
        <BriefField
          label={ASK_LABELS.targetLiveDate}
          value={display.timelineLine}
          pending={prompts.fields?.[ASK_LABELS.targetLiveDate]}
        />
        <BriefField
          label={ASK_LABELS.engagement}
          value={display.engagementLine}
        />
        <BriefField label={ASK_LABELS.region} value={display.regionName} />
      </div>
    </>
  )
}

/** Proof-strip height, which the design tunes per brief shape. */
const STRIP_HEIGHT = {
  single: 190,
  team: 170,
  product: 150,
  pending: 190,
} as const

export function BriefCanvas({
  canvas,
  onSchedule,
}: {
  canvas: BriefCanvasData
  onSchedule: () => void
}) {
  const shape = resolveBriefShape(canvas.brief)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The brief is the thing that grows. Every turn can add a role, a
          compliance flag, a must-have or a whole new section, so this region owns
          its own scrollbar and keeps its scrolling to itself (`overscroll-contain`)
          rather than handing overflow to the page. The action bar and the proof
          band below are pinned outside it. */}
      <div
        className={cn(
          'ask-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-[32px] py-[26px] @max-[62rem]:px-[16px] @max-[62rem]:py-[16px]',
          shape === 'team' && 'gap-[18px]',
          shape === 'product' && 'gap-[16px]',
          shape !== 'team' && shape !== 'product' && 'gap-[20px]',
        )}
      >
        <BriefHeader canvas={canvas} />

        {shape === 'single' ? <BriefSingle canvas={canvas} /> : null}
        {shape === 'team' ? <BriefTeam canvas={canvas} /> : null}
        {shape === 'product' ? <BriefProduct canvas={canvas} /> : null}
        {shape === 'pending' ? (
          <div className={cn(CARD, 'px-[26px] py-[24px]')}>
            <DashedValue>{ASK_LABELS.awaitingSignal}</DashedValue>
          </div>
        ) : null}

        {canvas.disclaimer ? (
          <p className="mt-auto text-[12.5px] leading-[1.5] text-[#5f6b7d]">
            {canvas.disclaimer}
          </p>
        ) : null}
      </div>

      <BriefActions brief={canvas.brief} onSchedule={onSchedule} />

      {canvas.strip ? (
        <ProofStrip proof={canvas.strip} height={STRIP_HEIGHT[shape]} />
      ) : null}
    </div>
  )
}
