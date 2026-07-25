# Sanity wiring audit — key marketing pages

**Date:** 2026-07-25  
**Scope:** Home, How It Works, Fractional CTO, Hire Engineers (`/services/software-engineers`), Our Work, For Developers (`/for-developers` / “For Engineers”), Location pages (LATAM / Philippines / Eastern Europe).  
**Method:** Code-path audit (page → template → schema → GROQ). No content edits in this pass.

**Status key**
- **WIRED** — editable from Sanity and rendered
- **HARDCODED** — visible in UI, not editable in Studio
- **PARTIAL** — schema exists but unused / ignored / empty fallback
- **MISSING SCHEMA** — needed for editability, no Studio field

---

## Executive summary

| Page | Route | Overall | Biggest gaps |
|---|---|---|---|
| Home | `/` | Mostly wired | Hero slideshow (Kyla/Marcello/etc), Where We Work hubs |
| How It Works | `/how-it-works` | Mostly wired | Matcher stub steps 2–4; talk/FAQ CTA destinations; no videos (by design currently) |
| Fractional CTO | `/services/fractional-ctos` | Mostly wired | Match form not a real submit; FAQ chat href; icons; OG image |
| Hire Engineers | `/services/software-engineers` | Mostly wired | Calculator maths locked; find-form lead submit noop; tour URL often empty |
| Our Work | `/our-work` | Mostly wired | Glassdoor 4.8 hardcoded; some CTA hrefs code-owned; plural story links |
| For Developers | `/for-developers` | Mixed | Join form fully hardcoded; testimonial video has no URL; ghost CTA inert |
| Locations ×3 | `/services/{latam,philippines,eastern-europe}-developers` | Mostly wired | Calculator rates/regions code-owned; hero CTA hrefs; vetted badge |

---

## Home `/`

### Not editable (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Hero slideshow | Kyla / Marcello / Petra / Gabriel cards + skills + “HOW THEY WORK” + “✓ MATCHED” + 7 days / 2:1 stats | HARDCODED (`HERO_PROFILE_CARD_PEOPLE`, `profile-card.tsx`) |
| Hero | Schema still has old `hero.profiles` / `floatingPills` but live UI ignores them | PARTIAL / orphan |
| Where we work | Entire hub strip (names, images, links) | HARDCODED / MISSING SCHEMA (`WHERE_WE_WORK`) |
| Locations (schema) | Old `locations` fields seeded but not rendered | PARTIAL orphan |
| CTA hrefs | Primary `#pricing`, secondary `/how-it-works` | HARDCODED (labels wired) |
| Process video URL | Falls back to hardcoded Vimeo if empty | PARTIAL |
| OG image | Schema field not queried in metadata | PARTIAL |

### Wired well
Trusted-by logos, client story, why-different, process steps/copy, testimonials, included, calculator mock copy, real-engineers marquee, ready-to-find copy, FAQ.

---

## How It Works `/how-it-works`

### Not editable (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Matcher quiz | Steps 2–4 (skills / team size / result) not in schema; UI is static stub | MISSING SCHEMA |
| Matcher | Talk CTAs are non-clickable spans; no real AI/book destinations | MISSING SCHEMA / HARDCODED |
| FAQ fallback CTA | Always `href="#faq"` — doesn’t open chat | HARDCODED |
| Videos | No video fields (page uses stills/photos by current design) | MISSING SCHEMA only if product wants video |
| UK locale | Same singleton for `/uk/how-it-works` — no UK overrides | MISSING SCHEMA |
| OG image | Not fetched | PARTIAL |

### Wired well
Hero + engineer cards, all 4 stages (copy + cards/funnel/handled), de-risk marquee, testimonials, FAQ Q&A, matcher step-1 labels/copy.

---

## Fractional CTO `/services/fractional-ctos`

### Not editable (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Match form | Demo only — no lead submit / HubSpot | MISSING SCHEMA / HARDCODED |
| FAQ side CTA | `href="#"` — no chat URL field | HARDCODED + MISSING SCHEMA |
| Section icons | Does / matched / form icons locked in code | HARDCODED |
| Hero CTA hrefs | `#match` / `#how` only | HARDCODED |
| Card layout offsets | Hidden; spliced from static for stega safety | PARTIAL |
| OG image | `og: false` | MISSING SCHEMA |
| Images | Schema wired but often empty in prod (placeholders) | PARTIAL (data, not code) |

### Wired well
Almost all copy, video URL/poster fields, does cards, statement, matched steps, derisk, self-check, FAQ Q&A, final CTA copy.

---

## Hire Engineers `/services/software-engineers`

### Not editable (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Pricing calculator | Role/region/seniority option keys + maths locked in code; Studio option fields ignored | HARDCODED / PARTIAL |
| Find form | `sendLead = () => {}` — no CRM submit | HARDCODED |
| Talk/Book pills | `href="#"` | HARDCODED |
| How “More” link | `href="#"` | HARDCODED |
| Role cards | No hrefs (non-navigating) | HARDCODED |
| Icons | Offer/role/step icons in code | HARDCODED |
| OG image | Missing | MISSING SCHEMA |
| Tour video | Field wired; often empty → inert | PARTIAL (data) |

### Wired well
Hero/offer/roles/how/vetting/proof/price labels/find copy/final CTA + image/video slots.

---

## Our Work `/our-work`

### Not editable (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Glassdoor rating number `4.8/5` | Hardcoded constant | HARDCODED / MISSING SCHEMA |
| Hero / Impact CTA hrefs | Forced to `/customer-stories` in transform | HARDCODED |
| Mid CTA href | Forced to `/book-a-call` | HARDCODED |
| Story card URLs | Use plural `/customer-stories/{slug}` (301 to singular) | PARTIAL |
| Photo tiles | Schema optional; empty → stripe placeholders | PARTIAL (data) |
| OG image | Missing | MISSING SCHEMA |

### Wired well
Hero copy, trusted-by, stats, impact bento from `customerStory`, reviews marquee from `review`, beyond-hiring copy (except rating number), mid CTA copy.

**Note:** `/customer-stories` hub is a separate page (not in this audit’s deep pass).

---

## For Developers (`/for-developers`, branded “For Engineers”)

### Not editable (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Join form (“Build your profile”) | Entire multi-step form code-owned | HARDCODED |
| Join form submit | No HubSpot/endpoint | MISSING SCHEMA / HARDCODED |
| Testimonials video | Play UI with no `videoUrl` field | MISSING SCHEMA |
| Ghost hero CTA | Label only — no href/action | PARTIAL |
| Step 02 Go code block | Intentionally frozen | HARDCODED (by design) |
| Photos | Wired but often empty → baked Figma placeholders | PARTIAL (data) |
| Quote content | Editable but seeded as placeholders | PARTIAL (content quality) |
| OG image | Missing | MISSING SCHEMA |

### Wired well
Hero copy, problem, how-steps text, benefits text, mission, testimonial quotes/headers, final CTA.

---

## Location pages

Routes:
- `/services/latam-developers`
- `/services/philippines-developers`
- `/services/eastern-europe-developers`

Shared template `LocationTemplate` + `locationPage` singleton docs. Narrative/media largely WIRED once seeded.

### Not editable on all three (priority)

| Section | What’s wrong | Status |
|---|---|---|
| Calculator rates / roles / region multipliers / seniority maths | Code registry + `calculator.tsx` | HARDCODED (intentional in brief; change if Seb must edit) |
| Calculator UI chrome + CTA | Labels / “Get matched…” / `/start-hiring` | HARDCODED |
| Hero CTA hrefs | `/start-hiring`, `#calculator` | HARDCODED |
| FAQ help href | `#chat` | HARDCODED |
| “VETTED BY SENIOR ENG” badge | Template constant | HARDCODED |
| Advantage icons | Index-locked SVGs | HARDCODED |
| OG image | `og: false` | MISSING SCHEMA |
| Video URLs | Fields exist; often empty until Studio paste | PARTIAL (data) |

### Region-specific
- **PH only:** EOR + Included sections (wired)
- **LATAM / EE only:** On Ground (wired)
- **EE:** Net-new slug (no Webflow service twin)

---

## Recommended fix order (for next planning session)

1. **Home hero slideshow + Where We Work** — highest “Seb can’t edit what he sees” pain  
2. **For Developers join form + testimonial video URL** — large hardcoded block  
3. **How It Works matcher + real CTA destinations**  
4. **Hire Engineers / Fractional CTO lead submit + dead `#` links**  
5. **Location calculator policy decision** (keep code vs move rates to Sanity)  
6. **Cross-cutting:** OG images, orphan schema cleanup, story link plural→singular  

---

## Approach note

Fan-out audit first → fix page-by-page from this list is the right order. Do **not** try to “fix everything in one PR”; each page’s remaining gaps are different shapes (slideshow vs form vs calculator policy).
