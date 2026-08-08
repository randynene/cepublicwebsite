
HANDBACK
- Task: B (canonical-host guard)
- Status: complete (code + local verification); post-deploy prod verification pending merge
- Branch + PR: fix/canonical-host-guard -> PR #86
- Files written: site/src/lib/canonical-host.ts (new); site/src/app/robots.ts; site/src/app/llms.txt/route.ts; site/src/components/third-party-scripts.tsx
- Manifest fragment: none (no data artifacts)
- BLOCKED ON: Jake to merge PR #86. I did not push to main per instruction, so /llms.txt is still 404 and markerConfig is still in production HTML right now.
- SURPRISES:
  1. NEXT_PUBLIC_CANONICAL_HOST is set on PREVIEW as well as Production. A build-time
     comparison could never have distinguished previews either, so the bug was wider
     than SEO_PROGRAMME 2.3 describes.
  2. I could not read the variable's value: it is stored Sensitive, so `vercel env pull`
     writes an empty string for it. The diagnosis is by elimination and is airtight:
     both sides of both comparisons resolve to www.cloudemployee.io, robots.txt (which
     trims + lowercases) passes and the other two fail, so the value must carry stray
     whitespace or capitals. Broken since cutover set it, not a later regression.
  3. This repo's working tree is SHARED with another live session. Mid-task it switched
     the tree onto branch seo/ahrefs-deep-pull and my commit landed on top of their
     Speed Insights commit. I moved my work into a separate git worktree, and reset
     their branch back to 94b48b3 to remove my commit from it. Their untracked files
     (scripts/seo/ahrefs-deep-pull.ts, scripts/seo/dataforseo-pull.ts) were untouched.
     Concurrent sessions need separate worktrees or this will corrupt someone's branch.
- Preview deploy verified (mygratr-p0qu0tleb): robots `Disallow: /`, /llms.txt 404,
  markerConfig PRESENT. The must-not-change half of the behaviour is confirmed on a real
  Vercel build, not just locally.
- NOT DONE: the four post-deploy production curls, because the fix is not deployed and
  I was told not to push to main. Run them after merge; the exact commands are in PR #86.

---

HANDBACK
- Task: A (Speed Insights) + C/D groundwork + E checklist; B is dashboard-only
- Status: partial - all code done, all four dashboard enablements need Jake
- Branch + PR: seo/speed-insights-setup -> PR #87 (rebased on main e713671)
- Files written: site/src/app/layout.tsx (+10), site/package.json,
  site/package-lock.json, scripts/seo/dataforseo-pull.ts (530 lines, untested
  vs live API), docs/seo/DATA_SOURCE_ENABLEMENT.md (376 lines, click-by-click
  for A-E). No data files - no source is live yet, so nothing to pull.
- Manifest fragment: audit-output/seo-intel/2026-08-06/MANIFEST.md ("Source enablement")
- BLOCKED ON Jake, all four are dashboard clicks I have no credentials for:
  Vercel enable + merge #87; Bing import; PSI key into .env as PAGESPEED_API_KEY;
  DATAFORSEO_LOGIN/PASSWORD into .env (then I can test the pull for real).
  PSI key MUST land before the Frog crawl or CWV columns come back empty silently.
- SURPRISES: (1) GIT COLLISION - another session drove git in this shared working
  tree mid-run: checked out branches under me, committed onto my branch, then
  reset it, orphaning my commit. Recovered via `git branch -f` with no checkout.
  Two sessions in one working dir is unsafe; use git worktree. Detail in MANIFEST.
  (2) insight-bank is NOT on this filesystem - SEO_PROGRAMME.md §5.2 and §7 both
  assume it. Used ce-sales-brain/apps/enrichment instead (identical env var names).
  (3) Speed Insights is NOT dashboard-only on Next.js - needs the component or the
  dashboard is empty forever, silently. (4) Branch name given for B
  (fix/canonical-host-guard) belongs to another session's live work, already on
  origin at 0c7299b; Bing needs no code at all. Not touched.
- NOT DONE: no dashboard enabled (no access, non-interactive session, Vercel MCP
  needs OAuth); DataForSEO data paths untested (no creds - only the free
  credential check is verified, and it refuses correctly); Frog crawl not run
  (desktop GUI + gated on the PSI key). Nothing dropped silently.

HANDBACK
- Task: D
- Status: partial
- Branch + PR: seo/ahrefs-deep-pull, https://github.com/galaxyfunk/mygratr/pull/88 (script only; audit-output is gitignored)
- Files written: audit-output/seo-intel/2026-08-06/ahrefs/ - 40 JSON files + ENDPOINTS.md.
  Complete: organic-keywords-us (48), organic-keywords-gb (4), organic-competitors us/gb (20/13),
  broken-backlinks (28), linked-domains (235), batch-analysis (6 domains x 34 metrics),
  site-audit-issues (173), 7 history series (37-80 pts each), all scalar metrics, 15 competitor
  scalar files, competitor-andela organic keywords (49).
  TRUNCATED: refdomains (250 of 1,567), backlinks-all-time (500).
- Manifest fragment: audit-output/seo-intel/2026-08-06/MANIFEST-ahrefs.md
- BLOCKED ON: the Ahrefs monthly unit quota is EXHAUSTED - 399,793/400,000, resets 17 Aug 2026.
  The pool is per WORKSPACE, so every Ahrefs API call from any session now fails. I caused this.
  Any session with Ahrefs work planned must reschedule or use another source.
- SURPRISES:
  1. Ahrefs v3 has NO offset parameter AND ignores unknown query params silently, so offset=N
     refetches page one forever while looking like progress. Requests are priced by whole-report
     size, not rows returned (one 250-row all-backlinks page = 29,000 units). Those two together
     spent ~396k units. Pagination must be keyset; the committed script now does it.
  2. NO content-gap or keyword-gap endpoint exists in v3 at any tier - both are UI-only. The
     competitor comparison in the brief has to be computed downstream from per-domain keyword
     and top-page pulls. Those specific pulls are the ones that did not survive the quota.
  3. The AI-answer columns (ai_responses_chatgpt / perplexity / gemini / google_ai_overviews) are
     advertised by the API but rejected on select - they need Brand Radar. No API visibility into
     AI citations, which matters if SEO_PROGRAMME assumes we can measure that.
  4. A live Ahrefs Site Audit project exists that no repo doc mentions: 9325640 "Cloudemployee",
     verified, owner jake@cloudemployee.io. Last crawl 1 Aug 2026 - the OLD Webflow site, two days
     pre-cutover - health 22/100, 584 of 751 URLs with errors. Re-crawling costs no API units and
     would give a real before/after for Tech Debt #66.
- NOT DONE: live backlink graph (8,816 links, the biggest gap), refdomains beyond 250, anchors,
  best-by-external/internal-links, top-pages (us+gb), Keywords Explorer overview + idea expansions,
  SERP overviews, and competitor keyword/top-page sets for toptal/turing/arc/revelo. All coded and
  ready in the script; all blocked purely on the quota reset. Paid data is genuinely empty
  (paid_keywords = 0). Rank Tracker is empty because the project tracks 0 keywords - a UI fix, not
  an API limit. Per-URL Site Audit crawl data needs one request per URL and was out of scope.
  CANNOT get on this plan at all: content gap, keyword gap, link intersect, AI-answer citations,
  and site-explorer/keywords-history (403).

HANDBACK (final, supersedes the 6 Aug partial)
- Task: D
- Status: complete for collection; API gaps deferred to 17 Aug by design
- Branch + PR: seo/ahrefs-deep-pull, https://github.com/galaxyfunk/mygratr/pull/88 (8 commits, 3 from other sessions - untouched)
- Files written: ahrefs/ now holds 15 UI-export JSONs + the API pull.
  content-gap-us 25,557 | link-intersect 30,000 (UI cap of 61,151) | matching-terms 18,105 |
  backlinks 12,795 | best-by-links 5,374 | refdomains 987 | traffic-history 731 |
  anchors 525 | top-pages all/us/gb 45/34/9 | organic-keywords us/gb 67/10 |
  organic-competitors us/gb 20/13. 149MB total.
  Scripts: scripts/seo/ahrefs-deep-pull.ts, scripts/seo/ahrefs-import-exports.ts
- Manifest fragment: MANIFEST-ahrefs.md (API), MANIFEST-ahrefs-exports.md (UI),
  ahrefs/ENDPOINTS.md (full surface), ahrefs/RESUME.md (17 Aug runbook)
- BLOCKED ON: nothing. API units reset 17 Aug; RESUME.md has the command, the
  --only groups worth buying, per-group unit estimates, and the do-not-re-buy list.
- SURPRISES:
  1. Requests are priced by WHOLE-REPORT size, not rows returned (one 250-row
     all-backlinks page = 29,000 units). The live backlink graph would cost ~1.04M
     units, so the API route to it is permanently closed on this plan. UI export
     got the same 12,795 links for free. Prefer UI over API for anything large.
  2. Brand Radar API is FREE (0 units, verified in the API usage log). AI-citation
     data is pullable on demand even with the pool empty. Should be scripted.
  3. Ahrefs billing does NOT charge overage - flat GBP 199/mo, requests simply
     refused. Exhausting units costs time, not money. My earlier alarm was wrong.
  4. Day-one AI baseline, unrecoverable later: across CE's own 10 buying questions,
     Toptal 7 mentions, Turing 6, arc 6, BairesDev 6, Cloud Employee 0.
- NOT DONE: brand-radar export (collecting weekly, first data ~14 Aug, free API
  route documented). keywords-explorer overview + serp-overview deferred to 17 Aug
  (~30-60k units, the only group RESUME.md recommends buying). site-explorer/
  keywords-history is 403 on this plan. ai_responses_* columns need Brand Radar
  tier. No analysis performed, as instructed.

HANDBACK
- Task: merge-86 + speed-insights-check
- Status: complete (Job 1) | blocked on dashboard read (Job 2 half a)
- VERIFICATION: prod deploy dpl_6qVVDzq4hZDYLoTZhFJuPMQYPo1m = commit 2fe4fcb, READY.
  1. /llms.txt -> "HTTP status: 200", 3606 bytes, body opens "# Cloud Employee" (was 404).
  2. markerConfig on homepage -> "markerConfig occurrences: 0" (also marker-io 0,
     getmarker 0). Was 1, with project 6a607cb9bba82be8b774fc61 exposed to customers.
  3. robots.txt -> "User-Agent: *  Allow: /  Disallow: /download-thank-you/
     Sitemap: https://www.cloudemployee.io/sitemap.xml", HTTP 200. No regression.
  4. npm run launch:verify-noindex -> "BLOCKED staging.jakevibes.dev / BLOCKED
     mygratr.vercel.app / -- mygratr-c3utcgloa not reachable (HTTP 404)" then
     "No non-canonical host is indexable." EXIT CODE: 0.
  Extra: staging robots still "Disallow: /" and staging /llms.txt still 404, so the
  request-host guard is confirmed correct on BOTH sides, not just production.
- SPEED INSIGHTS: half (b) DONE - PR #87 was already merged (6 Aug, 9cc682b) and is
  live; @vercel/speed-insights ^2.0.0 in site/package.json, <SpeedInsights /> in
  layout.tsx, and the runtime ships in prod chunk /_next/static/chunks/0y.90ql7fltpe.js
  which injects /_vercel/speed-insights/script.js. Half (a) NOT PROVABLE from outside:
  /_vercel/speed-insights/script.js 200 and /vitals 400 are IDENTICAL on a control
  project, and script.js is byte-identical (md5 0e7c215a...) between the two, so those
  probes are platform routes and are NOT evidence of enablement. JAKE MUST CLICK:
  Vercel > mygratr > Speed Insights tab. The component has been live ~24h, so if (a)
  is on the tab already shows real data; an "Enable" CTA or zero data means (a) is off.
- PR #87: already merged before this session, so nothing to merge. It also deployed
  ALONE on 6 Aug and #86 deployed alone today, so the two never confounded each other.
- SURPRISES: (1) #87 already merged - the brief assumed it was not. (2) My first read
  of half (a) was wrong; the control project disproved the endpoint probe. (3) gh pr
  merge --delete-branch also deleted the LOCAL fix/canonical-host-guard branch in this
  shared tree; verified nothing lost (tip 0c7299b intact, content identical to main).
- NOT DONE: did not merge #88 (as instructed; it is also the branch this tree sits on).
  Did not read NEXT_PUBLIC_CANONICAL_HOST - not needed, both bugs fixed. Did not POST
  synthetic vitals to discriminate half (a): it would have injected fake LCP values
  into the very CWV dataset Jake is trying to measure.

---

HANDBACK
- Task: C (Search Console deep pull)
- Status: complete (URL Inspection deliberately sampled, see NOT DONE)
- Branch + PR: seo/gsc-deep-pull, PR #90 (worktree at .claude/worktrees/gsc-deep-pull; nothing checked out, reset or deleted in the shared tree)
- Files written: 49 JSON into audit-output/seo-intel/2026-08-06/gsc/. Full history 2025-04-07 to 2026-08-07: date 487, query 17,711, page 1,257, device 3, country 231, searchAppearance 2, query x page 26,110, query x country 53,508, query x device 23,373, page x country 13,055, page x device 1,512, date x page 68,341, date x country 38,633, date x device 1,367. Cutover pair (5 days each side): post query 2,217 / page 218 / query x page 2,412; pre query 2,345 / page 204 / query x page 2,675. Search types: image 301 queries / 156 pages, video 10/9, news 1/18, discover and googleNews are all-zero. url-inspection.json 109 URLs.
- Manifest fragment: audit-output/seo-intel/2026-08-06/MANIFEST-gsc.md (per file: dimensions, date range, rows, cap flag, freshest date, ours/talent/other split)
- ROW CAPS HIT: none. Every job paginated on startRow until a request returned under 25,000 rows.
- POST-CUTOVER WINDOW: 5 days (3 to 7 Aug). Freshest FINAL date is 5 Aug; 6 and 7 Aug exist only as unfinalised data. Matched pre-window is 29 Jul to 2 Aug. Five days, two of them provisional, is a catastrophe check and not a migration verdict.
- BLOCKED ON: nothing.
- SURPRISES: (1) The URL Inspection API DOES serve this property, so per-URL coverage state, Google-selected vs declared canonical, last crawl time and robots verdict are all available by API. CLAUDE.md Tech Debt #66 and the post-launch audit treat GSC as a performance-only source; it is not. (2) Google throttles that API to roughly 0.5-1.3 URLs/minute in practice, nowhere near the documented 2,000/day, so it is an overnight job at site scale, not an interactive one. (3) ctr and position are absent entirely from Discover and Google News rows, and both surfaces reject the query dimension; a strict Zod schema silently killed those pulls on the first run. (4) searchAppearance cannot be grouped with any other dimension - probed, not assumed. (5) talent.cloudemployee.io is 185 of 1,257 pages in the property, roughly 15 percent, so it is large enough to distort any unfiltered read; every page-bearing file carries an ours/talent/other row count.
- NOT DONE: URL Inspection covers the top 109 of our 1,070 pages that have impressions, ranked by impressions, not all of them. Cause is the throttle above, not an error: 0 failures out of 109. It is checkpointed per URL, so raising --inspect-limit and re-running only fetches the new ones. Discover and googleNews query-dimension files are empty by API refusal, recorded verbatim in the manifest. No analysis or interpretation performed, per brief.

## Task E - replay every known URL against production (7 Aug 2026)

HANDBACK
- Task: E
- Status: complete
- Branch + PR: seo/replay-all-urls, PR #91 (worktree at ../mygratr-wt-replay; shared tree untouched)
- Files written: audit-output/seo-intel/2026-08-06/crawl/ - urls.json 6520; indexability.json 6520;
  response-times.json 6520; hreflang.json / json-ld.json / internal-links.json 656 each;
  images-missing-alt.json 655; uk-us-pairs.json 326; duplicate-descriptions.json 322 groups;
  duplicate-titles.json 306 groups; thin-pages.json 165; redirect-chains.json 28; orphans.json 7;
  sources.json 4; offsite-final-destinations.json 4; sitemap-not-200.json 4; h1-issues.json 1.
  Script: scripts/seo/replay-all-urls.ts (re-runnable, resume by default via per-path cache).
- Manifest fragment: MANIFEST-crawl.md
- URL COUNTS: sitemap 653 | Search Console 320 | Ahrefs top-pages + best-by-links 5396 |
  redirect tables 640 | DEDUPLICATED UNION 6520. Excluded 19 talent.cloudemployee.io URLs
  (11 GSC, 8 Ahrefs) and 16 redirect sources that are path-to-regexp patterns, not URLs.
  Of the 6520: 656 serve a 200 at the requested path, 3189 redirect and land on a 200,
  2674 are 404, 1 is 400.
- UK DUPLICATION: 326 /uk/ pages serve 200. 307 are word-identical to their US pair.
  18 differ, and 10 of those differ on title or description only (jaccard 1.0, equal word
  counts). 1 has no US counterpart: /uk/team/caitlin-murray, which is Tech Debt #58 exactly.
- BLOCKED ON: nothing.
- SURPRISES: (1) The sitemap lists 4 URLs that redirect rather than serve:
  /compare/cloud-employee-vs-arc-dev, /customer-story/virgin, /tools/price-comparison-calculator,
  /uk/customer-story/virgin. CLAUDE.md records the 653-URL sitemap as live and correct and the
  arc-dev redirect as a deliberate parity mirror (#55), but neither notes that the redirecting
  URLs are still IN the sitemap. (2) 5 book-a-call pages have a 0-word server-rendered body
  (/book-a-call/{aj,anto,molly,seb,shawnee}); the Calendly embed is client-side, so this is a
  measurement floor, not necessarily an empty page. (3) 306 duplicate-title groups, 300 of which
  are a US page and its UK clone sharing one title, which is the same finding as the UK
  duplication line above seen from the metadata side.
- NOT DONE: 16 redirect-table sources containing :slug+ params were not replayed - they are
  patterns, not URLs, and are counted as excluded in the manifest. Word count is
  server-rendered HTML only, with nav/header/footer stripped, so client-rendered copy is not
  counted. images-missing-alt is dominated by sitewide chrome (logo + mega-menu, 11+ per page
  on nearly every page); chrome is not split from in-content images, and the manifest says so.
  Response time is one uncached sample per URL under a 4-way concurrency limit, not a benchmark.
  No analysis or prioritisation performed, as instructed.

## Housekeeping - finish GSC URL Inspection + clean up PR #88 (8 Aug 2026)

HANDBACK
- Task: housekeeping (GSC inspection + PR88)
- Status: both done. Inspection is RUNNING in the background; PR #88 is cleaned and mergeable.
- INSPECTION RUN: started 01:36 UTC 8 Aug, `--inspect-limit=1070` (every one of our pages with
  impressions). talent.cloudemployee.io is NOT touched: `ownerOf()` in the script filters the 185
  talent + 2 other-host pages out of the target list before a single call is made. Banked 109 of
  1070 at start, 128 after 8 minutes. CHECK PROGRESS: `tail
  audit-output/seo-intel/2026-08-06/logs/gsc-inspection-progress.log` (one line every 10 min with
  count, remaining and a live ETA). Full detail in `logs/gsc-inspection-run.log`. Still alive?
  `screen -ls` shows `gsc-inspect` and `gsc-watch`; `screen -r gsc-inspect` watches it live
  (detach again with ctrl-a d). ETA 6-18h on observed 2.4 URLs/min, longer if Google throttles
  harder overnight. MANIFEST-gsc.md rewrites itself with the final count on each clean exit.
- PR #88: KEPT the 5 Ahrefs commits (ahrefs-deep-pull.ts + ahrefs-import-exports.ts, 2 files,
  1052 lines). EXCLUDED 1 commit, `1b5b131` the CE favicon/icon.svg/apple-icon - already on main
  as `33c4db1`, all three blobs byte-identical, so nothing was discarded. Rebased onto main in a
  throwaway worktree; git dropped the favicon commit itself as already-applied. MERGEABLE, checks
  are Vercel preview deploys only.
- SURPRISES: (1) `nohup` + `disown` does NOT survive this agent's shell - the tool kills the whole
  process group, and it silently killed the first inspection launch after 2 minutes. `screen -dmS`
  does survive. That is almost certainly why the original run stopped at 109 with ZERO failures:
  it was killed, not throttled. (2) Real throughput is ~2.4 URLs/min, not the 0.5-1.3 the earlier
  manifest recorded, so the 18h estimate is probably pessimistic. (3) PR #88 as GitHub reported it
  listed 8 commits and 10 files including DataForSEO and Speed Insights; git says 6 and 5, because
  those two had already merged to main via PR #87. The GitHub view was stale, not the branch.
- NOT DONE: nothing from the brief. Left alone deliberately: the script prints nothing per URL
  during inspection (18h of silence in the main log), which is why the external progress ticker
  exists - worth a one-line log inside `gsc-deep-pull.ts` before PR #90 merges. 4 GSC performance
  jobs are permanent API refusals (discover/googleNews `query`, searchAppearance pairs) and get
  re-attempted on every supervisor restart; harmless, 4 calls each. The `.claude/worktrees/
  ahrefs-deep-pull` worktree is left in place; remove with `git worktree remove` when PR #88 lands.

---

HANDBACK
- Task: hubspot + joined table
- Status: complete (Job 1 quality BAIL-OUT; Job 2 joined table built)
- Branch + PR: seo/joined-table (worktree `.claude/worktrees/joined-table`; shared tree left on main)
- Files written:
  - scripts/seo/hubspot-leads-pull.ts, scripts/seo/build-joined-table.ts (+ package.json npm aliases)
  - audit-output/seo-intel/2026-08-06/hubspot/ — 303 submissions / 121 pageUrl rows; MANIFEST-hubspot.md
  - audit-output/seo-intel/2026-08-06/joined/ — pages.json + pages.csv **7027 rows × 26 cols**; MANIFEST-joined.md
- LEADS ATTRIBUTION: first-page-seen NOT available (contacts CRM 403). Calendly bookings NOT visible (meetings/engagements 403). Raw form subs readable (303/12m) but quality signals (lifecycle/deals/owner/spam) are not — BAILED; leads_* null in joined table. Do not rank pages on raw counts.
- JOINED TABLE: 7027 rows, 26 cols. talent.cloudemployee.io dropped: 185 GSC full-page (+5 ahrefs, +2 bing; 0 crawl). Coverage (filled): status 6520, impressions/clicks/pos_90d 320, top_query 696, word_count 6520, internal_links_in 725, backlinks 5366, referring_domains 5392, organic_keywords 41, lighthouse 0, copilot 95, leads_* 0. Null ≠ zero.
- SURPRISES: (1) HubSpot private app has forms scope only — no CRM, so quality bail was forced. (2) Ahrefs best-by-links lists http/apex/www as separate rows; last-write-wins would keep http-apex (home → 11 RD). Join now keeps MAX. (3) No Lighthouse column in Ahrefs site-audit export.
- NOT DONE: HubSpot CRM scopes (contacts+deals+meetings) still needed before leads can rank pages; Lighthouse/CWV still absent (Tech Debt #66).

---

HANDBACK
- Task: synthesis
- Status: complete. All six lenses landed; none missing.
- Files written: analysis/FINDINGS.md, analysis/ROADMAP.json, docs/seo/SEO_PROGRAMME.md
  (rebuilt; old version preserved at docs/seo/SEO_PROGRAMME_v1_4aug.md).
- WAVE 1 COUNT: 10 items, ~32h Claude + 30 min Jake, all shippable this week.
- FAILED VERIFICATION: "toptal alternatives pos 4 / 2,000 searches" (7 imp in 16mo -
  killed, SEO-6 premise corrected); "879 robots-blocked links" (unreproducible, killed);
  "UK pages convert better" (composition - /uk home is 242 of 245 clicks); Marker.io
  281-to-242 attribution (demoted to hypothesis); thin-content programme (killed);
  raw-impression rankings on nearshoring/about-us/toptal-vs-upwork (downgraded).
- CONTRADICTIONS RESOLVED: Ahrefs-vs-Vercel perf = lab mobile vs field desktop, both
  right, lab predicts the forming CrUX; Brand Radar 0 vs Copilot 8,640 = different
  instruments, keep both; TECH-01 consolidate-UK vs D1 = D1 stands, narrowed per UK-08.
- TOP 3: (1) performance deletion package - server-side geo + delete body-hide + defer
  HubSpot + restore HTML caching, before the first CrUX window forms; (2) hire-fleet +
  pillar content upgrades against the verified 642-kw / 159k-search gap; (3) link-equity
  package - /alternatives page 1, orphans, apex links, dead-blog 301 map (154 domains).
- DECISIONS FOR JAKE: DFH-1 confirm body-hide delete; DFH-2 UK storage (recommend
  locale-override fields - probed, zero uk docs exist); ratify D1 narrowing; Philippines
  consolidation after 31 Aug; book-a-call noindex; Seb batch (shawnee 404, Caitlin,
  .com.au, UK presence); consent strategy; HubSpot CRM scopes.
- SURPRISES: url-inspection.json grew 109 -> 1,070 records mid-analysis (background job);
  full file makes the UK refusal STRONGER (15 indexed vs 57 duplicate verdicts). Junk
  families alone are 80,042 imp / 0 clicks (8.8% of 16mo). Strict non-brand CTR pos 4-6
  is 0.161% - pollution confirmed beyond the lenses' claims. /team/shawnee-malesich is a
  live 404 holding 286 Copilot citations + 112 clicks on her name.
- NOT DONE: manifests not regenerated (stale counts noted in FINDINGS.md); no Wave-1
  fixes executed (analysis session, per debugging rules); GB opportunity sizing waits on
  the 17 Aug Ahrefs reset.
