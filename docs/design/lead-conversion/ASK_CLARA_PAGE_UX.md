# Ask Clara page - Claude Design brief (living hiring brief)

> **Feed this file into Claude Design.**  
> Owner: Jake. Status: Design now (29 Jul 2026).  
> Parent system: `LEAD_CONVERSION_SYSTEM_UX.md` + `LEAD_CONVERSION_EXECUTION_PLAN.md`.  
> This is the full-page M2 experience (dedicated route), not the tiny widget.

---

## 0. One-sentence brief

A full-page CE experience: visitor chats with Clara on the **right**; on the
**left**, marketing proof first, then a **living hiring brief** that builds into
a strong visual profile (or a team collage) as they talk - always one click from
Schedule a Call.

---

## 1. Architecture (locked for design - do not invent a different split)

| Layer | Owner | Job |
|---|---|---|
| Page chrome, left visual, right chat shell, CTAs | **Cloud Employee Next.js** | What the visitor sees |
| Pre-chat marketing copy / proof assets | **Sanity** (static content) | Empty-state left rail |
| Chat conversation (talking) | **Clara API** (headless) | Answers, streaming text |
| Structured brief fields (roles, count, stacks, region…) | **Clara emits** structured updates; **CE stores + renders** | Living brief |
| Live session brief document | **Not Sanity** | Ephemeral session state (client + Clara session); HubSpot only on book/save |

**Plain English:** Clara does the talking and the understanding. The CE site draws
the picture. Sanity holds the marketing panels shown before anyone has spoken.
Sanity does **not** hold the live hiring profile mid-chat.

Design the UI as if the left panel receives a clean JSON brief that updates over
time. Do not design scraping of chat bubbles.

---

## 2. Route + entry

- Primary route to design: `/ask` (name can be “Ask Clara” / “Build your brief” -
  final slug can flex; design for a dedicated full page).
- Entry points later: Pricing after calculator, Hire Engineers “get matched”,
  header/helper “Ask AI”, Home interest spikes.
- Escape hatch always visible: **Schedule a Call** → `/book-a-call`.
- Secondary: **Contact** → `/contact`.

---

## 3. Layout (desktop) - one composition

```
┌─────────────────────────────────────────────────────────────┐
│  Header (existing CE chrome)         [Schedule a Call]      │
├────────────────────────────┬────────────────────────────────┤
│  LEFT (~55%)               │  RIGHT (~45%)                  │
│  Living visual stage       │  Clara chat                    │
│                            │                                │
│  BEFORE first user message │  Welcome + suggested prompts   │
│  → marketing materials     │  Input always ready            │
│                            │                                │
│  AFTER signals appear      │  Streaming replies             │
│  → hiring brief builds     │  Book a call sticky in chat    │
└────────────────────────────┴────────────────────────────────┘
```

**Mobile:** chat primary; brief is a sheet / stacked panel above or below that
updates as they type - not a second competing app.

**Hard rules**
- One composition, not a dashboard of cards.
- Brand / CE signal strong in first viewport (logo + headline + lime accent).
- No fake “we matched you an engineer” from chat alone.
- Book a Call always one click away (header + in-panel).
- Dark/lime CE visual language (not Clara’s default widget look).
- Do **not** draw Clara’s floating bubble / iframe chrome.

---

## 4. Left rail states (this is the product)

### State A - Before they speak (marketing)
Show why CE is worth talking to. Examples (design 3–5 modules, not all at once):
- Short value line (“Embedded engineers that feel in-house”)
- Proof: vetting / deep profiles / psychometrics (sweetener strip)
- Sample anonymised profile silhouette (labelled **example**)
- Soft prompt: “Tell Clara who you’re hiring - your brief builds here”

Empty left must still feel premium, not a blank void.

### State B - Single hire (exactly 1 role / 1 person intent)
Build **one strong profile card** live:
- Role title
- Seniority
- Tech stack chips
- Region / timezone preference
- Engagement (full-time / part-time / contract length if known)
- Team context (joins existing team / greenfield) if known
- Progress meter: “Brief strength” (not a quiz score)
- Label truthfully: **Your hiring brief** (never “Matched engineer”)

### State C - Team hire (2+ people)
Do **not** stamp out many fake headshots. Build a **team collage / scope board**:
- Headcount (e.g. “3 engineers”)
- Role mix if known (2 backend, 1 frontend)
- Shared + per-role tech stacks
- Regions
- Timeline / start
- One visual composition that densifies as they talk

**Switch rule for design:** if count = 1 → State B; if count ≥ 2 → State C.
If count unknown, stay in a soft hybrid until Clara clarifies.

### State D - Brief ready
- Left reaches a “Ready to review with a human” completeness
- Primary CTA: Schedule a Call (brief context implied)
- Optional: Continue refining in chat

---

## 5. Right rail - chat (Clara-powered later)

Design CE-owned chat UI:
- Agent name: Clara (or workspace display name)
- Welcome message + 3–4 suggested chips (“Hire one senior React”, “Build a squad
  of 3”, “Replace an agency”, “Not sure - help me scope”)
- Streaming assistant bubbles
- Sticky composer
- Persistent mini CTA: “Skip - book a call”
- No HubSpot fields in the chat for v1; identity at book/save only

---

## 6. Brief fields the visual should anticipate

Design empty → partial → filled treatments for:

| Field | Notes |
|---|---|
| `headcount` | 1 vs ≥2 drives State B vs C |
| `roles[]` | title, seniority, count per role |
| `tech_stacks[]` | chips |
| `regions[]` | PH / EE / LATAM / mixed |
| `engagement` | full-time, part-time, duration |
| `timeline` | ASAP / date / exploratory |
| `company_context` | optional, late |
| `goals` | short plain text |

Unknown fields stay as subtle placeholders, not errors.

---

## 7. Motion (2–3 intentional)

1. First structured signal: left morphs marketing → brief skeleton.
2. Each field fill: chip/card settles in (short, calm - not confetti).
3. 1 → team switch: profile card expands into collage (one morph, not a hard cut).

---

## 8. What Design must deliver

Frames:
1. Desktop empty (State A + chat welcome)
2. Desktop single-hire mid-brief (State B)
3. Desktop team collage mid-brief (State C)
4. Desktop brief-ready + Book a Call emphasis (State D)
5. Mobile stacked equivalent of B or C

Also annotate: always-visible Schedule a Call; no fake match copy.

---

## 9. Out of scope for this design pass

- Building the Clara `hiring_brief` API (engineering after design)
- HubSpot property mapping
- Replacing every demo form sitewide (placement comes after page exists)
- Talent / For Developers join flow

---

## 10. Build note (for later - not for Design)

V2 can ship the shell with guided chips and local brief state.  
V3 wires Clara chat + structured brief events into the same shells.
Do not wait on V3 to design; design the end state now.
