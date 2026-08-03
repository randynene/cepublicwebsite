'use client'

import { useId, useRef } from 'react'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/components/ui/_utils/cn'

import {
  ACCEPTED_FILE_TYPES,
  ASK_LABELS,
  GLYPH,
  WAVEFORM_HEIGHTS,
} from './content'
import { FOCUS_RING } from './primitives'
import type { AskAttachment, ComposerState } from '@/lib/ask/types'

// The composer, in its two shapes: the idle input row, and the voice panel that
// REPLACES it while recording (rather than sitting beside it, which is what keeps
// the column height stable).
//
// P1 caveat, deliberate: pressing Talk toggles the voice panel as pure UI state.
// No getUserMedia, no Web Speech, no audio captured - the waveform is the same CSS
// animation the design reference uses. Real dictation is P4.
//
// Sizes are arbitrary pixel values because `--spacing` is 0.5rem here; see the
// note in chat-thread.tsx.

/**
 * Microphone glyph, drawn from three primitives exactly as the reference does.
 * The icon sprite has no mic, and regenerating the shared sprite for one page is
 * not worth it.
 */
function MicGlyph() {
  return (
    <span aria-hidden="true" className="relative block h-[17px] w-[12px] shrink-0">
      <span className="absolute left-[2.5px] top-0 block h-[10px] w-[7px] rounded-full bg-brand-primary" />
      <span className="absolute left-0 top-[6px] block h-[6px] w-[12px] rounded-b-[9px] border-[1.5px] border-t-0 border-brand-primary" />
      <span className="absolute left-[5px] top-[13px] block h-[4px] w-[2px] bg-brand-primary" />
    </span>
  )
}

/**
 * Level meter. Bars hold their full box in layout and only scale on Y, so the
 * panel cannot change height as it animates. Under reduced motion they rest at
 * their minimum scale (globals.css) - still legible as a meter, simply still.
 */
function Waveform({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex w-full items-center justify-between gap-[4px]', className)}
    >
      {WAVEFORM_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="ask-wave-bar block min-w-[2px] flex-1 rounded-[2px] bg-brand-primary"
          style={{
            height: `${28 + height * 72}%`,
            opacity: 0.55 + height * 0.45,
            animationDelay: `${(-(index * 0.07)).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Attached files, as removable chips above the input.
 *
 * P1 selects and lists them; nothing is uploaded and nothing is read. Sending them
 * to Clara for analysis (a CV, a spec, a job description) is P3 - the point of
 * doing the picker now is that the composer has to have room for this without being
 * redesigned later.
 */
function AttachmentChips({
  attachments,
  onRemove,
}: {
  attachments: AskAttachment[]
  onRemove: (id: string) => void
}) {
  if (attachments.length === 0) return null
  return (
    <ul className="mb-[10px] flex flex-wrap gap-[6px]">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="inline-flex max-w-full items-center gap-[8px] rounded-pill border border-[#2c3f33] bg-[#0F1B12] py-[6px] pl-[11px] pr-[6px]"
        >
          <span className="truncate text-[12px] font-medium leading-none text-white">
            {attachment.name}
          </span>
          <span className="shrink-0 font-plex text-[10.5px] leading-none text-text-tertiary">
            {attachment.size}
          </span>
          <button
            type="button"
            aria-label={`${ASK_LABELS.removeFile} ${attachment.name}`}
            onClick={() => onRemove(attachment.id)}
            className={cn(
              'inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors duration-reveal ease-reveal hover:bg-surface-tertiary hover:text-white motion-reduce:transition-none',
              FOCUS_RING,
            )}
          >
            <Icon name="close" size="sm" className="size-[9px]" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function RoundButton({
  label,
  glyph,
  tone,
  onClick,
  className,
}: {
  label: string
  glyph: string
  tone: 'accent' | 'outline'
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-reveal ease-reveal motion-reduce:transition-none',
        tone === 'accent' && 'bg-brand-primary text-text-dark hover:bg-accent-alt',
        tone === 'outline' &&
          'border border-border-subtle text-text-tertiary hover:border-border-default hover:text-white',
        FOCUS_RING,
        className,
      )}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  )
}

function VoicePanel({
  recording,
  onStop,
}: {
  recording: NonNullable<ComposerState['recording']>
  onStop: () => void
}) {
  const compact = recording.compact === true
  const waveClass = compact ? 'mb-[12px] h-[32px]' : 'mb-[14px] h-[38px]'
  return (
    <div
      className={cn(
        'rounded-[18px] border border-brand-primary bg-[#0F1B12]',
        compact ? 'rounded-[16px] p-[14px]' : 'px-[16px] pb-[12px] pt-[16px]',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-[10px]',
          compact ? 'mb-[12px]' : 'mb-[14px]',
        )}
      >
        <div className="flex items-center gap-[11px]">
          <span
            aria-hidden="true"
            className={cn(
              'ask-pulse-dot block shrink-0 rounded-full bg-brand-primary',
              compact ? 'size-[7px]' : 'size-[8px]',
            )}
          />
          <span
            className={cn(
              'font-semibold leading-none text-brand-primary',
              compact ? 'text-[12px]' : 'text-[12.5px] tracking-[0.4px]',
            )}
          >
            {recording.label}
          </span>
          {compact ? null : (
            <span className="font-plex text-[12.5px] font-medium leading-none text-text-tertiary">
              {recording.elapsed}
            </span>
          )}
        </div>
        {compact ? (
          <span className="font-plex text-[12px] font-medium leading-none text-text-tertiary">
            {recording.elapsed}
          </span>
        ) : (
          <span className="text-[12px] font-medium leading-none text-text-tertiary">
            {recording.releaseHint}
          </span>
        )}
      </div>

      <Waveform className={waveClass} />

      <div className="flex items-center justify-between gap-[10px]">
        <span
          className={cn(
            'leading-none',
            compact
              ? 'text-[13px] text-text-secondary'
              : 'text-[13.5px] text-text-tertiary',
          )}
        >
          {compact ? ASK_LABELS.tapToStop : recording.footnote}
        </span>
        <div className="flex items-center gap-[10px]">
          {compact ? null : (
            <button
              type="button"
              onClick={onStop}
              className={cn(
                'rounded-pill border border-[#2c3f33] px-[14px] py-[8px] text-[12.5px] font-medium leading-none text-text-secondary transition-colors duration-reveal ease-reveal hover:border-brand-primary hover:text-white motion-reduce:transition-none',
                FOCUS_RING,
              )}
            >
              {ASK_LABELS.cancelRecording}
            </button>
          )}
          <RoundButton
            label={ASK_LABELS.stopRecording}
            glyph={GLYPH.stop}
            tone="accent"
            onClick={onStop}
            className="size-[34px] text-[13px]"
          />
        </div>
      </div>
    </div>
  )
}

export function Composer({
  composer,
  value,
  attachments,
  sending = false,
  onValueChange,
  onToggleRecording,
  onChip,
  onSend,
  onAddFiles,
  onRemoveFile,
}: {
  composer: ComposerState
  value: string
  attachments: AskAttachment[]
  /** True while a mock/Clara turn is streaming - send is a no-op. */
  sending?: boolean
  onValueChange: (value: string) => void
  onToggleRecording: () => void
  onChip: (value: string) => void
  onSend?: () => void
  onAddFiles: (files: FileList) => void
  onRemoveFile: (id: string) => void
}) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isRecording = composer.mode === 'recording'
  const canSend = Boolean(onSend) && value.trim().length > 0 && !sending

  return (
    <div className="shrink-0 pb-[24px] @max-[62rem]:px-[12px] @max-[62rem]:pb-[18px] @max-[62rem]:pt-[12px]">
      {composer.chips && !isRecording ? (
        <div className="mb-[12px] flex flex-wrap gap-[7px]">
          {composer.chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChip(chip)}
              disabled={sending}
              className={cn(
                'rounded-pill border border-border-subtle px-[12px] py-[8px] text-[12.5px] font-medium leading-none text-text-secondary transition-colors duration-reveal ease-reveal hover:border-brand-primary hover:text-white motion-reduce:transition-none disabled:opacity-50',
                FOCUS_RING,
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}

      {isRecording && composer.recording ? (
        <VoicePanel recording={composer.recording} onStop={onToggleRecording} />
      ) : (
        <div className="rounded-[18px] border border-[#2b3a56] bg-[#0E1A2E] px-[14px] pb-[10px] pt-[14px] @max-[62rem]:rounded-[16px] @max-[62rem]:px-[12px] @max-[62rem]:pb-[9px] @max-[62rem]:pt-[12px]">
          <AttachmentChips attachments={attachments} onRemove={onRemoveFile} />
          <label className="sr-only" htmlFor={inputId}>
            {composer.placeholder}
          </label>
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (canSend) onSend?.()
              }
            }}
            placeholder={composer.placeholder}
            disabled={sending}
            className="block w-full bg-transparent px-[4px] pb-[16px] pt-[4px] text-[15.5px] leading-none text-white outline-none placeholder:text-[#5f6b7d] disabled:opacity-70 @max-[62rem]:pb-[13px] @max-[62rem]:text-[14.5px]"
          />
          <div className="flex items-center justify-end gap-[10px] @max-[62rem]:gap-[9px]">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              aria-label={ASK_LABELS.attachFiles}
              className="sr-only"
              onChange={(event) => {
                const { files } = event.target
                if (files && files.length > 0) onAddFiles(files)
                // Reset so picking the same file twice in a row still fires change.
                event.target.value = ''
              }}
            />
            <RoundButton
              label={ASK_LABELS.attachFiles}
              glyph={GLYPH.attach}
              tone="outline"
              onClick={() => fileInputRef.current?.click()}
              className="size-[32px] text-[14px] @max-[62rem]:size-[30px] @max-[62rem]:text-[13px]"
            />
            <button
              type="button"
              onClick={onToggleRecording}
              className={cn(
                'inline-flex h-[32px] shrink-0 items-center gap-[8px] rounded-pill border border-[#2c3f33] bg-[#0F1B12] pl-[11px] pr-[13px] transition-colors duration-reveal ease-reveal hover:border-brand-primary motion-reduce:transition-none @max-[62rem]:h-[30px] @max-[62rem]:gap-[7px] @max-[62rem]:pl-[10px] @max-[62rem]:pr-[12px]',
                FOCUS_RING,
              )}
            >
              <MicGlyph />
              <span className="text-[12.5px] font-semibold leading-none text-brand-primary @max-[62rem]:text-[12px]">
                {ASK_LABELS.talk}
              </span>
            </button>
            <RoundButton
              label={ASK_LABELS.send}
              glyph={GLYPH.arrowUp}
              tone="accent"
              onClick={() => {
                if (canSend) onSend?.()
              }}
              className={cn(
                'size-[34px] text-[14px] @max-[62rem]:size-[32px] @max-[62rem]:text-[13px]',
                !canSend && 'opacity-50',
              )}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-[12px] px-[6px] pt-[10px] @max-[62rem]:px-[4px] @max-[62rem]:pt-[9px]">
        <span className="text-[11.5px] leading-none text-[#5f6b7d] @max-[62rem]:text-[11px]">
          {composer.hint}
        </span>
        {composer.status ? (
          <span className="whitespace-nowrap text-[11.5px] font-semibold leading-none text-text-tertiary">
            {composer.status}
          </span>
        ) : null}
      </div>
    </div>
  )
}
