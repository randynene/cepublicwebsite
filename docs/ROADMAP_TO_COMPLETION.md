# ROADMAP TO COMPLETION - Cloud Employee crossover

> The single source of truth for finishing the cloudemployee.io rebuild and taking
> it live on staging, ready for a zero-loss crossover. If any other doc disagrees
> with this file about "what is done", this file wins until launch.
>
> Owner: Jake. Author of record: planning brain. Last updated: 28 Jul 2026.
>
> **28 Jul - Seb page-by-page review.** The whole call is consolidated, tagged
> and mapped to real files in `docs/briefs/active/SEB-CALL-EDITS-28JUL.md`. The
> unambiguous items are BUILT (see §9 of that file for the build record); the
> ambiguous ones are written as 16 numbered questions for Seb in §7 and are
> still open. Two Sanity patch scripts are staged for Jake to run:
> `scripts/static/reorder-locations.ts` and
> `scripts/static/patch-seb-copy-edits.ts` (both dry-run by default).
>
> **The lesson worth carrying:** editing `content.ts` on a Sanity-wired page
> changes nothing on the live site. The Sanity value wins and the code is only a
> fallback for when the document is missing. Copy edits need a data patch, not
> just a commit.

---

## 0a. Plain English — "hardcoded" and "fallback" (Jake glossary)

These words keep coming up. They are NOT "the page is broken."

| Word | What it actually means | Example |
|---|---|---|
| **Hardcoded** | Some text, image, or form copy lives in the *code* file, not in Sanity Studio. The page looks fine. Seb cannot change that bit without a developer. | A button label typed in a React file instead of Studio. |
| **Fallback** | The page *can* read Sanity, but if Sanity is empty or thin, it quietly shows the old code copy instead. Looks fine; hides the fact Studio is not filled. | Home shows a nice hero even when Studio hero fields are blank. |
| **Form demo** | A form that *looks* real (fields, submit button) but does not send a lead to HubSpot yet — or a CTA that goes to `#` (nowhere). | Hire Engineers / Fractional CTO "match" forms until we wire them. |

**So for Home / How It Works (HIW) / Pricing:** the pages are built and mostly look right. The remaining work is making sure *everything meaningful* is editable in Studio, Sanity is fully filled, and we are not silently relying on code copy. That is Phase 6 + the editability work packages (WP-*), not a rebuild.

**Forms / sales funnel:** that is a separate cutover gate — see Phase 7.9 below. Jake maps the real funnel; we verify every HubSpot form, redirect, and thank-you page works on staging before DNS flip.

---

## 0. The mandate (Jake's words, locked)

1. **Every single page must be wired to Sanity.** No page ships showing hardcoded
   text. If Jake cannot change the text or an image from Sanity Studio, the page
   is not done.
2. **The whole site must map exactly to live cloudemployee.io** so the crossover is
   clean and loses no search traffic.
3. **Production is design-gated.** Nothing goes to the real domain until the design
   matches. Staging is where review happens.
4. **Marker.io** goes on staging so the wider team can leave visual feedback, page
   by page, as pages become review-ready.

---

## 1. What "done" means (three gates, in order)

A page is only DONE when it passes all three:

| Gate | Plain-English test |
|---|---|
| **G1 Design** | The page looks like the new CE redesign, not a bare placeholder. |
| **G2 Sanity** | Open the page in Presentation, click the text/image, and you can edit it. Content comes from Sanity, not from code. |
| **G3 SEO parity** | Page title, description, structured data, URL, and body content match what live CE serves today, so Google sees continuity. |

Anything that only loads at a URL but fails G1/G2/G3 is **"URL live only"** and does
NOT count as done.

---

## 2. Where we actually are (verified 21 Jul 2026)

Verified against the code AND a live query of the Sanity dataset (`lzbhll1u/production`).

**The good news:**
- Content migration is effectively complete. Sanity holds the real content for the
  CMS collections, including **23 service docs and 101 technology docs, with body
  content AND SEO meta already filled**.
- The SEO plumbing is strong: 684 redirect rules, a 6,937-URL parity gate, hreflang,
  structured data helpers, and a hostname-gated "no-index on staging" safety net.
- Most detail pages and most hubs are already fully done (design + Sanity + SEO).

**The gap is wiring, not building or content:**
- Several pages that look built are reading **hardcoded files** instead of Sanity,
  so they cannot be edited and (for services/technology) they show the SAME generic
  copy on every page. This is the SEO risk Jake spotted.
- A handful of pages are placeholder-only.
- Four pages do not exist yet.
- The parity gate has never been run to a recorded PASS.

**Confirmed numbers from the live dataset:**

| Check | Result |
|---|---|
| Service docs in Sanity | 23 (all have body content, all have meta title) |
| Technology docs in Sanity | 101 (100 have body content, all have meta title) |
| Sanity slugs vs live URLs | Match (e.g. `full-stack-developers`, `react-developers`) |

Interpretation: for services and technology, we are pointing the pages at the wrong
pipe. The correct content is already in Sanity waiting to be used.

---

## 3. The plan, in sequence (phases)

Phases are ordered by dependency and impact. Do them roughly in order. Each phase
ends with a verification step and a Marker.io action.

### PHASE 1 - Truth pass (foundation, do first)
Goal: stop guessing. Confirm exactly what content is in Sanity vs what live CE
serves, page by page, so we never wire a page to empty or wrong data.

- 1.1 Query Sanity for every content type: counts, and which docs are missing body
      or meta. (Services/technology already confirmed complete.)
- 1.2 Confirm the marketing singletons (Home, How It Works, Pricing, About, Contact,
      For Developers, Our Work, Referrals, Legal) are populated in Sanity with the
      real live copy, not empty.
- 1.3 Legal bodies VERIFIED present 21 Jul (privacy 236 blocks, terms 201) - not a
      risk. REMAINING content gap found: the `/book-a-call` index singleton is empty
      (0 sections); add its content before that page ships.
- 1.4 Produce a one-line "content status" against each row of the tracker in section 6.

**Gate to pass:** every page that will be wired has confirmed, correct content in
Sanity, or a named task to put it there.
**Marker.io:** not yet.

### PHASE 2 - Wire Services + Technology (highest impact)
Goal: the biggest SEO risk, fixed. Point service and technology pages at Sanity so
they show the real, unique, per-page content and meta, matched to live.

- 2.1 Rewire `/services/[slug]` and `/technology/[slug]` to fetch from Sanity
      (`fetchService` / `fetchTechnology`) instead of the hardcoded
      `site/src/data/services.ts` / `technologies.ts`.
- 2.2 Feed the Sanity content into the existing approved design (the CatalogueDetail
      layout Jake signed off), so the look is unchanged but the content is live and
      editable. See Decision D1 in section 8.
- 2.3 Reconcile slugs so every URL matches live CE exactly (Sanity slugs already do;
      remove the hardcoded short-slug variants so no stray URLs exist).
- 2.4 Make the page title/description/canonical come from Sanity meta (already filled)
      so SERP snippets match live at crossover.
- 2.5 Switch the structured data from generic "WebPage" to "Service" for service
      pages (the correct code already exists but is unused).
- 2.6 Rewire the `/services` and `/technology` HUB pages to Sanity. **DONE (Phase 2B,
      21 Jul 2026)** - data-driven grouping, real slugs, UK mirrors, FAQPage JSON-LD.
- 2.7 Close the small content-render gaps found in audit: render the "fold-5"
      bullet lists, and add per-technology FAQs where live has them (1 technology
      doc is missing body; backfill or confirm it is intentionally empty).
- 2.8 **Slug dedup + 404 discipline (SEO-critical).** Today the pages never 404:
      an unknown slug is "humanised" and served generic boilerplate. Remove the
      hardcoded short-slug variants (`react` vs `react-developers`) so only the
      exact live slugs exist, and make any non-Sanity slug return a real 404. This
      stops extra duplicate-content URLs that live CE does not have.
- 2.9 Also switch technology detail JSON-LD off generic WebPage where a better type
      applies, matching 2.5.
- 2.10 OBSERVED 21 Jul (live proof of the bug): `CatalogueDetail`
      (`site/src/components/templates/catalogue/detail.tsx:181`) 500s with "Cannot
      destructure property 'name' of 'content' as it is undefined" on service slugs that
      are in Sanity / generateStaticParams but absent from the hardcoded `services.ts`
      getter. Wiring to Sanity fixes the root cause; ensure the transform never passes
      `undefined` and unknown slugs return 404 (2.8), not a 500.

**Gate to pass:** open 5 service and 5 technology pages in Presentation, edit text,
see it change; confirm titles/URLs match live CE for those pages; confirm a made-up
slug (e.g. `/services/not-a-real-thing`) returns 404, not boilerplate.
**Marker.io:** open Review Wave 1 (see section 7) - services + technology.

> **STATUS - Phase 2A DETAIL WIRING DONE (21 Jul 2026).** `/services/[slug]`,
> `/technology/[slug]` and both `/uk/` mirrors now fetch from Sanity and render the
> approved CatalogueDetail design fed by a zero-loss transform
> (`site/src/lib/catalogue/content.ts`: `mapServiceToContent` / `mapTechnologyToContent`).
> Real per-page Sanity headings are used for every section; every fold's text has a
> home (intro paragraph + bullets in the hero, featureBullets/itemList/paragraphSection
> sections, and `headerOnly` folds rendered as statement bands - nothing dropped).
> Service hero pills + "technology coverage" cards come from `associatedTechnologies`
> (now projected in `SERVICE_QUERY` + Zod). Done: **2.1, 2.2, 2.3, 2.4** (titles are
> the Sanity `metaTitle` verbatim via `title.absolute` so the layout's
> "| Cloud Employee" template no longer double-brands them), **2.5** (`ServiceJsonLd`
> = `Service`), **2.7** (fold bullet lists render; service FAQs intentionally omitted
> - none in Sanity, avoids duplicate-content risk), **2.8** (only real Sanity slugs +
> the 3 location slugs are generated; old hardcoded short-slug variants removed; any
> unknown slug 404s - verified `/services/not-a-real-thing`, `/technology/react`,
> `/services/product-scoping` all 404), **2.9** (technology JSON-LD kept as `WebPage`
> - correct for a topic page), **2.10** (the `content`-undefined 500 is resolved: the
> transform never returns undefined and unknown slugs 404 before render). Location
> branch (LATAM / Philippines / Eastern Europe) preserved unchanged.
> Verified: `tsc` clean, zero new lint errors, full `next build` clean (708 pages),
> runtime 200s + correct 404s + correct JSON-LD + correct titles on the dev server.
> **Still outstanding:** (a) **Presentation click-to-edit spot-check** on 5 service +
> 5 tech pages - needs Jake in the browser (the fetch path + direct-field rendering
> match team/blog which are confirmed editable, but not yet clicked). (b) Optional:
> split CatalogueDetail into separate ServiceDetail / TechnologyDetail files (pure
> refactor, no behaviour change).

> **STATUS - Phase 2B HUB WIRING DONE (21 Jul 2026).** `/services` + `/technology`
> (and both `/uk/` mirrors) now render the D3 hub design fed by Sanity, replacing the
> hardcoded `SERVICES_HUB` / `TECHNOLOGY_HUB` reads. Data layer:
> `site/src/lib/sanity/queries/catalogue-hub.ts` (one round-trip per hub returning the
> hub singleton + full child list); transform: `site/src/lib/catalogue/hub-content.ts`
> (`mapServicesHubData` / `mapTechnologyHubData`) shapes it into the exact content the
> templates already consumed. Templates now take a `content` prop + a `pathPrefix`
> ('' US, '/uk' UK) so every card link is locale-correct and points at a REAL Sanity
> slug (unknown slugs 404 since Phase 2A). **Services grouping is data-driven** off
> existing fields (no schema change): featured = `servicesHub.featuredItems`
> (Studio-editable, fallback Software Engineers + Fractional CTOs); specialists =
> `type==staffAugmentation` && !AI && !location; AI = `aiOffering`; builds =
> `type==productBuilds` && !AI; Product Scoping (consultingServices) drives the promo
> CTA. Verified live: 20 grid cards in the exact live split (2 featured / 12 specialists
> / 3 AI / 3 builds), 0 dead links, tech-coverage chips resolve to real technology
> slugs, FAQPage JSON-LD emitted, UK mirror carries `/uk/` prefix, technology directory
> = 95 real Sanity techs A-Z. Meta title/description now read from the hub singleton
> (fallback to fixed copy); live H1s kept. Fixed brand furniture (section headings,
> promo copy, stories/quotes carousels) stays in the template, same as the detail
> pages. tsc + lint clean; all 4 routes 200. Hub FAQs + hero lead read the captured
> Sanity singleton content (Tech Debt #44) when present, else fall back to fixed copy.

> **STATUS - Phase 2A FAQ PARITY DONE (two-layer model, 21 Jul 2026).** Supersedes
> the "service FAQs intentionally omitted" note in 2.7 above. Live cloudemployee.io
> shows the SAME FAQ block on every service page (three groups: service model 10 +
> product builds 10 + consulting 9 = 29 Q&As) and the first group only on every
> technology page. Rather than duplicate that onto 124 docs, it lives once in a new
> Sanity singleton **`sharedServiceFaqs`** (`studio/schemas/singletons/shared-service-faqs.ts`,
> grouped under "Shared Content" in Studio) with three `faqItem[]` groups. Every
> service/technology detail page reads it by default (service = 3 groups combined;
> technology = serviceModel group). Each page ALSO gained an optional per-page
> `faqs` override field (`service` gained it; `technology` already had it): fill it
> to give THAT page unique FAQs, which then replace the shared block for that page -
> a clean AEO upgrade path with no re-architecture. Composition lives in the
> transform (`mapServiceToContent` / `mapTechnologyToContent` now take the shared
> block); render reuses `CatalogueFaqPanel`; **FAQPage JSON-LD** is emitted from a
> new shared builder (`catalogue/faq-json-ld.tsx`) wired into both `ServiceJsonLd`
> and `TechnologyJsonLd`. Verbatim live copy captured 21 Jul (em-dashes normalised
> to house style; one live typo "request.We" fixed to "request. We"). Verified: site
> `tsc` clean, studio `tsc` clean, lint 0 errors, seed dry-run produces valid
> PortableText, runtime 200/200/404 unchanged. **GATE - Jake runs the seed** (agent
> does not write the Sanity dataset): `npm run content:seed-shared-faqs` to preview,
> then `npm run content:seed-shared-faqs -- --apply` to write. Before the seed runs,
> the FAQ section simply does not render (empty singleton = no section, no error);
> after it runs, all service + technology pages show the live FAQ block and emit
> FAQPage JSON-LD. Studio needs a restart/redeploy to surface the new singleton +
> the service `faqs` field.

> **DECISION - CALCULATOR CONSOLIDATION NOT RUN (21 Jul 2026, Jake).** The session
> brief proposed embedding the calculator on `/pricing` then 301-redirecting
> `/hiring-cost-calculator` + `/price-comparison-calculator` (+ variants) to `/pricing`
> and deleting the standalone routes. **Rejected after checking live behaviour**
> (`data/webflow/live-behaviour.json`): `/hiring-cost-calculator`,
> `/price-comparison-calculator` and `/uk/price-comparison-calculator` are all **live
> 200 pages that rank**, and price-comparison is a **distinct working tool** (builds a
> shareable in-house-vs-CE comparison link) that `/pricing` does not replicate.
> Redirecting them away would delete live ranking pages + a working tool - the exact
> trap the parity gate exists to catch. **Faithful parity is kept instead:** the three
> calculator pages stay as live-matching 200s, and the only redirect live actually has
> (`/tools/price-comparison-calculator` -> `/pricing`, already in the generated tables)
> is preserved. Verified at runtime: 200 / 200 / 200 / 308->/pricing / 200. No code
> change required; no parity exception needed (this is faithful, not a divergence). If
> consolidation is ever wanted, it is a post-launch content decision and must embed
> BOTH calculators on `/pricing` first so no function is lost. Relates to Tech Debt
> #59 / #60.

### PHASE 3 - Wire the remaining hardcoded pages
Goal: honour the mandate that NO page reads hardcoded content.

- 3.1 For Developers (`/for-developers` + `/uk`) - **DONE (MYGRATR-WIRE-BESPOKE, 23 Jul).**
      Tokenise-and-hydrate rebuild: the frozen Figma export body is stored once, tokenised
      (`for-engineers/fe2-body.ts`), and `hydrateFe2()` fills every text node + photo from a
      content object at render. `content.ts` restructured to a mutable `ForEngineersContent`
      (H1s split lead/accent, 10 empty image slots, testimonials flagged PLACEHOLDER, code block
      left frozen); `JoinForm` kept code-owned. Bespoke `forDevelopersPage` schema replaces the
      old generic singleton; GROQ+lenient-Zod+`toForEngineersContent` (text keeps stega, image
      URLs stega-cleaned, sections fall back to static); US+UK routes fetch Sanity first, fall
      back to `FOR_ENGINEERS_CONTENT`; seed at `scripts/static/seed-for-developers-page.ts`.
      **Pixel-parity is a hard gate:** `npm run static:verify-fe2-parity` asserts the served body
      is BYTE-IDENTICAL to the frozen export (PRE 93,756 + POST 4,988 chars, both PASS) against a
      pristine snapshot. Studio tsc + site tsc + `npm run build` clean; both routes 200, zero
      leftover tokens, screenshot matches the export. NOT yet seeded to production + NOT pushed
      (Jake's gates). This was the LAST of the 6 bespoke pages.
- 3.2 Our Work (`/our-work`) - **DONE (MYGRATR-WIRE-BESPOKE, 23 Jul).** Reconciled the generic
      `ourWorkPage` singleton to a bespoke shape mirroring `OurWorkContent`: copy + editable stat
      numbers + 3 optional "customer photo" tiles (stories/logos/reviews/bento grid were already
      Sanity-driven from their own docs). GROQ+Zod+`toOurWorkContent` (splices code-owned
      `ctaHref`/labels); US+UK routes fetch Sanity first, fall back to static `OUR_WORK_CONTENT`;
      seed at `scripts/static/seed-our-work-page.ts`. Removed the obsolete `our-work`
      generic-capture entry. Committed `5bd39df`, pushed, Studio deployed, SEEDED to production
      (verified). Seeding first hit the Sanity 2,000-attribute dataset limit; **resolved by
      upgrading the project to the Growth plan (10,000 attributes)**, which also covers the
      remaining For Developers rebuild + future bespoke wiring.
      **28 Jul polish:** brighter logo marquee (full-colour on light chips); customer people
      photos fill the 8x tile + two beyond-hiring photo tiles (fallback from customerStory
      `companyPeopleImage` when Studio slots empty); Customer Impact taller with ambient
      autoplay Vimeo in top-right + bottom-left; page ground unified to `#070D18`; mid-CTA
      "Scalable tech talent…" removed (sitewide footer "They're ready to hire…" remains).
- 3.3 Location pages (`/services/latam-developers`, `/services/philippines-developers`,
      `/services/eastern-europe-developers`) - **BUILT + COMMITTED (design done).**
      Bespoke dark/lime `LocationTemplate` (`site/src/components/templates/location/`:
      index + spotlight + cost `calculator` + `json-ld`), dispatched from
      `/services/[slug]` (+ /uk) via `site/src/lib/location/registry.ts` before the
      Sanity service fetch; all three pre-render and 200. **G2 wiring code-complete
      (MYGRATR-WIRE-BESPOKE, 23 Jul):** new `locationPage` Sanity document type
      (`studio/schemas/documents/location-page.ts`, 3 docs keyed by slug) mirroring
      the LocationContent shape; GROQ+Zod+transform at
      `site/src/lib/sanity/queries/location-page.ts`; both routes now fetch Sanity
      FIRST and fall back to the code registry when the doc is absent/invalid; seed at
      `scripts/static/seed-location-pages.ts` (`npm run static:seed-location-pages`).
      Images kept as STRING paths (v1 decision) and the calculator's numeric config
      stays code-driven (only its copy is in Sanity). Verified: studio tsc + site tsc +
      lint clean, `next build` clean (706 pages), all 6 routes (US+UK) 200 via the
      fallback, unknown slug 404s. **OPEN (Jake by hand):** deploy Studio + run the seed
      against production; after the seed, editing a Location field in Studio changes the
      page. Until seeded, pages render identically via the code fallback.
      Note: latam + philippines already exist as Sanity service docs; eastern-europe
      is net-new (no service doc) and the registry branch renders it anyway.
- 3.4 Calculators - collapse to ONE, on `/pricing` (D3 + D5). Embed the calculator
      component on `/pricing`, then 301-redirect the standalone `/hiring-cost-calculator`
      and `/price-comparison-calculator` (+ `/uk/`, `/ph/`, `/tools/` variants) to
      `/pricing`, delete the two standalone routes, and add parity exceptions.
- 3.5 (folded into 3.4).
- 3.6 **Static-page design + parity batch.** These are built and Sanity-wired but use
      a generic shell: About Us, Contact, Book-a-call index (`/book-a-call`),
      Referrals, and the thank-you set. For each: (a) confirm what it should look
      like, (b) give it the redesign, (c) confirm it is editable in Presentation.
      Notes: About Us + Contact are live+indexed on CE - keep them live with captured
      content and DEFER their redesign (do not hide them). Work-with-Shawnee is being
      removed via 301 (D6), not designed. Thank-you pages stay noindex, lowest priority.

**Gate to pass:** each page editable in Presentation; each page that exists on live
CE matches it.
**Marker.io:** open Review Wave 2 - services detail/marketing pages.

### PHASE 4 - Alternatives re-skin + Compare consolidation
Decided 22 Jul 2026 (Jake, Path B). `/compare` and `/alternatives` are TWO hubs over
the SAME 27 compareBlog docs; `/alternatives` ranks better (~9.1 vs ~25.9). Rather than
build both, consolidate onto the stronger URL.

- 4.1 DONE (22 Jul) - `/alternatives` + `/uk/alternatives` re-skinned to the dark/lime
  hub pattern (new `AlternativesHubTemplate` + `resolveAlternativesHubRoute`; featured
  3-up auto-fill + 3-col grid). tsc + lint + build clean; both routes 200; cards link
  real `/compare/{slug}`; UK carries `/uk/compare/{slug}`; no US-link leakage on UK.
  Brief: `docs/briefs/active/ALTERNATIVES-RESKIN.md`.
- 4.2 PENDING - 301 `/compare` (hub root only) -> `/alternatives`; keep `/compare/{slug}`
  detail articles. This is a DELIBERATE DIVERGENCE from live (live serves `/compare` 200):
  needs a recorded parity exception + Seb sign-off + a confirmed net-new-redirect mechanism
  (redirect tables are auto-generated from Webflow, which has no such redirect). NOT the
  live `/compare` marketing page - that page is being retired via the redirect.
- 4.3 Structured data: `/alternatives` emits CollectionPage + BreadcrumbList + ItemList
  (+ FAQPage when populated) - list/comparison shape, not blogPost. Done.

**Gate to pass:** design + still editable in Sanity + the redirect verified.
**Marker.io:** fold into Review Wave 3 - hubs.

### PHASE 5 - Build the missing pages
Goal: the four pages that do not exist yet. Build them AND wire to Sanity.

- 5.1 Fractional CTO - **BUILT (22 Jul).** Bespoke dark/lime landing page ported 1:1
      from `docs/raw-html/Fractional CTO Page (offline).html`. Template at
      `site/src/components/templates/fractional-cto/` (index.tsx + content.ts +
      fractional-cto.css, scoped under `.fcto`); routes at
      `site/src/app/services/fractional-ctos/page.tsx` + `/uk` mirror. Shared
      `<SiteHeader />`/`<SiteFooter />` from the layout; the source chrome
      placeholders are dropped (hire-engineers convention). All 11 content sections
      + interactions (hero cluster entrance/float, logo + de-risk marquees, video
      play toggle, cursor-glow statement, 4-step match form, FAQ accordion) ported.
      tsc + lint + build clean. **URL DIVERGENCE (needs a call):** built at
      `/services/fractional-ctos` (the slug the Services hub "Fractional CTOs"
      featured card actually links to, and the hire-engineers sibling precedent),
      NOT the `/fractional-cto` top-level URL this roadmap originally planned. If
      `/fractional-cto` is wanted as the canonical URL, add a 301 or move the route.
      **Imagery is placeholder** (candidate avatars, video poster, step photo,
      client logos): styled placeholder containers / client-name text in the marquee;
      real assets drop into the same slots without layout change. **Not yet
      Sanity-wired** - copy is a static `content.ts` constant (same pattern as
      hire-engineers); a Sanity pass can replace it later. **COMMITTED + pushed to
      staging 22 Jul** (`2951a2c`; feat/design-1).
- 5.1b Software Engineers / "Hire Engineers" - **BUILT + COMMITTED (22 Jul, `a9cf250`).** Bespoke
      dark/lime landing page ported from `docs/raw-html/Hire Engineers Page`. Template at
      `site/src/components/templates/hire-engineers/`; routes at
      `site/src/app/services/software-engineers/page.tsx` + `/uk` mirror; both 200. This
      is the page the nav "Hire Engineers" link points at. Static route wins over
      `services/[slug]`. **G2 Sanity-wired (WIRE-BESPOKE 23 Jul): `hireEngineersPage`
      singleton with all copy + every image slot + the 90-second tour video editable;
      routes fetch Sanity-first with the static `HE` fallback; calculator numerics stay
      code-driven. tsc/build/routes-200 green.** Open: Jake deploys Studio + runs
      `npm run static:seed-hire-engineers-page`; confirm the `/hire/software-engineers`
      redirect resolves here.
- 5.2 Managed Pods (`/managed-pods`) - design exists. Confirm final URL vs live.
- 5.3 Referral (`/referrals`) - this page is ALREADY built and Sanity-wired; it just
      needs the real design applied. This is a DESIGN pass, not a net-new build.
- 5.4 Event detail (`/events/[slug]`) - DROPPED from launch scope (D4). Only the hub
      ships. Just verify no live event-detail URL 404s at parity time.

**Gate to pass:** design + Sanity + URL matches live (or a recorded exception).
**Marker.io:** open Review Wave 4 - net-new pages.

### PHASE 6 - De-risk the fallback pages (Home / How It Works / Pricing)
Goal: these read Sanity but silently fall back to hardcoded copy if the Sanity doc
is thin, which is fragile and already caused a Home crash.

- 6.1 Fix the Home hero-cards crash (page 500s when the profile cards data is empty;
      it must degrade gracefully). This is a live bug found on 21 Jul.
- 6.2 Fully populate the Home, How It Works, and Pricing singletons in Sanity so the
      hardcoded fallback is never used.
- 6.3 Decide whether to embed the hiring-cost calculator on Pricing as live does
      (Decision D5), rather than leaving Pricing calculator-less.

**Gate to pass:** these pages fully editable, no fallback in use, no crash.
**Marker.io:** fold into Review Wave 5 - core marketing.

### 6a. Sticky FAQ intro column - DONE (27 Jul 2026)

The intro column of the two-column FAQ ("Got questions?" + heading + the
"can't find your question" chatbot card) now pins beside the accordion while
the questions scroll, on every page that has that layout. One shared constant
at `site/src/components/layout/sticky-aside.ts` (`lg:sticky lg:top-[104px]
lg:self-start`), plus the equivalent rule for the hand-ported Fractional CTO
CSS. Desktop only; below `lg` the grid is already one column.

Applied to: Home, How It Works, Pricing, the three Location pages, Fractional
CTO, Services hub, Technology hub, Service detail, Technology detail, Download
detail, Tool detail, Compare detail (plus every `/uk` mirror - same components).

**Load-bearing side fix:** `overflow-x: hidden` on the page root makes that
element a scroll container, which silently kills `position: sticky` inside it.
Switched to `overflow-x: clip` (same visual result, no scroll container) on
Location, Services hub, Technology hub, catalogue detail and `.fcto`.

**Not applied, by design:** the blog / resource / alternatives hubs and the blog
+ review article pages put their FAQ in a single 720px reading column, so there
is no second column to pin. If those should match the two-column pattern that is
a design decision, not a bug.

Verified by rendering each page and measuring: all 13 pin at exactly 104px.

### 6b. Blank image slots - OPEN (audited 27 Jul 2026)

Audited two ways and cross-checked: a code+Sanity read, and a render pass over
every template that detects boxes painting no image (the code alone cannot tell
you what a visitor sees, because most of these are fallbacks that appear only
when the image data is missing). Where the two disagreed, the page was opened
and looked at. Confirmed list:

| Page | What a visitor sees | Cause |
|---|---|---|
| `/services` (+ `/uk`) | **All 20 service cards are empty tiles**, plus the promo panel = 21 | No image field wired on the card at all |
| `/` (Where we work) | **6 random stock landscapes** captioned São Paulo, Bogotá, Buenos Aires, Manila, Zagreb, Cape Town | `picsum.photos` stand-ins in `home/content.ts`; all 6 `homePage.whereWeWork` hubs have no uploaded image |
| `/our-work` (+ `/uk`) | ~~3 striped tiles captioned "customer photo"~~ **FIXED 28 Jul** - people photos from customer stories fill the 8x + beyond-hiring tiles (Studio overrides still win when set); mid-CTA tile removed with that section | was: `ourWorkPage` photo slots null |
| `/services/[slug]` + `/technology/[slug]` (~124 pages × 2 locales) | 1 empty tile in the "Schedule a call" band on each | Fixed furniture, never wired (`catalogue/detail.tsx:351`) |
| `/services/software-engineers` | 4 "Image suggestion" tiles | Placeholder brief; real assets never supplied |
| `/about-us` (+ `/uk`) | 1 empty tile beside "We started because hiring was broken" | `aboutUsPage.founderImage` unset and static fallback is `''` |
| `/services/fractional-ctos` | 1 empty photo box under "Tell us what you need" | `matched.feature.image` never supplied |
| `/tools/culture-match` | Full-width empty walkthrough tile | No poster image |

Lower salience, same root cause: all 101 `technology` docs have no `icon`, so the
technology-coverage chips on service detail pages render empty 48px logo slots;
and one blog post (`nearshoring-or-offshoring-the-strategic-choice-for-tech-leaders`)
has no thumbnail, so it shows a stripe card on every listing it appears in.

**Checked and genuinely fine** (do not re-audit): `/for-developers` - the ten
Figma slots look empty in `content.ts` but empty there means "keep the baked
export asset", and real photos render. Also clean: How It Works, Pricing,
Contact, Referrals, the three Location pages, Compare, and every hub
(customer-stories, reviews, blog, videos, tools, downloads, events,
alternatives, technology). Team photos, customer-story heroes and review avatars
are all complete in Sanity.

Worst first: the `/services` grid (every card blank on a top-level nav page) and
the homepage stock photos (random landscapes presented as CE locations - a
credibility problem, not just a gap).

**Gate to pass:** no visible placeholder or stand-in image on any page that
ships. Mostly needs real photography from Seb; the exceptions are `/services`
cards and the service/technology CTA band, which have no image field wired at
all and need a code change before any photo can be dropped in.

### 6c. Jul 27 design + copy pass - DONE (27 Jul 2026)

Jake's edit list, executed and verified in-browser:

- **Copy.** Home hero trimmed to three trust points (one monthly fee / we handle
  HR & payroll / 300+ teams built); "Client story" eyebrow becomes "Jobs boards
  don't work anymore"; footer CTA wording unified on "Contact Us Today"; Cape
  Town dropped from the locations slider (5 remain).
- **Home cost calculator.** Was static markup dressed to look like dropdowns.
  Now a real client component (`home/calculator-card.tsx` +
  `lib/calculators/next-hire.ts`) sharing the pricing page's model, with the
  SAVE badge derived from the computed figure rather than hard-coded. All five
  calculators on the site audited and confirmed recomputing.
- **Fractional CTO.** Hero replaced with the shortlist panel and the three CTO
  archetype cards per the supplied design.
- **For Engineers.** Hero fills the viewport on landing, with a see-more cue
  down to "Applying is broken".
- **Chrome.** Nav dropdowns widened so each sentence sits on one line; the
  Locations pin centred (Material Symbols advance-width, not a box-centring
  problem); header CTA chips + centre-out nav underline.
- **Pricing.** Hero now runs the home page's three stacked talent-profile cards.
- **Locations (all three).** Square icon tiles at real pixel sizes, subject
  icons instead of generic ticks on the EOR row, video widened to the home
  page's band, "What's included" columns rebuilt with aligned markers, and
  "Engineers we've placed" cards rebuilt to the supplied reference with
  prominent flags.
- **CTA + trust-strip alignment.** Audited the canonical sweep pills and header
  CTA pills across representative marketing, hub, catalogue and location pages.
  Labels and leading icon circles now share a 1px optical lift. Philippines hero
  benefits stay on one desktop row. The standard "Trusted by 300+ / Engineering
  Teams" label is locked to exactly two lines on Location, Pricing and catalogue
  detail logo strips. Typecheck, changed-file lint and the full site build pass;
  the Philippines layout was browser-verified at 1440px.

**Cursor spotlight.** Audited every page for where the location pages'
cursor-follow glow belongs. Component promoted out of the location folder to
`site/src/components/motion/spotlight.tsx` and applied to Home "Ready to find",
How It Works matcher, Hire Engineers "Proof", and the About Us story. Found and
fixed a half-applied case: the Philippines quiz variant wrapped in `Spotlight`
but marked no `data-spot-item`, so it glowed without dimming. Nine sections
verified by measuring real opacity before and after the cursor arrives.

**Deliberately excluded** (do not "finish the job" later without a design call):
heroes, calculators, forms, marquees and FAQ accordions already own the cursor;
gradient-band sections and catalogue statement bands need a transparent-ground
Spotlight variant first, since the component hardcodes `#070D18`.

**Known drift:** four separate hand-rolled versions of this glow now exist (home
client story, For Engineers, Fractional CTO, and the shared component). Folding
them into one is a tidy-up, not urgent.

### 6d. Technology brand logos - DONE (27 Jul 2026)

The `/technology` index rendered a two-letter abbreviation ("RE", "KU", "PO") in
the 44px badge on all 101 cards, and the tech-coverage chips on `/services` did
the same. Both now render the real brand logo.

**The logos were already in Sanity.** `technology.techLogo` is populated on 99 of
the 101 docs - genuine full-colour marks migrated from Webflow, the same assets
the live site uses. The hub GROQ simply never projected the field, so the
templates fell back to initials. The fix was three lines of query plus wiring,
not new artwork.

> **Process note, worth remembering.** The first attempt at this built a whole
> brand-icon pipeline from Simple Icons + Devicon + 21 hand-drawn glyphs before
> checking whether the data already existed. It did. Jake caught it by pointing
> at the live site. **Check the Sanity schema and a real document before
> concluding content is missing** - `imageField('techLogo', ...)` was sitting in
> `studio/schemas/documents/technology.ts` the whole time. Same class of error as
> Tech Debt #45.

**What ships:**
- `catalogue-hub.ts` projects `techLogo.asset->{ url, extension }` on both the
  technology hub and the services tech chips.
- `hub-content.ts` builds the URL. SVG (69 docs) passes through untouched since
  the Sanity CDN does not transform SVG; raster (23 PNG + 7 WebP) gets
  `?w=88&h=88&fit=max&auto=format`, because a couple of the source PNGs are
  300kB+.
- `site/src/components/ui/tech-badge/index.tsx` renders the badge for both hubs.

**The tile is white.** These marks are full-colour artwork drawn for a light
background - the live site puts them on white cards. AWS's mark is `#252f3e`,
which is invisible against our `#101B30` card, so the logo brings its own ground
with it. All 93 hub logos were rendered on the white tile and eyeballed; none
disappear. Contact sheet at `docs/design/tech-logos-sanity.png`.

**Only two technologies have no logo, and neither can.** MVVM and IAM are
architecture concepts, not products, so no mark exists in Sanity, Simple Icons or
Devicon. They get a hand-drawn glyph each (layered bars, shield-and-keyhole) from
a 1.2kB two-symbol sprite.

**Order of precedence in the badge:** Sanity `techLogo` -> sprite glyph ->
two-letter abbreviation. It can never render blank.

**Adding a technology later.** The fix is to upload `techLogo` in Studio. No code
change, no build step. `npm run verify:tech-icons` reports any technology that
would fall back to plain letters, and flags a glyph made redundant by a newly
uploaded logo. Currently 99 real logos / 2 deliberate glyphs / 0 letters.

The sprite and `tech-icon-map.ts` are hand-maintained, two entries each. An
earlier version of this generated them from `simple-icons` + `devicon`; those
packages were removed once the Sanity logos landed, because 159MB of
devDependencies installed on every Vercel build to produce zero shipped symbols
is not a trade worth making. If a logo-less technology ever appears and a real
mark exists for it, pull the path from those sets ad hoc rather than
re-committing the dependency.

Nothing was written to the production dataset.

**Not done:** the technology *detail* pages (`/technology/[slug]`) do not show
the logo yet. Easy follow-on if wanted.

### 6e. FAQ "Open chat" panel - DONE (27 Jul 2026)

Six templates rendered the "Can't find your question? / Open chat" panel that
sits beside an FAQ section, and all six had been hand-rolled separately, so all
six looked different: the eyebrow was lime on one, white on two and grey on two;
three had the lime pill with the dark arrow circle and three had a flat pill or
a bare inline arrow.

They now all render one component, `site/src/components/shared/faq-chat-card/`:
`#101B30` card on a `#22314D` border at 20px radius, lime uppercase eyebrow,
`#B8C2D1` body, and the canonical `size="cta"` lime pill. Affected: Home, How It
Works, Pricing, the three Location pages, and the Service/Technology detail
pages (`CatalogueFaqPanel`). Fractional CTO keeps its own scoped CSS (a `.fcto *`
reset makes Tailwind spacing unreliable inside it) but its `.faq-cta` rules were
matched to the shared card by hand.

**Three of the six CTAs were dead links.** Home pointed at `#faq` (the section
containing the button), Fractional CTO at `#`, and Location + the catalogue panel
at a raw `#chat` anchor that matches no element. The shared card uses `ChatPill`,
so every one of them now opens the Clara widget and falls back to `/book-a-call`
when the widget is unavailable (see `site/src/lib/chat.ts`).

**One content item left for Seb.** The Home FAQ body renders "Ask our AI chatbot
, trained on every sales call we've had" - a stray space before the comma. That
string comes from Sanity, not from code; the code fallback in `home/content.ts`
was corrected (em dash -> hyphen) but the dataset value needs an edit in Studio.
Nothing was written to the production dataset.

**Not done:** the FAQ sections on the `/services` and `/technology` hub index
pages have no chat panel at all (they are a single stacked column of cards, no
left aside). Adding one there is a layout decision, not a fix - flagged for Jake.

### PHASE 7 - SEO + parity full verification (the launch gate)
Goal: prove the crossover is safe before anyone flips the domain.

- 7.1 Run the parity gate (`npm run launch:verify-parity`) against the staging build
      and record a PASS. Investigate every mismatch. This has never been recorded.
- 7.2 Fix the dynamic sitemap so individual content pages carry US/UK hreflang pairs.
- 7.3 Fix the nav structured data to use the safe serializer (consistency).
- 7.4 Replace the placeholder social-share image with a real one.
- 7.5 Add the brand's verified social links to the Organization structured data.
- 7.6 Spot-check live vs new page title/description on the top 20 traffic URLs.
- 7.7 **Start-hiring funnel parity.** The `/start-hiring/{step}` funnel is built and
      noindex. Verify all 8 steps, the forms, and the redirects behave as live does.
- 7.8 Confirm no extra indexable service/technology URLs exist beyond live (result of
      the slug dedup in 2.8).
- 7.9 **HubSpot + full sales-funnel once-over (Jake-owned map + agent verify).**
      See section 7a below. Cutover blocker: no silent dead forms.
- 7.10 **Speed + SEO crawl pass (Screaming Frog + Lighthouse + repo gates).**
      See section 7b below.

**Gate to pass:** parity gate PASS recorded; SEO checklist Tier 1 green on every
template; HubSpot funnel map verified (7.9); speed/SEO crawl recorded (7.10).
**Post-launch (not launch-blocking):** `llms.txt`, robots AI-crawler stance (needs
Jake decision), `dateModified` freshness. Logged here so they are not forgotten.
**Marker.io:** already sitewide by now; use it to log SEO nitpicks too.

### 7a. HubSpot + sales-funnel cutover once-over (NEW — Jake priority)

**Why this exists:** a wrong HubSpot form id is the quietest failure on the site.
The page looks perfect, nothing 404s, and every enquiry is lost. Typecheck / build /
parity cannot catch it. We already have `npm run launch:verify-hubspot-forms` for
that reason — this phase makes the *whole funnel* a named cutover gate, not a
side note.

**Jake does first (business map — one sitting):**
1. List every path a lead can take on live CE today, in plain English. Example
   shape (fill in / correct with real CE reality):
   - Nav / CTA → Book a Call → Calendly → thank-you / confirmed page
   - Nav / CTA → Start Hiring (multi-step) → HubSpot forms → thank-you
   - Contact page → HubSpot form and/or Calendly → thank-you
   - Footer newsletter → HubSpot
   - Download / gated content → form → download thank-you
   - For Developers join / Hire Engineers / Fractional CTO match forms (demo vs real?)
   - Any other HubSpot, Calendly, or chat entry points
2. For each path: entry URL → form/tool → where the lead lands in HubSpot → thank-you
   URL → whether the page should be noindex.
3. Decide which "form demos" must become real HubSpot submits before cutover vs
   which can stay as CTAs out to Book a Call / Start Hiring.

**Agent / staging verify (after Jake's map):**
- [ ] `NEXT_PUBLIC_HUBSPOT_PORTAL_ID=22809822` set on Vercel Production + Preview
      (and `site/.env.local`). Without this, **every** form silently renders empty.
- [ ] `npm run launch:verify-hubspot-forms` PASS — every form id the site renders
      resolves on HubSpot (portal `22809822`).
- [ ] Extend that verifier to cover Contact + any newly wired forms (WP-05).
- [ ] Manually submit one test lead per funnel path on staging; confirm it appears
      in HubSpot and the thank-you / next-step redirect matches the map.
- [ ] Calendly: Book-a-call detail pages + Contact intro-call URL load and book.
- [ ] Start-hiring: all 8 steps order/progress match HubSpot redirects (already
      burned us once — see verifier comments).
- [ ] No primary CTA left as `href="#"` on pages that look like they submit leads.
- [ ] Thank-you / confirmed pages remain noindex; lead-capture pages behave as live.

**Gate:** Jake signs the funnel map; every path on the map has a green staging test;
verifier PASS recorded in the cutover folder.

### 7b. Make the site fast + SEO / AEO solid (tools + order)

**Goal in plain English:** Google and AI bots should see the right pages quickly,
with real content in the first HTML response, correct titles/structured data, and
no crawl traps. Speed is part of SEO/AEO — slow pages get timed out by AI crawlers
(often 1–5 seconds).

**We already have in-repo (run these first — free, repeatable):**

| Tool / command | What it proves |
|---|---|
| `npm run launch:verify-parity` | Every known live URL behaves the same on the new site (6,937 URLs). |
| `npm run launch:verify-noindex` | Staging stays noindex; production only indexes when canonical host is set. |
| `npm run launch:verify-hubspot-forms` | Form ids are real (see 7a). |
| Tier 1 checklist `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md` | Per-template SEO/AEO gate (title, canonical, hreflang, JSON-LD, SSR content, sitemap). |
| Sitewide gap brief `docs/seo/SEO_GEO_SITEWIDE_GAP_FIX_BRIEF.md` | Launch-gate SEO items vs post-launch polish. |

**Jake / SEO tools to run against staging (then again on production day-1):**

1. **Screaming Frog (Jake already has it) — primary crawl**
   - Crawl staging (auth if needed) and, when safe, production after cutover.
   - Export / check: status codes (200/301/404), titles, meta descriptions,
     canonicals, hreflang, indexability, directive conflicts, orphan pages,
     redirect chains, duplicate titles/descriptions, missing H1 / multiple H1,
     image alts, page depth.
   - Compare against live CE crawl: same indexable URL set (parity), no surprise
     404s on ranking URLs, no accidental index on thank-you/funnel steps.
   - Keep a dated export under `audit-output/seo/` (gitignored) as the cutover
     evidence pack.

2. **Google Lighthouse / PageSpeed Insights — speed + SEO score**
   - Hard gate from our checklist: **Lighthouse SEO = 100** on key templates.
   - Performance: aim healthy Core Web Vitals (LCP / INP / CLS). Known debt:
     third-party script budget (GTM, HubSpot, Hotjar, pixels, Calendly, etc.) —
     Tech Debt #29/#30. Fix = lazy-load + necessity review, not "add more tags."
   - Sample set: Home, one Service, one Technology, one Blog, Pricing, one Hub.

3. **Google Search Console (cutover day + week 1)**
   - Submit new sitemap only on the production host.
   - URL Inspection on top-20 traffic URLs.
   - Watch coverage / redirect / soft-404 spikes for 7–14 days.

4. **Optional but useful**
   - **Ahrefs / Semrush** site audit on production after cutover (Jake may already
     have Ahrefs — note Tech Debt #4: plan must include cloudemployee.io).
   - **Rich Results Test** / schema validator on a Service, FAQ hub, Article, Review.
   - **WebPageTest** or CrUX for real-user speed if Lighthouse lab numbers disagree
     with feel.

**Speed playbook (what actually makes this Next.js site fast):**
- Keep primary content **server-rendered** (already the architecture) — bots see text
  without waiting for JavaScript.
- Images through the Sanity + `next/image` path (priority on LCP/hero only).
- Do **not** pile more marketing pixels before cutover; audit and defer what live
  does not need on every page (SCAFFOLD-AUDIT / Tech Debt #29).
- Fonts already on Inter + Source Serif 4 — avoid adding more families.
- Measure before/after any third-party change; HubSpot + GTM are the usual LCP/TBT
  villains.

**AEO (AI-search) — what matters vs hype:**
- Tier 1 on-site (SSR content, headings, FAQPage where real FAQs exist, correct
  JSON-LD, fast HTML) = launch gate — already in `SEO_GEO_PER_TEMPLATE_CHECKLIST.md`.
- `llms.txt` = cheap post-launch nice-to-have, **not** a ranking lever.
- Real AI citations also need **off-site** mentions (listicles, reviews, press) —
  separate post-launch workstream; the site alone cannot win that.

**Gate for 7.10:** Screaming Frog crawl notes filed; Lighthouse SEO 100 on sample
set; Tier 1 checklist green; known Perf debt listed (not ignored) with owner.

**SEO cutover P0 pack (Jul 2026, branch `cursor/seo-cutover-fixes-3404`) — code
shipped, needs Jake re-crawl on staging to close:**
- `/schedule-a-call` (+ UK) → `/book-a-call` locked redirect + CTA href fixes
- Double `| Cloud Employee` titles via `resolvePageTitle()` (absolute when brand
  already in string)
- `/uk` vs `/uk/` canonical/redirect fight fixed (`localePrefixedPath`)
- Hub pagination `?page=N` → `noindex,follow` + canonical to page 1
- Screaming Frog "missing canonical" = Next streaming metadata; `htmlLimitedBots`
  extended with Screaming Frog (defaults kept)
- `/for-developers` hero span → real `<h1>` post-hydrate (FE2 parity fixture unchanged)
- `/services/ai-product-builds` already has template `<h1>` from Sanity name
- Retired `/team/shawnee-*` + `/team/jimmy-*` 404s match live (intentional; no redirect)
- `/live-job-role/*` stays Webflow-export exact list (no catch-all)

### PHASE 8 - Staging sign-off + Marker.io full rollout
Goal: the whole team reviews the finished site on staging via Marker.io.

- 8.1 Install Marker.io sitewide on staging (a single script in the root layout) and
      confirm it actually renders on a staging page before inviting reviewers.
- 8.2 Run the design-fidelity check on templates that were built but never formally
      reviewed against the design: Customer story, the 4 resource hubs
      (videos/tools/downloads/events), and download-thank-you.
- 8.3 Walk every review wave to closed. Triage feedback into must-fix vs post-launch.
- 8.4 Get Jake's design sign-off (the production gate).

### PHASE 9 - Cutover preparation (Jake's by-hand gates)
Goal: everything staged and reversible. These steps are Jake's to run, not the agent.

- 9.1 Confirm redirect record count equals the live page count (parity of URLs).
- 9.2 Confirm the "no-index on staging" gate is still ON for staging.
- 9.3 Set the canonical host env var ONLY on the deployment that will serve
      www.cloudemployee.io, on cutover day. Never on staging.
- 9.4 Prepare the rollback plan before flipping DNS.

---

## 4. The Services + Technology problem, explained fully

This is the item Jake flagged, so it gets its own section.

**What Jake sees:** service and technology pages look designed, but they are not
mapped to Sanity and would not be SEO-safe at crossover.

**What is actually true (verified):**
- Sanity has all 23 services and 101 technologies, WITH their real per-page content
  and their real SEO meta titles. Nothing is missing.
- The built pages ignore Sanity. They render `site/src/data/services.ts` and
  `technologies.ts`, which are generic files lifted from the design export. The
  result: the same paragraph, bullets, and FAQs appear on every service page and
  every technology page, and the page title is a generic "Name | Cloud Employee",
  not the real live meta.
- Because of that, at crossover Google would see the unique content it currently
  ranks replaced by near-identical boilerplate across dozens of URLs. That is the
  SEO risk. It is real, and it is caused by the wrong data source, not missing data.

**The fix (Phase 2):** point the pages at Sanity, feed that content into the design
Jake already approved, make the meta come from Sanity, and make the URLs match live
exactly. Because the content already exists and the slugs already match, this is a
wiring job with a clear, low-risk path.

**Proof the content is there (live query, 21 Jul 2026):**
- `serviceCount = 23`, `svcMissingFolds = 0`, `svcMissingMeta = 0`.
- `techCount = 101`, `techMissingFolds = 1`, `techMissingMeta = 0`.
- Example Sanity slugs: `full-stack-developers`, `back-end-developers`,
  `react-developers`, `latam-developers` - matching the live URL structure.

---

## 5. Marker.io rollout - when to put it on each page

Principle: **only ask people to review a page once it is review-ready** (passes G1
design + G2 Sanity on staging). Reviewing half-built pages wastes everyone's time
and buries the real feedback.

Practically, Marker.io is one small script that goes on the WHOLE staging site once.
You do not add it page by page in code. What you stage is **which pages you invite
people to review**, in waves tied to the phases above.

| Wave | Opens after | Pages invited for review |
|---|---|---|
| Install | Start of Phase 2 | Marker.io script live on all of staging. Reviewers told: only pages listed as "open" below. |
| Wave 1 | Phase 2 done | Service pages + Technology pages (detail + hubs) |
| Wave 2 | Phase 3 done | For Developers, Our Work, Locations, Calculators |
| Wave 3 | Phase 4 done | Compare + Alternatives hubs; and all the already-done detail pages + hubs (blog, team, reviews, videos, tools, downloads, customer stories) |
| Wave 4 | Phase 5 done | Fractional CTO, Managed Pods, Referral, Event detail |
| Wave 5 | Phase 6 done | Home, How It Works, Pricing |
| Full | Phase 7-8 | Entire site open for final sign-off |

Rule of thumb: a page enters a review wave the moment it is green on G1 + G2. G3
(SEO parity) is verified centrally in Phase 7, not by reviewers.

---

## 6. Master page tracker

> Corrected 21 Jul 2026 after a full re-audit of `site/src/app/` (102 route files).

Status key:
- **DONE** = passes G1 design + G2 Sanity + G3 SEO.
- **WIRED-FALLBACK** = reads Sanity but silently falls back to hardcoded copy if the
  Sanity doc is thin. NOT done until the fallback is removed and Sanity is fully filled.
- **DESIGN-OK-NOT-WIRED** = looks right, but reads hardcoded files. Cannot be edited.
- **URL-LIVE-ONLY** = loads (often Sanity-wired) but uses a generic/placeholder shell,
  no bespoke redesign yet.
- **NOT-BUILT** = no route file exists.

Every URL also has a `/uk` version unless noted. Dev-only routes (`/demo`,
`/legals/privacy-policy/preview`) and the dead `/uk/[...slug]` catch-all are excluded
from the product tracker and should be deleted before launch (scaffold debt).

### Detail pages
| Page | URL | Status | Work needed | Wave |
|---|---|---|---|---|
| Blog article | `/{category}/{slug}` | DONE | none | 3 |
| Team member | `/team/{slug}` | DONE | none | 3 |
| Review | `/reviews/{slug}` | DONE | none | 3 |
| Video | `/videos/{slug}` | DONE | none | 3 |
| Tool | `/tools/{slug}` | DONE | none | 3 |
| Download | `/download/{slug}` | DONE | none | 3 |
| Book a call (detail) | `/book-a-call/{slug}` | DONE | none | 3 |
| Compare (detail) | `/compare/{slug}` | DONE | none | 3 |
| Customer story | `/customer-story/{slug}` | DONE (bespoke dark/lime verified 22 Jul; confirm hero video in browser) | none | 3 |
| Download thank-you | `/download-thank-you/{slug}` | DONE (bespoke dark/lime verified 22 Jul, noindex) | none | 4 |
| **Service** | `/services/{slug}` | WIRED (detail, US+UK) | Fidelity pass + Presentation click-check | 1 |
| **Technology** | `/technology/{slug}` | WIRED (detail, US+UK) | Fidelity pass + Presentation click-check | 1 |
| Event detail | `/events/{slug}` | DROPPED (D4) | out of launch scope; verify no live event-detail URL 404s | - |

### Hub / listing pages
| Page | URL | Status | Work needed | Wave |
|---|---|---|---|---|
| Blog + 6 topic hubs | `/blog`, `/staff-augmentation`, `/nearshoring-offshoring`, `/scaling-teams`, `/hiring-tips`, `/managing-engineers`, `/ai-in-software-development` | DONE | none | 3 |
| Videos / Tools / Downloads / Events | `/videos`, `/tools`, `/downloads`, `/events` | DONE (verify gate PASS 21 Jul; design fidelity Phase 8) | fidelity check (Phase 8) | 3 |
| Reviews | `/reviews` | DONE | none | 3 |
| Customer stories | `/customer-stories` | DONE | none | 3 |
| **Services hub** | `/services` | DONE (Phase 2B) | none | 1 |
| **Technology hub** | `/technology` | DONE (Phase 2B) | none | 1 |
| Compare hub | `/compare` | RETIRE via 301 -> /alternatives (Phase 4.2, pending) | redirect + parity exception | 3 |
| Alternatives hub | `/alternatives` | DONE (dark/lime re-skin, 22 Jul) | none | 3 |

> **STATUS - RESOURCE HUBS VERIFICATION GATE PASS (21 Jul 2026).** The four resource
> hubs (`/videos /tools /downloads /events` + `/uk` mirrors) shipped earlier as commit
> `c6f4cb1` (`ResourceHubTemplate` + sidebar + re-skinned `ResourceCard`). A verification
> pass on 21 Jul ran the full gate: `tsc --noEmit` clean, `next build` exit 0 with all 8
> routes present, all 8 routes HTTP 200, US cards link real Sanity slugs, `/events`
> renders its honest empty state, CollectionPage + BreadcrumbList (+ ItemList when
> populated) JSON-LD present. Lint: 0 errors in resource-hub files (33 pre-existing
> errors are Tech Debt #36 / SCAFFOLD-AUDIT scope, unrelated). **One bug found and
> fixed:** on the four UK hubs the cards linked to US detail pages (`/videos/{slug}` not
> `/uk/videos/{slug}`) because `resource-card.tsx` double-processed the href through
> `toInternalHref` with a defaulted `en-US` locale, which stripped the `/uk` prefix that
> `getChildHref` had correctly added. Fixed by dropping the redundant re-wrap (the sidebar
> was always correct). Re-verified: all UK cards now carry `/uk/` and a UK detail target
> 200s. **The fix in `resource-card.tsx` is UNCOMMITTED** (awaiting Jake's approval to
> commit). **Related pre-existing bug flagged, NOT fixed (out of scope):** the blog
> family's `article-card.tsx` has the byte-identical line and the same defect - the
> `/uk/blog` grid links into the US cluster (17 links measured). Its own re-skin/fix
> phase should apply the same one-line fix.

### Marketing / standalone
| Page | URL | Must match live? | Status | Work needed | Wave |
|---|---|---|---|---|---|
| Home | `/` | No (redesigned) | WIRED-FALLBACK | Phase 6: fix crash + fill Sanity + kill fallback | 5 |
| How It Works | `/how-it-works` | No (redesigned) | WIRED-FALLBACK | Phase 6: fill Sanity + kill fallback | 5 |
| Pricing | `/pricing` | Yes | WIRED-FALLBACK | Phase 6: fill Sanity + calculator embed (D5) | 5 |
| For Developers | `/for-developers` (+ `/uk`) | Yes | DONE - rebuilt + Sanity-wired, pixel-parity PROVEN (not yet seeded/pushed) | Phase 3.1: tokenise-and-hydrate rebuild of the frozen Figma export; `forDevelopersPage` bespoke singleton + GROQ/Zod/transform + US/UK routes + seed. `npm run static:verify-fe2-parity` asserts byte-identical output. Build green, routes 200. Jake to seed + push. | 2 |
| Our Work | `/our-work` | Yes | **DONE (WIRE-BESPOKE 23 Jul) + polish 28 Jul.** Bespoke page + Sanity wiring. Polish: bright logo marquee; people-photo tiles (8x + 2x beyond-hiring); taller Customer Impact with autoplay videos TR/BL; uniform `#070D18` ground; mid-CTA removed. Studio photo slots still optional overrides. | DONE (G2 + polish) | 2 |
| Location: LATAM | `/services/latam-developers` | Net-new | BUILT + COMMITTED (bespoke `LocationTemplate` + cost calculator + location JSON-LD, dark/lime; 200). G1 + G2 done. **27 Jul:** redesigned shared "What's included" card added after the regional overview with Latin America-specific payroll copy; `locationPage-latam-developers.included` patched in production (published doc only, no draft) so all copy is Studio-editable. | DONE (G1+G2) | 2 |
| Location: Philippines | `/services/philippines-developers` | Net-new | BUILT + COMMITTED (same `LocationTemplate`; 200). G1 done. G2 wiring code-complete (WIRE-BESPOKE 23 Jul, same as LATAM). Doc IS seeded (page renders Sanity data). **"What's included" section redesigned 27 Jul - DONE** (one bordered card, equal-height columns, two-up "We" list, lime as accent only) per `whats-included-1a.html`; copy rewritten with counted labels + 8 split "We" items + PH-named payroll line; 4 new fields (`youBody`, `youFootnote`, `wePill`, `weBody`) added to schema/GROQ/Zod/seed. **Studio deployed + `npm run static:patch-ph-included` run against production** (published doc patched, no draft existed); verified rendering at 1440/1024/390. **27 Jul polish:** hero CTA contents optically centred; all three benefit facts share one desktop row; trusted-by label is exactly two lines. | DONE (G1+G2) | 2 |
| Location: Eastern Europe | `/services/eastern-europe-developers` | Net-new | BUILT + COMMITTED (same `LocationTemplate`; 200; net-new slug, no service doc). G1 + G2 done. **27 Jul:** redesigned shared "What's included" card added after the regional overview with Eastern Europe-specific payroll copy; `locationPage-eastern-europe-developers.included` patched in production (published doc only, no draft) so all copy is Studio-editable. | DONE (G1+G2) | 2 |
| About Us | `/about-us` | YES - live + indexed on CE | URL-LIVE-ONLY | Keep live w/ captured content (stays indexed); redesign later (deferred). Do NOT hide. **27 Jul:** removed from header `navigation.primaryLinks` (was the 6th item); kept in footer Company column (`About us`). Page itself unchanged. | 4 (defer design) |
| Contact | `/contact` | YES - live + indexed on CE (`/contact-us` -> `/contact`) | URL-LIVE-ONLY | Keep live w/ captured content; redesign later (deferred). Do NOT hide. | 4 (defer design) |
| Referrals | `/referrals` | Design exists | URL-LIVE-ONLY (built + wired) | Phase 5.3 DESIGN pass (not a build) | 4 |
| Book a call (index) | `/book-a-call` | Yes (in sitemap) | URL-LIVE-ONLY + EMPTY in Sanity (0 sections, verified 21 Jul) | Phase 1.3 add content THEN design | 4 |
| Work with Shawnee | `/work-with-shawnee` | YES - live on CE (US+UK) | REMOVE via 301 | 301-redirect `/work-with-shawnee` + `/uk/work-with-shawnee` -> `/contact` (D6 CONFIRMED), delete route, add parity exception. | - |
| Legal: Privacy | `/legals/privacy-policy` | Yes | WIRED - body present (236 blocks, verified 21 Jul) | optional design polish | - |
| Legal: Terms | `/legals/general-terms` | Yes | WIRED - body present (201 blocks, verified 21 Jul) | none | - |
| Thank-you pages | `/thank-you`, `/thank-you-culture-match`, `/thank-you-for-your-message`, `/thank-you-now-book-a-call`, `/book-a-call-confirmed`, `/book-a-call-thank-you` | No | URL-LIVE-ONLY (noindex, fine) | none | - |
| Calculator (the only one that matters) | on `/pricing` | Yes | embed component on /pricing (D5) | Phase 6.3 | 5 |
| Hiring cost calculator (standalone) | `/hiring-cost-calculator` | Live 200, not wanted standalone | REMOVE via 301 -> /pricing (D3 FINAL) | delete route; parity exception | - |
| Price comparison calculator (standalone) | `/price-comparison-calculator` | Live 200, not wanted standalone | REMOVE via 301 -> /pricing (D3 FINAL) | delete route (+ /uk, /ph, /tools variants -> /pricing); parity exception | - |
| Fractional CTO | `/services/fractional-ctos` (+ `/uk`) | Net-new | BUILT + COMMITTED 22 Jul (`2951a2c`); **G2 wiring code-complete (WIRE-BESPOKE 23 Jul): `fractionalCtoPage` singleton (all copy editable + `video.videoUrl`) + GROQ/Zod/transform + US/UK routes (Sanity-first, static `FCTO` fallback) + seed; tsc/build/routes-200 green.** No photos by design (anonymised CTO cards, text-name logos, stylised video tile) - only media control is the video URL. OPEN: Jake deploys Studio + runs `npm run static:seed-fractional-cto-page`. | Deploy Studio + run seed; then DONE (confirm canonical URL vs planned `/fractional-cto` separately) | 4 |
| Software Engineers (Hire Engineers) | `/services/software-engineers` (+ `/uk`) | Net-new (nav "Hire Engineers") | BUILT + COMMITTED 22 Jul (`a9cf250`; bespoke dark/lime `templates/hire-engineers/`). **G2 wiring code-complete (WIRE-BESPOKE 23 Jul): `hireEngineersPage` singleton (all copy editable + every image slot editable - hero avatars, offer/proof/form photos, sample-profile + author avatars, match photos - + 90-second tour `videoUrl`/`poster`) + GROQ/Zod/transform (splices calculator option keys, stega-cleans tour URL) + US/UK routes (Sanity-first, static `HE` fallback) + seed; tsc/build/routes-200 green.** Calculator numeric tables stay code-driven. SEEDED to production 23 Jul (after the Growth plan upgrade; verified `hireEngineersPage` landed with all sections), Studio deployed. Fully editable in Studio. Seb: upload image slots + paste the 90-second tour video URL if wanted. | DONE (G2). Optional: image/video uploads (confirm `/hire/software-engineers` redirect target + nav link) | 4 |
| Managed Pods | `/managed-pods` | Net-new | NOT-BUILT | Phase 5.2 | 4 |
| 404 | any bad URL | n/a | DONE (dark/lime re-skin 22 Jul) | none | - |

### Funnels / utility (built, not standard marketing pages)
| Page | URL | Status | Work needed | Wave |
|---|---|---|---|---|
| Start-hiring funnel | `/start-hiring/{step}` (8 steps) | WIRED (noindex) | Phase 7.7 parity: forms, steps, redirects | - |
| Sitemap | `/sitemap.xml` | Needs hreflang fix | Phase 7.2 | - |
| Robots | `/robots.txt` | Correct (hostname-gated) | Phase 9.2/9.3 verify | - |

---

## 7. SEO parity checklist (the launch gate)

Nothing goes to the real domain until all of these are green:

- [ ] Parity gate run against staging and recorded as PASS (`launch:verify-parity`).
- [ ] Redirect record count equals live page count.
- [ ] Service/technology page titles, descriptions, and body match live (Phase 2).
- [ ] No extra indexable service/technology URLs beyond live (slug dedup, made-up
      slugs return 404).
- [ ] Dynamic sitemap carries US/UK hreflang on individual content pages.
- [ ] Privacy policy body present (page does not 404).
- [ ] Structured data correct per template (Service on service pages, etc.).
- [ ] Nav structured data uses the safe serializer.
- [ ] Start-hiring funnel behaves as live (steps, forms, redirects).
- [ ] **HubSpot + sales-funnel once-over (Phase 7.9):** Jake funnel map signed;
      `launch:verify-hubspot-forms` PASS; one real test lead per path on staging;
      portal id on Vercel; no dead primary form CTAs.
- [ ] **Speed + crawl pass (Phase 7.10):** Screaming Frog staging crawl filed;
      Lighthouse SEO 100 on sample set; Tier 1 SEO/AEO checklist green; Perf debt
      (third-party scripts) owned, not ignored.
- [ ] Every page is editable in Presentation (including the static-page batch).
- [ ] Real social-share image in place.
- [ ] Organization structured data has verified social links.
- [ ] Dead/dev routes removed (`/demo`, `/legals/privacy-policy/preview`, `/uk/[...slug]`).
- [ ] No-index gate ON for staging; canonical host set ONLY on production at cutover.
- [ ] Top-20 traffic URLs spot-checked live vs new.

---

## 8. Open decisions for Jake (surface before building)

Per the two-brain rule, these are architecture/product calls the build should not
make silently. Recommendation given; Jake confirms.

- **D1 - Service/tech render path. CONFIRMED (21 Jul).** Keep the approved
  CatalogueDetail design; feed it Sanity content via a small transform layer. Phase 2
  proceeds on this basis. (Alternative rejected: swapping to ServiceTemplate/
  TechnologyTemplate would change the look.)
- **D2 - Location pages. CONFIRMED (21 Jul).** Locations are Sanity-backed and MUST be
  wired. URLs: `/services/latam-developers`, `/services/philippines-developers`,
  `/services/eastern-europe-developers`. latam + philippines already exist as Sanity
  service docs; add eastern-europe.
- **D3 - Calculators. FINAL (21 Jul).** ONE calculator only, and it lives ON `/pricing`
  (via D5). The standalone calculator URLs are NOT wanted, even though they are live 200s.
  301-redirect ALL of these to `/pricing`: `/hiring-cost-calculator`,
  `/price-comparison-calculator`, plus their `/uk/`, `/ph/`, and `/tools/` variants
  (`/tools/price-comparison-calculator` already 301s to `/pricing` on live). Delete the
  two standalone routes. Record the two live-200 redirects as parity exceptions
  (deliberate divergence: live serves 200, we 301). SEQUENCE: embed the calculator on
  `/pricing` first (or in the same change), THEN point the redirects at it, so the
  calculator is never missing.
- **D4 - Event detail. CONFIRMED DROPPED (21 Jul).** No live event-detail content;
  `/events/[slug]` is out of launch scope. Ensure no live event-detail URL 404s.
- **D5 - Pricing calculator embed. CONFIRMED (21 Jul).** Render the calculator
  component directly on `/pricing` (live uses an iframe).
- **D6 - Work-with-Shawnee removal target. CONFIRMED (21 Jul).** 301-redirect
  `/work-with-shawnee` and `/uk/work-with-shawnee` -> `/contact`. Then delete the route
  and record a parity exception.

**Deferred-but-in-scope note (About Us + Contact) - CONFIRMED (21 Jul):** both are live
and indexed on CE. Decision: keep them live with their captured content so they stay
indexed and parity holds; redesign later. They are NOT hidden/noindexed, because that
would drop pages Google currently ranks during the migration.

- **D7 - Lead capture / intent system. CONFIRMED + SIMPLIFIED (26 Jul).**
  Necessary doors only — see `docs/design/lead-conversion/LEAD_CONVERSION_SYSTEM_UX.md`:
  - **M1 Schedule a Call** = primary door sitewide
  - **M2 Chat + living brief** = warm path at interest spikes only (Pricing first)
  - **M4 Helper chat** = CE-owned helper later (Clara headless if gates pass)
  - **M3 Start Hiring** = keep URLs/forms working; **do not promote** / no new links
  - Butter-up first; ungate downloads; no email-gate for pricing quotes
  - Locations hero should move off `/start-hiring` toward M1 (+ optional M2)
- **D8 - Pricing conversion. CONFIRMED (26 Jul).** Pricing is the highest-value page.
  - **Ship first (Option A):** after calculator result, primary CTA =
    **“Get a more accurate estimate - book a call”**. Pass the calculator data it
    actually collects (developer count, talent region, comparison country, currency,
    estimate range, locale, source page) into booking context where supported.
    Secondary = optional 2–3 guided brief questions, **not** Start Hiring.
  - **Utopia (design next):** calculator → AI chat asks a few high-signal questions →
    living hiring brief builds on the side → marketing sweeteners (technical vetting,
    deep profiles, psychometrics only if sales/legal approves) → example
    shortlist-style cards (labelled examples)
    → Book a call for real shortlist.
  - **Claude Design feed (sitewide placement + kit):**  
    **`docs/design/lead-conversion/LEAD_CONVERSION_SYSTEM_UX.md`**
    Pricing deep dive/audit: `docs/design/lead-conversion/PRICING_LEAD_CONVERSION_UX.md`.
  - **Execution handoff (new chat):**  
    **`docs/design/lead-conversion/LEAD_CONVERSION_EXECUTION_PLAN.md`** — page matrix, phases A–F,
    copy-paste starter prompt.
  - The CE site owns the M2 UI shell. Until a backend is ready, the shell can run
    clearly-labelled guided questions with the same side brief.
- **D9 - Clara architecture. CONFIRMED AFTER REPO AUDIT (26 Jul).**
  `galaxyfunk/clara-chatbot` is a mature Q&A/RAG product with streaming, sessions,
  knowledge management, HubSpot sync, Calendly attribution, and admin tooling.
  **Do not rebuild those backend capabilities without cause. Do not use Clara’s
  current widget/iframe as Pricing M2.** Build CE-owned M2/M4 interfaces and evaluate
  Clara as a headless backend after adding structured brief I/O, signed sessions,
  durable rate limiting, staging CORS, webhook verification, privacy/retention, and
  accessibility gates. Remove the legacy Clara launcher before M4 ships so two chat
  widgets never compete. Full decision: `docs/design/lead-conversion/LEAD_CONVERSION_EXECUTION_PLAN.md` §1a.

### 8a. Utopia conversion loop (what “lots of leads” looks like)

Goal: warm them, learn about them without a form dump, convert on Book a Call.

```
Pricing calculator → estimate
        ↓
Chat asks 4–6 key questions (chips first)
        ↓
Side panel: hiring brief builds live (+ vetting sweeteners)
        ↓
Brief ready → example shortlist-style profiles (labelled examples)
        ↓
PRIMARY: Book a call (always available as escape)
   SECONDARY: keep refining / explicitly save brief (optional)
        ↓
HubSpot + human match → 2 real profiles
```

Sitewide placement map + Claude Design frame list:
`docs/design/lead-conversion/LEAD_CONVERSION_SYSTEM_UX.md`.
Pricing audit / questions / metrics: `docs/design/lead-conversion/PRICING_LEAD_CONVERSION_UX.md`.

**Rules that protect conversion:**
1. Never fake that chat/calculator matched real people.
2. Book a Call always one click away (chat must not trap hot leads).
3. Start Hiring remains working for legacy/direct traffic but is not promoted.
4. Email only at book / explicit save — not before the first answers.
5. Measure: calculator → panel engage → brief ready → book clicks → bookings → opps.

**Build sequence:** V1 Option A on Pricing → V2 this guided chat+brief module
(design in Claude Design now) → V3 connect a headless backend (Clara if its gates
pass) → reuse on Home / Hire Engineers / Locations.

---

## 9. How to use this file

- This is the checklist we work through, top to bottom.
- After each phase, tick the tracker in section 6 and update the SEO checklist.
- When context in a working chat gets full, start a fresh chat pointed at this file.
- The file is the memory; the chat is disposable.
