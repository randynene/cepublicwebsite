# Ask Clara - how `/ask` gets wired to the Clara Chatbot

> Author: execution agent, 29 Jul 2026. Status: **DRAFT for Jake** - not locked.
> Supersedes the P2/P3/P5 assumptions in `ASK_CLARA_EXECUTION_PLAN.md` §4 and §5,
> which were written before anyone had read the Clara source.
> P1 (the frontend shell) is complete and on PR #54.

---

## 0. Where the facts in this document came from

Everything below was read from the live system on 29 Jul, not inferred:

| Claim | How it was established |
|---|---|
| Clara repo is readable without Jake | `gh repo view galaxyfunk/clara-chatbot` - **PUBLIC**, TypeScript, default branch `main`, last push 20 May 2026 |
| Chat contract | `src/app/api/chat/route.ts` + `src/types/chat.ts` |
| SSE event shape | `src/lib/chat/engine.ts` lines ~345-425 |
| CORS allow-list | `src/app/api/chat/route.ts` lines 12-20 |
| Extraction pattern already exists | `src/lib/chat/summarize.ts` |
| Booking + CRM already exist | `src/app/api/webhooks/calendly/route.ts`, `src/lib/integrations/{calendly,hubspot}.ts` |
| Behaviour is prompt-configurable | `settings.personality_prompt`, consumed at `engine.ts:716` |
| CE workspace id is live | `GET https://clara.cloudemployee.io/api/workspace/public?workspace_id=09aa62df-…` -> `200`, `display_name: "Clara"` |
| Both Clara hosts are up | `clara.cloudemployee.io` and `chatbot.jakevibes.dev` both `200` on that endpoint |

**Nothing was written to Clara, and no chat turn was sent** (a POST would have spent
tokens and created a session row). The probe above is a free read-only GET.

---

## 1. The headline: there is no API key to go and fetch

The plan assumed a `CLARA_API_BASE_URL` + workspace key + "auth header if required".
The reality is simpler and worth knowing before anyone goes hunting for credentials:

**`POST /api/chat` takes no secret.** Its entire auth model is:

1. a CORS origin allow-list, hardcoded in the route, and
2. `workspace_id` + `session_token` in the request body.

```ts
// src/types/chat.ts
export interface ChatRequest {
  workspace_id: string   // 09aa62df-5af6-4cec-b565-c335e907327d (CE's, already in CLAUDE.md)
  session_token: string  // a UUID the CLIENT generates - widget.js just calls crypto.randomUUID()
  message: string        // max 2000 chars
  message_id: string     // client-generated, used for idempotency
}
```

So CE needs **no new environment variable to talk to Clara**. `CLARA_API_BASE_URL`
and `CLARA_WORKSPACE_ID` are worth adding as config rather than hardcoding a
customer's host in lib code (architecture rule 9), but neither is a secret.

The Anthropic key that powers extraction lives on **Clara's** server and is already
there - the existing summariser uses it.

---

## 2. What Clara already does, that the plan assumed we would build

Reading the source moved four things from "we build this" to "it exists":

**Streaming is done.** Send `stream: true` (or `Accept: text/event-stream`) and you
get SSE. Events are exactly:

```
data: {"type":"token","content":"…"}                       // repeated
data: {"type":"done","escalation_offered":bool,"booking_url":string|null,…}
data: {"type":"error","message":"…"}
```

**Sessions are done.** `session_token` in, `session_id` + `message_count` back.
History is persisted server-side in `chat_sessions`, so CE does **not** re-send the
transcript. Resume across visits already works.

**Structured extraction is done, as a pattern.** `summarizeConversation()` fires a
separate Anthropic call with a JSON-only system prompt and parses the result. Its
prompt literally says *"This summary should read as a client brief that a
salesperson can act on immediately."* It already returns `visitor_intent`,
`topics_discussed`, `buying_stage`, `contact_info`, `action_items`. It runs in
Next's `after()` so it never blocks the reply.

That is 80% of the brief-extraction machinery. What it is not: per-turn, typed to
our `Brief`, or sent to the browser. It fires once at 6 messages and writes to
`chat_sessions.metadata.summary`.

**Booking and CRM are done.** This is the biggest surprise. Clara has
`POST /api/webhooks/calendly`, which fires on `invitee.created`, pulls the session
token out of **`payload.tracking.utm_content`**, and hands off to
`handleCalendlyBooking()`; `upsertHubSpotContact()` sits beside it, and
`settings.hubspot_enabled` gates it.

**This rewrites P5.** The plan had CE building `/api/ask/booking` to post the brief
to HubSpot. It should not. CE's only job is to put `session_token` into the
Calendly embed's `utm_content`, and Clara's existing webhook closes the loop.

---

## 3. The one thing that genuinely does not exist: `brief_update`

Clara emits `token`, `done`, `error`. There is no `brief_update` event and no
per-turn structured output. **This is the whole Clara-side build.**

Also worth knowing before we design it: the plan's token rule - *"one Clara call per
user message, brief extraction is a side-channel on that same turn"* - is not
achievable as written. Clara's own summariser is already a **second** LLM call.
Extraction needs its own call because the chat completion is streaming prose to the
visitor; you cannot get reliable JSON out of the same stream.

Two honest options:

| | How | Cost per turn | Feel |
|---|---|---|---|
| **A. Second extraction call** (recommended) | Clone the `summarizeConversation` pattern with a Brief-shaped prompt; run it on the same request, emit `brief_update` before `done` | +1 cheap call (Haiku-class, ~1k tokens) | Brief lands with the reply |
| **B. Tool use on the main call** | Give the chat model a `update_brief` tool so one completion both talks and emits | +0 calls | Clara is multi-provider (`anthropic` \| `openai`, BYO key) and tool-use behaviour differs per provider; streaming + tool calls together is fiddly |

**Recommendation: A**, and cap the cost by only extracting when the visitor's message
plausibly changes the brief (skip pure Q&A turns like "what are your terms?"). B is
the purist answer and a trap on a multi-provider BYO-key product.

---

## 4. The plan

Four workstreams. Two are Clara-repo PRs, two are CE-repo phases. They can overlap
because CE's mock transport (P2) is built to the same contract Clara will later
satisfy.

### CLARA-1 - unblock the origins (tiny, do first)

`ALLOWED_ORIGINS` in `src/app/api/chat/route.ts` (and the identical list in
`workspace/public/route.ts`) does not include `staging.jakevibes.dev` or Vercel
preview hosts. Until it does, `/ask` cannot talk to Clara from anywhere we can look
at it.

- Add `https://staging.jakevibes.dev`.
- Decide how preview hosts are handled. Hardcoding rotating Vercel URLs does not
  scale; a suffix check (`*.vercel.app` under the CE team) or an env-driven list is
  the real fix. **Decision needed - see D2.**
- Lift the duplicated list into one shared module while we are in there.

Small, isolated, no behaviour change. This is the "prove the pipe works" PR.

### CE-P2 - mock transport (no Clara, no spend)

Build the client against the **real** SSE shape above, fed by a scripted local mock.
Everything after this point is tuning, not discovery.

- `site/src/lib/ask/clara/client.ts` - one `sendMessage()` that parses
  `token` / `brief_update` / `done` / `error` and does not care whether the bytes came
  from a mock or from Clara.
- `site/src/lib/ask/brief/reducer.ts` - merge `brief_update` patches into `Brief`,
  bump `version`, recompute `strength`, drive the S3/S4/S5 shape switch off `intent`.
  The P1 fixtures become the reducer's test cases.
- Replace `ASK_SCREENS` as the render source with live session state. The components
  do not change - that was the point of P1's shape.
- Keep `?askDebug=1`; add a mock-script picker beside the state switcher.

Exit: a scripted conversation fills the brief live, morphs S3 -> S4, and reaches S6,
with zero API spend.

### CLARA-2 - hiring-brief mode (the real work)

1. **`src/lib/chat/extract-brief.ts`** - clone `summarize.ts`; swap the prompt for a
   Brief-shaped one; return a typed patch. Only fill confident fields, leave the rest
   unset (the canvas is built to draw dashed prompts for absent fields, and that is
   what makes a partial brief look deliberate instead of broken).
2. **Emit `brief_update`** in `processChatStream` after the token loop, before `done`.
3. **Persist it** on `chat_sessions.metadata.brief` so a returning visitor resumes
   with their brief intact, and so a human can read it later.
4. **Share the type.** The `Brief` contract currently lives in
   `site/src/lib/ask/brief.ts`. Two hand-maintained copies will drift. **Decision
   needed - see D3.**
5. **Briefing behaviour.** Clara currently *answers*; a brief needs her to *ask* -
   one question at a time, backing off when told to. That is
   `settings.personality_prompt`, which is a **dashboard edit, not a deploy**.

### CE-P3/P4/P5 - go live, voice, booking

- **P3:** swap the mock for a thin proxy at `/api/ask/message`. It exists to keep the
  workspace id server-side and to give us one place for logging and rate limits, not
  because a secret needs hiding.
- **P4:** voice. Web Speech API in the browser, transcript sent as ordinary text.
  Clara needs no changes at all. The S2 UI already exists.
- **P5:** in-canvas Calendly, with `utm_content = session_token` so Clara's existing
  webhook links the booking to the session and fires HubSpot. CE listens for
  `calendly.event_scheduled` to advance to S8. **CE should not build a HubSpot post.**
  Download and Email on the brief action bar turn into real buttons here.

---

## 5. Sequencing

```
CLARA-1 (origins)  ──┐
                     ├──> CLARA-2 (brief_update + prompt) ──> CE-P3 (live) ──> P4 ──> P5
CE-P2 (mock) ────────┘
```

CLARA-1 and CE-P2 are independent and can run in parallel. CLARA-2 and CE-P2 must
agree on the `brief_update` payload **before** either is built - that is the one
place where getting it wrong costs a rewrite on both sides.

---

## 6. Decisions for Jake

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Extraction: second call (A) or tool use (B)? | **A.** Multi-provider BYO keys make B fragile. Skip extraction on non-brief turns to control cost. |
| **D2** | How do Vercel preview origins get past Clara's CORS? | Env-driven allow-list plus a suffix check for the CE Vercel team. Hardcoding rotating URLs will rot. |
| **D3** | Where does the `Brief` type live so both repos agree? | Publish the JSON Schema (or a tiny shared package) from the Clara repo and generate/validate CE's Zod from it. Cheapest honest version: keep CE's Zod as the gate, treat unknown fields as ignorable, and version the payload. |
| **D4** | Does the brief live only in Clara's Supabase, or also in CE? | Clara only. It already has session storage and a human-review path. A second store is the "second brain" the plan warned against. |
| **D5** | Clara's escalation trigger is a **regex on her own reply text** that matches `/schedule a call/i` (`engine.ts:409`). We just renamed the CTA to "Talk to a human". | Add `talk to a human` to that regex, or the escalation + `booking_url` path silently stops firing as her prompt adopts the new wording. **Easy to miss, cheap to fix.** |
| **D6** | Who runs the Clara PRs? | The repo is public and readable, so an agent can raise them. Merging and deploying are yours. |

---

## 7. What Jake actually has to do

**You do not need to log in for me to plan or build this.** The repo is public and I
have the full contract; there is no API key to obtain.

You do need to:

1. **Merge two PRs on `galaxyfunk/clara-chatbot`** (CLARA-1, then CLARA-2) and deploy
   them. Read-only access is enough for me to write them; merging is yours.
2. **Edit `personality_prompt` in the Clara dashboard** - this one does need your
   login. It is what turns Clara from answering questions into running a briefing
   interview, and it is a prompt edit rather than a code change, so it is the fastest
   lever on how the whole thing feels.
3. **Answer D1-D5** above, or wave them through with the recommendations.
4. **Confirm the Clara host** for staging: `clara.cloudemployee.io` and
   `chatbot.jakevibes.dev` are both live and serving the same workspace. Which is
   canonical?

---

## 8. Non-goals

- No second LLM on the CE side. CE renders JSON; it does not think.
- No brief in Sanity. Sanity holds the static proof panels only.
- No HubSpot call from CE. Clara owns the CRM edge.
- No re-sending transcripts. Clara holds session memory.
- Not touching the Clara widget's own UI. `/ask` is a separate surface.
