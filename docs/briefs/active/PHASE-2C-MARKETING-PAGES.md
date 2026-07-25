# Phase 2c — the remaining pages

Everything left between here and a green parity gate. Written after the Webflow
page list revealed the true page set (the April crawl, the sitemap, Search Console
and Ahrefs were all blind to pages with no links and no rankings).

## The principle that decides every row below

**A page's URL and its design are separate problems, and only one of them is
urgent.**

If `/about-us` does not exist at cutover, the URL 404s and its rankings go. That is
irreversible on a timescale that matters. If `/about-us` exists but looks like the
old site, nothing is lost — we restyle it the week Seb's design lands, and Google
never notices.

So: build every page now, from whatever content exists today, with correct URLs,
correct content and correct SEO. Restyle later. The only pages we build "properly"
first time are the ones whose design already exists.

## Two ways in

**A. Design exists in `docs/raw-html/`** → build against the design. It is faster to
do it once than to do it twice.

**B. No design** → clone the live page's content into Sanity and render it through
the generic static-page template. On-brand (dark/lime chrome, our components), not
pixel-matched to anything. Reskin when the design arrives.

The Sanity shape is the same either way (`defineStaticPage`: hero + `sections[]`),
so a reskin is a template change, not a content migration. That is the whole point
of doing it this way.

---

## The pages

Every row is US + UK unless noted.

### Group 1 — no design yet, clone from live, reskin later

Jake: About Us "very different", For Developers "completely different", Pricing
"probably very different", Contact "pretty much the same".

| Page | Singleton | Notes |
|---|---|---|
| `/about-us` | `aboutUsPage` (exists) | Also the target of the `/team` redirect, so it must exist or `/team` 404s too. |
| `/contact` | `contactPage` (exists) | Staying broadly as-is, so this one is closest to final. HubSpot form. |
| `/for-developers` | `forDevelopersPage` (exists) | The developer/candidate sign-up page. |
| `/pricing` | **needs schema** | Live 200. Our redirect table used to kill it (fixed). Carries the interactive calculator — see Group 3. |
| `/our-work` | **needs schema** | **Do not merge into `/customer-stories`.** GSC: position 4.2 on 1,825 impressions — it OUTRANKS the hub it resembles. |
| `/alternatives` | **needs schema** | Same. Position 9.1 on 1,363 impressions, vs `/compare` at 25.9. |
| `/work-with-shawnee` | `workWithShawneePage` (exists) | Small landing page. |

### Group 2 — design exists, build properly

| Page | Design | Notes |
|---|---|---|
| `/referrals` | `docs/raw-html/Referral.html` | Live page ("Know someone building a Dev Team?"). Jake: the new design is a completely different page, and it exists. Build from the design, not from live. |
| `/404` | `docs/raw-html/404.html` | Note: Webflow also serves a page AT the literal path `/404`. Route + not-found handler. |
| Location pages | `docs/raw-html/Location.html` | **NEW pages, no live equivalent.** `/talent-locations-europe` 404s on live — an unpublished Webflow draft, nothing to preserve. See Group 5. |

### Group 3 — the calculators

| Page | Singleton | Notes |
|---|---|---|
| `/pricing` | needs schema | The pricing page hosts a live calculator (developers x region x currency -> monthly cost). |
| `/price-comparison-calculator` | `priceComparisonCalculatorPage` (exists) | Live 200. Also a `tool` doc at `/tools/price-comparison-calculator`, which live 301s to `/pricing` — mirror that. |
| `/hiring-cost-calculator` | `hiringCostCalculatorPage` (exists) | Live 200. |

The calculator is the only genuinely interactive thing in this phase. Its logic
(salary benchmarks per region, employment-cost breakdown) is data, and it belongs
in Sanity, not hardcoded — the numbers will change.

### Group 4 — thank-you and confirmation pages

All small, all `noindex` (verify), all found only via the Webflow page list.

`/thank-you`, `/thank-you-culture-match`, `/thank-you-for-your-message`,
`/thank-you-now-book-a-call`, `/book-a-call-confirmed`, `/book-a-call-thank-you`,
plus the `/book-a-call` hub (lists the 6 bookACall docs; the detail routes already
exist).

### Group 5 — the new Location pages

Net-new. No live equivalent, so no URL to preserve and no rankings at risk — which
means these are the one group where we can take our time and get the design right
first.

Jake's set: Eastern Europe, LATAM, Philippines.

**Do not put these at `/locations/*`.** LATAM and Philippines already rank at
`/services/latam-developers` and `/services/philippines-developers`. A new URL for
the same subject either splits the ranking or cannibalises it. The Location design
becomes a richer layout variant of the Service template, rendered at the URLs that
already rank. Eastern Europe is new, so it joins the same pattern:
`/services/eastern-europe-developers`.

---

## Cross-cutting work this phase needs

**A generic static-page template.** Group 1 is seven pages of the same shape (hero +
sections + CTA). One template driven by `sections[]`, not seven bespoke templates.
The section types already exist in the schema (`richTextSection`,
`twoColumnSection`, `ctaSection`, `imageSection`, `faqSection`,
`hubspotFormSection`, ...).

**A live-page content capture script.** Scrapes a live page into its Sanity
singleton as hero + sections. Reused for all of Group 1 and for the hub intro copy
(Tech Debt #44/#45, still open). This is the difference between a week of copy-paste
and an afternoon.

**HubSpot forms.** `/contact` and `/for-developers` have forms. Every form id must
go through `npm run launch:verify-hubspot-forms` — a wrong id renders nothing at
all, with no error, and loses every submission silently. This already happened once
(the portal id was never exposed to the app, so every form on the site was dead).

---

## Sequencing

1. **Content capture script + generic static-page template.** Everything else
   depends on these, and they turn Group 1 from seven builds into seven seeds.
2. **Group 1** (7 pages). The ones with live rankings to protect.
3. **Group 4** (thank-you pages + book-a-call hub). Small, fast, closes a chunk of
   the gate.
4. **Group 3** (calculators). The only real engineering left.
5. **Group 2** (`/referrals`, `/404`) — build from the designs.
6. **Group 5** (Location pages) — new pages, no deadline pressure, do them well.
7. **Hub rebuild + hub intro copy** (Phase 2b, Tech Debt #43/#44/#45).

The parity gate goes green somewhere around step 5. Steps 6 and 7 are quality, not
parity.

## Definition of done

- `npm run launch:verify-parity` green (or every remaining divergence recorded in
  `parity-exceptions.json` with a reason).
- `npm run launch:verify-hubspot-forms` green.
- `npm run build` clean, `tsc` clean.
- Every new page: canonical + hreflang + correct locale, per the CONTRACT in
  `lib/locale.ts`.
