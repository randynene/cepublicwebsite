# Pricing lead conversion UX - scope + conversion audit

> Owner: Jake. Status: **Strategy draft for Claude Design** (26 Jul 2026).  
> Related roadmap decisions: D7 (intent lanes), D8 (Pricing conversion) in
> `docs/ROADMAP_TO_COMPLETION.md`.  
> **Parent brief (feed this into Claude Design for sitewide placement):**  
> `docs/design/LEAD_CONVERSION_SYSTEM_UX.md`  
> This file is the **Pricing hero module** deep dive (audit, questions, metrics).

---

## 1. What we are designing

After someone uses the Pricing calculator and sees an estimate, we do **not**
only show a dead “Contact us” button.

We open a **refinement moment**:

1. Chat asks a few **most important** questions.
2. As soon as there is enough data, a **profile / hiring brief builds on the side**.
3. We layer **marketing sweeteners** that show how CE actually works
   (technical vetting, deep profiles, psychometric profiling, etc.).
4. The visitor can always **Schedule a call** for a human accurate estimate /
   real shortlist.
5. The conversation backend can be an extended **headless Clara service** if it
   passes the audit gates. The CE site owns the visible M2 shell and living brief.

**Ship order (do not block launch on utopia):**

| Stage | Experience | Blocks launch? |
|---|---|---|
| **V1 - Option A** | Calculator result → strong “Get a more accurate estimate - book a call” (+ optional short questions) | No - do this first |
| **V2 - This doc** | Chat asks key questions → side brief builds → sweeteners → book a call | Design now, build after V1 |
| **V3** | A headless backend (Clara if it passes the audit gates) powers the CE-owned chat + structured brief | After API/security/data contract is ready |

---

## 2. Conversion audit - is this the best way to convert?

### Verdict

**Hypothesis, not a proven conversion fact:** this is a strong warm-path candidate,
with a permanent one-click Book a Call escape. It must beat V1 on booked calls and
qualified opportunities before it becomes the default experience.

It should not be the only door. Hot visitors who already want a human may abandon
the journey if chat is mandatory.

This pattern scores high on both goals Jake cares about:

| Goal | How this pattern helps |
|---|---|
| **Butter them up** | Estimate → guided questions → living brief → vetting sweeteners → desire for real profiles |
| **Collect useful data non-intrusively** | Progressive Q&A; value shown as the brief fills; email only at book/submit |
| **Convert repeatedly** | Same module can later mount on Home calculator, Hire Engineers, Locations |

### Why it can beat “just Book a Call”

- Calculator users are **warm**, not cold - they may answer 3–5 good questions if each answer visibly upgrades the side panel.
- A living brief makes the interaction feel like **progress**, not a form.
- Sweeteners (vetting / psychometrics / deep profiles) sell the *method*, which is CE’s real differentiator vs a rate table.
- Chat feels lighter than a multi-step HubSpot wall for people not ready to talk.

### Where it fails (design must avoid these)

1. **Chat as a trap** - if Book a Call is hidden, hot leads may leave. Always show it.
2. **Fake matching** - never say “We found your engineer” from chat answers alone. Say “Your brief is ready - here’s what shortlists look like / book to get yours.”
3. **Too many questions** - max **4–6 critical** before the first hard CTA. More only if they opt to continue.
4. **Sweetener spam** - vetting proof should support the story, not interrupt every reply with a carousel.
5. **Email too early** - do not gate the first answers behind email. Ask identity when they book or explicitly save the brief.
6. **Tiny floating bubble only** - for this Pricing moment, chat should feel like a **panel experience**, not an ignored widget in the corner.

### Compared to alternatives

| Approach | Conversion quality | Butter | Data quality | Verdict |
|---|---|---|---|---|
| Calculator → Book a Call only (V1) | High for hot traffic | Medium | Low (calculator context only) | **Ship first** |
| Calculator → long HubSpot form | Medium | Low | High | Feels salesy on Pricing |
| Calculator → email for PDF quote | Low–medium | Low | Medium | Rejected (D7) |
| **Calculator → chat Qs + side brief + sweeteners + Book a Call** | Hypothesized high (test required) | High | High (structured) | **Candidate utopia** |
| AI chat sitewide with no Pricing module | Medium | Medium | Uneven | Helper lane, not Pricing hero |

**Working hypothesis:** V1 remains the baseline. Roll out M2 gradually and keep it
only if it lifts Book a Call clicks, Calendly bookings, and qualified HubSpot
opportunities rather than merely increasing chat engagement.

---

## 3. Utopia user flow (happy path)

```
1. User sets developer count, talent region, comparison country, and currency on the Pricing calculator
2. Sees estimate + savings
3. Refinement panel opens (or scrolls into view):
      LEFT: guided questions / AI chat - “Want a more accurate picture? 4 quick questions.”
      RIGHT: Hiring brief starts with calculator data already filled
4. Chat asks only the highest-signal questions (see §5)
5. Each answer updates the right-hand brief (progress, not a quiz score)
6. After enough data:
      - Brief reaches “Ready for a tailored estimate”
      - Example shortlist style cards may appear (labelled examples)
      - Sweeteners unlock: technical vetting, deep profile, psychometrics
7. Primary CTA: Schedule a call (pre-filled context from brief)
   Secondary: Continue refining / explicitly save the brief if offered
8. On book or explicit save → identity + brief to HubSpot / approved backend DB
```

**Escape hatch at every step:** “Skip - book a call now.”

---

## 4. What the chat app should look like (UX direction)

This is for Claude Design. Not final pixels - composition rules.

### 4.1 Layout (desktop)

**Split panel under / beside the calculator result - one composition, not a dashboard.**

```
+---------------------------+------------------------------+
|  Guided/AI chat           |  Living hiring brief         |
|  - short messages         |  - calculator context        |
|  - 1 question at a time   |  - stack / must-haves        |
|  - quick-reply chips      |  - timeline / team size      |
|  - “Book a call” always   |  - estimate range            |
|    visible as text link   |  - then: example profile     |
|    or secondary button    |    cards + vetting proofs    |
+---------------------------+------------------------------+
```

- Left chat ~45%, right brief ~55% (brief is the emotional payoff).
- Dark CE ground, lime accent - match site tokens, not a generic chatbot skin.
- One question visible at a time; previous answers collapse into short summary chips.
- Prefer **tap chips / multiple choice** over typing for the first 4 questions (faster, cleaner data). Allow free text on “anything else?”

### 4.2 Mobile

- Calculator result first.
- Chat takes the main column.
- Brief is a **sticky compact card** under the composer (“Brief: 3/5 ready”) that expands full-screen on tap.
- Book a call pinned in the sticky footer of the module.

### 4.3 Chat personality

- Concise, expert, human - CE voice, not “Hey friend!!!”.
- Each question explains *why* in half a line (“This changes seniority banding and vetting depth”).
- Never guilt them for skipping.
- After enough data, chat itself pitches the call: “I can keep going, or after a discovery call a matcher can turn this brief into real profiles.” Any delivery-time claim must match sales-approved live copy.

### 4.4 Entry points (where chat appears)

| Priority | Entry | Behaviour |
|---|---|---|
| P0 | Pricing calculator result | Opens the split panel (this module) |
| P1 | Home calculator CTA | Deep-link to `/pricing#refine` with state; inline Home M2 is deferred |
| P2 | Sitewide floating chat | Lighter helper; can hand off into Pricing brief module when topic = pricing/hiring |
| P3 | Hire Engineers / Locations | Same pattern later |

Floating sitewide chat ≠ this Pricing module. Same AI brain, different shells.

### 4.5 Integration contract (CE shell + headless backend)

The Clara repository was audited. Clara is useful as a possible headless backend,
but its current widget/iframe is not the M2 UI. The CE site owns the chat rail and
living brief. A backend must:

- Accept **initial context** from the calculator (developer count, talent region,
  comparison country, currency, estimate range, locale, page URL).
- Emit **structured brief updates** (JSON fields in §5) to the parent page so the side panel can render without scraping chat text.
- Emit **intent events**: `brief_ready`, `book_call_clicked`, `handoff_to_human`.
- Support **Book a Call** context with the calculator fields, answered brief fields, source page, and brief id.
- Keep transcripts in the approved backend database; the CE site is not their source of truth.
- Use signed sessions, durable rate limiting, explicit CORS, versioned schemas,
  webhook verification, and a documented retention/deletion policy.

Until the backend is ready: V1 is Book a Call only; V2 uses **guided scripted
questions** with the same side brief. It must not pretend to be AI. V3 connects
the backend after all gates in `LEAD_CONVERSION_EXECUTION_PLAN.md` §1a pass.

### 4.6 CRM + Calendly handoff contract (required before V3)

| Event | Destination | Minimum payload |
|---|---|---|
| `book_call_clicked` | Calendly context/prefill where supported | brief id, calculator context, role, seniority, skills, timeline, locale, source page |
| `calendly_scheduled` | HubSpot contact + timeline note/deal workflow | same context + Calendly event reference |
| `brief_ready` | Chat backend DB only until identity capture | structured non-PII brief |
| `brief_saved` (explicit) | Approved HubSpot form/API | email + consent + versioned brief JSON |

**Failure rules:**

- Calendly script fails → show a normal `/book-a-call` link.
- HubSpot write fails → booking still succeeds; log/alert without showing success for a saved brief.
- M2/backend fails → V1 estimate + M1 Book a Call still work.
- Never make M1 depend on M2, Clara, or HubSpot success.

---

## 5. Questions + side brief data model

### 5.1 Highest-signal questions (max 6 before first hard CTA)

Suggested order (edit in design review):

1. **What are you hiring for?** (always ask; the current calculator does not collect role)
2. **Must-have stack or skills?** (chips + optional other)
3. **Seniority / years?** (always ask unless the calculator is redesigned to collect it)
4. **When do you need someone?** (ASAP / 2–4 weeks / exploring)
5. **How many seats?** (1 / 2–3 / team)
6. **Anything a matcher must know?** (free text, optional)

Stop at “brief ready” after 4 if 1–4 are answered; 5–6 are bonus.

### 5.2 Side panel - hiring brief fields

Visual profile = **their hiring brief**, not a fake engineer at first.

- Role  
- Talent region (pre-filled from calculator)
- Comparison country (pre-filled from calculator)
- Developer count (pre-filled from calculator)
- Currency (pre-filled from calculator)
- Seniority  
- Monthly estimate range (from calculator)  
- Skills / must-haves  
- Start timing  
- Seats  
- Notes  

**Unlock threshold:** when ≥4 core fields filled → state “Brief ready” + show Book a Call primary + sweeteners + optional example engineer cards.

### 5.3 Example engineer cards (optional, after threshold)

- Label clearly: **“Example of the shortlist style you’d get”** (not “Your matches”).
- 1–2 cards: photo/avatar treatment, role, seniority, stack tags, rate band aligned to estimate.
- CTA on cards = same Book a Call (do not invent a second conversion).
- The existing Pricing hero candidate card is also marketing illustration. If its
  copy implies a real match, apply the same clear example labelling.

---

## 6. Marketing sweeteners (butter layer)

Show CE’s depth of profiling **as the brief builds**, not as a separate brochure page.

Suggested sweetener modules (rotate or unlock in sequence):

| Sweetener | Message | When to show |
|---|---|---|
| Technical vetting | Pair-programming / senior-led technical bar | After skills question |
| Deep profiles | Notes on stack fit + working style, not CV spam | When brief hits 50% |
| Psychometric / culture | **Design-only until sales/legal approves this current capability and wording** | After “matcher must know” or brief ready |
| Speed proof | Use only the sales-approved live SLA wording | At brief ready, next to Book a Call |

**Rules:**

- One sweetener at a time; short (1 line + icon/proof mark).
- Never block the next question behind a sweetener.
- Prefer proof over adjectives (“senior engineers run the sessions” > “world-class”).

---

## 7. Conversion doors (always available)

| Door | Label direction | When |
|---|---|---|
| **Primary** | Get a tailored estimate - book a call | Always visible; emphasized at brief ready |
| **Secondary** | Keep refining in chat | While they are engaged |
| **Tertiary** | Save/email my brief (optional) | Only after brief-ready, with explicit identity/consent; no Start Hiring link |
| **Helper** | Sitewide AI chat | Other pages / general questions |

Identity capture: on **Book a Call** (Calendly) and/or when they explicitly “Save my brief / email me this brief.”

---

## 8. Success metrics (so we know utopia is working)

Optimise this chain, not vanity chat turns:

1. Calculator completes  
2. Refinement panel engages (chat started or question chip clicked)  
3. Brief ready (≥4 fields)  
4. Book a call clicks  
5. Calendly bookings  
6. HubSpot opportunities / matched shortlists  

Secondary: save-brief rate; panel abandonment; M2 failures that fall back to M1.

### 8.1 Analytics + experiment contract

| Event | When | Properties (no raw chat text) |
|---|---|---|
| `calc_complete` | Estimate rendered | talent region, comparison country, dev count, currency, estimate band |
| `m2_panel_open` | Refinement opens | source page, experiment variant |
| `m2_question_answer` | Guided answer selected | question id, answer id |
| `m2_brief_ready` | Required fields filled | brief field count, brief id |
| `m2_book_call_click` | M1 clicked inside M2 | brief id, brief-ready boolean |
| `calendly_scheduled` | Booking confirmed | attribution/session reference |

**Experiment rule:** V1 is the control. V2 starts as a measured variant, not an
automatic 100% replacement. Agree sample size and decision window before launch.
Judge success on booked calls and qualified opportunities, not chat turns.

### 8.2 Privacy, accessibility, and performance gates

- Label V3 as an AI assistant; V2 is “guided questions”.
- Link to privacy information before storing a transcript or identity.
- Define controller/processor, retention, deletion, and UK/EU CMP/consent behavior.
- Focus management, keyboard operation, Escape close, polite live announcements,
  44px controls, reduced motion, and mobile keyboard-safe sticky controls are required.
- Lazy-load M2 after user action. Do not regress Pricing LCP/CLS against V1.
- No-JS or backend failure always leaves the estimate and normal Book a Call link.

---

## 9. What Jake designs in Claude Design

Please produce frames for:

1. Pricing calculator **result state** with refinement panel closed vs open  
2. Desktop **split: chat + living brief** (empty / mid / brief-ready)  
3. Brief-ready with **one sweetener + example profile cards + Book a call**  
4. Mobile stack: chat + compact brief + pinned CTA  
5. Escape: “Skip - book a call now” from first chat screen
6. Optional: sitewide floating chat handoff into this module  

Use existing CE dark/lime language. No purple SaaS chatbot clichés. No email gate on screen 1.

---

## 10. Open questions for Jake (before build)

1. Is the side panel **only the hiring brief** at first, or brief + example engineers from the first unlock? (Rec: brief first, engineers at ready.)  
2. Should “Save my brief” ever ask for email without booking? (Rec: optional, after ready only.)  
3. Which 4 questions are sacred for v1 of the chat script?  
4. **Resolved architecture:** design/build the CE shell first. Clara may be extended
   headlessly at V3 only after the execution-plan gates pass; do not use Clara widget UI as M2.
5. Any sweeteners that are **claims we must not make** until legal/sales approve (e.g. psychometric)?

---

## 11. Bottom line

**Best conversion system for CE Pricing:**

> Show the number → use guided questions (V2) or an AI assistant (V3 after gates)
> to build their brief visually while showing CE’s profiling depth → always offer
> Schedule a Call for the real shortlist.

That is the conversion hypothesis to test. It is worth designing because it gives
value while collecting useful context, but it is not “best” until it beats the V1
Book a Call baseline on bookings and qualified opportunities.

V1 still ships Option A. This doc is the utopia Jake designs next.
