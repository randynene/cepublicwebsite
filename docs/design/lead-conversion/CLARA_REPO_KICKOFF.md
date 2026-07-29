# Cursor kickoff - Clara-repo work for `/ask` (run this INSIDE `galaxyfunk/clara-chatbot`)

> This is the Clara half of wiring up Cloud Employee's `/ask` page.
> Read `ASK_CLARA_WIRING_PLAN.md` (in the mygratr repo) first for why.
>
> **Line numbers below are against commit `1accca4`** (main, 20 May 2026). Re-find
> them before editing; do not trust them blind.

---

## Why you are here

Cloud Employee has a full-page conversation surface at `/ask`: the visitor talks to
Clara on the left, and a structured hiring brief builds on the right as she
understands more. The frontend is built and signed off. It currently runs on
hard-coded fixtures.

Clara already does almost everything needed. Three changes are missing, and they all
live in this repo.

**Do not touch the widget UI.** `/ask` is a separate surface that talks to the same
API. `public/widget.js` is not in scope.

---

## CLARA-1 - open the CORS allow-list (do this first, it is tiny)

`ALLOWED_ORIGINS` is hardcoded and duplicated:

- `src/app/api/chat/route.ts:12-20`
- `src/app/api/workspace/public/route.ts:6-14`

Neither includes `https://staging.jakevibes.dev`, which is where CE is reviewed, nor
any Vercel preview host. Until that changes, `/ask` cannot reach Clara from anywhere
anyone can look at it.

1. Lift the list into one shared module (e.g. `src/lib/cors.ts`) and have both routes
   import it. Two copies of a security list will drift.
2. Add `https://staging.jakevibes.dev`.
3. Handle preview origins. Hardcoding rotating `*.vercel.app` URLs will rot within a
   week. Prefer an env-driven list (`CLARA_EXTRA_ALLOWED_ORIGINS`, comma-separated)
   plus, if you want previews to work without a redeploy each time, a narrow suffix
   check scoped to the CE Vercel team - **not** a blanket `*.vercel.app`, which would
   let any Vercel app on the internet call this workspace.

Note the current fallback: an unrecognised origin is echoed back the FIRST allowed
origin rather than being refused. That is permissive-by-accident. Worth tightening
while you are here, but call it out rather than changing behaviour silently.

**Exit:** a request from `staging.jakevibes.dev` gets a matching
`Access-Control-Allow-Origin` and a real answer.

---

## CLARA-D5 - the escalation regex is about to go stale (one line, do it with CLARA-1)

Clara decides whether to offer a booking by running a regex over **her own reply
text**:

- `src/lib/chat/engine.ts:409` (streaming path)
- `src/lib/chat/engine.ts:446` (non-streaming path)

Both match `/…|schedule a call|…/i`. Cloud Employee has just renamed that CTA
sitewide to **"Talk to a human"**, and Clara's `personality_prompt` is being updated
to match. As her wording moves, this regex stops firing, and the escalation +
`booking_url` path quietly dies.

Add `talk to a human` (and `speak to a human`) to both. Two copies of the same regex
is itself a smell - hoist it to a named constant.

---

## CLARA-2 - emit `brief_update` (the actual work)

### The contract

CE expects one new SSE event, sent **after** the token loop and **before** `done`:

```
data: {"type":"brief_update","version":3,"brief":{ …complete Brief… }}
```

**Send the complete brief every time, not a patch.** Both were on the table; whole-
document wins because merging partials across a network is where drift and
impossible-to-reproduce bugs live, and a brief is a few hundred bytes. CE replaces
wholesale when `version` increases and ignores anything stale or out of order.

The `Brief` shape is defined in the CE repo at `site/src/lib/ask/brief.ts` and is
reproduced in `ASK_CLARA_WIRING_PLAN.md`. Fields are optional by design.

### Fill only what you are confident about

This is the single most important behavioural note. **Leave unknown fields unset.**
CE renders absent fields as dashed "Clara will ask next" prompts, and that is what
makes a half-finished brief look deliberate rather than broken. A guessed seniority
or an invented region is worse than an empty one, because a human reads this brief
before a sales call.

### How to build it

Clone the pattern that already exists in `src/lib/chat/summarize.ts`:

- `SUMMARIZE_PROMPT` at line 4 - a JSON-only system prompt.
- `summarizeConversation()` at line 27 - a separate Anthropic call on the app-level
  `ANTHROPIC_API_KEY`, parsed defensively.

Make `src/lib/chat/extract-brief.ts` in that image, with a Brief-shaped prompt and
schema. Two deviations worth considering: `summarize.ts` pins
`claude-sonnet-4-20250514` (line 43), which is heavier than this needs - a
Haiku-class model is plenty for field extraction and this runs every turn, not once.

Then:

1. Call it in `processChatStream` (`src/lib/chat/engine.ts`, the block around
   345-425) after the token loop completes, and enqueue the `brief_update` event
   before the existing `done` at line 413.
2. **Skip the call on turns that cannot change the brief.** "What are your terms?"
   does not need an extraction pass. This is the difference between a sensible bill
   and a silly one.
3. Persist the brief on `chat_sessions.metadata.brief` alongside the existing
   `metadata.summary`, so a returning visitor resumes with their brief intact and a
   human can read it later.
4. Mirror it on the non-streaming path if that path is still used.

**Exit:** a scripted conversation against a real workspace streams tokens, then one
`brief_update` per meaningful turn, with `version` incrementing and the brief
surviving a page reload.

---

## Not in scope

- **The Calendly + HubSpot loop.** It already exists
  (`src/app/api/webhooks/calendly/route.ts`, `src/lib/integrations/hubspot.ts`) and
  links a booking to a session via `payload.tracking.utm_content`. CE will pass the
  session token in that param. Do not rebuild it and do not add a second CRM path.
- **The widget UI.**
- **`personality_prompt`.** That is a dashboard edit Jake makes, not a code change.

---

## Repo etiquette

Small PRs, in order: CLARA-1 + D5 together (trivial, unblocks review), then CLARA-2.
Merging and deploying are Jake's.
