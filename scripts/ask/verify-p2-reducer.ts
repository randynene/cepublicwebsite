/**
 * Ask Clara P2 — reducer regression against the P1 fixture briefs.
 *
 * Run: npx tsx scripts/ask/verify-p2-reducer.ts
 *
 * Covers: out-of-order versions ignored, error mid-stream leaves composer idle
 * path open (status=error, not streaming), empty/partial brief accepted, and
 * S3 → S4 reshape via complete brief replace ending at brief-ready.
 */

import assert from 'node:assert/strict'

import {
  askSessionReducer,
  briefUpdateNote,
  createInitialSessionState,
  isBriefReady,
} from '../../site/src/lib/ask/brief/reducer'
import { resolveBriefShape } from '../../site/src/lib/ask/brief'
import {
  READY_BRIEF,
  SINGLE_HIRE_BRIEF,
  TEAM_BRIEF,
} from '../../site/src/lib/ask/fixtures'

function main() {
  let state = createInitialSessionState('test-session')
  assert.equal(state.brief, null)
  assert.equal(state.status, 'idle')

  // Partial brief (empty-ish fields) — no zeros invented by the reducer.
  state = askSessionReducer(state, {
    type: 'brief_update',
    version: 1,
    brief: {
      version: 1,
      intent: 'single_hire',
      headcount: 1,
      roles: [{ title: 'Senior React Engineer', count: 1 }],
      strength: 28,
    },
  })
  assert.equal(state.briefVersion, 1)
  assert.equal(state.brief?.techStacks, undefined)
  assert.equal(resolveBriefShape(state.brief!), 'single')
  assert.equal(isBriefReady(state.brief), false)

  // Stale / out-of-order version ignored.
  state = askSessionReducer(state, {
    type: 'brief_update',
    version: 1,
    brief: { ...READY_BRIEF, version: 1 },
  })
  assert.equal(state.briefVersion, 1)
  assert.equal(state.brief?.strength, 28)

  state = askSessionReducer(state, {
    type: 'brief_update',
    version: 0,
    brief: { ...READY_BRIEF, version: 0 },
  })
  assert.equal(state.briefVersion, 1)

  // Advance to fixture single-hire, then reshape to team.
  state = askSessionReducer(state, {
    type: 'brief_update',
    version: 2,
    brief: SINGLE_HIRE_BRIEF,
  })
  assert.equal(resolveBriefShape(state.brief!), 'single')

  state = askSessionReducer(state, {
    type: 'brief_update',
    version: 3,
    brief: { ...TEAM_BRIEF, strength: 62 },
  })
  assert.equal(resolveBriefShape(state.brief!), 'team')
  assert.equal(isBriefReady(state.brief), false)
  assert.match(briefUpdateNote(SINGLE_HIRE_BRIEF, state.brief!), /headcount/)

  // Error mid-stream: after send + token, error clears streaming.
  state = askSessionReducer(state, {
    type: 'send',
    message: 'hello',
    visitorId: 'v1',
    claraId: 'c1',
  })
  assert.equal(state.status, 'streaming')
  state = askSessionReducer(state, { type: 'token', content: 'Hi' })
  state = askSessionReducer(state, {
    type: 'error',
    message: 'Mock stream interrupted.',
  })
  assert.equal(state.status, 'error')
  assert.equal(state.streamingEntryId, null)
  // Composer path: a new send is allowed after error.
  state = askSessionReducer(state, {
    type: 'send',
    message: 'retry',
    visitorId: 'v2',
    claraId: 'c2',
  })
  assert.equal(state.status, 'streaming')

  state = askSessionReducer(state, {
    type: 'brief_update',
    version: 4,
    brief: { ...TEAM_BRIEF, version: 4, strength: 74 },
  })
  state = askSessionReducer(state, {
    type: 'done',
    escalation_offered: true,
    booking_url: null,
  })
  assert.equal(state.status, 'idle')
  assert.equal(isBriefReady(state.brief), true)
  assert.ok(state.entries.some((entry) => entry.kind === 'offer'))
  assert.ok(state.entries.some((entry) => entry.kind === 'suggestions'))

  console.log('verify-p2-reducer: OK')
}

main()
