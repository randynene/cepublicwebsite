# Cursor kickoff - Ask Clara `/ask` (paste into a NEW cloud agent)

> Read this entire file first. Then read the linked plan + HTML reference.  
> One phase per chat. Start at **P1** only unless Jake says otherwise.

---

## Mission

Build `/ask` (Ask AI anything) on the Cloud Employee Next.js site: a full-page
experience where the visitor chats with Clara on the left and a living hiring /
product brief builds on the right, ending in an in-canvas Calendly booking.

You are the **execution brain**. Architecture is already locked. Do not redesign it.

---

## Read these files (in order)

1. `docs/design/lead-conversion/ASK_CLARA_EXECUTION_PLAN.md` — **master plan**
2. `docs/design/lead-conversion/ASK_CLARA_PAGE_UX.md` — product UX decisions
3. `docs/design/lead-conversion/ask-clara-reference/Ask_Clara_Page_standalone.html` — **visual SoT** (frames S1–S10 via `data-screen-label`)
4. Existing site patterns: `site/src/components/templates/book-a-call/calendly-inline-embed.tsx`, `site/src/lib/chat.ts`, `site/src/components/third-party-scripts.tsx` (Clara workspace id), `site/src/app/tokens.css`
5. Clara Chatbot repo (separate): `galaxyfunk/clara-chatbot` — especially `src/app/api/chat/route.ts`, `public/widget.js`, chat types. **Do not rebuild Clara’s widget UI.**

Also open Jake’s original kickoff if attached in the chat (states, Brief type, file map). Prefer the Execution Plan if anything conflicts.

---

## Architecture (non-negotiable)

| Concern | Owner |
|---|---|
| Page chrome, layout, brief rendering, booking UI | This Next.js app |
| Pre-chat marketing / proof panels | Sanity (`askPage`) — **static only** |
| Conversation + understanding | Clara Chatbot API |
| Structured brief fields | **Emitted by Clara** as `brief_update`; CE merges + renders |
| Live brief | Ephemeral session state — **NOT Sanity, NOT a second CE LLM** |
| CRM | HubSpot on booking confirm / explicit save only |

**Token rule:** one Clara call per user message. Brief extraction is a side-channel
on that same turn. Never scrape chat bubbles. Never spin up a Sanity/CE second AI
to “build the brief.”

**Copy rule:** never claim a matched engineer / live database match (Option A).

---

## Layout contract

- Chat **left** ~44%, canvas **right** ~56%; draggable divider 35–65%, persist `localStorage`.
- `/ask` header: CloudEmployee logo + `Schedule a Call` only (no mega-nav).
- Canvas shows exactly one of: **proof** | **brief** | **booking**.
- Mobile: chat primary; proof/brief card above thread; composer docked.
- Dark/lime palette per plan + HTML inline styles.
- Match HTML closely; implement in idiomatic React/TS + Tailwind v4 tokens used by the repo.

---

## States (must ship in P1 as switchable fixtures)

S1 Discovery · S2 Voice active · S3 Single hire · S4 Team · S5 Product/MVP ·  
S6 Brief ready · S7 Booking · S8 Booked · S9 Mobile discovery · S10 Mobile brief.

---

## Build order (halt between phases)

### P1 — Frontend only (DO THIS FIRST)
- Route `/ask` + `/uk/ask`.
- Shell + all canvas variants driven by hard-coded `Brief` fixtures.
- **Dev state switcher** (`?askDebug=1`) so Jake can click S1–S10.
- No Clara, no HubSpot, no voice backend.
- **HALT:** show Jake the switcher on a Vercel preview. Pixel-close at 1440×900 and 390×844.

### P2 — Mock Clara transport
- SSE mock: `token` + `brief_update` scripts.
- Morphs and field fills tunable without API cost.
- **HALT:** Jake signs motion/feel.

### P3 — Real Clara
- `POST /api/ask/message` proxy (workspace key server-side only).
- Env: `CLARA_API_BASE_URL`, `CLARA_WORKSPACE_ID`, auth as needed — **ask Jake, do not invent**.
- Clara repo changes: `brief_update` emission + CORS for staging/prod.
- Session id cookie + localStorage.
- **HALT:** live chat + brief updates on staging.

### P4 — Voice
- Web Speech API + mic AnalyserNode waveform; Ctrl+D hold; send text to Clara.

### P5 — Booking
- In-canvas Calendly (S7); `calendly.event_scheduled` → S8 → HubSpot + PDF via `/api/ask/booking`.

---

## Suggested structure

See Execution Plan §6. Prefer `site/src/components/ask/...` and `site/src/lib/ask/...`.

Sanity: `askPage` singleton for proof items + Calendly URL + CTA label.  
Schema deploy is OK; **dataset seed/patch** = narrow patch or Jake runs seed (see safety rules).

---

## Repo / git rules (Mygratr)

- Branch: `cursor/ask-clara-<short>-3404` off latest `main`.
- Explicit path staging; single-line commits; no `git add -A`.
- Push/PR per cloud-agent rules for this session.
- Do not touch `.env` secrets; do not bulk-mutate Sanity production.
- Update `docs/ROADMAP_TO_COMPLETION.md` when `/ask` becomes a real tracked page.

---

## Acceptance (P1 gate)

- [ ] All 10 states reachable via debug switcher
- [ ] Pixel-close to reference HTML at 1440 and 390
- [ ] Brief renders from JSON alone with partial data (dashed placeholders)
- [ ] Schedule a Call visible in header; opens booking canvas state (even if Calendly is stubbed in P1)
- [ ] No matched-engineer copy
- [ ] `prefers-reduced-motion` respected
- [ ] tsc + lint clean for touched files

---

## First message to Jake after P1

Send the preview URL + how to use `?askDebug=1`. Do not start P2 until he says so.
