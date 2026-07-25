# DESIGN_EXECUTION_ROADMAP.md

**Purpose:** Master plan for the Figma-first design restart, from establishing the Claude Design reference set through to a launched, SEO-strong Cloud Employee site on the Mygratr stack. This is the doc Cursor works against as the design + launch track. It supersedes the visual-design portions of MYGRATR_PHASE_ROADMAP_v2 (the backend/content phases in that doc still stand).

**Status:** v1.0 — handoff into Cursor.
**Owner:** Jake Hall (non-developer, directs Claude Code).
**Stack:** Next.js + Sanity (project `lzbhll1u`, dataset `production`) + Vercel. Repo `galaxyfunk/mygratr`, branch `feat/design-1`.

---

## 0. Read this first — what changed and what didn't

A strategic pivot happened: the visual design is being redone against a **new canonical Figma** (Seb's CE-REDESIGN.fig — dark theme, lime accent `#D4FF3C`, "Hire engineers vetted by engineers"). An earlier round of Claude Design work was done against the *wrong/old* design and is superseded.

**What survives the pivot (do not touch, do not rebuild):**
- The entire Sanity backend: ~388–451 docs across 21 types, all migrated and verified, including CONTENT-1E embed recovery (142 tables + 7 videos).
- The full site structure: 27 templates across 5 tiers.
- All schemas, content, IDs, IP, the Two-Brain methodology.
- The Next.js scaffold + the one shipped template (BLOG — 74 URLs live, Lighthouse SEO 100).
- DESIGN-1 *infrastructure*: Storybook, Visual Editing wiring, UI_STRINGS lint rule, v0 prompt template. These are plumbing and are design-agnostic.
- The 22 primitives + Icon system as **code/behaviour**. Their structure (accessibility, form wiring, composition) is reusable.

**What is stale (the only thing being redone):**
- The visual *tokens* (old teal `#1c787c` era) and any visual styling extracted from the old design.
- The *shape* of a small number of components where the new Figma genuinely changed the form, not just the colour.

**The core insight that sizes this work:** components separate structure from skin. Structure lives in React; skin lives in tokens. So most components only need a **token re-skin**, not a rebuild. A handful need a **shape edit**. Very few are genuinely **new**. This is an edit job, not a from-scratch job.

---

## 1. The strategy in one breath

Load the two finished pages (Home, How It Works) + the design system into Claude Design as a **reference set** → re-extract the new tokens into the codebase early → design the internal templates in Claude Design against that reference, chrome-first → reconcile components in Storybook as each template reveals what needs editing → build in Next.js wired to the existing Sanity backend → populate content + wire visual editing. **SEO/GEO rides inside every template from the design stage**, with a technical-SEO + redirect gate immediately before launch and rank monitoring immediately after.

---

## 2. Why the reference-set approach is correct

A design system in the abstract is weaker than a design system *plus two fully-realized pages*. Tokens say "lime is `#D4FF3C`." The finished Home page shows *how lime actually gets used*: where, how much, what it pairs with, how dark sections breathe. Claude Design produces far better internal pages by pattern-matching against real pages than by interpreting a token sheet alone. Home + How It Works are the "show, don't tell" reference. The design system page is the "tell." Use both.

---

## 3. Design execution track (Track A)

### Phase D1 — Establish the Claude Design reference set
**Goal:** One Claude Design context that has fully absorbed the new visual language and can confirm it back accurately.
**Inputs:** Home page, How It Works page, design system page from CE-REDESIGN.fig.
**Steps:**
1. Load all three into a single Claude Design session.
2. Have it extract and confirm back: colour tokens (semantic names), type scale, button language (the lime pill + circular-icon pattern), section patterns, lime-on-dark usage rules, spacing/radius/shadow.
3. Verify the extraction against the real pages before proceeding. Errors here propagate into all 25 templates, so this is a HALT gate.
**Exit criteria:** A confirmed visual-language summary that matches the Figma. This becomes the source-of-truth reference every downstream template session points at.
**Risk:** High-leverage. Rushing it taxes every later phase. This is the single most important session in the track.

### Phase D2 — Re-extract the token file into the codebase
**Goal:** Replace old teal-era tokens with the new design's tokens, early.
**Steps:**
1. Pull the corrected token set out of the D1 session.
2. Replace the stale tokens in the codebase (token CSS / Tailwind v4 theme layer).
3. Open Storybook against the existing primitives.
**Exit criteria:** Storybook renders the existing 22 primitives in the new skin. You can now *see* which primitives re-skin cleanly and which break — this previews D4 for free.
**Why now and not at the end:** doing the token swap early means the components carry the new look from the start, and component edits in D4 happen against current tokens instead of being batched and re-touched twice.

### Phase D3 — Design internal templates in Claude Design (the volume)
**Goal:** Every internal template designed in the established language, in dependency order.
**Order (this matters):**
1. **Chrome first** — Header, Footer, 404. Universal dependency: every page renders inside these. (This is STATIC-1.) Header locked at Path A: structurally correct, no GSAP polish yet (animation batched with HOME later).
2. **Simple pattern-templates** — Team Member, Review, Video, Download (+ Download Thank You), Tool (+ Event), Book a Call. Repetitive; establishes the pattern-apply rhythm. BLOG is already shipped and is the reference for these.
3. **Medium** — Compare, Customer Story.
4. **Hard** — Service, Technology (HIGH complexity).
5. **HOME final polish pass** — highest stakes, done last, batched with Header animation polish.
**Per-template output:** polished HTML scaffold in the new design language, ready for Figma polish (via html.to.design for Seb's stakeholder approval) then Next.js build.
**Exit criteria per template:** design matches reference set; SEO contract specified (see Track B); component deltas noted for D4.

### D3 expanded inventory — six new Figma-sourced pages (added Jun 2026)

These six pages exist in Seb's CE-REDESIGN.fig but were not in the original 25-template count. **All six are "reproduce faithfully from Figma," not redesign.** All six need **desktop AND mobile** designs. All six need **image assets harvested from Figma** (these images are not in the Sanity migration — the migration carried content, not these net-new marketing visuals). They slot into D3's design volume and carry their SEO contract like every other template (Track B-baked).

The four template "things" below produce six pages because the Location template has three data records.

| Page | Figma fidelity | Desk + Mobile | (a) Needs new Sanity schema? | (b) Images harvested from Figma? | (c) Editability tier |
|---|---|---|---|---|---|
| **Location TEMPLATE** — 3 records: Europe, Philippines, Latin America. ONE template, 3 docs. | Reproduce faithfully | Both | **YES** — new `location` content type. **DECIDED**: build as a full content type so future regions = new docs, no code. | YES | **Full content type** (decided) |
| **Fractional CTO** — likely one-off marketing page | Reproduce faithfully | Both | OPEN — see decision below | YES | Near-static one-off (pending decision) |
| **Managed Engineering Pods** — likely one-off marketing page | Reproduce faithfully | Both | OPEN — see decision below | YES | Near-static one-off (pending decision) |
| **Referral** — likely one-off marketing page | Reproduce faithfully | Both | OPEN — see decision below | YES | Near-static one-off (pending decision) |

**Location decision (already made):** build as a full Sanity content type. It is the most editable option and future regions become new documents against one template instead of new code. One template, three data records (Europe, Philippines, Latin America) at launch.

> **🔲 OPEN DECISION — Jake to resolve (one-off pages: Fractional CTO, Pods, Referral).**
> Do we build **full Sanity schemas** for these three one-off marketing pages, or treat them as **near-static pages with light Sanity backing** (a small flexible field set, or hardcoded copy with only a few Sanity-editable slots)?
> **Tradeoff:** full schemas = maximum editability for Seb, every block editable in Studio, but real schema-authoring overhead per page for pages that may never change. Near-static = far less schema work and faster to ship, but edits to these pages later need a developer or a Cursor session, not Seb in Studio.
> **Not deciding this here — flagging it.** The Location template is unaffected (already decided as a full content type). Also tracked in Section 7.

### Phase D4 — Reconcile components in Storybook (interleaved with D3, not after)
**Goal:** Storybook + primitive library current with the new design.
**The nuance:** do NOT batch this to the end. As each D3 template is designed, it reveals which primitives need a **shape edit** vs the **re-skin** they already got in D2. Fold those edits in as you go.
**Three buckets per component:**
- **Re-skin** — token swap only (already handled by D2 for most). Button, Card, Heading, Text, Container, Input, etc.
- **Shape edit** — new design changed the form, not just colour (candidates from the Figma: floating dark nav, lime pill + circular-icon button, tilted engineer-profile card stack, pricing calculator).
- **New** — no existing primitive equivalent. Expected to be rare.
**Method:** a component-by-component diff (new Figma component vs existing primitive), each tagged re-skin / shape-edit / new. This diff is the precise scope of D4 and removes guesswork.
**Exit criteria:** by the time the last template is designed, Storybook is already current. No big end-of-track component sprint.

### Phase D5 — Build the Next.js frontend (Claude Code)
**Goal:** Templates built in code, wired to the existing Sanity backend.
**Steps:** polished designs → Claude Code, template by template, same dependency order as D3. BLOG already done = proof the pipeline works end to end.
**Discipline:** Two-Brain model strict. Planning Claude writes the brief; Claude Code executes only; halts at named checkpoints. Briefs locked before execution.
**Exit criteria:** all templates rendering live data from Sanity, matching the polished designs.

### Phase D6 — Populate content + wire Visual Editing
**Goal:** Final imagery + content in Sanity, Presentation tool wired for visual editing.
**Note:** content is already migrated, so this is mostly imagery, final polish, and the ~10-second click-any-field-to-Studio visual editing round-trip target.
**Exit criteria:** site is content-complete and editable by Seb via Studio + Presentation.

---

## 4. SEO / GEO track (Track B) — runs inside Track A, not after it

**Principle:** SEO is not a pre-launch phase. It's a property baked into every template as it's designed and built. Retrofitting structured data into 25 templates one at a time is the expensive mistake the context files already warn against ("design decisions belong in specs, not retrofit"). BLOG already proves the per-template SEO discipline; the job is to make every template inherit it.

### B-baked: per-template SEO contract (every template, D3 + D5)
Each template carries, from the moment it's designed:
- Correct heading hierarchy (one H1, logical H2/H3 cascade).
- The right JSON-LD schema type for that page. BLOG pattern = BlogPosting + BreadcrumbList + FAQPage. Each template gets its correct schema.org type (Organization, Service, FAQPage, BreadcrumbList, VideoObject, Review/AggregateRating, Person, etc.).
- Clean semantic HTML.
- Meta fields wired from Sanity (title, description, OG, canonical).
- Internal linking logic (entity cross-links, breadcrumb trails).

### B-GEO: answer-engine optimization (deliberate workstream, pulled forward)
The differentiator for AI Overviews / ChatGPT / Perplexity / Gemini. Being *citable*, not just rankable:
- Clear, extractable factual answers (not marketing prose) in answer-shaped blocks.
- Strong entity definitions: who Cloud Employee is, what staff augmentation is, defined machine-readably.
- An entity-based authority graph in Sanity (already flagged on-horizon — pull a lightweight version forward into schema/template work; far cheaper to emit clean entity data by design than to retrofit).
- Content structured as Q&A / definition / comparison blocks that LLMs lift cleanly.
- (Later) AI Answer endpoints.
**Why forward, not post-launch:** designing templates that emit clean entity + answer data costs near-nothing at design time and a lot to bolt on later.

### B-gate: pre-launch technical-SEO sweep (the QA-1 / LAUNCH window)
One consolidated sweep before cutover:
- **The 317 redirects** from old Webflow URLs. Critical — this is how rankings transfer instead of evaporate. Hard gate.
- Canonical tags, sitemap, robots.txt correct across all locales (US default + `/uk/`).
- Lighthouse cleanup batch (Tech Debt #21–#33: third-party script budget, cookie hygiene, ClaraChatBot WCAG AA, hero aspect-ratio).
- Core Web Vitals pass.

### B-monitor: post-launch (MONITOR-1)
- GSC index + coverage check.
- Rank-preservation tracking (did redirects hold, did rankings transfer).
- Then growth: programmatic SEO from CE placement data, content-freshness automations (n8n).

---

## 5. Full sequence at a glance

| # | Phase | Track | Delivers | Risk |
|---|---|---|---|---|
| D1 | Reference set in Claude Design | A | Confirmed new visual language | High-leverage gate |
| D2 | Token re-extract into codebase | A | New skin live in Storybook | Low |
| D3 | Design internal templates (chrome→simple→medium→hard→HOME) | A + B-baked | All 25 templates designed | Medium (volume) |
| D4 | Reconcile components in Storybook (interleaved) | A | Primitive library current | Low–Medium |
| D5 | Build Next.js frontend (Claude Code) | A + B-baked | Templates live on Sanity data | High (volume) |
| D6 | Populate content + wire Visual Editing | A | Content-complete, editable | Low |
| — | GEO/entity workstream | B-GEO | Citable, answer-engine-ready | Medium (differentiator) |
| QA-1 | Visual + structural QA + SEO sweep | A + B-gate | Launch-ready, redirects staged | Medium |
| LAUNCH | Cutover + 317 redirects | A + B-gate | Live site | Highest |
| MONITOR-1 | Post-cutover SEO monitoring | B-monitor | Rank retention confirmed | Low |

---

## 6. Operating discipline (carried from existing project conventions)

- **Two-Brain Model (strict):** Planning Claude = strategy/architecture/briefs. Claude Code = execution only, never architecture decisions.
- **Dev-light posture:** Jake + Claude Code primary. Surgical dev consult only when genuinely blocked >half a day. Budget envelope $0–2000 across the whole migration.
- **Brief discipline:** briefs locked before execution; one conversation per phase; DEV-N deviation log for mid-execution scope changes; D-prefix for architectural decisions.
- **Commit/push:** single-line commit messages, no body, no Co-Authored-By. Push always waits for Jake's explicit approval. Commits only at named HALTs.
- **Probe before claiming:** never fabricate CE site facts. Live data over inference. Verify file currency before trusting context files (they lag reality).
- **Context-file update tiers** (the overhead Cursor now reduces): Tier 1 always (CHANGELOG, CLAUDE.md row, PHASE_HISTORY); Tier 2 if changed; Tier 3 for foundational/HIGH/pre-launch phases only.
- **Communication:** direct, opinionated, no hedging, no em dashes, no beginner framing, no unsolicited stopping-point suggestions.

---

## 7. Open decisions — confirm before D5

**1. Does cloudemployee.io actually complete the Sanity migration, or stay on Webflow?** A decision brief was prepared for Seb on exactly this. The full Next.js build (D5) is the expensive part. Confirm this is settled before pouring effort into it. D1–D4 (design) are valuable regardless; D5 onward depends on a "yes."

**2. One-off pages (Fractional CTO, Pods, Referral): full Sanity schemas or near-static with light Sanity backing?** Full schemas = maximum editability for Seb (every block editable in Studio) at the cost of real schema-authoring overhead per page, for pages that may never change. Near-static = far less schema work and faster to ship, but later edits need a developer or a Cursor session, not Seb in Studio. The Location template is unaffected (already decided as a full content type). Full detail in the D3 expanded inventory (Section 3).

---

## 8. The immediate next action

**Write and run the D1 setup brief** for Claude Design: the exact instruction that loads Home + How It Works + the design system and has Claude Design extract and confirm the visual language. Everything downstream depends on D1 being clean.

---

*v1.0 — handoff into Cursor. Supersedes visual-design portions of MYGRATR_PHASE_ROADMAP_v2; backend/content phases there still stand.*
