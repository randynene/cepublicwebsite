# Ask Clara (`/ask`) - master execution plan

> Owner: Jake. Locked architecture: 29 Jul 2026.  
> Visual SoT: `ask-clara-reference/Ask_Clara_Page_standalone.html` (frames S1–S10).  
> Product UX SoT: `ASK_CLARA_PAGE_UX.md` (amended by this plan where they diverge).  
> Kickoff for build agent: `ASK_CLARA_AGENT_KICKOFF.md`.

---

## 0. What we are building (plain English)

A mini generative UI on Cloud Employee:

1. Visitor lands on **Ask AI anything** (`/ask`).
2. **Left:** they talk to Clara (text or voice → text).
3. **Right:** first they see trust/marketing cards. As soon as they describe a
   hire or a product build, that marketing gives way to a **living brief** that
   fills in as the conversation continues.
4. When the brief is strong enough, we invite them to **Schedule a Call**.
   Booking happens **on the same page**. Chat stays alive.

This is beak-wetting: show progress, build desire, then book a human. Not a form maze.

---

## 1. Who does what (crystal clear - do not invent a third brain)

| Piece | Owner | Notes |
|---|---|---|
| Chat conversation (all talking) | **Clara Chatbot** (`galaxyfunk/clara-chatbot`) | One brain. LLM, knowledge, session memory. |
| Structured brief JSON | **Clara emits** on each turn (`brief_update` SSE event) | Condensed fields only - succinct, not a novel. |
| Drawing the brief / morphs / booking UI | **CE Next.js** (`/ask`) | Pure render + merge. **No second LLM on CE.** |
| Testimonials / Did-you-know / case bites | **Sanity `askPage`** | Static proof content for S1 (and optional strip later). |
| Live brief mid-chat | **Ephemeral session state** | Client + Clara `session_id`. **Not Sanity.** |
| HubSpot + PDF | **CE API on book/save only** | Never mid-chat form fields. |

### Wrong idea to kill now
> “Sanity runs another AI that builds the brief.”

**No.** Sanity only stores marketing copy/assets. A second AI on CE would double
token cost and drift from Clara’s understanding. Clara talks **and** emits the
brief patch in the **same request**. CE just paints JSON.

### Token discipline (locked)
- **One** Clara call per user message (streamed).
- Brief extraction is part of that turn (tool/structured side-channel), not a
  parallel CE model.
- Brief fields stay short (titles, chips, one-line goals). Cap field lengths in
  schema.
- Do not re-send full transcript every time if Clara sessions already hold memory
  - send `session_id` + new message (+ optional last brief version).
- Mock transport for UI tuning so we do not burn Clara tokens while pixel-pushing.

---

## 2. Design frames (visual SoT)

Reference HTML (unpacked):  
`docs/design/lead-conversion/ask-clara-reference/Ask_Clara_Page_standalone.html`

| ID | Label | Canvas |
|---|---|---|
| S1 | Discovery | Rotating proof (client stories + did-you-know) |
| S2 | Voice active | Same canvas; waveform + draft transcript in chat |
| S3 | Brief single hire | One profile card, fields fill live |
| S4 | Brief team | Grouped mark + role-mix board |
| S5 | Brief product / MVP | Scope checklist, compliance, suggested pod |
| S6 | Brief ready | Full brief + Schedule a Call emphasis |
| S7 | Booking in canvas | Calendly inline; brief summary pinned |
| S8 | Booked | Confirmation; brief sent; chat live |
| S9 | Mobile discovery | Proof card above thread |
| S10 | Mobile brief | Brief card above thread |

**Layout contract (from kickoff + HTML)**
- Chat left ~44% / canvas right ~56%; draggable divider 35–65%, `localStorage`.
- Header on `/ask`: **logo + Schedule a Call only** (no full mega-nav).
- Canvas shows **exactly one** of: proof | brief | booking (S7/S8).
- Palette: `#070D18` / `#0B1424` / `#101B30` / borders `#22314D` / lime `#D4FF3C`.
- Type: Inter UI, Source Serif 4 italic quotes, IBM Plex Mono micro-labels.
- Copy rule: **never** “matched engineer” / fake database matches (Option A).

**Delta vs earlier UX note:** older brief described marketing shrinking to a
bottom strip under the brief. **Build to the HTML + kickoff:** when brief mode
starts, canvas becomes the brief (proof exits). Proof can return only if they
hide the brief or we later add a deliberate strip - not required for v1.

---

## 3. Brief model

```ts
type Brief = {
  version: number
  intent: 'unknown' | 'single_hire' | 'team_hire' | 'product_build'
  headcount?: number
  roles?: { title: string; seniority?: string; count: number; stacks?: string[] }[]
  techStacks?: string[]
  regions?: ('PH' | 'EE' | 'LATAM' | 'mixed')[]
  engagement?: { type: 'full_time' | 'part_time' | 'contract'; durationMonths?: number }
  timeline?: string
  teamContext?: string
  companyContext?: string
  goals?: string
  mustHaves?: { label: string; confirmed: boolean }[]
  complianceFlags?: string[]
  suggestedPod?: { role: string; count: number; note?: string }[]
  strength: number // 0-100
}
```

**Rules**
- Unknown → dashed placeholders, never zeros/errors.
- Intent drives S3 / S4 / S5.
- Labels: “Your hiring brief” / “Your product brief”.
- Big team (headcount ≥ 5 OR ≥ 3 distinct roles): summarise + soft human handoff
  (Mode D from UX brief) rather than endless collage.
- Strength threshold for S6: define in reducer (start **≥ 70**, tune with Jake).

---

## 4. Clara integration contract

### CE → Clara (via our proxy)
`POST /api/ask/message` (Next.js) → Clara `POST /api/chat` (server-side only).

Env (Jake supplies - do not invent secrets):
- `CLARA_API_BASE_URL`
- `CLARA_WORKSPACE_ID` (CE already uses `09aa62df-5af6-4cec-b565-c335e907327d` for widget)
- Auth header if required
- CORS: Clara must allow CE staging + production origins (Clara repo change)

### SSE events CE must handle
| Event | CE action |
|---|---|
| `token` | Append streaming assistant bubble |
| `brief_update` | Merge into Brief reducer; re-render canvas |
| `state_hint` | Optional intent hint |
| `done` | End stream |
| `error` | Surface recoverable error; keep composer usable |

### Clara repo work (parallel track - `galaxyfunk/clara-chatbot`)
Required before “real AI” feels like the product:
1. **Hiring-brief mode** - same chat turn returns streamed tokens + structured
   `brief_update` (JSON patch or full brief + version).
2. Succinct extraction prompt - fill only confident fields; leave rest unset.
3. Session resume by `session_id`.
4. CORS allowlist: `staging.jakevibes.dev`, `www.cloudemployee.io`, preview hosts as needed.
5. Rate limits + no browser-exposed secrets.

Until that lands, CE runs on **mock transport** (scripted tokens + brief patches).

---

## 5. Booking + HubSpot

- Anywhere Schedule a Call on `/ask` → **S7 in canvas** (not navigate away).
- Calendly: Discovery Call, 30 min (URL from Sanity `askPage`).
- Prefill email when known; pass `session_id` + `brief_version` as custom/UTM params.
- On `calendly.event_scheduled` → S8 → `POST /api/ask/booking` → HubSpot + PDF email.
- No HubSpot fields in the chat UI.

Sitewide header elsewhere still goes to `/book-a-call`. Only `/ask` chrome opens S7.

---

## 6. Suggested file map (CE site)

```
site/src/app/ask/page.tsx
site/src/app/uk/ask/page.tsx
site/src/app/api/ask/message/route.ts
site/src/app/api/ask/booking/route.ts
site/src/components/ask/AskShell.tsx
site/src/components/ask/ChatPanel.tsx
site/src/components/ask/VoiceRecorder.tsx
site/src/components/ask/canvas/ProofRotator.tsx
site/src/components/ask/canvas/BriefSingle.tsx
site/src/components/ask/canvas/BriefTeam.tsx
site/src/components/ask/canvas/BriefProduct.tsx
site/src/components/ask/canvas/BriefReady.tsx
site/src/components/ask/canvas/BookingPanel.tsx
site/src/components/ask/canvas/BookedPanel.tsx
site/src/lib/ask/clara/client.ts          # SSE + mock transport
site/src/lib/ask/brief/types.ts
site/src/lib/ask/brief/reducer.ts
studio/schemas/documents/ask-page.ts      # proof items + calendlyUrl + CTA label
```

Dev-only: `?askDebug=1` state switcher for S1–S10 + fixture briefs (step 1 gate).

---

## 7. Phased build order (one phase per agent chat)

| Phase | Goal | Exit |
|---|---|---|
| **P0** | Plan locked + reference committed (this doc) | Jake OK |
| **P1** | Static shell + all canvas variants + debug state switcher | Pixel-close S1–S10 at 1440 + 390; no Clara |
| **P2** | Mock Clara transport (scripted SSE) | Morphs + field fills tunable without API spend |
| **P3** | Clara Chatbot: `brief_update` mode + CORS + proxy | Real chat + brief updates on staging |
| **P4** | Voice (Web Speech + waveform) | S2 works; text still sent to Clara |
| **P5** | Calendly in-canvas + HubSpot + PDF | S7/S8 real; noindex rules as needed |

**Do not skip P1.** Frontend must look right before token spend.

---

## 8. SEO / chrome notes

- `/ask` is a conversion tool. Decide indexability with Jake (likely indexable
  landing with careful H1 “Ask AI anything”, or noindex if preferred).
- `/ask` layout: minimal header (logo + Schedule a Call). Do not mount full
  mega-nav if it fights the composition - match HTML.
- UK mirror `/uk/ask` with locale path helpers.

---

## 9. Safety / gates

- No bulk Sanity writes for live briefs.
- No inventing Clara endpoints - env-gated proxy only.
- No fake match copy.
- Push/merge only on Jake approval (cloud agents: follow session push rules).
- High-complexity: this plan is foundational for M2 - treat P3 Clara contract as
  a mini-brief that may need a short audit before coding Clara changes.

---

## 10. Open items for Jake (only if blocking)

1. Clara base URL for staging (likely `https://clara.cloudemployee.io` - confirm).
2. Whether `/ask` is indexable.
3. Calendly event URL for Discovery Call (same as current book-a-call singleton?).
4. HubSpot destination for brief JSON (which properties).

Non-blocking defaults the build agent may use until Jake answers:
- Clara base = existing widget host; workspace id = current CE widget id.
- `/ask` indexable with normal meta.
- Calendly URL from existing `bookACallPage.calendlyUrl` until `askPage` seeded.
