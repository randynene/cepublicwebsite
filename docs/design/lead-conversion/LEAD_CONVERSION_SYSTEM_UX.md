# Lead conversion system - Claude Design scope (sitewide)

> **Feed this whole file into Claude Design.**  
> Owner: Jake. Status: **Simplified - locked 26 Jul 2026.**
> Roadmap: D7 + D8 in `docs/ROADMAP_TO_COMPLETION.md`.  
> Pricing-module deep dive: `docs/design/lead-conversion/PRICING_LEAD_CONVERSION_UX.md`.
> **Execution plan / new-chat handoff:** `docs/design/lead-conversion/LEAD_CONVERSION_EXECUTION_PLAN.md`.

---

## 0. One-sentence brief

Keep the site simple: **Schedule a Call everywhere interest shows**, and at the
biggest interest moments open **guided questions (V2) or an AI assistant (V3 after
gates) + a living hiring brief**. No form maze. Start Hiring stays in the background.

---

## 1. Simplified system (what we actually use)

| Module | Plain English | Role |
|---|---|---|
| **M1 - Schedule a Call** | Talk to a human now (Calendly) | **Primary door sitewide** |
| **M2 - Chat + living brief** | AI asks a few questions; brief builds on the side; then book a call | **Warm path at interest spikes only** |
| **M4 - Helper chat** | Small CE-owned AI helper, optionally powered by Clara headlessly | **Sitewide helper (later)** |
| **M3 - Start Hiring** | Old multi-step HubSpot funnel | **Keep alive, do not promote** |

### What “simplified” means (Jake locked)

1. **Necessary on the site:** M1 + M2 (+ M4 later).  
2. **Not necessary as a marketed door:** M3 - keep URLs/forms working for parity; **do not add new links** to `/start-hiring` across the site.
3. **One visual language** for M1/M2/M4 - not different form styles on every page.
4. **Butter up first** - browse freely; hard ask only when interest spikes.

---

## 2. Intent → door (simple)

| Visitor mood | Door |
|---|---|
| Ready to talk | **M1 Schedule a Call** |
| Just saw a price / clicked “get matched” | **M2 Chat + brief** (with M1 escape always) |
| Quick question | **M4 Helper chat** |
| Wandering / reading | Nothing - soft M1 at section ends only |
| Email updates | Footer newsletter only |
| Somehow hits old `/start-hiring` URL | M3 still works (background) |

---

## 2a. Architecture direction for Design

The existing `galaxyfunk/clara-chatbot` product has been audited.

- Reuse/extend Clara selectively as a **headless chat backend** if the technical spike passes.
- Do **not** design around Clara's current `widget.js`, iframe, Side Whisper, or Command Bar UI.
- M2 and M4 are CE-owned interfaces using the current dark/lime design system.
- M2 V2 initially uses deterministic guided questions, not fake AI.
- When M4 ships, the legacy Clara bubble must be removed so two chat launchers never compete.
- Design M1 so a plain `/book-a-call` fallback still works if Calendly JavaScript fails.

The complete architecture decision and technical gates live in
`docs/design/lead-conversion/LEAD_CONVERSION_EXECUTION_PLAN.md` §1a.

---

## 3. Core flow to design (M2)

```
Interest spike (esp. Pricing calculator)
        ↓
M2 opens: guided questions (V2) / AI assistant (V3) asks 4–6 key questions
        ↓
Side: hiring brief builds + vetting sweeteners
        ↓
Brief ready → example profile cards (labelled examples)
        ↓
Book a call (M1)  ← always available as “Skip - book now”
```

---

## 4. SITEWIDE PLACEMENT (simplified)

### Everywhere
| What | Module |
|---|---|
| Header **Schedule a Call** | M1 |
| Footer newsletter | Soft email (not sales) |
| Floating AI helper (later) | M4 - can hand off to M2 |

### Interest spikes only - full M2
| Page | When M2 opens |
|---|---|
| **Pricing** | After calculator result (**hero / design first**) |
| **Home** | Deep-link to Pricing M2 later; Home calculator is currently decorative |
| **Hire Engineers** | “Get matched” (replace dead demo form) |
| **Fractional CTO** | “Find your CTO” (replace dead demo form) |
| **Locations ×3** | Secondary “Build a brief” - hero stays **M1** |

### Light only - M1 (no full M2 panel)
| Page | CTA |
|---|---|
| How It Works | Book a call (+ helper M4 later; no heavy matcher maze) |
| Services / Technology detail | End CTA → Schedule a Call |
| Hubs (blog, services, etc.) | Soft Schedule a Call only |
| Blog / downloads / stories / reviews | Soft “Book 15 mins” after content (downloads **ungated**) |
| Contact | Simple HubSpot + Calendly (M1) - normal contact page |
| Book a Call pages | Calendly only (already chose M1) |
| About / Our Work | Soft M1 at end |
| Legal / thank-yous | Nothing |

### Explicitly out
| Page | Note |
|---|---|
| **For Developers** | Talent join form - **different system**, not client M2 |
| **Start Hiring links** | **Do not add** new sitewide links; Locations hero is locked to M1 |

---

## 5. Locations note (current vs simplified)

Today Locations hero points at `/start-hiring` (M3).  
**Simplified target:** hero → **M1 Schedule a Call**; optional secondary → **M2 Build a brief**.  
M3 remains reachable only via old URLs / redirects, not as the main button.

---

## 6. Visual rules (Claude Design)

- CE dark + lime. Not a purple chatbot skin.
- **M2** = one split composition (chat | living brief), mainly on Pricing.
- One question at a time; chips first; Book a Call always visible.
- Sweeteners: vetting, deep profiles, psychometrics - short proofs, don’t block questions.
- Example engineer cards only after brief is ready - labelled **Examples**.
- **M4** = small; must not compete with header Schedule a Call.
- Mobile: chat main + compact brief + pinned Book a Call.
- **AI disclosure:** label real AI clearly as an AI assistant and link to privacy information. V2 scripted questions are not labelled AI.
- **Claims:** psychometric/culture profiling stays design-only until sales/legal confirms the current offering and wording.
- **Accessibility:** design focus order, Escape/close, visible keyboard focus, `aria-live` brief updates, 44px controls, reduced-motion states, and a mobile layout where the keyboard never hides the CTA/input.
- **Failure state:** show a helpful unavailable state plus a normal Book a Call link. Never leave a blank panel.
- **Performance:** M2 opens on user action and lazy-loads its AI backend. It must not shift the calculator result or harm first-paint speed.
- **Terminology:** “Schedule a Call” and “Book a call” are labels for the same M1 behavior.

---

## 7. Claude Design frame list (keep it short)

### Kit
1. M1 Schedule a Call (header + in-panel)  
2. M2 desktop: empty / mid / brief-ready (+ sweetener + example cards)  
3. M2 mobile  
4. M4 helper: collapsed / open / “Build a brief” handoff  

### Placements (only what’s necessary)
5. **Pricing** - calculator → M2 (priority #1)
6. **Home** - CTA deep-links to Pricing M2 (inline M2 deferred)
7. **Hire Engineers** - get matched → M2
8. **Fractional CTO** - find CTO → M2
9. **Location** - hero M1 + secondary M2
10. **Service detail** - end band M1 only (M2 secondary is deferred)
11. **Blog/download end** - soft M1 only
12. **Contact** - simple form + Calendly

Skip designing M3 as a marketed experience. Skip full M2 on every hub/blog.

---

## 8. Ship sequence

| Stage | Ship |
|---|---|
| **V1** | Stronger M1 on Pricing calculator (“accurate estimate - book a call”) |
| **V2** | M2 on Pricing (design now in Claude Design) |
| **V3** | A headless backend (Clara if it passes the gates) powers CE-owned M2 + M4 |
| **V4** | Same M2 on Home / Hire Engineers / FCTO / Locations secondary |
| **Background** | Keep M3 `/start-hiring` working; no new promos |

---

## 9. Bottom line

**Simple sitewide model:**

- **M1** = default conversion everywhere  
- **M2** = special experience when they’re hot (Pricing first)  
- **M4** = helpful chat later  
- **M3** = keep the lights on, don’t feature it  

Utopia is not more doors. Utopia is **fewer, clearer doors** used at the right moment.
