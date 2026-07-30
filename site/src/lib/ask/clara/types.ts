// Ask Clara — the wire types for the Clara chat stream.
//
// These match the contract verified against Clara's source
// (docs/design/lead-conversion/ASK_CLARA_WIRING_PLAN.md). P2's mock emits the
// same events the real API will; P3 swaps only the transport that yields bytes.

import type { Brief } from '../brief'

/** Request body for `POST /api/chat`. No auth header; no secret. */
export interface ClaraChatRequest {
  workspace_id: string
  session_token: string
  message: string
  message_id: string
  stream: true
}

/**
 * SSE events Clara emits (and that our mock mirrors).
 *
 * `brief_update` carries the COMPLETE brief, not a patch. The client replaces
 * wholesale when `version` increases and ignores stale or out-of-order versions.
 */
export type ClaraStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'brief_update'; version: number; brief: Brief }
  | {
      type: 'done'
      escalation_offered: boolean
      booking_url: string | null
    }
  | { type: 'error'; message: string }

/**
 * Opens a stream and returns raw SSE bytes. P2 supplies a mock; P3 supplies a
 * fetch against `/api/ask/message`. `sendMessage` does not care which.
 */
export type ClaraTransport = (
  request: ClaraChatRequest,
  signal?: AbortSignal,
) => Promise<ReadableStream<Uint8Array>>
