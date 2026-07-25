# Chat B prompt — Book A Call + Compare

> **Paste everything in the code block below into a fresh Cursor chat.**
> Chat A (Download + Tool) is Gate 6 approved — commit before or after Chat B per Jake.

---

```
You are CONDUCTOR for Chat B of the four-template batch on branch feat/design-1.

Orchestrate only. Do not build or QA directly. Do not push unless I explicitly approve.

## Read first

1. CLAUDE.md
2. docs/templates/TEMPLATE_FIDELITY_LOOP.md (§0a hierarchy, §8–§10, §9 Cost mode: ON)
3. docs/briefs/active/TEMPLATE-BATCH-4-HANDOVER.md

## Chat A — DONE (Gate 6 approved, do not rebuild)

| Template | Routes | QA slug | Notes from Chat A |
|---|---|---|---|
| Download | /downloads/[slug] + /uk/downloads/[slug] | /downloads/10-ai-prompts | Post-FAQ "Get it now" block REMOVED (not in approved design). FAQs use FaqList. |
| Tool | /tools/[slug] + /uk/tools/[slug] | /tools/culture-match | Layout per Tool.html/PDF. Live-tool section ONLY when toolEmbed populated (Culture Match = hidden). Loom walkthrough (not screenshot). FAQ band = page dark #070D18, not blue #0A1628. Culture Match Loom patched in Sanity. |

Shared primitives shipped in Chat A:
- site/src/components/ui/faq-list/ — canonical dark-template FAQ (lime circle +/×). Storybook: Primitives/FaqList. Use on Book A Call + Compare if FAQs exist. Do NOT use Radix Accordion for dark marketing templates.
- VideoEmbed now supports Loom (loom.com/share + /embed). Download how-to-use may use GenericEmbedLite fallback; Tool uses eager Loom iframe in walkthrough frame.

Verify git status before starting — Chat A may be uncommitted.

## This session — build these two only

| Order | Template | Routes | Computed QA | Visual design PDF |
|---|---|---|---|---|
| 1 | Book A Call | /book-a-call/[slug] + /uk/book-a-call/[slug] | docs/raw-html/Book A Call.html | docs/raw-html-pdf/Book A Call.pdf |
| 2 | Compare | /compare/[slug] + /uk/compare/[slug] | docs/raw-html/Compare.html | docs/raw-html-pdf/Compare Page.pdf |

**Do NOT use docs/re-design/screenshots/** for design QA (old teal live site — wrong design era).

## Hard rules (learned from Video + Chat A — non-negotiable)

1. **Design reference hierarchy:** computed pixel diff = `docs/raw-html/{Template}.html`. Visual eyeball (Gate 6) = `docs/raw-html-pdf/*.pdf`. Never the re-design screenshot folder.
2. **No inline closing CTA** in template body — sitewide FooterTopCta owns "Ready to hire…". OMIT even if export shows it.
3. **No visible breadcrumbs** in `<main>` unless I explicitly approve at Step 0 (Compare export has breadcrumb markup — default = hide visual, BreadcrumbList JSON-LD only).
4. **All CTAs** = `MegaMenuPillLabel` with `size="cta"` (~28px, matches header Schedule a Call).
5. **FAQs on dark pages** = `FaqList` (lime +/× on #101B30 cards). Not Radix Accordion.
6. **Omit empty export sections** — do not render placeholder cards for missing CMS data (Tool live-embed lesson). If schema field empty, section absent.
7. **Section backgrounds** — match page ground (#070D18) unless export shows a distinct wash. Do not default to lighter blue bands without checking PDF.
8. **Spacing** — arbitrary px from export; no double padding inside Container; `--spacing: 0.5rem` = 8px per Tailwind unit.
9. **Sanity data gaps** — if export needs a Loom/Calendly/embed URL missing from CMS, write a one-shot patch script; Jake runs it. Do not hardcode CE URLs in template logic.
10. **Embeds** — render via PortableText handlers + VideoEmbed/HubSpot/Calendly only when data exists. Loom URLs in videoOverview as `videoEmbed` blocks.

## Cost mode rules

- Opus Builder first pass; Sonnet/Codex fix iterations only (failing rows).
- Step 0.5 mandatory: export-spec.json from raw-html before each build.
- Book A Call LITE PATH: main agent may build (no Opus subagent) — 6 docs, calendlyEmbed only.
- Compare: fork site/src/components/templates/blog/ — do not greenfield.
- Iteration cap 4 per template.
- Full chrome QA on Book A Call only; Compare = body diff unless chrome touched.

## Flow per template

Step 0 (HALT) → probe → report → wait for Jake
Step 0.5 → export-spec.json
Builder → first pass (cite raw-html + raw-html-pdf + export-spec)
QA → computed diff vs raw-html desktop + structural 5/5
  loop cap 4
Gate 5.5 (opt) → vision vs PDF
Gate 6 → Jake localhost vs PDF
Commit → explicit paths, single-line message, no push

## Step 0 — start here

Write/run:
- scripts/template-book-a-call/probe-step0-sanity.ts
- scripts/template-compare/probe-step0-sanity.ts

Pattern: scripts/template-video/probe-step0-sanity.ts

Report table: doc counts, locale split, QA slug (fullest doc matching export), field fill rates per export section, enum drift, meta fallbacks, omit list.

**Book A Call — HALT decisions for Jake:**
- Schema has no localeField — confirm UK route behaviour for 6 docs (same slug both locales?)
- calendlyEmbed Portable Text shape — what embed block types exist?
- metaTitle backfill on 6 docs

**Compare — HALT decisions for Jake:**
- Breadcrumb visible in export — default hide visual + JSON-LD only unless I say otherwise
- 30 compareBlog docs; author refs resolve; tldrSection fill rates
- Reuse blog PortableText renderers (videoEmbed + table from CONTENT-1E)

HALT until I approve Step 0 report.

## Export section maps (quick)

### Book A Call.html
- Hero: firstName + lastName as H1 (~67px desktop)
- Calendly embed area: calendlyEmbed PT — render embed blocks; no fabricated iframe if missing
- No FAQ on schema — OMIT unless Step 0 finds unexpected populated fields
- OMIT: inline closing CTA, visible breadcrumbs

Path is /book-a-call/[slug] NOT /book-a-calls/

### Compare.html
- Hero: title, competitor, tags, thumbnailImage
- TL;DR band: tldrSection if populated
- Body: content via B3 PortableText
- Author + date: author → teamMember, date
- FAQs: faqs[] via FaqList if populated
- Fork blog stack; BlogPosting JSON-LD
- OMIT: inline closing CTA, related/share unless schema backs

## Builder file stack (both)

types/sanity/documents/{type}.ts, lib/sanity/queries/{type}.ts, components/templates/{template}/, json-ld.tsx, app routes (default + uk), sitemap.ts, validate-json-ld.ts, tools/eslint/ui-strings.json + npm run generate-ui-strings

Verify: npm run build GREEN; lint clean; server-rendered where possible.

## Gate 6 URLs (after CLEAN PASS)

- /book-a-call/{qa-slug} vs docs/raw-html-pdf/Book A Call.pdf
- /compare/{qa-slug} vs docs/raw-html-pdf/Compare Page.pdf

**All four batch pages checklist:** footer top CTA 2-col, pills ~28px, content tight under header, no duplicate closing band, FaqList style if FAQs present.

## Commits (after Gate 6 — Jake approves)

feat(template-book-a-call): ship /book-a-call/[slug] + UK mirror with WebPage JSON-LD
feat(template-compare): ship /compare/[slug] + UK mirror with BlogPosting JSON-LD

(Optional: separate commits for Chat A if not yet committed)
feat(template-download): ship /downloads/[slug] + UK mirror
feat(template-tool): ship /tools/[slug] + UK mirror + FaqList primitive

Start: Step 0 dual probe → report → HALT.
```
