// Ask Clara — session state for the living brief.
//
// Pure reducer: messages, current brief, version, streaming status, error.
// Canvas shape is derived elsewhere from `brief.intent` via `resolveBriefShape`,
// and S6 is driven off `BRIEF_READY_STRENGTH`. Out-of-order `brief_update`
// versions are ignored (complete replace, never merge).

import { BRIEF_READY_STRENGTH, type Brief } from '../brief'
import { MOCK_WELCOME_TEXT } from '../clara/scripts'
import type { ChatEntry } from '../types'

export type AskStreamStatus = 'idle' | 'streaming' | 'error'

export interface AskSessionState {
  sessionToken: string
  entries: ChatEntry[]
  brief: Brief | null
  /** Highest accepted brief version. Stale updates below this are ignored. */
  briefVersion: number
  status: AskStreamStatus
  error: string | null
  /** Talk to a human opens the booking canvas without leaving the page. */
  bookingOpen: boolean
  /** Id of the Clara turn currently receiving tokens, if any. */
  streamingEntryId: string | null
}

export type AskSessionAction =
  | { type: 'reset'; sessionToken?: string }
  | { type: 'send'; message: string; visitorId: string; claraId: string }
  | { type: 'token'; content: string }
  | { type: 'brief_update'; version: number; brief: Brief }
  | {
      type: 'done'
      escalation_offered: boolean
      booking_url: string | null
    }
  | { type: 'error'; message: string }
  | { type: 'open_booking' }
  | { type: 'close_booking' }

const OFFER_TITLE = 'Book 30 minutes to review your brief'
const OFFER_BODY = 'Your brief comes with you - no forms, no repeating yourself.'
const OFFER_CTA = 'Talk to a human'
const READY_SUGGESTIONS = ['Add a second role', 'Change region', 'What does this cost?']

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createSessionToken(): string {
  return crypto.randomUUID()
}

export function createInitialSessionState(
  sessionToken: string = createSessionToken(),
): AskSessionState {
  return {
    sessionToken,
    entries: [
      {
        kind: 'clara',
        id: 'welcome',
        text: MOCK_WELCOME_TEXT,
      },
    ],
    brief: null,
    briefVersion: 0,
    status: 'idle',
    error: null,
    bookingOpen: false,
    streamingEntryId: null,
  }
}

/**
 * Diff two briefs into a short acknowledgement line under Clara's turn.
 * Empty/partial briefs still produce a note so the visitor sees something landed.
 */
export function briefUpdateNote(prev: Brief | null, next: Brief): string {
  if (!prev) {
    if (next.intent === 'single_hire') return 'Brief updated - role'
    if (next.intent === 'team_hire') return 'Brief updated - role mix'
    if (next.intent === 'product_build') return 'Brief updated - scope'
    return 'Brief updated'
  }

  const parts: string[] = []
  if (prev.intent !== next.intent) {
    if (next.intent === 'team_hire' && prev.intent === 'single_hire') {
      parts.push(`headcount ${(prev.headcount ?? 1)} → ${(next.headcount ?? 3)}`)
    } else {
      parts.push('intent')
    }
  } else if (prev.headcount !== next.headcount) {
    parts.push(`headcount ${(prev.headcount ?? '?')} → ${(next.headcount ?? '?')}`)
  }
  if (JSON.stringify(prev.roles) !== JSON.stringify(next.roles)) {
    parts.push('role mix')
  }
  if (JSON.stringify(prev.techStacks) !== JSON.stringify(next.techStacks)) {
    parts.push('stack')
  }
  if (JSON.stringify(prev.regions) !== JSON.stringify(next.regions)) {
    parts.push('region')
  }
  if (prev.timeline !== next.timeline && next.timeline) {
    parts.push('start')
  }
  if (JSON.stringify(prev.mustHaves) !== JSON.stringify(next.mustHaves)) {
    parts.push('scope')
  }
  if (
    JSON.stringify(prev.complianceFlags) !== JSON.stringify(next.complianceFlags)
  ) {
    parts.push('compliance')
  }
  if (JSON.stringify(prev.suggestedPod) !== JSON.stringify(next.suggestedPod)) {
    parts.push('suggested pod')
  }

  return parts.length > 0 ? `Brief updated - ${parts.join(', ')}` : 'Brief updated'
}

function stripOfferAndSuggestions(entries: ChatEntry[]): ChatEntry[] {
  return entries.filter(
    (entry) => entry.kind !== 'offer' && entry.kind !== 'suggestions',
  )
}

function withOfferAndSuggestions(entries: ChatEntry[]): ChatEntry[] {
  const base = stripOfferAndSuggestions(entries)
  return [
    ...base,
    {
      kind: 'offer',
      id: newId('offer'),
      title: OFFER_TITLE,
      body: OFFER_BODY,
      ctaLabel: OFFER_CTA,
    },
    {
      kind: 'suggestions',
      id: newId('suggestions'),
      items: READY_SUGGESTIONS,
    },
  ]
}

function hasOffer(entries: ChatEntry[]): boolean {
  return entries.some((entry) => entry.kind === 'offer')
}

export function askSessionReducer(
  state: AskSessionState,
  action: AskSessionAction,
): AskSessionState {
  switch (action.type) {
    case 'reset':
      return createInitialSessionState(action.sessionToken ?? createSessionToken())

    case 'send': {
      if (state.status === 'streaming') return state
      const withoutStale = stripOfferAndSuggestions(state.entries)
      return {
        ...state,
        status: 'streaming',
        error: null,
        streamingEntryId: action.claraId,
        entries: [
          ...withoutStale,
          { kind: 'visitor', id: action.visitorId, text: action.message },
          {
            kind: 'clara',
            id: action.claraId,
            text: '',
            streaming: true,
          },
        ],
      }
    }

    case 'token': {
      if (!state.streamingEntryId) return state
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.kind === 'clara' && entry.id === state.streamingEntryId
            ? { ...entry, text: `${entry.text}${action.content}` }
            : entry,
        ),
      }
    }

    case 'brief_update': {
      // Complete replace when version increases; ignore stale / out-of-order.
      if (action.version <= state.briefVersion) return state
      const nextBrief: Brief = {
        ...action.brief,
        version: action.version,
      }
      const note = briefUpdateNote(state.brief, nextBrief)
      const noteEntry: ChatEntry = {
        kind: 'brief-update',
        id: newId('brief-update'),
        text: note,
      }
      let entries = [...state.entries, noteEntry]
      if (
        nextBrief.strength >= BRIEF_READY_STRENGTH &&
        !hasOffer(entries) &&
        state.status !== 'streaming'
      ) {
        // Offer is normally attached on `done`; if a brief arrives after done
        // (should not happen), still surface it.
        entries = withOfferAndSuggestions(entries)
      }
      return {
        ...state,
        brief: nextBrief,
        briefVersion: action.version,
        entries,
      }
    }

    case 'done': {
      const entries = state.entries.map((entry) =>
        entry.kind === 'clara' && entry.id === state.streamingEntryId
          ? { ...entry, streaming: false }
          : entry,
      )
      const ready =
        action.escalation_offered ||
        (state.brief !== null && state.brief.strength >= BRIEF_READY_STRENGTH)
      return {
        ...state,
        status: 'idle',
        streamingEntryId: null,
        error: null,
        entries: ready && !hasOffer(entries) ? withOfferAndSuggestions(entries) : entries,
      }
    }

    case 'error': {
      const entries = state.entries.map((entry) => {
        if (entry.kind !== 'clara' || entry.id !== state.streamingEntryId) {
          return entry
        }
        const text =
          entry.text.trim().length > 0
            ? entry.text
            : 'Something went wrong on that turn.'
        return { ...entry, text, streaming: false }
      })
      return {
        ...state,
        status: 'error',
        streamingEntryId: null,
        error: action.message,
        entries,
      }
    }

    case 'open_booking':
      return { ...state, bookingOpen: true }

    case 'close_booking':
      return { ...state, bookingOpen: false }

    default:
      return state
  }
}

/** True when the canvas should use the S6 brief-ready treatment. */
export function isBriefReady(brief: Brief | null): boolean {
  return brief !== null && brief.strength >= BRIEF_READY_STRENGTH
}
