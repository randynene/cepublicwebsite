// Ask Clara P2 — local mock transport.
//
// Emits the real SSE event shape with realistic token timing. Zero API spend.
// P3 replaces `createMockTransport` with a fetch against `/api/ask/message`;
// `sendMessage` stays unchanged.

import type { Brief } from '../brief'
import { encodeSseEvent } from './client'
import {
  DEFAULT_MOCK_SCRIPT,
  matchScriptTurn,
  MOCK_FALLBACK_REPLY,
  MOCK_SCRIPTS,
  type MockScriptId,
} from './scripts'
import type { ClaraStreamEvent, ClaraTransport } from './types'

const encoder = new TextEncoder()

/** Gap between token chunks. Tunable; keep short enough that a demo still flows. */
const TOKEN_DELAY_MS = 28
/** Pause before a brief_update so the reply is mostly on screen first. */
const BRIEF_PAUSE_MS = 180
/** Pause between progressive brief versions in one turn. */
const BRIEF_STEP_MS = 320

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** Split a reply into word-ish chunks so the stream reads as typing, not a dump. */
function tokenise(reply: string): string[] {
  const parts = reply.match(/\s+|\S+/g)
  return parts ?? [reply]
}

function ensureBriefVersion(brief: Brief, version: number): Brief {
  return brief.version === version ? brief : { ...brief, version }
}

export interface MockTransportControls {
  transport: ClaraTransport
  getScriptId: () => MockScriptId
  setScriptId: (id: MockScriptId) => void
  reset: () => void
  getTurnIndex: () => number
}

/**
 * Stateful mock: remembers which script turn the session is on, so successive
 * `sendMessage` calls walk the conversation. Call `reset()` when the debug
 * picker switches scripts.
 */
export function createMockTransport(
  initialScriptId: MockScriptId = DEFAULT_MOCK_SCRIPT,
): MockTransportControls {
  let scriptId = initialScriptId
  let turnIndex = 0

  const transport: ClaraTransport = async (_request, signal) => {
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const enqueue = (event: ClaraStreamEvent) => {
          controller.enqueue(encoder.encode(encodeSseEvent(event)))
        }

        try {
          const script = MOCK_SCRIPTS[scriptId]
          // Sequential turns: the visitor's message text is not used to branch.
          // Clara will use it for real; here every send advances the script.
          const matched = matchScriptTurn(script, turnIndex)

          if (!matched) {
            await streamTokens(MOCK_FALLBACK_REPLY, enqueue, signal)
            enqueue({
              type: 'done',
              escalation_offered: false,
              booking_url: null,
            })
            controller.close()
            return
          }

          turnIndex = matched.nextIndex
          const { turn } = matched

          if (turn.errorAfterTokens) {
            await streamTokens(turn.errorAfterTokens, enqueue, signal)
            await sleep(BRIEF_PAUSE_MS, signal)
            enqueue({
              type: 'error',
              message:
                'Mock stream interrupted. The composer stays open - send again to continue.',
            })
            controller.close()
            return
          }

          await streamTokens(turn.reply, enqueue, signal)

          if (turn.briefs && turn.briefs.length > 0) {
            await sleep(BRIEF_PAUSE_MS, signal)
            for (let i = 0; i < turn.briefs.length; i += 1) {
              const brief = turn.briefs[i]
              const version = brief.version
              enqueue({
                type: 'brief_update',
                version,
                brief: ensureBriefVersion(brief, version),
              })
              if (i < turn.briefs.length - 1) {
                await sleep(BRIEF_STEP_MS, signal)
              }
            }
          }

          enqueue({
            type: 'done',
            escalation_offered: turn.escalationOffered === true,
            booking_url: null,
          })
          controller.close()
        } catch (error) {
          if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
            controller.error(error)
            return
          }
          enqueue({
            type: 'error',
            message:
              error instanceof Error ? error.message : 'Mock transport failed.',
          })
          controller.close()
        }
      },
    })
  }

  return {
    transport,
    getScriptId: () => scriptId,
    setScriptId: (id) => {
      scriptId = id
      turnIndex = 0
    },
    reset: () => {
      turnIndex = 0
    },
    getTurnIndex: () => turnIndex,
  }
}

async function streamTokens(
  reply: string,
  enqueue: (event: ClaraStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (const chunk of tokenise(reply)) {
    await sleep(TOKEN_DELAY_MS, signal)
    enqueue({ type: 'token', content: chunk })
  }
}

/** Placeholder workspace id for the mock. Never sent off-box in P2. */
export const MOCK_WORKSPACE_ID = 'mock-ask-clara-workspace'
