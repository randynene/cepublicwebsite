// Ask Clara — streamed chat client.
//
// One `sendMessage()` that opens a transport, parses the four SSE event types,
// and yields them. It does not know or care whether the bytes came from the
// local mock (P2) or from Clara via the proxy (P3). That seam is the whole point.

import type { Brief } from '../brief'
import type {
  ClaraChatRequest,
  ClaraStreamEvent,
  ClaraTransport,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Narrow a parsed JSON value to a Clara stream event. Unknown shapes are
 * dropped rather than thrown - a bad frame must not kill the rest of the stream.
 */
export function parseClaraEvent(value: unknown): ClaraStreamEvent | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null

  switch (value.type) {
    case 'token':
      return typeof value.content === 'string'
        ? { type: 'token', content: value.content }
        : null
    case 'brief_update':
      if (typeof value.version !== 'number' || !isRecord(value.brief)) return null
      return {
        type: 'brief_update',
        version: value.version,
        // The Brief shape is Clara's to satisfy. Runtime Zod lands with P3 when
        // real payloads arrive; for now we trust the typed mock / proxy.
        brief: value.brief as unknown as Brief,
      }
    case 'done':
      return {
        type: 'done',
        escalation_offered: value.escalation_offered === true,
        booking_url:
          typeof value.booking_url === 'string' || value.booking_url === null
            ? (value.booking_url as string | null)
            : null,
      }
    case 'error':
      return typeof value.message === 'string'
        ? { type: 'error', message: value.message }
        : null
    default:
      return null
  }
}

/** Encode one event as an SSE `data:` frame. Shared by the mock transport. */
export function encodeSseEvent(event: ClaraStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Parse a byte stream of SSE frames into typed events.
 *
 * Handles chunk boundaries that split mid-frame (buffers until a blank line)
 * and ignores comment / heartbeat lines Clara may send.
 */
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<ClaraStreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let separator = buffer.indexOf('\n\n')
      while (separator !== -1) {
        const rawFrame = buffer.slice(0, separator)
        buffer = buffer.slice(separator + 2)
        const event = eventFromSseFrame(rawFrame)
        if (event) yield event
        separator = buffer.indexOf('\n\n')
      }
    }

    // Flush a trailing frame that omitted the final blank line.
    if (buffer.trim().length > 0) {
      const event = eventFromSseFrame(buffer)
      if (event) yield event
    }
  } finally {
    reader.releaseLock()
  }
}

function eventFromSseFrame(frame: string): ClaraStreamEvent | null {
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  if (dataLines.length === 0) return null
  const payload = dataLines.join('\n')
  if (payload === '' || payload === '[DONE]') return null
  try {
    return parseClaraEvent(JSON.parse(payload) as unknown)
  } catch {
    return null
  }
}

/**
 * Open a chat turn against the given transport and yield parsed events.
 *
 * Clara holds the transcript: send `session_token` + the new message only.
 * Never re-send history.
 */
export async function* sendMessage(
  request: ClaraChatRequest,
  transport: ClaraTransport,
  signal?: AbortSignal,
): AsyncGenerator<ClaraStreamEvent> {
  const stream = await transport(request, signal)
  yield* parseSseStream(stream, signal)
}
