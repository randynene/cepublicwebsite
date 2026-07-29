'use client'

import { useCallback, useMemo, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale-path'

import { AskCanvas, AskCanvasMobile } from './canvas'
import { AskHeader } from './ask-header'
import { ChatThread } from './chat-thread'
import { Composer } from './composer'
import { AskDebugSwitcher } from './debug-switcher'
import { ASK_DEBUG } from './content'
import { SplitHandle, useSplit } from './split-handle'
import { ASK_SCREENS } from '@/lib/ask/fixtures'
import type { AskAttachment, AskScreenId, ComposerState } from '@/lib/ask/types'

/** "184 KB" / "2.4 MB". Decimal units, to match what an OS file dialog shows. */
function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

// The /ask shell: chat on the left, canvas on the right, one draggable divider.
//
// ─── Chrome ──────────────────────────────────────────────────────────────────
// /ask carries its own header (logo, Back to site, Talk to a human) and no footer,
// so the surface takes the whole viewport. The root layout drops the sitewide nav
// and the body padding that would otherwise reserve space for it.
//
// ─── How the two layouts coexist ─────────────────────────────────────────────
// Both the split layout and the stacked phone layout are rendered, and CONTAINER
// queries (not viewport media queries) decide which is visible. That buys two
// things at once:
//
//   - a real phone gets the stacked layout, because the shell's container is the
//     viewport;
//   - the S9/S10 mobile frames can be previewed inside a 390px box on a desktop
//     viewport, because a container query measures that box.
//
// A viewport media query cannot do the second, and a JS width check would cost a
// hydration flash. The price is that the chat column appears twice in the DOM; the
// hidden copy is `display: none`, so assistive tech skips it.
//
// ─── What P1 wires and what it does not ──────────────────────────────────────
// Wired: state selection, the split divider, Talk to a human opening the booking
// canvas, chips loading the composer, Talk toggling the voice panel.
// Not wired: sending anything. No Clara call, no HubSpot, no microphone. Those are
// P2/P3/P4/P5.

/**
 * The surface claims the whole viewport: /ask has its own header inside the shell
 * and no footer under it. `dvh` rather than `vh` so a phone's collapsing address bar
 * does not push the docked composer off screen.
 */
const ASK_SURFACE_HEIGHT = 'h-[100dvh]'

/**
 * The voice panel needs a recording block. Screens designed in the recording state
 * bring their own; when the visitor presses Talk from an idle screen we synthesise
 * one, so the panel is reachable from every state.
 */
const TALK_RECORDING: NonNullable<ComposerState['recording']> = {
  label: 'Transcribing as you speak',
  elapsed: '0:00',
  releaseHint: 'Release Ctrl+D to send',
  footnote: 'Your words land in the brief, not just the chat',
}

export function AskShell({
  locale,
  initialScreenId,
  debug,
}: {
  locale: Locale
  initialScreenId: AskScreenId
  debug: boolean
}) {
  const [screenId, setScreenId] = useState<AskScreenId>(initialScreenId)
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<AskAttachment[]>([])
  /** null = follow the fixture; true/false = the visitor pressed Talk. */
  const [talking, setTalking] = useState<boolean | null>(null)

  const screen = ASK_SCREENS[screenId]

  const selectScreen = useCallback((id: AskScreenId) => {
    setScreenId(id)
    // A new state brings its own composer mode, so drop the local override.
    setTalking(null)
  }, [])

  const composer = useMemo<ComposerState>(() => {
    if (talking === null) return screen.composer
    if (!talking) return { ...screen.composer, mode: 'idle' }
    return {
      ...screen.composer,
      mode: 'recording',
      recording: screen.composer.recording ?? TALK_RECORDING,
    }
  }, [screen.composer, talking])

  const toggleRecording = useCallback(() => {
    setTalking((current) =>
      current === null ? screen.composer.mode !== 'recording' : !current,
    )
  }, [screen.composer.mode])

  // Booking from inside the page opens the canvas rather than navigating away.
  // Keeping the conversation alive through the booking is the point of the page.
  const openBooking = useCallback(() => setScreenId('S7'), [])

  const addFiles = useCallback((files: FileList) => {
    const picked = Array.from(files).map((file) => ({
      // crypto.randomUUID is available in every browser this site supports and
      // avoids index-based keys, which break when a chip in the middle is removed.
      id: crypto.randomUUID(),
      name: file.name,
      size: formatFileSize(file.size),
    }))
    setAttachments((current) => [...current, ...picked])
  }, [])

  const removeFile = useCallback((id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id))
  }, [])

  const { split, drag, commit } = useSplit()

  const chatColumn = (
    // `flex-1` matters in the stacked phone layout: without it the column only
    // takes its content height, so the thread stops being bottom-anchored and the
    // composer floats mid-screen instead of docking. It is inert in the desktop
    // grid, where the column is a stretched grid item.
    <div className="flex min-h-0 flex-1 flex-col px-[28px] @max-[62rem]:px-0">
      <ChatThread
        entries={screen.entries}
        onSchedule={openBooking}
        onSuggestion={setDraft}
      />
      <Composer
        composer={composer}
        value={draft}
        attachments={attachments}
        onValueChange={setDraft}
        onToggleRecording={toggleRecording}
        onChip={setDraft}
        onAddFiles={addFiles}
        onRemoveFile={removeFile}
      />
    </div>
  )

  const shell = (
    <div className="@container flex h-full min-h-0 flex-col bg-bg-primary">
      <AskHeader locale={locale} onSchedule={openBooking} />

      {/* Desktop: the split. */}
      <div
        className="relative hidden min-h-0 flex-1 @min-[62rem]:grid"
        style={{ gridTemplateColumns: `${split}fr ${100 - split}fr` }}
      >
        {chatColumn}
        <div className="flex min-h-0 flex-col overflow-hidden border-l border-[#1a2740] bg-surface-sweep-dark">
          <AskCanvas canvas={screen.canvas} onSchedule={openBooking} />
        </div>
        <SplitHandle split={split} onDrag={drag} onCommit={commit} />
      </div>

      {/* Phone: one card above the thread, composer docked. */}
      <div className="flex min-h-0 flex-1 flex-col @min-[62rem]:hidden">
        <div
          className={cn(
            'flex min-h-0 flex-col',
            // The compact proof/brief cards size themselves; the full booking and
            // confirmation panels are capped so the conversation stays on screen.
            screen.canvas.kind === 'proof' || screen.canvas.kind === 'brief'
              ? 'shrink-0'
              : 'max-h-[58%] shrink-0 overflow-hidden',
          )}
        >
          <AskCanvasMobile canvas={screen.canvas} onSchedule={openBooking} />
        </div>
        {chatColumn}
      </div>
    </div>
  )

  return (
    <>
      {screen.viewport === 'mobile' ? (
        // A designed phone frame. Full-bleed on an actual phone; a 390x844 device
        // frame from `lg` up so it is reviewable on a desktop.
        <div
          className={cn(
            'flex items-center justify-center bg-[#04080f] lg:p-[32px]',
            ASK_SURFACE_HEIGHT,
          )}
        >
          {/* 390x844 is the designed phone size, but the surface below the sitewide
              header is shorter than 844px on a laptop - so the frame takes the
              smaller of the two rather than pushing the page into a second
              scrollbar. */}
          <div className="h-full w-full overflow-hidden lg:h-[min(844px,100%)] lg:w-[390px] lg:rounded-[8px] lg:border lg:border-[#1a2740]">
            {shell}
          </div>
          <span className="sr-only">{ASK_DEBUG.mobileFrameNote}</span>
        </div>
      ) : (
        <div className={ASK_SURFACE_HEIGHT}>{shell}</div>
      )}

      {debug ? (
        <AskDebugSwitcher screenId={screenId} onSelect={selectScreen} />
      ) : null}
    </>
  )
}
