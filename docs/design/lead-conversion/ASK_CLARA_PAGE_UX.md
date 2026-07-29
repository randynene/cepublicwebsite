# Ask AI anything - Claude Design brief (living hiring brief)

> **Feed this whole file into Claude Design.**  
> Owner: Jake. Status: **LOCKED for Design** (29 Jul 2026).  
> Parent: `LEAD_CONVERSION_SYSTEM_UX.md` + `LEAD_CONVERSION_EXECUTION_PLAN.md`.  
> Wireframe intent: Jake Stage 1 / Stage 2 sketches (chat LEFT, visual RIGHT).  
> This is a full-page CE experience, not Clara’s floating widget.

---

## 0. One-sentence brief

Visitor lands on **Ask AI anything**: chats with **Clara on the left**; on the
**right**, full marketing until a clear hiring signal, then a living hiring brief
builds on top while marketing drops to a smaller rotating strip - dark/lime CE
skin, soft handoff to a human when the brief is strong (no fake “we matched you”).

---

## 1. Locked decisions (Jake 29 Jul 2026)

| # | Decision |
|---|---|
| Layout | **Chat LEFT · visual RIGHT** |
| Page label | **Ask AI anything** (route suggestion `/ask`) |
| Skin | **CE dark/lime** (not the light-grey sketch, not Clara widget chrome) |
| Stage flip | **Stage 1 → Stage 2 on first clear hiring signal** |
| Match copy | **Option A only** - “Your brief is strong enough for a human shortlist.” Never imply live database matches. |
| Chrome | Top: **Cloud Employee logo + Schedule a Call** (and existing site header norms). No extra conversion clutter in the hero of this page. |
| Hide | User can **hide / show the whole right column** |
| Big team | If headcount **≥ 5** OR **≥ 3 distinct roles** → recommend working with a human rather than over-building the collage |
| Voice | **Primary nudge** in empty chat (design the mic / dictation affordance) |
| Attach | Paperclip may appear as a light secondary control; not the hero of v1 |
| In-page Book a Call | **Not pushed on arrival.** Soft offer in chat / on brief when Stage 2 brief looks strong. Header Schedule a Call always remains. |

---

## 2. Architecture (for Design context - do not invent another split)

| Layer | Owner | Job |
|---|---|---|
| Page, chat shell, right visual, hide control, CTAs | **CE Next.js** | What the visitor sees |
| Stage 1 marketing (testimonials, Did you know, case studies) | **Sanity** (static) | Right rail before hiring signal |
| Chat talking | **Clara API** (headless, later) | Streaming answers |
| Structured brief fields | **Clara emits**; **CE renders** | Living brief |
| Live brief mid-session | **Not Sanity** | Session state; HubSpot only on book/save |

Design the right panel as if it receives a clean JSON brief over time. Do not
design scraping of chat bubbles.

---

## 3. Two visual stages (mandatory frames)

### Stage 1 - General questions (no clear hiring signal yet)

```
┌──────────────────────────────────────────────────────────────┐
│  [CE logo]                              [Schedule a Call]    │
├─────────────────────────────┬────────────────────────────────┤
│  LEFT - Clara chat          │  RIGHT - FULL marketing        │
│                             │                                │
│  Clara avatar + welcome:    │  Rotating:                     │
│  “Hi, I’m Clara…”           │  - Testimonials                │
│  Suggested question chips   │  - Did you know…               │
│  Composer + voice nudge     │  - Case study bites            │
│                             │                                │
│  (Pricing / terms / general │  No profile card yet           │
│   Q&A stays here forever    │                                │
│   if they never hire-signal)│  [Hide panel]                  │
└─────────────────────────────┴────────────────────────────────┘
```

**Stage 1 rules**
- Entire right column = promotional / proof content with **rotating animation**.
- Chat can fully answer non-hiring questions (terms, pricing explainers, how it works).
- Do **not** invent a half-empty profile. No fake progress.
- Soft control in chat is OK: “Are we asking too many questions?” (tone: visitor in control).

### Stage 2 - Clear hiring signal detected

```
┌──────────────────────────────────────────────────────────────┐
│  [CE logo]                              [Schedule a Call]    │
├─────────────────────────────┬────────────────────────────────┤
│  LEFT - Clara chat          │  RIGHT TOP - Living brief      │
│  keeps probing gently       │  Profile OR team collage       │
│  “Too many questions?”      │  grows as they answer          │
│                             ├────────────────────────────────┤
│  When brief is strong:      │  RIGHT BOTTOM - Marketing      │
│  soft human handoff in chat │  (shrunken rotating strip)     │
│  (see §6)                   │  [Hide whole right column]     │
└─────────────────────────────┴────────────────────────────────┘
```

**Flip trigger:** first clear hiring signal  
Examples: “I need a senior React dev”, “hire 3 engineers in PH”, “replace our agency squad”.  
Non-triggers: “What are your terms?”, “How does pricing work?”, “Where are you based?”

**Motion:** one calm morph - marketing full-bleed → brief takes the upper right,
marketing compresses to the lower strip. Not a hard page reload feel.

---

## 4. Left - Clara chat (both stages)

Must include:
- Clara logo / avatar
- Opening: **“Hi, my name is Clara…”** + one light probe (“What’s on your mind - a hire, pricing, or how we work?”)
- **Templated example question chips** (3–5). Mix general + hiring so Stage 1 and Stage 2 are both reachable.
- Streaming bubbles (design CE dark chat, not Clara’s default widget)
- Composer: text input, **voice/mic prominent**, send
- Helper line OK: voice dictation hint
- Control: **“Are we asking too many questions?”** → Clara backs off / offers to summarise or stop probing
- Visitor feels in control; no interrogating form energy

**Do not** put a giant Schedule a Call button inside the chat on landing.
Header CTA is enough until §6.

---

## 5. Right - living brief (Stage 2 top)

### Mode B - Single hire (1 person / 1 role intent)
One strong **hiring brief / role profile** card that fills live:
- Role title
- Seniority
- Tech stack chips
- Region / timezone
- Engagement (full-time / duration) if known
- Short scope line (“What they’re hiring for”)
- Brief strength / completeness (progress, not a quiz score)
- Label: **Your hiring brief** - never “Matched engineer”

### Mode C - Team (2+ people, below “big” threshold)
**Team collage / scope board** (not many fake headshots):
- Headcount
- Role mix
- Stacks
- Regions
- Timeline
- Visual densifies as fields arrive

### Mode D - Big team (recommend human)
If **headcount ≥ 5** OR **≥ 3 distinct roles**:
- Stop trying to perfect a giant collage
- Right top becomes a **clear scope summary** + message: best next step is a human working session
- Chat soft-offers Schedule a Call (still Option A language - no fake matches)

**Switch rules**
- count unknown → soft skeleton until Clara clarifies 1 vs many  
- count = 1 → Mode B  
- count 2–4 (and &lt; 3 distinct roles) → Mode C  
- big threshold → Mode D  

---

## 6. Human handoff (when brief looks good)

Only after the brief is meaningfully filled (Stage 2, strong):

Clara tone (Option A):
> “This brief looks solid. Want to get put in touch with a human? We’ve got
> enough to run a proper shortlist conversation.”

- Primary action: **Schedule a Call**
- Secondary: keep refining in chat
- **Forbidden:** “I’m already seeing matched profiles in our database” (unless
  later product can show real anonymised inventory - out of scope now)

---

## 7. Hide control

- Control toggles **the entire right column** (marketing and/or brief).
- Chat remains full-width when right is hidden.
- Easy to bring the panel back.

---

## 8. Motion (2–3 intentional)

1. Stage 1 → 2: right column morphs; marketing slides/compresses to bottom strip.
2. Each brief field fill: calm chip/card settle.
3. Mode B ↔ C ↔ D: one morph when headcount/role mix changes - not a jarring cut.

---

## 9. Frames Claude Design must deliver

1. **Stage 1 desktop** - chat left + full marketing right + header logo/CTA + voice nudge + chips  
2. **Stage 2 desktop - single hire** - brief building top-right, marketing strip bottom-right  
3. **Stage 2 desktop - team collage** - same split, Mode C  
4. **Stage 2 desktop - big team / human recommend** - Mode D + soft Schedule a Call in chat  
5. **Stage 2 desktop - right column hidden** - chat expanded  
6. **Mobile** - chat primary; brief as sheet/stack that appears after hiring signal  

Also annotate: Option A handoff copy; no fake match; dark/lime.

---

## 10. Out of scope for this design pass

- Clara `hiring_brief` API implementation
- HubSpot property mapping
- Real talent-inventory matching
- Replacing every sitewide demo form (placement after this page exists)
- For Developers / talent join

---

## 11. Build note (not for Design)

Shell can ship with guided chips + local brief state first.  
Clara headless chat + structured brief events wire into the **same** shells later.
Design the end state now.
