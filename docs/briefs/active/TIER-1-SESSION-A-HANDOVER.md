# Tier 1 — Full Batch Handover (Customer Story + Download Thank You + Service + Technology)

**Paste the block below into a FRESH Cursor chat.**
This chat is the CONDUCTOR. It never writes template code itself — it runs the
BUILDER → QA loop via subagents per `docs/templates/TEMPLATE_FIDELITY_LOOP.md`.

**Jake's review mode for this session: BATCHED.** Run all four templates end-to-end.
Do NOT stop for Gate 6 after each template. One Gate 6 pass at the end with every
localhost URL. Only stop mid-batch for Step 0 architecture HALTs that need a human
call, or if a template hits the iteration cap with material fails remaining.

---

```
You are the CONDUCTOR for MYGRATR Tier-1 FULL BATCH on branch `feat/design-1`.
Read these first, in order, then confirm the plan back to me before doing anything:

1. `CLAUDE.md` (orientation + current phase — verify TEMPLATE-VIDEO / DOWNLOAD / TOOL / BOOK_A_CALL / COMPARE rows are Complete)
2. `docs/templates/TEMPLATE_FIDELITY_LOOP.md` (CONDUCTOR → BUILDER → QA loop; Cost mode ON)
3. `.cursor/rules/00-core.mdc` + `.cursor/rules/30-safety.mdc`

## Scope — build ALL FOUR in this one chat, in this order

| # | Template | Routes | Sanity type | Complexity | HTML export | Design PDF |
|---|---|---|---|---|---|---|
| 1 | Customer Story | `/customer-story/[slug]` + `/uk/customer-story/[slug]` (singular) | `customerStory` | Medium | `docs/raw-html/Customer Story.html` | `docs/raw-html-pdf/Customer Story.pdf` |
| 2 | Download Thank You | `/download-thank-you/[slug]` (+ UK mirror if other detail templates mirror) | `downloadAccess` | Trivial / LITE | `docs/raw-html/Download Thank You.html` | `docs/raw-html-pdf/Download Thank You.pdf` |
| 3 | Service | `/services/[slug]` + `/uk/services/[slug]` | `service` | HIGH (folds) | `docs/raw-html/Service.html` | `docs/raw-html-pdf/Service Detail.pdf` |
| 4 | Technology | `/technology/[slug]` + `/uk/technology/[slug]` | `technology` | HIGH (folds; reuse Service patterns) | `docs/raw-html/Technology.html` | `docs/raw-html-pdf/Technology Detail.pdf` |

Event is PARKED (no HTML/PDF). Do not build hubs, chrome sweeps, or redirect fixes.

## Review mode — BATCHED GATE 6 (critical)

Jake does NOT want to eyeball after each template.

- After each template: finish the automated loop (Step 0 → 0.5 → Builder → QA → fix iterations up to cap 4) → commit on clean automated pass → **immediately start the next template**.
- Do **NOT** wait for Gate 6 / human visual approval between templates.
- Collect every QA slug + localhost URL as you go.
- Only **one** human Gate 6 at the end: when all four are built + committed, print the full URL list and stop for Jake's eyeball pass against the four PDFs.

You MAY still HALT mid-batch for:
- Step 0 findings that need a real architecture call (Zod shape, route prefix, schema gap that invents product behaviour).
- Iteration cap hit with material fails still open on a template.
- Safety gate hits (Sanity mutation needed, push request, credentials, destructive work).

Do NOT HALT just to show a screenshot or ask "does this look good?" mid-batch.

## Flow per template (automated)

1. **Step 0 (brief HALT only if architecture found)** — read-only Sanity probe. Report doc count + locale split, field fill rates, enum drift (Zod to LIVE values, never mutate Sanity), meta fill, edge cases, recommended QA slug, export section map (schema-backed | omit | sitewide chrome).
   - If Step 0 is clean routine: state the recommendation in one line and **proceed** (Decision behaviour — do not dump options).
   - If Step 0 needs a strategic/architecture call: HALT and ask Jake.
2. **Step 0.5** — `audit-output/{template}/export-spec.json` from raw-html (script).
3. **Builder** (Opus first pass) — file stack, locked primitives, `build` + `lint`. No commit/push/Sanity mutation from Builder.
4. **QA** (Sonnet) — Playwright computed diff export vs built page. PASS/FAIL table.
5. Fix failing rows only (Sonnet/Codex for iterations) until zero material fails or cap 4.
6. On clean automated pass: **commit** with explicit paths, single-line message, **no push**. Record the localhost QA URL. Start next template.

## End-of-batch Gate 6 (only human visual stop)

When #1–#4 are all committed, print something exactly like:

```
## BATCH COMPLETE — Gate 6 eyeball list
Dev server: http://localhost:3000  (start `cd site && npm run dev` if not already)

1. Customer Story — http://localhost:3000/customer-story/{qa-slug}
   PDF: docs/raw-html-pdf/Customer Story.pdf
2. Download Thank You — http://localhost:3000/download-thank-you/{qa-slug}
   PDF: docs/raw-html-pdf/Download Thank You.pdf
3. Service — http://localhost:3000/services/{qa-slug}
   PDF: docs/raw-html-pdf/Service Detail.pdf
4. Technology — http://localhost:3000/technology/{qa-slug}
   PDF: docs/raw-html-pdf/Technology Detail.pdf

UK mirrors (spot-check any one): /uk/...
Commits: {hash list}
Ready for your visual review. Do not push until you approve.
```

Start `npm run dev` yourself before handing Jake the list so the URLs work.

## Hard rules (from Video + Download/Tool + Book-a-Call/Compare — non-negotiable)

1. Design QA = `docs/raw-html/{Template}.html` (computed) + `docs/raw-html-pdf/*.pdf` (eyeball). NEVER `docs/re-design/screenshots/`.
2. No inline closing CTA in template body — sitewide FooterTopCta owns it.
3. No visible breadcrumbs in `<main>` unless Jake explicitly approved at Step 0 (BreadcrumbList JSON-LD only by default).
4. All CTAs = `MegaMenuPillLabel` `size="cta"`. Horizontal arrows need explicit non-rotated `leadingGlyph={<Icon name="chevron-right" …/>}` (Tech Debt #56 — do not reintroduce diagonal on new CTAs).
5. Dark FAQs = `FaqList`. Not Radix Accordion.
6. Empty CMS fields = section omitted. No placeholder cards.
7. Section backgrounds = page ground `#070D18` unless export shows a distinct wash.
8. All literal UI text in `templates/**` via `UI_STRINGS`.
9. Sanity data gaps → write one-shot patch script; Jake runs it. No live dataset mutation by the agent. No hardcoded CE URLs in template logic.
10. Two-Brain: Conductor plans, Builder executes. Architecture gaps → STOP. No push without Jake's approval.

## Known caveats (confirm at each Step 0)

- **Customer Story #16:** `customerStory-68754c657697d163dd1a6126` ("Travel Tech Client") has intentionally null `companyLogo`. Template fallback/omit — do NOT backfill or delete.
- **CONTENT-1E:** 3 customerStory docs have recovered `table` + `videoEmbed` PortableText — reuse Blog/Compare handlers.
- Customer Story URL is **singular** `/customer-story/` (not plural).
- Download Thank You = `downloadAccess`; must emit `robots: noindex`. No article JSON-LD.
- Service then Technology: Technology should reuse Service fold / section primitives — do not greenfield Technology if Service established them.
- Out of scope: Event, hubs, chrome arrow sweep (#56), compare redirect (#55), push.

## Shared primitives already shipped (reuse)

- `site/src/components/ui/faq-list/`
- VideoEmbed / Loom
- Reference scaffolds:
  - Simple detail: Video `f6729d3`, Team Member
  - Rich-text / article: Blog + Compare `b85091b`

## Cost mode

- Opus Builder first pass per template; Sonnet/Codex for fix iterations (failing rows only).
- Step 0.5 mandatory before each build.
- Download Thank You = LITE PATH (Conductor/main agent may build without Opus if Step 0 confirms trivial).
- Customer Story = full loop; fork Blog/Compare PortableText.
- Service = full Opus loop (HIGH).
- Technology = full loop but scaffold-copy from Service folds.
- Iteration cap 4 per template.
- Full chrome QA on Customer Story + Service only; Download Thank You + Technology = body/fold diffs unless chrome touched.

## State you're inheriting

- Branch `feat/design-1`, **10 commits ahead of origin (unpushed)** as of context sync `443538d`.
- Shipped unpushed: Video `f6729d3`, Download+Tool `8a0e3b2`, header CTA arrow `8a7b660`, Book-a-Call+Compare `b85091b`, docs sync `443538d`.
- Re-run `cd site && npm run build` after the first template lands; keep it green through the batch.

## Start here

1. Confirm the three docs are read.
2. Give the batched plan (one short confirmation: order, reviewed-at-end, no mid-batch eyeballs).
3. Run Customer Story Step 0 probe (`scripts/template-customer-story/probe-step0-sanity.ts`, patterned on `scripts/template-video/probe-step0-sanity.ts`).
4. If Step 0 is routine — proceed. If architecture call needed — HALT.
Then keep going through all four until the end-of-batch Gate 6 URL list.
```

---

## After this batch
- Post-phase context sync for the four new templates (or run the post-phase-update skill).
- Event stays parked until a design export exists.
- Chrome arrow #56 + compare redirect #55 remain LAUNCH / chrome-fidelity passes — not this batch.
