'use client'

import { useCallback, useMemo, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale-path'
import { ASK_SCREENS } from '@/lib/ask/fixtures'
import {
  DEFAULT_MOCK_SCRIPT,
  type MockScriptId,
} from '@/lib/ask/clara/scripts'
import type { AskAttachment, AskScreenId, ComposerState } from '@/lib/ask/types'

import { AskCanvas, AskCanvasMobile } from './canvas'
import { AskHeader } from './ask-header'
import { ChatThread } from './chat-thread'
import { Composer } from './composer'
import { AskDebugSwitcher } from './debug-switcher'
import { ASK_DEBUG, ASK_LIVE } from './content'
import { SplitHandle, useSplit } from './split-handle'
import { useAskSession } from './use-ask-session'

/** "184 KB" / "2.4 MB". Decimal units, to match what an OS file dialog shows. */
function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

// The /ask shell: chat on the left, canvas on the right, one draggable divider.
//
// P2: live session state (mock SSE) is the default render source. The P1 fixture
// switcher still freezes a designed frame when Jake picks one in ?askDebug=1.
// Components stay declarative - only the source of entries/canvas/composer changes.

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

type ViewMode =
  | { kind: 'live'; scriptId: MockScriptId }
  | { kind: 'fixture'; screenId: AskScreenId }

export function AskShell({
  locale,
  initialScreenId,
  initialScriptId,
  fixtureMode,
  debug,
}: {
  locale: Locale
  initialScreenId: AskScreenId
  initialScriptId: MockScriptId
  /** When true, boot frozen on `initialScreenId` (deep-linked ?askState=). */
  fixtureMode: boolean
  debug: boolean
}) {
  const [mode, setMode] = useState<ViewMode>(() =>
    fixtureMode
      ? { kind: 'fixture', screenId: initialScreenId }
      : { kind: 'live', scriptId: initialScriptId },
  )

  const {
    state: liveState,
    canvas: liveCanvas,
    composer: liveComposer,
    send,
    setScript,
    resetSession,
    openBooking: openLiveBooking,
    closeBooking: closeLiveBooking,
    isStreaming,
  } = useAskSession(initialScriptId)

  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<AskAttachment[]>([])
  /** null = follow the source; true/false = the visitor pressed Talk. */
  const [talking, setTalking] = useState<boolean | null>(null)

  const fixtureScreen =
    mode.kind === 'fixture' ? ASK_SCREENS[mode.screenId] : null

  const entries = fixtureScreen ? fixtureScreen.entries : liveState.entries
  const canvas = fixtureScreen ? fixtureScreen.canvas : liveCanvas
  const viewport = fixtureScreen ? fixtureScreen.viewport : 'desktop'
  const baseComposer = fixtureScreen ? fixtureScreen.composer : liveComposer

  const selectFixture = useCallback((id: AskScreenId) => {
    setMode({ kind: 'fixture', screenId: id })
    setTalking(null)
    setDraft('')
  }, [])

  const selectScript = useCallback(
    (id: MockScriptId) => {
      setMode({ kind: 'live', scriptId: id })
      setTalking(null)
      setDraft('')
      setAttachments([])
      setScript(id)
    },
    [setScript],
  )

  const resetLiveScript = useCallback(() => {
    setTalking(null)
    setDraft('')
    setAttachments([])
    resetSession()
    setMode((current) =>
      current.kind === 'live'
        ? current
        : { kind: 'live', scriptId: DEFAULT_MOCK_SCRIPT },
    )
  }, [resetSession])

  const composer = useMemo<ComposerState>(() => {
    if (talking === null) return baseComposer
    if (!talking) return { ...baseComposer, mode: 'idle' }
    return {
      ...baseComposer,
      mode: 'recording',
      recording: baseComposer.recording ?? TALK_RECORDING,
    }
  }, [baseComposer, talking])

  const toggleRecording = useCallback(() => {
    setTalking((current) =>
      current === null ? baseComposer.mode !== 'recording' : !current,
    )
  }, [baseComposer.mode])

  const openBooking = useCallback(() => {
    if (mode.kind === 'fixture') {
      setMode({ kind: 'fixture', screenId: 'S7' })
      return
    }
    openLiveBooking()
  }, [mode.kind, openLiveBooking])

  const closeBooking = useCallback(() => {
    if (mode.kind === 'live') closeLiveBooking()
  }, [mode.kind, closeLiveBooking])

  const sendMessage = useCallback(
    (value?: string) => {
      if (mode.kind !== 'live') return
      const text = (value ?? draft).trim()
      if (!text) return
      setDraft('')
      void send(text)
    },
    [draft, mode.kind, send],
  )

  const onChip = useCallback(
    (value: string) => {
      if (mode.kind === 'live') {
        sendMessage(value)
        return
      }
      setDraft(value)
    },
    [mode.kind, sendMessage],
  )

  const onSuggestion = useCallback(
    (value: string) => {
      if (mode.kind === 'live') {
        sendMessage(value)
        return
      }
      setDraft(value)
    },
    [mode.kind, sendMessage],
  )

  const addFiles = useCallback((files: FileList) => {
    const picked = Array.from(files).map((file) => ({
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

  const errorLine =
    mode.kind === 'live' && liveState.error
      ? `${ASK_LIVE.streamErrorPrefix}: ${liveState.error}`
      : null

  const chatColumn = (
    <div className="flex min-h-0 flex-1 flex-col px-[28px] @max-[62rem]:px-0">
      <ChatThread
        entries={entries}
        onSchedule={openBooking}
        onSuggestion={onSuggestion}
      />
      {errorLine ? (
        <p className="px-[4px] pb-[8px] text-[12px] leading-[1.4] text-[#F5A3A3]">
          {errorLine}
        </p>
      ) : null}
      <Composer
        composer={composer}
        value={draft}
        attachments={attachments}
        sending={mode.kind === 'live' && isStreaming}
        onValueChange={setDraft}
        onToggleRecording={toggleRecording}
        onChip={onChip}
        onSend={() => sendMessage()}
        onAddFiles={addFiles}
        onRemoveFile={removeFile}
      />
    </div>
  )

  const shell = (
    <div className="@container flex h-full min-h-0 flex-col bg-bg-primary">
      <AskHeader locale={locale} onSchedule={openBooking} />

      <div
        className="relative hidden min-h-0 flex-1 @min-[62rem]:grid"
        style={{ gridTemplateColumns: `${split}fr ${100 - split}fr` }}
      >
        {chatColumn}
        <div className="flex min-h-0 flex-col overflow-hidden border-l border-[#1a2740] bg-surface-sweep-dark">
          <AskCanvas
            canvas={canvas}
            onSchedule={openBooking}
            onBookingBack={closeBooking}
          />
        </div>
        <SplitHandle split={split} onDrag={drag} onCommit={commit} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col @min-[62rem]:hidden">
        <div
          className={cn(
            'flex min-h-0 flex-col',
            canvas.kind === 'proof' || canvas.kind === 'brief'
              ? 'shrink-0'
              : 'max-h-[58%] shrink-0 overflow-hidden',
          )}
        >
          <AskCanvasMobile
            canvas={canvas}
            onSchedule={openBooking}
            onBookingBack={closeBooking}
          />
        </div>
        {chatColumn}
      </div>
    </div>
  )

  return (
    <>
      {viewport === 'mobile' ? (
        <div
          className={cn(
            'flex items-center justify-center bg-[#04080f] lg:p-[32px]',
            ASK_SURFACE_HEIGHT,
          )}
        >
          <div className="h-full w-full overflow-hidden lg:h-[min(844px,100%)] lg:w-[390px] lg:rounded-[8px] lg:border lg:border-[#1a2740]">
            {shell}
          </div>
          <span className="sr-only">{ASK_DEBUG.mobileFrameNote}</span>
        </div>
      ) : (
        <div className={ASK_SURFACE_HEIGHT}>{shell}</div>
      )}

      {debug ? (
        <AskDebugSwitcher
          mode={mode}
          onSelectFixture={selectFixture}
          onSelectScript={selectScript}
          onResetScript={resetLiveScript}
        />
      ) : null}
    </>
  )
}
