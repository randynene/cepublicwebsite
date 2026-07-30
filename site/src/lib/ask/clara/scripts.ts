// Ask Clara P2 — scripted conversations for the mock transport.
//
// Each script is a sequence of turns. The mock matches the visitor's message to
// the next turn (or by keyword), then emits real SSE events: tokens, a complete
// brief_update, and done. End-state briefs reuse the P1 fixtures so the reducer
// is exercised against the same shapes the canvas was designed for.

import type { Brief } from '../brief'
import {
  PRODUCT_BRIEF,
  READY_BRIEF,
  SINGLE_HIRE_BRIEF,
  TEAM_BRIEF,
} from '../fixtures'

export type MockScriptId = 'single-to-squad' | 'product-mvp' | 'error-midstream'

export interface MockScriptTurn {
  /**
   * Substring match against the visitor message (case-insensitive). `'*'` matches
   * any message when this turn is next in sequence.
   */
  match: string | '*'
  /** Full Clara reply; the transport streams this as token events. */
  reply: string
  /**
   * Complete briefs to emit as `brief_update` events during / after the reply.
   * Multiple entries simulate fields settling in over the turn.
   */
  briefs?: Brief[]
  /** When true, `done` carries `escalation_offered: true` (S6 soft offer). */
  escalationOffered?: boolean
  /**
   * If set, the transport streams a few tokens then emits `error` instead of
   * finishing the reply. Used by the error-midstream script.
   */
  errorAfterTokens?: string
}

export interface MockScript {
  id: MockScriptId
  label: string
  description: string
  /** Seed chips shown above the composer on a fresh session. */
  chips: string[]
  turns: MockScriptTurn[]
}

// Progressive single-hire briefs. Each is a COMPLETE brief (not a patch); the
// canvas settles as versions climb. End state = SINGLE_HIRE_BRIEF from fixtures.

const PARTIAL_ROLE: Brief = {
  version: 1,
  intent: 'single_hire',
  headcount: 1,
  roles: [{ title: 'Senior React Engineer', count: 1 }],
  strength: 28,
}

const PARTIAL_STACK: Brief = {
  version: 2,
  intent: 'single_hire',
  headcount: 1,
  roles: [
    { title: 'Senior React Engineer', seniority: 'Senior · 5-8 yrs', count: 1 },
  ],
  techStacks: ['React', 'TypeScript'],
  strength: 42,
}

/** Team reshape below the S6 threshold so the canvas stays on the brief card. */
const TEAM_BUILDING: Brief = {
  ...TEAM_BRIEF,
  version: 3,
  strength: 62,
  timeline: undefined,
}

/** Team brief at fixture strength - crosses BRIEF_READY_STRENGTH (70). */
const TEAM_READY: Brief = {
  ...TEAM_BRIEF,
  version: 4,
  strength: 74,
}

const PRODUCT_PARTIAL: Brief = {
  version: 1,
  intent: 'product_build',
  strength: 22,
  goals: 'Clinic booking MVP',
}

const PRODUCT_SCOPE: Brief = {
  version: 2,
  intent: 'product_build',
  techStacks: ['Next.js', 'Node', 'Postgres'],
  mustHaves: [
    { label: 'Patient booking + reschedule', confirmed: true },
    { label: 'Clinic availability management', confirmed: true },
  ],
  strength: 48,
}

export const MOCK_SCRIPTS: Record<MockScriptId, MockScript> = {
  'single-to-squad': {
    id: 'single-to-squad',
    label: 'Single → squad → ready',
    description:
      'Fills a single-hire brief, reshapes to a 3-person squad, then reaches brief-ready.',
    chips: [
      'Hire one senior React engineer',
      'Build a squad of 3',
      'Not sure - help me scope',
    ],
    turns: [
      {
        match: 'hire one',
        reply:
          "Started your brief on the right. Is TypeScript part of the stack, and would Next.js experience matter?",
        briefs: [PARTIAL_ROLE],
      },
      {
        match: '*',
        reply:
          'Added. The Philippines gives you around four hours of London overlap, which suits a live standup. When would you want them starting?',
        briefs: [PARTIAL_STACK, SINGLE_HIRE_BRIEF],
      },
      {
        match: 'squad',
        reply:
          'Reshaped your brief into a 3-person squad. Node and Postgres on the backend side - does anyone need to own infrastructure, or does your team keep that?',
        briefs: [TEAM_BUILDING],
      },
      {
        match: '*',
        reply:
          "Noted. That's everything I need for a matching conversation - a CloudEmployee lead will bring real candidate options and walk through cost.",
        briefs: [TEAM_READY],
        escalationOffered: true,
      },
    ],
  },

  'product-mvp': {
    id: 'product-mvp',
    label: 'Product / MVP',
    description: 'Scopes a clinic booking MVP into a product brief with a suggested pod.',
    chips: [
      'Not sure - help me scope',
      'I need an MVP built',
      'Hire one senior React engineer',
    ],
    turns: [
      {
        match: '*',
        reply:
          "Then let's brief the product, not the roles - I'll suggest the team shape at the end. What does version one absolutely have to do on day one?",
        briefs: [PRODUCT_PARTIAL],
      },
      {
        match: '*',
        reply:
          "Captured. Data audit usually means UK hosting and an audit trail - I've flagged both. Is there a date this has to be live by?",
        briefs: [PRODUCT_SCOPE, PRODUCT_BRIEF],
      },
      {
        match: '*',
        reply:
          "That's a solid product brief. A CloudEmployee lead should walk the pod shape and timeline through with you.",
        briefs: [{ ...PRODUCT_BRIEF, version: 4, strength: 78 }],
        escalationOffered: true,
      },
    ],
  },

  'error-midstream': {
    id: 'error-midstream',
    label: 'Error mid-stream',
    description:
      'Streams a few tokens then errors. Composer stays usable so you can retry.',
    chips: ['Trigger a stream error', 'Hire one senior React engineer'],
    turns: [
      {
        match: '*',
        reply: 'I was about to start your brief when something went wrong on my side.',
        errorAfterTokens: 'I was about to start your brief',
      },
      {
        match: '*',
        reply:
          'Back online. Started a single-hire brief - tell me more about the role and I will keep filling it in.',
        briefs: [PARTIAL_ROLE, SINGLE_HIRE_BRIEF],
      },
      {
        match: '*',
        reply:
          "That's a strong brief. Ready when you are to review it with a human.",
        briefs: [READY_BRIEF],
        escalationOffered: true,
      },
    ],
  },
}

export const MOCK_SCRIPT_ORDER: MockScriptId[] = [
  'single-to-squad',
  'product-mvp',
  'error-midstream',
]

export const DEFAULT_MOCK_SCRIPT: MockScriptId = 'single-to-squad'

export function isMockScriptId(value: string | null): value is MockScriptId {
  return value !== null && value in MOCK_SCRIPTS
}

/**
 * Pick the next turn for a visitor message.
 *
 * Turns advance in order so the demo always walks partial → single → squad →
 * ready. `match` is documentary (and useful if a future script wants stricter
 * gating); a mismatch still advances so the conversation never stalls.
 */
export function matchScriptTurn(
  script: MockScript,
  turnIndex: number,
): { turn: MockScriptTurn; nextIndex: number } | null {
  if (turnIndex >= script.turns.length) return null
  return { turn: script.turns[turnIndex], nextIndex: turnIndex + 1 }
}

/** Welcome line shown before the visitor sends anything. */
export const MOCK_WELCOME_TEXT =
  "Hi, I'm Clara - CloudEmployee's hiring assistant. Ask me anything about how embedded engineering works, or tell me who you're hiring and I'll build a brief on the right."

export const MOCK_FALLBACK_REPLY =
  "I've got enough to keep going - tell me what to adjust on the brief, or ask about cost, regions, or next steps."
