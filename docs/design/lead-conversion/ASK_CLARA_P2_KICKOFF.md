# Cursor kickoff - Ask Clara P2 (paste into a NEW cloud agent, mygratr repo)

> One phase per chat. This is **P2 only**: make `/ask` run on a streamed transport
> instead of fixtures, with a local mock standing in for Clara. No real Clara calls.
>
> Read first: `docs/design/lead-conversion/ASK_CLARA_WIRING_PLAN.md` (the Clara
> contract, established by reading Clara's source), then
> `ASK_CLARA_EXECUTION_PLAN.md` for the locked architecture.
>
> Branch off latest `main` as `cursor/ask-clara-p2-<suffix>`.

---

## What already exists (P1, PR #54)

`/ask` and `/uk/ask` are built and reviewed. Do not redesign any of it.

| Thing | Where |
|---|---|
| `Brief` contract (Clara's to satisfy) | `site/src/lib/ask/brief.ts` |
| Brief -> on-screen prose, null-safe | `site/src/lib/ask/display.ts` |
| Render shapes (screens, chat entries, canvas) | `site/src/lib/ask/types.ts` |
| The 10 designed states + a `DEEP` growth test | `site/src/lib/ask/fixtures.ts` |
| Shell, chat, composer, canvas | `site/src/components/ask/` |
| Debug switcher | `?askDebug=1` |

The components already take a declarative render input. **That was the point of P1's
shape: swapping the source should not require touching them.** If you find yourself
rewriting canvas components, stop and re-read.

---

## The transport contract (agreed with the Clara side)

Clara's real SSE, verified against her source:

```
data: {"type":"token","content":"…"}                            // repeated
data: {"type":"brief_update","version":3,"brief":{ …Brief… }}   // CLARA-2 adds this
data: {"type":"done","escalation_offered":bool,"booking_url":string|null}
data: {"type":"error","message":"…"}
```

Request body (no auth header, no secret):

```ts
{ workspace_id: string, session_token: string, message: string, message_id: string, stream: true }
```

Two properties to build against:

- **`brief_update` carries the COMPLETE brief, not a patch.** Replace wholesale when
  `version` increases; ignore stale or out-of-order versions. No merge logic.
- **Clara holds the transcript.** Never re-send history; send `session_token` and the
  new message only.

---

## Steps

1. **`site/src/lib/ask/clara/client.ts`** - one `sendMessage()` that opens the
   stream, parses the four event types, and does not know or care whether the bytes
   came from the mock or from Clara. This is the seam P3 swaps.
2. **`site/src/lib/ask/brief/reducer.ts`** - session state: messages, current brief,
   version, streaming status, error. Derive the canvas shape from `brief.intent` (the
   existing `resolveBriefShape`) so an S3 -> S4 reshape happens on its own, and drive
   S6 off `BRIEF_READY_STRENGTH`.
3. **Mock transport** - scripted conversations that emit the real event shape with
   realistic token timing. Reuse the P1 fixtures as the scripts' end states; that
   makes them regression tests for the reducer rather than throwaway.
4. **Wire the shell** - replace `ASK_SCREENS` as the render source with live state.
   The composer's send button and Enter key become real. Suggestion chips and
   quick-start chips send instead of only filling the input.
5. **Keep the debug switcher**, and add a mock-script picker beside it. The state
   switcher stays useful for reviewing a single frame.
6. **Motion pass** - this is the phase where morphs get judged. The brief settling as
   fields arrive, and the S3 -> S4 reshape, are the two that matter. Respect
   `prefers-reduced-motion`, which the P1 CSS already gates on.

---

## Exit criteria

- A scripted conversation types out, fills the brief live, reshapes S3 -> S4, and
  reaches S6 - with **zero API spend**.
- Reducer handles: out-of-order versions, an error mid-stream (composer stays
  usable), and an empty/partial brief (dashed placeholders, no zeros).
- `?askDebug=1` still reaches every designed state.
- tsc + lint clean for touched files; no new console errors on `/ask`.

## Non-goals

- No real Clara call (P3), no voice (P4), no Calendly or HubSpot (P5).
- No new canvas design.
- Do not build a HubSpot post on the CE side at any point - Clara owns that edge.

## Halt

Show Jake the mock on a Vercel preview and get the motion signed off before P3.
