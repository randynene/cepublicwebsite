'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import {
  askSessionReducer,
  createInitialSessionState,
  createSessionToken,
} from '@/lib/ask/brief/reducer'
import { deriveLiveCanvas, deriveLiveComposer } from '@/lib/ask/brief/derive-view'
import { sendMessage } from '@/lib/ask/clara/client'
import {
  createMockTransport,
  MOCK_WORKSPACE_ID,
} from '@/lib/ask/clara/mock-transport'
import {
  DEFAULT_MOCK_SCRIPT,
  MOCK_SCRIPTS,
  type MockScriptId,
} from '@/lib/ask/clara/scripts'

// Owns the live /ask session: mock transport in, declarative render props out.
// Components never see the stream - they keep taking entries / canvas / composer.

export function useAskSession(initialScriptId: MockScriptId = DEFAULT_MOCK_SCRIPT) {
  const [state, dispatch] = useReducer(
    askSessionReducer,
    undefined,
    createInitialSessionState,
  )
  const [scriptId, setScriptIdState] = useState<MockScriptId>(initialScriptId)

  const mockRef = useRef(createMockTransport(initialScriptId))
  const abortRef = useRef<AbortController | null>(null)
  const sessionTokenRef = useRef(state.sessionToken)
  const statusRef = useRef(state.status)

  useEffect(() => {
    sessionTokenRef.current = state.sessionToken
    statusRef.current = state.status
  }, [state.sessionToken, state.status])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const resetSession = useCallback((nextScriptId?: MockScriptId) => {
    abortRef.current?.abort()
    abortRef.current = null
    if (nextScriptId) {
      setScriptIdState(nextScriptId)
      mockRef.current.setScriptId(nextScriptId)
    } else {
      mockRef.current.reset()
    }
    const token = createSessionToken()
    sessionTokenRef.current = token
    statusRef.current = 'idle'
    dispatch({ type: 'reset', sessionToken: token })
  }, [])

  const setScript = useCallback(
    (nextScriptId: MockScriptId) => {
      resetSession(nextScriptId)
    },
    [resetSession],
  )

  const send = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message) return
    if (statusRef.current === 'streaming') return

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    const visitorId = `visitor-${crypto.randomUUID()}`
    const claraId = `clara-${crypto.randomUUID()}`
    dispatch({ type: 'send', message, visitorId, claraId })
    statusRef.current = 'streaming'

    try {
      const request = {
        workspace_id: MOCK_WORKSPACE_ID,
        session_token: sessionTokenRef.current,
        message,
        message_id: crypto.randomUUID(),
        stream: true as const,
      }

      for await (const event of sendMessage(
        request,
        mockRef.current.transport,
        abort.signal,
      )) {
        if (abort.signal.aborted) return
        switch (event.type) {
          case 'token':
            dispatch({ type: 'token', content: event.content })
            break
          case 'brief_update':
            dispatch({
              type: 'brief_update',
              version: event.version,
              brief: event.brief,
            })
            break
          case 'done':
            dispatch({
              type: 'done',
              escalation_offered: event.escalation_offered,
              booking_url: event.booking_url,
            })
            statusRef.current = 'idle'
            break
          case 'error':
            dispatch({ type: 'error', message: event.message })
            statusRef.current = 'error'
            break
        }
      }
    } catch (error) {
      if (abort.signal.aborted) return
      statusRef.current = 'error'
      dispatch({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Try sending again.',
      })
    }
  }, [])

  const openBooking = useCallback(() => {
    dispatch({ type: 'open_booking' })
  }, [])

  const closeBooking = useCallback(() => {
    dispatch({ type: 'close_booking' })
  }, [])

  const script = MOCK_SCRIPTS[scriptId]
  const canvas = useMemo(() => deriveLiveCanvas(state), [state])
  const composer = useMemo(
    () => deriveLiveComposer(state, script.chips),
    [state, script.chips],
  )

  return {
    state,
    canvas,
    composer,
    scriptId,
    send,
    resetSession,
    setScript,
    openBooking,
    closeBooking,
    isStreaming: state.status === 'streaming',
  }
}
