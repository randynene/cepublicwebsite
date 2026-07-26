# Lead conversion system — Claude Design scope (sitewide)

> **Feed this whole file into Claude Design.**  
> Owner: Jake. Status: Design scope (26 Jul 2026).  
> Roadmap: D7 + D8 in `docs/ROADMAP_TO_COMPLETION.md`.  
> Pricing-module deep dive (audit, questions, metrics):  
> `docs/design/PRICING_LEAD_CONVERSION_UX.md`.

---

## 0. One-sentence brief

Design a **sitewide lead system** where visitors get warmed up freely, then at moments of interest can refine via **AI chat + a living hiring brief**, while **Schedule a Call** is always the fast hot path — never a form dump, never fake “we matched you.”

---

## 1. Goals

1. **Convert more booked calls** (primary KPI).
2. **Butter prospects up** before a hard ask (trust + desire).
3. **Collect high-signal hiring data** in a non-intrusive way (for sales + Jake’s AI app).
4. Feel like **one coherent CE product**, not random forms on random pages.

### Non-goals

- Email-gating downloads or pricing quotes.
- Replacing Calendly with chat.
- Fake instant engineer matching from 3 dropdowns.
- Putting a heavy multi-step form on every page.

---

## 2. The system (4 parts — design all of them)

Think in **modules**, reused across the site with different intensity.

| Module | What it is | Job |
|---|---|---|
| **M1 — Hot CTA** | Schedule a Call / Calendly | Instant human path |
| **M2 — Refinement module** | AI chat (left) + living hiring brief (right) + sweeteners | Warm path: questions → brief builds → book call |
| **M3 — Async funnel** | Start Hiring multi-step (HubSpot) | People who want a form, not a call yet |
| **M4 — Helper chat** | Lighter sitewide AI bubble (same brain, smaller shell) | Questions anywhere; can hand off into M2 |

**Brain:** Jake’s separate AI app / DB powers M2 + M4.  
**Site:** CE Next.js hosts shells, calculator context, Calendly, HubSpot.

### Intent lanes (locked)

| Intent | Door |
|---|---|
| Hot — “talk now” | M1 Schedule a Call |
| Warm — “help me specify” | M2 Refinement module |
| Async detail | M3 Start Hiring |
| Curious / stuck | M4 Helper chat |
| Browsing | No form — content + soft CTAs |
| Soft stay-in-touch | Footer newsletter only |

---

## 3. Utopia flow (core story to design)

```
Interest moment (calculator, “get matched”, end of service page, etc.)
        ↓
Offer choice:
  • Book a call now (M1)
  • Refine with AI (M2)  ← default warm path
        ↓
Chat asks 4–6 high-signal questions (chips first)
        ↓
Side panel: hiring brief builds live
        ↓
Sweeteners unlock (technical vetting, deep profiles, psychometrics…)
        ↓
Brief ready → example shortlist-style cards (labelled EXAMPLES)
        ↓
Primary: Schedule a call (brief context passed in)
```

**Escape at every step:** “Skip — book a call now.”

---

## 4. SITEWIDE PLACEMENT MAP (the important bit)

Where each module appears across the website.

### 4.1 Global (every page)

| Placement | Module | Behaviour |
|---|---|---|
| **Header — Schedule a Call** | M1 | Always visible. Calendly popup (current pattern). Hot path. |
| **Footer newsletter** | Soft email only | Stay-in-touch. Not a sales form. |
| **Floating AI helper** (later) | M4 | Corner/edge entry. Answers questions. If topic = hiring/pricing → **hand off into M2** (“Continue — build your brief”). |
| **Clara / legacy chat** | Replace or coexist TBD | Design assumes Jake’s AI app becomes the helper; don’t invent a third chat brand in frames. |

### 4.2 Pricing — HERO placement (design first)

| Placement | Module | Behaviour |
|---|---|---|
| **After calculator result** | **M2 full split panel** | Primary utopia surface. Calculator data pre-fills the brief. |
| Same section | M1 | Persistent “Book a call for a tailored estimate”. |
| Page end / FAQ help | M4 or M2 deep-link | “Ask about this rate” opens helper or scrolls to M2. |

**Claude Design priority #1:** Pricing calculator result → M2 open / mid / brief-ready.

### 4.3 Home

| Placement | Module | Behaviour |
|---|---|---|
| Hero primary CTA | M1 or scroll to match | Keep simple; don’t open M2 in the hero. |
| **Pricing calculator block** (“Get matched at this rate”) | Opens **M2** (inline or navigate to `/pricing#refine` with state) | Same refinement story as Pricing. |
| Ready-to-find / final CTA band | M1 primary + “Prefer to refine first?” → M2 | Dual door. |

### 4.4 How It Works

| Placement | Module | Behaviour |
|---|---|---|
| Existing matcher / quiz area | Evolve toward **M2 lite** or handoff | Don’t keep a dead stub. Either real questions→brief or CTA into M2. |
| Stage ends / final CTA | M1 | Book a call. |
| FAQ “ask” | M4 | Helper. |

### 4.5 Hire Engineers (`/services/software-engineers`)

| Placement | Module | Behaviour |
|---|---|---|
| Hero “Get matched” | Start M2 **or** M1 (A/B later; default **M2** for butter) | |
| On-page Find-form demo | **Replace / hand off** — no dead submit | Either becomes M2 questions or “Continue → build your brief” |
| Calculator “Get matched at this rate” | M2 with context | |
| Final CTA | M1 + M2 secondary | |

### 4.6 Fractional CTO

| Placement | Module | Behaviour |
|---|---|---|
| “Find your CTO” / match form | Same rule as Hire Engineers — **no demo dead-end** | M2 (CTO-flavoured questions) or M1 |
| Final CTA | M1 | |

### 4.7 Location pages (LATAM / PH / EE)

| Placement | Module | Behaviour |
|---|---|---|
| Hero primary | M1 (“Meet your engineer in 7 days” → call) | Hot, location already known → pre-fill brief region |
| Secondary | M2 (“Build a brief for this region”) | |
| FAQ / chat hrefs | M4 | Stop `#chat` dead anchors — wire to helper |

### 4.8 Services + Technology detail + hubs

| Placement | Module | Behaviour |
|---|---|---|
| Mid / end CTA bands | M1 primary | “Schedule a call” / “Hire [role]” |
| Soft secondary | “Not ready? Build a brief” → M2 | Especially on high-traffic service pages |
| Hub furniture CTAs | M1 | Keep light; hubs are browse mode |

### 4.9 Contact

| Placement | Module | Behaviour |
|---|---|---|
| Page body | Simple HubSpot + Calendly (M1) | People who typed “contact” want a normal door |
| Optional | M4 helper | Not the hero |

### 4.10 Book a Call pages

| Placement | Module | Behaviour |
|---|---|---|
| Page | **M1 only** (Calendly inline) | Do not stack M2 here — they already chose hot path |
| After booking | Thank-you (noindex) | Already exists |

### 4.11 Start Hiring funnel

| Placement | Module | Behaviour |
|---|---|---|
| `/start-hiring/*` | **M3 only** | Real HubSpot steps. Optional top link: “Rather talk? Book a call”. |

### 4.12 Blog / resources / downloads / videos / tools / stories / reviews

| Placement | Module | Behaviour |
|---|---|---|
| In-content / end of article | Soft M1 | “Want this applied to your team? Book 15 mins” |
| Downloads | **Ungated** + soft M1 after | No email wall (D7) |
| Tools / calculators (standalone → pricing) | Same as Pricing M2 when calculator completes | |
| Resource hubs | Browse mode; footer/header only | Don’t interrupt listing grids with M2 |

### 4.13 For Developers (talent lane — different audience)

| Placement | Module | Behaviour |
|---|---|---|
| Join / build profile form | **Talent join** (not client M2) | Separate track — engineers joining the network |
| CTAs | Stay on `#join` / talent CRM | Do **not** mix client hiring brief into this page |

**Design note:** Client conversion system ≠ talent join form. Different goals; don’t unify them into one chat.

### 4.14 About / Our Work / Legal / Thank-yous

| Placement | Module | Behaviour |
|---|---|---|
| About / Our Work mid/final CTA | M1 | Light |
| Legal | None | |
| Thank-you pages | None (noindex) | Confirmation only |

---

## 5. Placement intensity (so the site doesn’t feel like a chatbot maze)

| Intensity | Where | What user sees |
|---|---|---|
| **Full M2** | Pricing (hero), optionally Home calculator + Hire Engineers | Split chat + living brief |
| **M2 lite** | HIW matcher, service page secondary | Shorter questions or “Open brief builder” |
| **M1 only** | Header, Book a Call, Contact, most CTAs | One-click call |
| **M4 only** | Floating helper | Small; can upgrade to M2 |
| **Silent** | Blog grids, legal, thank-yous | No interruption |

**Rule:** Full M2 appears at **interest spikes** (just saw a number, just clicked “get matched”), not on first paint of every page.

---

## 6. Visual / UX rules for Claude Design

### Brand + composition

- CE dark ground + lime accent (site tokens). Not purple SaaS chatbot.
- Pricing M2 = **one composition** under the calculator — not a dashboard of widgets.
- Side brief is the emotional payoff; chat is the quiet interviewer.
- Sweeteners: one at a time, short proof lines (vetting, deep profiles, psychometrics).
- Example engineer cards only after brief threshold — labelled **Examples**.

### Chat UI (M2)

- One question at a time.
- Chips / multiple choice first; free text last.
- Always show Book a Call.
- Progress = brief filling on the right (not a scary % quiz bar).

### Helper (M4)

- Compact launcher; doesn’t steal header CTA.
- Clear CE identity (not a generic “Chat with us!” blob).
- Handoff control: “Build a hiring brief” → expands/navigates to M2.

### Mobile

- M2: chat main + compact sticky brief card + pinned Book a Call.
- M4: standard bottom/side sheet; don’t cover the header CTA.

---

## 7. Context passed into chat / brief (for all placements)

Whenever M2 opens, pre-fill what we already know:

- Page type + URL  
- Locale (US / UK)  
- Role / service / technology slug if any  
- Location region if on a location page  
- Calculator outputs if any (seniority, estimate range)  
- CTA that opened it (“get matched at this rate”, “find your CTO”, etc.)

Design the brief so empty fields look intentional (“Waiting — answer in chat”), not broken.

---

## 8. Claude Design — frame list (produce these)

### A. System kit
1. M1 Schedule a Call button states (header + in-module)  
2. M2 desktop split: empty / mid / brief-ready (+ sweetener + example cards)  
3. M2 mobile stack  
4. M4 floating helper: collapsed / open / handoff-to-M2  
5. Sweetener chips/cards set (vetting, deep profile, psychometrics, “2 profiles in ~7 days”)

### B. Site placements (priority order)
6. **Pricing** — calculator result → M2 (hero)  
7. **Home** — calculator CTA opening M2  
8. **Hire Engineers** — hero + replace dead find-form with M2 handoff  
9. **Fractional CTO** — match CTA → M2 or M1  
10. **Location** — hero dual door (call + build brief)  
11. **How It Works** — matcher area → M2 lite  
12. **Service detail** — end CTA band (M1 + secondary M2)  
13. **Blog article end** — soft M1 only  
14. **Download thank-you / after ungated download** — soft M1  
15. **Contact** — simple form + Calendly (no M2 hero)  
16. **For Developers** — talent join (explicitly separate)

### C. Escape + trust
17. First chat screen with “Skip — book a call now”  
18. Example cards with honest “Example shortlist style” labelling  
19. Brief-ready state pitching the call without guilt

---

## 9. Ship sequence (so design doesn’t block launch)

| Stage | What ships | Design |
|---|---|---|
| **V1** | M1 stronger on Pricing calculator result (Option A) | Light |
| **V2** | M2 shell on Pricing (scripted questions OK) + side brief + sweeteners | **This brief** |
| **V3** | Jake’s AI app powers M2/M4; structured brief → HubSpot | Embed |
| **V4** | Roll Full M2 / M2 lite to Home, Hire Engineers, Locations, HIW per map above | Same kit, new placements |

---

## 10. Open decisions for Jake (answer in design review)

1. Home calculator: **inline M2** or send to `/pricing#refine`?  
2. Hire Engineers / FCTO dead forms: **replace with M2** or button handoff only?  
3. Sitewide M4: ship with V2 or after Pricing M2 is proven?  
4. Talent (For Developers): confirm stays a **separate** system.  
5. Which sweeteners are legally/sales-safe to claim (esp. psychometrics)?

---

## 11. Bottom line for Claude Design

**Design one kit (M1–M4), then place it by intent:**

- **Pricing** = full refinement theatre (chat + brief + sweeteners).  
- **Interest spikes** elsewhere = same module or a lite handoff.  
- **Header** = always Book a Call.  
- **Browse pages** = soft CTAs only.  
- **Talent** = different funnel.  

Utopia is not “chat everywhere.”  
Utopia is **the right door at the right moment, sitewide, with one visual language.**
