# Handover — TEMPLATE batch ×4 (loop v2)

> **Do not paste this whole file.** Jake uses the short CONDUCTOR prompt in chat;
> this doc is the source of truth on disk.
>
> Branch: `feat/design-1`. Do not push unless Jake explicitly approves.

---

## Mission

Ship **four** detail-page templates in one session, each to **one-shot** quality.
Build in this order (simple → medium; shared primitive fixes carry forward):

| # | Phase | Routes | Export | JSON-LD `@type` | Notes |
|---|---|---|---|---|---|
| 1 | **MYGRATR-TEMPLATE-DOWNLOAD** | `/downloads/[slug]` + `/uk/downloads/[slug]` | `docs/raw-html/Download.html` | `CreativeWork` or `DigitalDocument` | Hub exists |
| 2 | **MYGRATR-TEMPLATE-TOOL** | `/tools/[slug]` + `/uk/tools/[slug]` | `docs/raw-html/Tool.html` | `WebApplication` or `SoftwareApplication` | Hub exists |
| 3 | **MYGRATR-TEMPLATE-BOOK_A_CALL** | `/book-a-call/[slug]` + `/uk/book-a-call/[slug]` | `docs/raw-html/Book A Call.html` | `WebPage` (+ `Person` if schema backs it) | **6 docs only**; no hub index |
| 4 | **MYGRATR-TEMPLATE-COMPARE** | `/compare/[slug]` + `/uk/compare/[slug]` | `docs/raw-html/Compare.html` | `BlogPosting` or `Article` | Hub at `/compare`; **reuse Blog stack** |

**Out of scope this batch:**

- `Download Thank You.html` / `downloadAccess` / `/download-thank-you/[slug]` (noindex thank-you)
- **Customer Story**, **Service**, **Technology** (medium/hard — next batch)
- Figma marketing batch (Home, HIW, etc.)

**Why these four:** completes the roadmap "simple pattern-template" tier (Download, Tool, Book a Call) plus the first **medium** template (Compare, blog-shaped, 30 docs). Service/Technology are HIGH complexity — wrong for a 4-page one-shot batch.

### Design references (do not confuse)

| Template | Computed QA (numbers) | Visual design (look) | **Do NOT use** |
|---|---|---|---|
| Download | `docs/raw-html/Download.html` | `docs/raw-html-pdf/Download Page.pdf` | `docs/re-design/screenshots/catalog-details/download__*.png` (old live site) |
| Tool | `docs/raw-html/Tool.html` | `docs/raw-html-pdf/Tool Page.pdf` | `.../tool__*.png` |
| Book A Call | `docs/raw-html/Book A Call.html` | `docs/raw-html-pdf/Book A Call.pdf` | `.../book-a-call__*.png` |
| Compare | `docs/raw-html/Compare.html` | `docs/raw-html-pdf/Compare Page.pdf` | `.../compare__*.png` |

HTML + export-spec = automated pixel diff. PDF = Builder orientation + Gate 6 (and
optional Gate 5.5 vision). Old `re-design/screenshots` = wrong design era (teal);
structure-only archival.

---

## Read first

1. `CLAUDE.md`
2. `docs/templates/TEMPLATE_FIDELITY_LOOP.md` (base loop + **§8–§10**; enable **§9 Cost mode** in Conductor prompt)
3. **This file**
4. Pattern stacks: **Blog** (Compare), **Video** (most recent detail build), Review, Team Member
5. `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md`
6. `site/src/components/ui/mega-menu-pill-label/index.tsx` — canonical `size="cta"` (~28px tall)

---

## HALT 0 — chrome fixes

**Done.** Commit `1c3547d` — footer top CTA, compact `size="cta"`, video breadcrumbs hidden. Skip HALT 0 unless `git status` shows drift.

---

## What VIDEO got wrong (hard rules — all four templates)

1. **Inline closing CTA in export ≠ template field** — OMIT from template body; verify **sitewide** `FooterTopCta` against `Footer.html` in QA.
2. **Breadcrumbs** — default: **no visible trail**; keep `BreadcrumbList` JSON-LD. Compare export shows breadcrumb UI — **confirm with Jake at Step 0** before building.
3. **CTA pills** — all CTAs use `MegaMenuPillLabel size="cta"` (header Schedule a Call is canonical).
4. **Spacing** — arbitrary px; no double padding inside `Container width="default"`; `--spacing: 0.5rem` = 8px per Tailwind unit.
5. **Gate 6 product pass** — computed CLEAN is not done until localhost chrome checklist passes.

---

## Loop v2 flow (batch ×4)

```
Step 0   → quad Sanity probe (all 4 types), export section maps, HALT for Jake
Build 1  → Download → QA → loop (cap 6)
Build 2  → Tool → QA → loop (cap 6)
Build 3  → Book A Call → QA → loop (cap 6)
Build 4  → Compare → QA → loop (cap 6)
Gate 6   → Product pass all 4 QA slugs on localhost
Commit   → Jake picks: one commit per template OR one batch commit; explicit paths; no push
```

**Roles:** CONDUCTOR orchestrates; BUILDER = Opus first pass (Sonnet/Codex for fixes in Cost mode); QA = Sonnet-class.

**Cost mode (recommended):** split into **Chat A** (Download + Tool) and **Chat B** (Book A Call + Compare). Chrome QA full on Download only; Book A Call = main-agent lite path. See `TEMPLATE_FIDELITY_LOOP.md` §9.

**Batch discipline:** finish each template to CLEAN PASS before starting the next. Do not fork primitives per template.

---

## Step 0 — quad probe (HALT until Jake approves)

Write and run (read-only, no Sanity mutation):

- `scripts/template-download/probe-step0-sanity.ts`
- `scripts/template-tool/probe-step0-sanity.ts`
- `scripts/template-book-a-call/probe-step0-sanity.ts`
- `scripts/template-compare/probe-step0-sanity.ts`

Pattern: `scripts/template-video/probe-step0-sanity.ts`.

**Report table (one row per type):**

| Item | Download | Tool | Book A Call | Compare |
|---|---|---|---|---|
| Doc count + locale split | | | | |
| QA slug (fullest coverage + matches export) | | | | |
| Field fill rates per export section | | | | |
| Enum drift → Zod to LIVE values | | | | |
| metaTitle / metaDescription fill + fallbacks | | | | |
| Null image / optional edge cases | | | | |
| Type-specific probes (below) | | | | |

**Type-specific Step 0 probes:**

- **Download:** `hubspotFormId` fill; docs missing form ID → omit card or empty state?
- **Tool:** `toolEmbed` / `hiddenCode`; Culture Match placeholder (no API keys)
- **Book A Call:** schema has **no `localeField`** — do all 6 docs serve both `/book-a-call/[slug]` and `/uk/book-a-call/[slug]` with same slug, or UK-only subset? `calendlyEmbed` Portable Text shape; `metaTitle` backfill status (6 docs)
- **Compare:** 30 docs; `author` ref resolve; `tldrSection` fill; `videoEmbed`/`table` PT types from CONTENT-1E; breadcrumb visibility decision

---

## Export section maps (desktop frame only)

### Download.html

| Export section | Sanity fields | Render? |
|---|---|---|
| Hero 2-col (radial wash, `grid 1fr 1fr gap 56px`) | `name`, `title`, `mainDescription`, `tags`, `button1*`, `button2*`, `headerFooterImage` | Yes; omit empty blocks |
| "You'll get" | `youllGet[]` | If populated |
| "How to use it" | `howToUseIt.*` | If populated |
| "The impact" | `theImpact.*` | If populated |
| FAQs | `faqs[]` | Native `<details>` |
| "Get it now" + HubSpot card | `getItNow.*`, `hubspotFormId` | `HubSpotFormEmbed` |
| Inline closing CTA | **none** | **OMIT** |
| Visible breadcrumbs | **none** | **OMIT visual**; JSON-LD only |

### Tool.html

| Export section | Sanity fields | Render? |
|---|---|---|
| Hero (~67px H1, ~26px sub) | `name`, `subHeader`, `headerBlurb`, `button1*`, `button2*` | Yes |
| "Share this on" | **none** | **OMIT** |
| Tool embed | `toolEmbed` | B3 PortableText |
| Description / video overview | `description`, `videoOverview` | If populated |
| FAQs | `faqs[]` | If populated |
| Sidebar / thumbnail layout | `thumbnail` | Per export grid |
| Inline closing CTA | **none** | **OMIT** |
| Visible breadcrumbs | **none** | **OMIT visual**; JSON-LD only |

### Book A Call.html

| Export section | Sanity fields | Render? |
|---|---|---|
| Hero / headline with rep name | `firstName`, `lastName` (H1 ~67px desktop) | Yes |
| Calendly embed area | `calendlyEmbed` (Portable Text) | Yes — render embed blocks; no fabricated iframe if data missing |
| FAQ block (if in export) | **none on schema** | **OMIT** unless Step 0 finds populated unexpected fields |
| Inline closing CTA | **none** | **OMIT** |
| Visible breadcrumbs | **none** | **OMIT visual**; JSON-LD only |

**Route note:** path is `/book-a-call/[slug]` (not `/book-a-calls/`). Slug from `firstName` + `lastName`.

### Compare.html

| Export section | Sanity fields | Render? |
|---|---|---|
| Hero / title area (~58px H1) | `title`, `competitor`, `tags`, `thumbnailImage` | Yes |
| TL;DR band | `tldrSection` | If populated |
| Article body | `content` | B3 PortableText (tables + videoEmbed from CONTENT-1E) |
| Author + date row | `author` → teamMember, `date` | Yes |
| FAQs | `faqs[]` | If populated |
| Breadcrumb UI | **none in schema** | **Step 0 decision** — export includes breadcrumb markup; default = omit visual + JSON-LD only unless Jake wants visible |
| Inline closing CTA | **none** | **OMIT** |
| Related / share rows | **none** | **OMIT** unless schema backs |

**Pattern note:** Compare is blog-shaped — start from `site/src/components/templates/blog/` and edit; do not greenfield.

---

## Builder prompt (run four times)

Swap `{Template}`, `{template}`, routes, and Step 0 table per row.

> BUILDER for MYGRATR-TEMPLATE-{TEMPLATE}. Branch `feat/design-1`. Build only; no commit/push/Sanity mutation.
>
> **Routes:** {exact paths from mission table}
> **Export:** `docs/raw-html/{Template}.html` desktop frame
> **Pattern:** Video file stack; Compare also forks Blog stack
> **Sanity:** {Step 0 approved row — do not re-probe}
>
> **Chrome boundaries:** no inline closing CTA; no visible breadcrumbs unless Step 0 approved visible for Compare; all CTAs `MegaMenuPillLabel size="cta"`; Download uses `HubSpotFormEmbed`; Book A Call renders `calendlyEmbed` via PortableText/embed handlers only.
>
> **Layout:** arbitrary px spacing; no double Container padding; per-section washes as export shows.
>
> **Files:** types, queries, `templates/{template}/`, json-ld, both locale routes, sitemap, validate-json-ld, UI_STRINGS.
>
> Verify: `npm run build` GREEN; lint clean; server-rendered where possible.

---

## QA prompt (run four times)

Probes: `scripts/template-{template}/qa-computed-diff.mjs`  
Output: `audit-output/{template}/qa-diff-run.json`

**Measure:**

1. Template body (desktop export vs built page @ 1280px)
2. Footer top CTA vs `Footer.html`
3. Header Schedule a Call pill height vs page primary CTAs (≤2px delta)
4. Breadcrumb visibility in `<main>` (FAIL if visible unless Step 0 approved Compare exception)

**Structural gate 5/5:** build green, JSON-LD primary + BreadcrumbList, both locales 200, meta description, no CSR bailout.

**Verdict:** CLEAN PASS = 0 material fails on body **and** chrome rows.

---

## Gate 6 — localhost product pass (all four)

After each template QA CLEAN, spot-check on `http://localhost:3000`:

| Template | URL | Extra checks |
|---|---|---|
| Download | `/downloads/{qa-slug}` | Side-by-side vs `Download Page.pdf`; HubSpot form; hero 2-col |
| Tool | `/tools/{qa-slug}` | Side-by-side vs `Tool Page.pdf`; no share row; embed renders |
| Book A Call | `/book-a-call/{qa-slug}` | Side-by-side vs `Book A Call.pdf`; Calendly area; rep name |
| Compare | `/compare/{qa-slug}` | Side-by-side vs `Compare Page.pdf`; TL;DR + body; breadcrumb policy |

**All four:** compare against **`docs/raw-html-pdf/`** (not `re-design/screenshots`).
Footer top CTA 2-col + compact pills; pills ~28px; content tight under header.

---

## Definition of done

- All four: 0 material fails, 5/5 structural, Gate 6 PASS
- Sitemap: all four types × locales (per doc counts)
- `validate-json-ld.ts` extended for all four
- Tech debt logged in `CLAUDE.md` for Step 0 gaps
- Update `TEMPLATE_FIDELITY_LOOP.md` §8 if new patterns emerge
- Commits: explicit path staging; Jake chooses per-template vs batch; no push without approval

---

## Commit message templates

```
feat(template-download): ship /downloads/[slug] + UK mirror with CreativeWork JSON-LD
feat(template-tool): ship /tools/[slug] + UK mirror with WebApplication JSON-LD
feat(template-book-a-call): ship /book-a-call/[slug] + UK mirror with WebPage JSON-LD
feat(template-compare): ship /compare/[slug] + UK mirror with BlogPosting JSON-LD
```
