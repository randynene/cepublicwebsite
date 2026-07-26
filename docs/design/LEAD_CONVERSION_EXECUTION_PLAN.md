# Lead conversion - detailed execution plan (handoff)

> **Continue from this file in a new chat.**  
> Owner: Jake. Locked: 26 Jul 2026.  
> Status: Strategy locked · Clara audited · Design next · Build phased.

### Related docs
| Doc | Use for |
|---|---|
| **This file** | Execution plan - what to place where, in what order, done checks |
| `docs/design/LEAD_CONVERSION_SYSTEM_UX.md` | **Feed into Claude Design** (visual scope + frames) |
| `docs/design/PRICING_LEAD_CONVERSION_UX.md` | Pricing M2 deep dive (questions, audit, metrics) |
| `docs/design/LEAD_CONVERSION_AUDIT_2026-07-26.md` | Independent audit findings, corrections, and remaining gates |
| `docs/ROADMAP_TO_COMPLETION.md` | Master launch roadmap (D7 + D8) |

---

## 1. Do we know exactly what we’re doing?

**Yes.** Locked model:

| Module | What | Site role |
|---|---|---|
| **M1** | Schedule a Call (Calendly) | **Primary door - sitewide** |
| **M2** | AI chat + living hiring brief + sweeteners → Book a Call | **Warm path - interest spikes only** |
| **M4** | Small CE-owned helper UI, optionally powered by Clara headlessly | **Later - sitewide helper** |
| **M3** | `/start-hiring` HubSpot multi-step | **Keep alive only - do not promote** |

### Rules (non-negotiable)
1. Butter up first - don’t hard-ask on every page.
2. Never fake “we matched you an engineer” from calculator/chat alone.  
3. Book a Call always one click away inside M2.  
4. No new links to `/start-hiring`, including from Pricing M2.
5. Downloads stay ungated; no email-gate for pricing quotes.  
6. For Developers talent join ≠ client M2 (separate system).

### Primary KPI chain
Calculator / interest → M2 engage (optional) → **Book a call click** → Calendly booked → HubSpot opportunity.

---

## 1a. Architecture decision - Clara (audited 26 Jul 2026)

### Decision

**Do not rebuild the chat brain from zero, but do not embed Clara's existing widget as M2.**

Use this architecture:

| Layer | Decision |
|---|---|
| **M2 visitor UI** | Build as CE-owned React components using the current dark/lime design system |
| **M4 visitor UI** | Build as a small CE-owned helper; never run it alongside the legacy Clara bubble |
| **Chat backend** | Evaluate and selectively extend Clara as a **headless API** |
| **Existing `widget.js` / iframe** | Temporary legacy helper only; not the Pricing M2 surface |
| **Clara database/admin** | Reuse where useful for knowledge, sessions, gaps, and sales review |
| **M1 Calendly** | Keep CE's existing Calendly path independent of Clara |
| **M3 Start Hiring** | Unrelated to Clara; keep working in the background |

### Why this is the decision

The Clara repository was inspected directly at `galaxyfunk/clara-chatbot`.
It already provides RAG chat, streaming, sessions, Q&A management, HubSpot
upsert, Calendly attribution, and an embeddable widget. Rebuilding those backend
capabilities would duplicate working software.

However, Clara today is a free-form Q&A widget. It does **not** provide:

- a structured hiring-brief state model;
- calculator context input;
- structured `brief_updated`, `brief_ready`, or `book_call` events;
- the CE split-screen chat + living-brief UI;
- the current CE dark/lime visual language;
- production-ready staging CORS, signed embed security, or complete accessibility.

Therefore the correct model is **headless Clara brain, CE-owned shells**. M2 V2
ships first with deterministic guided questions and no AI dependency. V3 may
connect that shell to an extended Clara API only after the security and data
contract gates below pass.

### Clara gates before V3

- [ ] Add an API mode such as `hiring_brief` with structured input/output; do not scrape LLM prose.
- [ ] Accept initial calculator/page context and emit versioned brief fields/events.
- [ ] Add signed embed/session tokens plus durable IP/workspace rate limiting.
- [ ] Add `staging.jakevibes.dev` to explicit CORS allowlists for testing.
- [ ] Verify Calendly webhook signatures.
- [ ] Verify HubSpot properties and map the structured brief payload.
- [ ] Define transcript retention, privacy disclosure, consent/CMP behavior, and deletion.
- [ ] Do not run legacy Clara widget and M4 together.
- [ ] Pass keyboard, screen-reader, contrast, and mobile accessibility checks.

### M1 canonical behavior

**M1 means Schedule a Call.** The header currently opens the CE Calendly popup.
Routed traffic can use `/book-a-call` and its person pages. `/schedule-a-call`
is not currently a route and must not be used unless it is deliberately added
as a redirect or a shared popup trigger. Every in-content M1 CTA must resolve to
one of those working behaviors.

---

## 2. Page-by-page placement matrix

Legend: **Primary** = main CTA · **Secondary** = quieter · **None** = don’t add · **Keep** = exists, don’t promote · **Later** = after Pricing M2 proven

| Page / surface | M1 Schedule a Call | M2 Chat + brief | M3 Start Hiring | M4 Helper | Notes / work |
|---|---|---|---|---|---|
| **Header (all pages)** | Primary | None | None | None | Already exists - keep strong |
| **Footer newsletter** | None | None | None | None | Email only - not a sales form |
| **Home** | Soft / final CTA | Deep-link to Pricing M2 later | None | Later | Home calculator is currently decorative; do not mount M2 until it is real |
| **Pricing** | Always (escape + result CTA) | **HERO - after calculator** | None | Later | Design + build first |
| **How It Works** | End / stage CTAs | None until Pricing M2 is proven | None | Later | Replace the dead matcher stub with working M1 CTAs first |
| **Hire Engineers** | Final CTA | Replace dead Find-form → M2 | None | Later | No `sendLead = () => {}` |
| **Fractional CTO** | Final CTA | Replace dead Match-form → M2 | None | Later | Same as HE |
| **Locations ×3** | **Hero primary** (change from start-hiring) | Secondary “Build a brief” | Remove as hero target | Later | Today hero → `/start-hiring` - fix in placement pass |
| **Services hub** | Soft CTA | None | None | Later | Browse mode |
| **Technology hub** | Soft CTA | None | None | Later | Browse mode |
| **Service / tech detail** | End CTA band | Optional secondary later on top pages only | None | Later | Default = M1 only |
| **Contact** | Calendly + simple HubSpot form | None | None | Later | Normal contact page - WP-05 track |
| **Book a Call (+ slugs)** | Calendly inline only | None | None | None | Already chose hot path |
| **Start Hiring steps** | Optional “Rather talk?” link to M1 | None | **The page itself** | None | Background funnel only |
| **Blog / topic hubs / articles** | Soft end CTA | None | None | Later | Don’t interrupt reading |
| **Downloads / tools / videos** | Soft after content | None | None | Later | Downloads **ungated** |
| **Customer stories / reviews** | Soft end CTA | None | None | Later | |
| **About / Our Work** | Soft end CTA | None | None | Later | |
| **For Developers** | None (talent CTAs) | **None** | None | None | Talent join form only |
| **Legal / thank-yous** | None | None | None | None | |
| **Floating helper** | None | Handoff target | None | **Later sitewide** | Same AI brain as M2 |

---

## 3. Current reality vs target (so next chat doesn’t guess)

| Area | Today | Target |
|---|---|---|
| Header Schedule a Call | Live (Calendly) | Keep as M1 global |
| Pricing calculator → call | Copy points to `/schedule-a-call`, but that route does not exist | Use canonical M1 behavior; then add M2 |
| Home / HE / FCTO “match” forms | Demo / partial | M2 or clear handoff - no dead submits |
| Locations hero | Links to `/start-hiring` | Switch to M1; optional M2 secondary |
| Start Hiring | Full HubSpot funnel | Keep working; **no new inbound links** |
| Sitewide AI helper | Legacy Clara widget is loaded sitewide | CE-owned M4 UI; optionally Clara headless backend; remove legacy widget when M4 ships |
| Contact form | Weak / incomplete | Finish as simple HubSpot + Calendly (separate WP-05) |

---

## 4. Phased execution (do in order)

### Phase A - Design (Jake + Claude Design) ← **YOU ARE HERE**
**Input doc:** `LEAD_CONVERSION_SYSTEM_UX.md` (+ Pricing deep dive).

- [ ] Design M1 button states (header + in-panel)  
- [ ] Design M2 split panel: empty / mid / brief-ready (+ sweeteners + example cards)  
- [ ] Design M2 mobile  
- [ ] Design Pricing calculator → M2 placement (priority #1)  
- [ ] Design Home / HE / FCTO / Location placements (lighter frames)  
- [ ] Design M4 helper (can be lower priority)  
- [ ] Jake answers open questions in §6  

**Done when:** Claude Design frames approved for Pricing M2 + global M1.

### Phase B - V1 ship (code, no AI app required)
**Goal:** Pricing converts with clear M1; no fake M2 yet.

- [ ] Pricing calculator result CTA: “Get a more accurate estimate - book a call”
- [ ] Pass real calculator context into Calendly if supported: dev count, talent region, comparison country, currency, estimate range, locale, source page
- [ ] Audit sitewide primary CTAs → prefer Book a Call / Calendly over dead `#` and over new Start Hiring links  
- [ ] Locations: change hero primary from `/start-hiring` → Schedule a Call / Book a Call  
- [ ] Hire Engineers: remove or wire the `sendLead` no-op; no marketed dead form
- [ ] Fractional CTO: final match step must hand off to M1 or future M2
- [ ] Home: make talk CTAs real links; do not imply the decorative calculator/matcher submits
- [ ] Confirm M3 still works if someone hits old URLs (parity)  
- [ ] Progressive fallback: a plain working M1 link remains if Calendly or JavaScript fails

**Done when:** Pricing result → booked-call path is obvious on staging.

### Phase C - V2 M2 shell on Pricing (code; scripted questions OK)
**Goal:** Utopia UX without waiting on full AI brain.

- [ ] Build M2 shell under Pricing calculator (chat rail + living brief)  
- [ ] Script 4–6 high-signal questions (chips) per Pricing deep-dive doc  
- [ ] Brief fields update live; sweeteners unlock; example cards at “brief ready”  
- [ ] Always-visible Skip → Book a Call  
- [ ] On Book a Call: pass brief context  
- [ ] Optional: save brief identity only at book / explicit save  
- [ ] Loading/error/no-JS states always preserve a working M1 link
- [ ] Guided V2 is labelled “guided questions”, not “AI”, until a real AI backend is connected
- [ ] Meet M2 accessibility contract: focus management, Escape close, polite live updates, 44px controls, reduced motion, mobile keyboard clearance
- [ ] Lazy-load M2 after user action; do not regress Pricing LCP/CLS against V1

**Done when:** Jake can click through Pricing M2 on staging end-to-end.

### Phase D - V3 connect the AI backend
- [ ] Decide after a technical spike: extend Clara headlessly or use a replacement backend; do not use Clara `widget.js` for M2
- [ ] Initial context in, versioned structured brief fields/events out, `book_call` intent
- [ ] Replace scripted left rail with real AI only after the Clara gates in §1a pass
- [ ] HubSpot / CRM field map and failure behavior approved before writing PII
- [ ] M4 CE-owned helper uses the same backend and hands off “Build a brief” → M2
- [ ] Remove/disable the legacy Clara widget before M4 launches

**Done when:** Real AI answers + brief still drives Book a Call.

### Phase E - Roll M2 to other interest spikes
Same kit, new mounts (only after Pricing M2 feels right):

1. Home CTA deep-links to Pricing M2; inline Home M2 waits until its calculator is real
2. Hire Engineers (kill dead form)  
3. Fractional CTO (kill dead form)  
4. Locations secondary “Build a brief”  
5. (Optional) top service pages secondary only  

**Done when:** No marketed dead demo forms; M2 only where matrix says.

### Phase F - HubSpot / funnel once-over (cutover gate)
Still required before DNS flip - see roadmap Phase 7.9:

- [ ] Jake maps every live lead path (call / contact / newsletter / downloads / M3)  
- [ ] `npm run launch:verify-hubspot-forms` PASS  
- [ ] Portal id on Vercel  
- [ ] One test lead per **promoted** path (M1, Contact, newsletter; M3 if still reachable)  
- [ ] Verify Calendly failure fallback and HubSpot failure does not block booking
- [ ] Confirm AI disclosure, transcript retention, consent/CMP, and privacy policy language

---

## 5. What each workstream owns

| Workstream | Owner | Touches |
|---|---|---|
| Claude Design frames | Jake | Visuals for M1/M2/M4 placements |
| V1/V2 site code | Agent | Pricing CTA, M2 shell, Locations hero fix, dead-form removal |
| AI backend integration | Clara + CE agent | Headless API, structured events, security, DB |
| Contact page HubSpot | Agent WP-05 | Simple contact form - not M2 |
| Start Hiring | Leave alone except parity | No new promos |
| Roadmap ticks | Agent | Update `ROADMAP_TO_COMPLETION.md` when phases ship |

---

## 6. Open questions (answer before/during design)

1. Home M2: **resolved for first rollout** - deep-link to `/pricing#refine`; no inline M2 until Home calculator is real.
2. Example profile cards: real anonymised assets or designed placeholders first?  
3. Psychometric sweetener: sales/legal OK to claim?  
4. M4 timing: with Pricing M2 or after it is converting? (Recommendation: after.)
5. Locations: **resolved** - hero becomes M1; M2 is optional secondary.
6. Who approves AI disclosure, transcript retention, CMP/consent, and psychometric claims?
7. Which HubSpot object/properties receive the brief, and what happens if that write fails?

---

## 7. New-chat starter prompt (copy/paste)

```
Continue Cloud Employee lead conversion execution from:
docs/design/LEAD_CONVERSION_EXECUTION_PLAN.md

Locked model: M1 Schedule a Call sitewide; M2 chat+brief at interest spikes
(Pricing first); M4 helper later; M3 start-hiring keep-alive only (no new links).
Clara decision: CE owns the M2/M4 UI. Clara may be extended as a headless
backend only after the gates in §1a; do not embed Clara widget.js as M2.

Design brief for Claude Design: docs/design/LEAD_CONVERSION_SYSTEM_UX.md
Pricing deep dive: docs/design/PRICING_LEAD_CONVERSION_UX.md
Roadmap decisions D7/D8: docs/ROADMAP_TO_COMPLETION.md

Next: [pick one - Phase A design review / Phase B V1 Pricing CTA + Locations hero / Phase C M2 shell]
```

---

## 8. Bottom line

We are **not** placing “forms everywhere.”

We are placing:
- **M1** everywhere it matters  
- **M2** only when someone’s interested (Pricing first)  
- **M4** later for questions  
- **M3** in the basement (working, unpromoted)

This file is the execution handoff. The UX doc is what you feed Claude Design.
