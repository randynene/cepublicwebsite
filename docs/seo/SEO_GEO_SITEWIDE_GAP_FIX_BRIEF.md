# SITE-WIDE SEO / GEO GAP-FIX BRIEF

**Purpose:** the "fix once" SEO/GEO gaps from the infrastructure audit — site-wide items that aren't per-template. Prioritised for GEO impact. The mega-menu link-visibility fix is folded in here (Jake's call) as the top item since it's the biggest GEO leak and the code is fresh.

**Launch-gate marking:** items tagged **[LAUNCH GATE]** are Tier 1 — they block go-live and must ship before cutover. Items tagged **[POST-LAUNCH]** are optimization, not blocking. Maps to the tier structure in the per-template checklist.

This is a build brief. Match existing patterns (the audit documented them). Read-only investigate first where noted, then fix. HALT points marked. Commit at checkpoints, single-line messages, no push.

---

## P0-1 [LAUNCH GATE] — Mega-menu links must be in the initial server-rendered HTML

**The problem (biggest GEO leak):** desktop mega-menus lazy-mount only after first open (`openedMenus.has(shellMenuKey) ? <MegaMenuShell>...`), and the mobile mega-menu renders section labels as `<span>`, not links. Result: the deep internal links to services/technology/resources pages — a large part of the internal link graph — are absent from the initial HTML. AI crawlers (which don't reliably execute JS or simulate clicks) never see them. Only the 6 top-level nav items are exposed (via SiteNavigationElement JSON-LD).

**The fix — the mega-menu link URLs must exist as real `<a href>` in the SSR HTML, regardless of open/closed visual state.** Options, in order of preference:
1. **Render the mega-menu link markup server-side, hidden via CSS until opened** (not conditionally mounted). The links are then in the HTML from first paint; the open/close is purely presentational. This is the clean fix — visual behaviour unchanged for users, links now crawlable.
2. If full server render of the panel is too heavy, at minimum emit the mega-menu destination links as crawlable anchors somewhere in the initial HTML (e.g. an SSR link list the visual menu enhances).

Requirements:
- Desktop: mega-menu deep links (`/services/*`, `/technology/*`, `/resources/*`, blog/customer-story featured links) present as `<a href>` in initial HTML.
- Mobile: `MobileMegaAccordion` section items render as real `<a href>` links, not `<span>` labels.
- Do NOT change the visual open/close behaviour or the design — this is about what's in the DOM at first paint, not how it looks.
- Verify: `curl` / view-source the homepage (JS disabled) and confirm the mega-menu destination URLs are in the HTML.

**HALT after this fix** — show view-source proof the links are in the initial HTML, and confirm the visual menu still behaves identically. This touches the chrome you just finished, so review before proceeding.

---

## P0-2 [LAUNCH GATE] — Sitewide Organization + WebSite JSON-LD

**The problem:** no sitewide entity anchor. Organization only appears nested inside BlogPosting `publisher`. AI-search needs a canonical entity ("Cloud Employee is this company, this logo, this URL, these socials") to ground brand mentions.

**The fix:** emit an `Organization` and a `WebSite` JSON-LD block sitewide (root layout), via `serializeJsonLd()`:
- **Organization:** legal name, url, logo (real asset — coordinate with the blog `/og-default.png` placeholder flagged as post-launch tech debt; use the real CE logo), sameAs (LinkedIn, and other verified profiles — pull real URLs, don't invent), contactPoint if available.
- **WebSite:** name, url, and `potentialAction` SearchAction if there's a site search (there's the Clara "Ask about our services" widget — only add SearchAction if it maps to a real query URL; otherwise omit, don't fake it).
- Source entity facts from Sanity `siteSettings` where they exist; flag any missing (logo, socials) as data to supply rather than fabricating.

---

## P1-1 [POST-LAUNCH] — robots.txt AI-crawler policy (deliberate stance)

**Current:** prod `robots.ts` is allow-all (`userAgent: '*'`). Functional but no documented AI stance.

**Decision needed from Jake before implementing** (this is strategy, not a code call):
- **Recommended for a GEO-first company:** explicitly ALLOW the search/answer bots that drive citations (OAI-SearchBot, Claude-SearchBot / ClaudeBot, PerplexityBot, GPTBot, Google-Extended) so you stay eligible for AI-search citations and referral traffic. CE *wants* to be cited — visibility is the goal.
- Optionally block pure training/scraping crawlers with no citation benefit (CCBot, Bytespider) if there's a data-scraping concern — but note this has no effect on citation eligibility either way, and blocking too aggressively can accidentally reduce visibility.
- Verify the CDN/Vercel layer isn't silently overriding robots.txt (a common misconfiguration — the two layers must agree).

Implement explicit `User-agent` rules in `robots.ts` once Jake confirms the stance. Keep the staging/preview disallow-all gate intact.

---

## P1-2 [POST-LAUNCH] — `llms.txt` (low priority, B2A value only)

**Reality (verified mid-2026):** ~10% adoption, and the AI search/answer bots overwhelmingly ignore it and crawl HTML directly — no measurable citation benefit. Its real value is for *agentic/IDE* consumers (Cursor, Claude Code, MCP). Near-zero cost, so ship one, but do NOT treat it as an AI-search ranking lever and do NOT prioritise it over the above.

**The fix (when convenient):** a single `/llms.txt` (Markdown, H1 first line) with a clean curated inventory of CE's highest-value pages + short descriptions. Do NOT generate per-page Markdown mirrors (creates duplicate-content crawl-budget dilution). Keep it small and current.

---

## P1-3 [POST-LAUNCH] — `dateModified` + content freshness (2026 ranking factor)

**Why it's new/important:** 2026 AEO research makes freshness a hard factor — 83% of commercial-query AI citations come from pages updated within 12 months, and pages not refreshed quarterly are 3x more likely to lose citations.

**The fix:**
- Ensure Article/relevant JSON-LD emits `datePublished` + `dateModified` sourced from Sanity `_updatedAt` / `_createdAt` (site-wide pattern in the JSON-LD helpers).
- Stand up a quarterly content-refresh discipline on high-value pages (owned by content, not code — flag as a process, not a build task).

## P2 — Smaller consistency fixes

- **P2-1 [POST-LAUNCH] Nav JSON-LD escaping:** `nav.tsx` SiteNavigationElement uses raw `JSON.stringify` — route it through `serializeJsonLd()` for consistency/XSS-safety.
- **P2-2 [LAUNCH GATE] `lang` attribute for UK:** UK pages get hreflang alternates but `<html lang="en">` is static. Set `lang="en-GB"` on UK-locale pages (`en-US` default) so document language is correct. (Small, but it's a correctness gate — cheap to do before launch.)
- **P2-3 [POST-LAUNCH] Sitemap future-proofing:** confirmed only `blogPost` in `URL_BUILDERS`; handled per-template by the checklist, but audit the sitemap once when 3-4 templates have shipped to ensure none were missed.

---

## Sequencing & constraints

- **Launch gate (must ship before cutover):** P0-1 (mega-menu links in HTML), P0-2 (Organization/WebSite schema), P2-2 (`lang=en-GB`). Do the two P0s first — highest GEO value, and the mega-menu code is fresh.
- **Post-launch (optimize, not blocking):** P1-1 (robots stance — needs Jake's decision), P1-2 (llms.txt), P1-3 (dateModified/freshness), P2-1, P2-3.
- P1-1 (robots) needs Jake's stance decision before implementing — flag and wait.
- Match existing patterns (serializeJsonLd, env-driven URLs). Don't fabricate entity facts (logo, socials, contact) — source from siteSettings or flag as data to supply.
- HALT after P0-1 (mega-menu view-source proof). Commit at checkpoints, no push.

## Deliverable
Mega-menu deep links in initial HTML (crawlable, visual behaviour unchanged); sitewide Organization + WebSite JSON-LD; robots.txt AI stance (pending Jake); llms.txt (low priority); the P2 consistency fixes. Data gaps (logo/socials) flagged not invented. Committed, not pushed.
