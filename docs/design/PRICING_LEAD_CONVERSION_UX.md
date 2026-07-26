# Pricing lead conversion UX — scope + conversion audit

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
5. The AI chat comes from **Jake’s separate app / database**, embedded into this
   site later — this doc scopes the UX contract so design + integration stay aligned.

**Ship order (do not block launch on utopia):**

| Stage | Experience | Blocks launch? |
|---|---|---|
| **V1 — Option A** | Calculator result → strong “Get a more accurate estimate — book a call” (+ optional short questions) | No — do this first |
| **V2 — This doc** | Chat asks key questions → side brief builds → sweeteners → book a call | Design now, build after V1 |
| **V3** | Jake’s AI app fully powers the chat + writes structured brief into HubSpot / CRM | After embed is ready |

---

## 2. Conversion audit — is this the best way to convert?

### Verdict

**Yes — as the *warm-path* utopia on Pricing, with a permanent one-click Book a Call escape.**  
**No — as the *only* door.** Hot visitors who already want a human will bounce if chat is mandatory.

This pattern scores high on both goals Jake cares about:

| Goal | How this pattern helps |
|---|---|
| **Butter them up** | Estimate → guided questions → living brief → vetting sweeteners → desire for real profiles |
| **Collect useful data non-intrusively** | Progressive Q&A; value shown as the brief fills; email only at book/submit |
| **Convert repeatedly** | Same module can later mount on Home calculator, Hire Engineers, Locations |

### Why it can beat “just Book a Call”

- Calculator users are **warm**, not cold — they will answer 3–5 good questions if each answer visibly upgrades the side panel.
- A living brief makes the interaction feel like **progress**, not a form.
- Sweeteners (vetting / psychometrics / deep profiles) sell the *method*, which is CE’s real differentiator vs a rate table.
- Chat feels lighter than a multi-step HubSpot wall for people not ready to talk.

### Where it fails (design must avoid these)

1. **Chat as a trap** — if Book a Call is hidden, hot leads churn. Always show it.
2. **Fake matching** — never say “We found your engineer” from chat answers alone. Say “Your brief is ready — here’s what shortlists look like / book to get yours.”
3. **Too many questions** — max **4–6 critical** before the first hard CTA. More only if they opt to continue.
4. **Sweetener spam** — vetting proof should support the story, not interrupt every reply with a carousel.
5. **Email too early** — do not gate the first answers behind email. Ask identity when they book or explicitly save the brief.
6. **Tiny floating bubble only** — for this Pricing moment, chat should feel like a **panel experience**, not a ignored widget in the corner.

### Compared to alternatives

| Approach | Conversion quality | Butter | Data quality | Verdict |
|---|---|---|---|---|
| Calculator → Book a Call only (V1) | High for hot traffic | Medium | Low (role/region/seniority only) | **Ship first** |
| Calculator → long HubSpot form | Medium | Low | High | Feels salesy on Pricing |
| Calculator → email for PDF quote | Low–medium | Low | Medium | Rejected (D7) |
| **Calculator → chat Qs + side brief + sweeteners + Book a Call** | **Highest for warm traffic** | **Highest** | **High (structured)** | **Utopia** |
| AI chat sitewide with no Pricing module | Medium | Medium | Uneven | Helper lane, not Pricing hero |

**Best overall system:** V1 always available + this utopia as the default refinement path for people who engage after the estimate.

---

## 3. Utopia user flow (happy path)

```
1. User sets role / region / seniority on Pricing calculator
2. Sees estimate + savings
3. Refinement panel opens (or scrolls into view):
      LEFT: AI chat — “Want a more accurate picture? 4 quick questions.”
      RIGHT: Hiring brief starts with calculator data already filled
4. Chat asks only the highest-signal questions (see §5)
5. Each answer updates the right-hand brief (progress, not a quiz score)
6. After enough data:
      - Brief reaches “Ready for a tailored estimate”
      - Example shortlist style cards may appear (labelled examples)
      - Sweeteners unlock: technical vetting, deep profile, psychometrics
7. Primary CTA: Schedule a call (pre-filled context from brief)
   Secondary: Continue in chat / Start Hiring if they prefer async
8. On book or explicit save → identity + brief to HubSpot / Jake’s app DB
```

**Escape hatch at every step:** “Skip — book a call now.”

---

## 4. What the chat app should look like (UX direction)

This is for Claude Design. Not final pixels — composition rules.

### 4.1 Layout (desktop)

**Split panel under / beside the calculator result — one composition, not a dashboard.**

```
+---------------------------+------------------------------+
|  AI chat                  |  Living hiring brief         |
|  - short messages         |  - role / region / seniority |
|  - 1 question at a time   |  - stack / must-haves        |
|  - quick-reply chips      |  - timeline / team size      |
|  - “Book a call” always   |  - estimate range            |
|    visible as text link   |  - then: example profile     |
|    or secondary button    |    cards + vetting proofs    |
+---------------------------+------------------------------+
```

- Left chat ~45%, right brief ~55% (brief is the emotional payoff).
- Dark CE ground, lime accent — match site tokens, not a generic chatbot skin.
- One question visible at a time; previous answers collapse into short summary chips.
- Prefer **tap chips / multiple choice** over typing for the first 4 questions (faster, cleaner data). Allow free text on “anything else?”

### 4.2 Mobile

- Calculator result first.
- Chat takes the main column.
- Brief is a **sticky compact card** under the composer (“Brief: 3/5 ready”) that expands full-screen on tap.
- Book a call pinned in the sticky footer of the module.

### 4.3 Chat personality

- Concise, expert, human — CE voice, not “Hey friend!!!”.
- Each question explains *why* in half a line (“This changes seniority banding and vetting depth”).
- Never guilt them for skipping.
- After enough data, chat itself pitches the call: “I can keep going, or a matcher can turn this brief into two real profiles — usually within 7 days.”

### 4.4 Entry points (where chat appears)

| Priority | Entry | Behaviour |
|---|---|---|
| P0 | Pricing calculator result | Opens the split panel (this module) |
| P1 | Home calculator CTA | Same module or deep-link into Pricing module with state |
| P2 | Sitewide floating chat | Lighter helper; can hand off into Pricing brief module when topic = pricing/hiring |
| P3 | Hire Engineers / Locations | Same pattern later |

Floating sitewide chat ≠ this Pricing module. Same AI brain, different shells.

### 4.5 Integration contract (Jake’s separate app)

Design assumes the embed can:

- Accept **initial context** from the calculator (role, region, seniority, estimate range, locale, page URL).
- Emit **structured brief updates** (JSON fields in §5) to the parent page so the side panel can render without scraping chat text.
- Emit **intent events**: `brief_ready`, `book_call_clicked`, `handoff_to_human`.
- Support **Book a Call** URL with query/notes payload (role, region, seniority, brief id).
- Live on Jake’s DB; CE site does not become source of truth for chat transcripts.

Until the app is ready: V1 Book a Call only; V2 can use a scripted question UI with the same side brief (same design, fake AI), then swap the left rail to the real app.

---

## 5. Questions + side brief data model

### 5.1 Highest-signal questions (max 6 before first hard CTA)

Suggested order (edit in design review):

1. **What are you hiring for?** (role confirm / refine — may already be known)
2. **Must-have stack or skills?** (chips + optional other)
3. **Seniority / years?** (if not already from calculator)
4. **When do you need someone?** (ASAP / 2–4 weeks / exploring)
5. **How many seats?** (1 / 2–3 / team)
6. **Anything a matcher must know?** (free text, optional)

Stop at “brief ready” after 4 if 1–4 are answered; 5–6 are bonus.

### 5.2 Side panel — hiring brief fields

Visual profile = **their hiring brief**, not a fake engineer at first.

- Role  
- Region  
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

---

## 6. Marketing sweeteners (butter layer)

Show CE’s depth of profiling **as the brief builds**, not as a separate brochure page.

Suggested sweetener modules (rotate or unlock in sequence):

| Sweetener | Message | When to show |
|---|---|---|
| Technical vetting | Pair-programming / senior-led technical bar | After skills question |
| Deep profiles | Notes on stack fit + working style, not CV spam | When brief hits 50% |
| Psychometric / culture | Matched to how your team actually works | After “matcher must know” or brief ready |
| Speed proof | “Two vetted profiles in ~7 days” | At brief ready, next to Book a Call |

**Rules:**

- One sweetener at a time; short (1 line + icon/proof mark).
- Never block the next question behind a sweetener.
- Prefer proof over adjectives (“senior engineers run the sessions” > “world-class”).

---

## 7. Conversion doors (always available)

| Door | Label direction | When |
|---|---|---|
| **Primary** | Get a tailored estimate — book a call | Always visible; emphasized at brief ready |
| **Secondary** | Keep refining in chat | While they are engaged |
| **Tertiary** | Prefer a form? Start Hiring | For async detail lovers |
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

Secondary: chat → Start Hiring handoff rate; bounce from panel without CTA.

---

## 9. What Jake designs in Claude Design

Please produce frames for:

1. Pricing calculator **result state** with refinement panel closed vs open  
2. Desktop **split: chat + living brief** (empty / mid / brief-ready)  
3. Brief-ready with **one sweetener + example profile cards + Book a call**  
4. Mobile stack: chat + compact brief + pinned CTA  
5. Escape: “Skip — book a call now” from first chat screen  
6. Optional: sitewide floating chat handoff into this module  

Use existing CE dark/lime language. No purple SaaS chatbot clichés. No email gate on screen 1.

---

## 10. Open questions for Jake (before build)

1. Is the side panel **only the hiring brief** at first, or brief + example engineers from the first unlock? (Rec: brief first, engineers at ready.)  
2. Should “Save my brief” ever ask for email without booking? (Rec: optional, after ready only.)  
3. Which 4 questions are sacred for v1 of the chat script?  
4. Does Jake’s AI app already expose an embed + structured events, or do we design the shell first and plug the brain in at V3?  
5. Any sweeteners that are **claims we must not make** until legal/sales approve (e.g. psychometric)?

---

## 11. Bottom line

**Best conversion system for CE Pricing:**

> Show the number → let AI ask a few high-signal questions → build their brief visually while selling how deep CE profiles are → always offer Schedule a Call for the real shortlist.

That is the highest-probability warm-lead converter **if** Book a Call stays one click away and we never fake a completed human match.

V1 still ships Option A. This doc is the utopia Jake designs next.
