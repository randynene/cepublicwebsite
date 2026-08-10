# S8 - Backlink rescue part A: the 301 decision list

**Session:** S8 (see `docs/seo/EXECUTION_SESSIONS.md`). **Ships nothing.** This is a
decision document for Jake, not a redirect. Nothing in `site/` is touched here.
S9 ships the approved rows.

**Sources:** `audit-output/seo-intel/2026-08-06/analysis/authority.md` AUTH-01 (the
dead-blog funnel, ranked by referring domains) and AUTH-06 (the broken-backlinks
reclaim list, ranked by DR). FINDINGS.md Wave 2 item 2.3. Tech Debt #65 in CLAUDE.md.

**Data boundary you must read before trusting the counts.** The raw join behind
AUTH-01 (`ahrefs/backlinks.export.json`, 995 referring domains) carries PII, is
gitignored, and is not present in this session. So exact referring-domain counts
exist only for the AUTH-01 top 10 (rows 1-10 below); those rows are ranked by
referring domains as the brief requires. Rows 11-25 are the AUTH-06 broken-backlink
URLs, whose per-URL referring-domain counts are not in the committed corpus; AUTH-06
characterises them as one-to-few domains each, so they are ordered here by max DR as
the best available proxy and their refdomain cells are marked `n/a*`. When S9 runs,
re-run the AUTH-01 join to confirm the ordering below row 10 before shipping.

---

## Preamble

**How much is in play.** AUTH-01: **154 referring domains send 359 links into 69 dead
blog URLs**, every one of which 308s to the `/blog` hub, which Google treats as a soft
404. That is the recoverable pool. AUTH-06 adds **24 individually-reported broken
backlinks** (mostly single-link, some outside `/blog`). **23 of the 24 were already 404
before the 3 Aug cutover** - this is inherited Webflow link rot, so frame the whole
exercise as reclaim, not repair. Nothing here was broken by the migration.

**How confident.** Of the 25 rows, **11 are high confidence**: 4 are high-confidence
redirect reclaims (an honest topical target that is a live 200), and 7 are
high-confidence "accept the loss" calls (no honest target exists, so any 301 would be
a soft 404). The remaining 14 are medium or low - they need either a live-200 curl
check in S9 or a Jake judgment call, and 3 of them are really content-cost decisions
(write or restore the page) rather than redirect decisions.

**The handful to ship first.** If Jake approves only a few, ship these four - highest
confidence, honest live targets, biggest reclaim per unit of risk:

1. `/blog/it-outsourcing/why-philippines-for-business` -> `/hiring-tips/hiring-developers-in-the-philippines-...`
   (**20 referring domains, DR 76** - the biggest reclaim in the set that has an honest
   live target; target curl-confirmed 200 in AUTH-01).
2. `/web-developer` -> `/services/web-developers` (DR 59 - AUTH-06's "best mechanical win";
   exact topical match).
3. `/blog/it-outsourcing/how-to-hire-react-native-developer-step-by-step-guide` ->
   `/technology/react-native-developers` (DR 37 - clean product match).
4. `/blog/it-outsourcing/neck-and-neck-...-india-and-the-philippines` ->
   `/hiring-tips/hiring-developers-in-the-philippines-...` (DR 30 - same clean PH target as #1).

Rows 2-4 are the mechanical wins broken out in the S9 quick list at the bottom; they
need no judgment. Row 1 is a judgment call that happens to be as safe as a mechanical one.

**Content cost.** Three rows have no honest live target but carry real authority, so
the only non-soft-404 reclaim is to write or restore a page. They are flagged
`WRITE/RESTORE` in the table and listed again under "Content-cost rows" below so Jake
can see the cost before deciding. Do not 301 these to the nearest hub to fill the cell -
per the rules, an irrelevant 301 wastes the link.

---

## The decision list (top 25 dead URLs by referring domains)

Legend - Confidence: **high** / **med** / **low**. Target verbs: `301` (redirect),
`ACCEPT` (leave on the /blog catch-all / 404, record the loss), `WRITE/RESTORE`
(content cost - no honest existing target). `[S9]` = also on the clean-mechanical quick list.

| # | Dead URL | Ref domains | Max DR | Anchor / linking-page context | Proposed target | Conf | Reason |
|---|---|---|---|---|---|---|---|
| 1 | /blog/programming-tips/10-best-websites-to-practice-coding-online | 30 | 76 | n/a (per-link anchors gitignored) | **WRITE/RESTORE** (else ACCEPT) | low | Biggest single reclaim by domains, but developer-resource content with no honest live twin; /for-developers is a recruiting page, not a resource list, so a 301 there is a soft 404. Only clean reclaim is to restore/write a coding-resources page. |
| 2 | /blog/it-outsourcing/why-philippines-for-business | 20 | 76 | n/a | **301** -> /hiring-tips/hiring-developers-in-the-philippines-... | high | Strong topical match, target curl-confirmed 200 in AUTH-01. NOT /why-the-philippines (that 308s to /how-it-works). |
| 3 | /blog/tech-news/importance-of-technology-advancement-in-business-sector | 14 | 76 | n/a | **ACCEPT** | high | Generic tech-news listicle; no buyer-relevant target. Any 301 is a soft 404. |
| 4 | /blog/it-outsourcing/the-5-challenges-you-will-face-when-hiring-software-developers | 11 | 94 | n/a (highest DR in the AUTH-01 set) | **301** -> /hiring-tips/how-to-avoid-costly-mistakes-when-hiring-a-remote-developer | med | Topical hiring-challenges match; confirm target is live 200 before shipping in S9. |
| 5 | /blog/productivity/10-tips-for-effective-communication-with-a-remote-team | 10 | 82 | n/a | **301** -> /managing-engineers/how-to-manage-remote-engineers | med | Remote-team management match; confirm target live 200 in S9. |
| 6 | /blog/productivity/11-signs-you-lack-work-life-balance | 10 | 76 | n/a | **ACCEPT** | high | Lifestyle/wellbeing content; no honest target. |
| 7 | /blog/productivity/being-stressed-at-work | 9 | 91 | n/a | **ACCEPT** | high | Wellbeing content; off-topic for every live page despite the DR. |
| 8 | /blog/tech-news/in-demand-digital-skills-in-the-uk | 9 | 73 | n/a | **ACCEPT** | high | UK skills listicle; no live equivalent. Revisit only if a UK skills page is ever written. |
| 9 | /blog/it-outsourcing/outsourcing-vs-freelance-the-pros-and-cons-to-consider | 6 | 34 | n/a | **ACCEPT** | low | AUTH-01's suggested twin (7-risks, row 10) is itself a dead catch-all, so it cannot be the target; no other honest match. |
| 10 | /blog/it-outsourcing/7-risks-you-will-encounter-when-hiring-freelance-developers | 5 | 75 | n/a | **301** -> /hiring-tips/how-to-avoid-costly-mistakes-when-hiring-a-remote-developer | low | Loose topical match (freelance-hiring risks -> hiring-mistakes); overlaps row 4's target. Jake's call vs ACCEPT. |
| 11 | /blog/tech-news/the-future-of-drone-technology%20 | n/a* | 91 | Source page is UR 0 (portfolio citations); trailing %20 | **ACCEPT** (stays on /blog) | low | No topical target; source value modest. The trailing %20 is already handled by S1's whitespace-tolerant middleware, so no bespoke rule is needed. |
| 12 | /blog/productivity/how-to-write-an-nda-for-software-development | n/a* | 75 | testgorilla.com, dofollow, in-content - best single link in the broken set | **WRITE/RESTORE** (or ACCEPT) | med | No honest live target except a staff-augmentation contract-terms post (defensible if live). Best single link in AUTH-06, so worth a content decision. Do not 301 to an unrelated page. |
| 13 | /blog/productivity/how-to-create-a-compelling-github-portfolio | n/a* | 73 | n/a | **WRITE/RESTORE** (or ACCEPT) | low | Developer-audience content; nearest live is /for-developers, too weak for a clean 301. Restore the article or accept. |
| 14 | /blog/tech-news/sunrise-industries-in-2018 (+ masaischool variant, DR 52) | n/a* | 61 | n/a | **ACCEPT** | high | Dated 2018 listicle; no target. |
| 15 | /web-developer | n/a* | 59 | n/a | **301** -> /services/web-developers `[S9]` | high | AUTH-06's best mechanical win; exact topical match, no judgment needed. |
| 16 | /blog/productivity/tools-for-digital-marketing | n/a* | 58 | n/a | **ACCEPT** | high | No target; off-topic for a developer-hiring site. |
| 17 | /blog/productivity/5-tips-for-staying-productive-...-working-from-home | n/a* | 55 | n/a | **301** -> /managing-engineers/how-to-manage-remote-engineers | low | Marginal topical match (remote productivity -> managing remote engineers); Jake's call vs ACCEPT. |
| 18 | /r/remote-r-developer | n/a* | 53 | n/a | **301** -> /technology/<R page> IF one exists, else ACCEPT | med | Conditional mechanical win: only clean if a specific R/technology page exists in the live set; a 301 to the bare /technology hub would itself be a soft 404. Check /developers/* live set in S9. |
| 19 | /blog/programming-tips/software-developer-mindset | n/a* | 53 | n/a | **ACCEPT** | high | No honest target. |
| 20 | /blog/benefits-of-it-outsourcing-service-provider | n/a* | 48 | n/a | **ACCEPT** (or WRITE/RESTORE) | low | Its obvious twin (/blog/it-outsourcing/partnering-...) is itself a 308 to /blog; no live target. |
| 21 | /blog/it-outsourcing/how-to-hire-react-native-developer-step-by-step-guide | n/a* | 37 | n/a | **301** -> /technology/react-native-developers `[S9]` | high | Clean product match; no judgment needed. |
| 22 | /brew/remote-brew-developer | n/a* | 34 | n/a | **ACCEPT** | high | No target; leave 404. |
| 23 | /blog/programming-tips/website-design-tips... | n/a* | 34 | n/a | **ACCEPT** | high | No target. |
| 24 | /blog/it-outsourcing/neck-and-neck-...-india-and-the-philippines | n/a* | 30 | n/a | **301** -> /hiring-tips/hiring-developers-in-the-philippines-... `[S9]` | high | Clean PH-hiring match (same target as row 2). Do NOT use /why-the-philippines (308s to /how-it-works). |
| 25 | mobile-data / startup-courses (x3 femaleswitch) / laptop-business-ideas | n/a* | 28-21 | n/a | **ACCEPT** | high | Low-DR, no targets; leave 404. |

`n/a*` - per-URL referring-domain counts for rows 11-25 live only in the gitignored
raw export (not in this session). AUTH-06 rates these one-to-few domains each; they are
ordered here by max DR. Confirm exact counts via the AUTH-01 join in S9.

**Zero-value rows, excluded from the 25 (recorded so nobody re-litigates them).**
AUTH-06's DR 18 and below: 6x papasearch.net + /careers/graphic-designer (scraper, zero
value); onlyjs.com and koralkyanastazie.cz -> /careers/shopify-developer-senior (DR 3, 0).
Leave 404. Careers pages belong to the talent site, which is not ours (hard rule 4).

---

## Content-cost rows (the honest answer is "write or restore", not "redirect")

Surfaced separately so Jake sees the content cost before approving anything:

- **Row 1** - /blog/programming-tips/10-best-websites-to-practice-coding-online (30
  domains, DR 76). The largest single reclaim in the whole set, but only reclaimable by
  restoring/writing a coding-resources page. If not written, ACCEPT.
- **Row 12** - /blog/productivity/how-to-write-an-nda-for-software-development (DR 75).
  Carries the single best link in AUTH-06 (testgorilla.com, dofollow, in-content).
  Restore the NDA post, or write a staff-augmentation contract-terms page and 301 to it,
  or ACCEPT.
- **Row 13** - /blog/productivity/how-to-create-a-compelling-github-portfolio (DR 73).
  Restore the article, or ACCEPT.

---

## S9 quick list - the clean mechanical wins (no judgment needed)

These need no Jake decision; they are the ~5 clean AUTH-06 reclaims S9 can ship
directly. Each is an exact-or-obvious topical match to a live page.

| Dead URL | 301 target | DR | Note |
|---|---|---|---|
| /web-developer | /services/web-developers | 59 | AUTH-06's best mechanical win. |
| /blog/it-outsourcing/how-to-hire-react-native-developer-step-by-step-guide | /technology/react-native-developers | 37 | Clean product match. |
| /blog/it-outsourcing/neck-and-neck-...-india-and-the-philippines | /hiring-tips/hiring-developers-in-the-philippines-... | 30 | Clean PH match. |
| /blog/it-outsourcing/why-philippines-for-business | /hiring-tips/hiring-developers-in-the-philippines-... | 76 | Effectively mechanical: target curl-confirmed 200; also the top reclaim by domains (row 2). |
| /r/remote-r-developer | /technology/<R page> (conditional) | 53 | Only clean if a specific R page exists; otherwise ACCEPT. Confirm the live /technology set before treating as mechanical. |

That is ~5 clean redirects (/web-developer, react-native, the two Philippines URLs, and
/r/ if an R page exists), matching AUTH-06's net count. Everything else in the top 25 is
either an ACCEPT or a Jake judgment call.

---

## What S9 does with this

1. Jake marks each row: approve target / change target / accept loss.
2. S9 adds the approved 301s to the tracked redirect tables, plus this quick list.
3. S9 curl-verifies every shipped target is a live 200 (soft-404 guard).
4. Accepted losses are recorded parity-exceptions style (who decided, why), so the DR
   numbers do not get re-litigated later.

No redirect is shipped by S8.
