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
import type { AskScreenId, ComposerState } from '@/lib/ask/types'

// The /ask shell: chat on the left, canvas on the right, one draggable divider.
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
// Wired: state selection, the split divider, Schedule a Call opening the booking
// canvas, chips loading the composer, Talk toggling the voice panel.
// Not wired: sending anything. No Clara call, no HubSpot, no microphone. Those are
// P2/P3/P4/P5.

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

  // Anywhere Schedule a Call is pressed on this page, booking opens in the canvas
  // instead of navigating to /book-a-call. Keeping the conversation alive through
  // the booking is the point of the page.
  const openBooking = useCallback(() => setScreenId('S7'), [])

  const { split, drag, commit } = useSplit()

  const chatColumn = (
    <div className="flex min-h-0 flex-col px-[28px] @max-[62rem]:px-0">
      <ChatThread
        entries={screen.entries}
        onSchedule={openBooking}
        onSuggestion={setDraft}
      />
      <Composer
        composer={composer}
        value={draft}
        onValueChange={setDraft}
        onToggleRecording={toggleRecording}
        onChip={setDraft}
      />
    </div>
  )

  const shell = (
    <div className="@container flex h-full min-h-0 flex-col bg-bg-primary">
      <AskHeader header={screen.header} locale={locale} onSchedule={openBooking} />

      {/* Desktop: the split. */}
      <div
        className="relative hidden min-h-0 flex-1 @min-[62rem]:grid"
        style={{ gridTemplateColumns: `${split}fr ${100 - split}fr` }}
      >
        {chatColumn}
        <div className="flex min-h-0 flex-col border-l border-[#1a2740] bg-surface-sweep-dark">
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
        <div className="flex h-[100dvh] items-center justify-center bg-[#04080f] lg:p-[32px]">
          <div className="h-full w-full overflow-hidden lg:h-[844px] lg:w-[390px] lg:rounded-[8px] lg:border lg:border-[#1a2740]">
            {shell}
          </div>
          <span className="sr-only">{ASK_DEBUG.mobileFrameNote}</span>
        </div>
      ) : (
        <div className="h-[100dvh]">{shell}</div>
      )}

      {debug ? (
        <AskDebugSwitcher screenId={screenId} onSelect={selectScreen} />
      ) : null}
    </>
  )
}
