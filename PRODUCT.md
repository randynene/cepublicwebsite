# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring managers, founders, and CTOs at US and UK tech companies who want to add remote software engineers to their existing team without going through a job board or a generic staffing agency. They arrive comparing options (compare pages exist against Toptal, Arc.dev, and "dev agencies" broadly), price-check via the hiring-cost and price-comparison calculators, read customer stories and reviews as proof, and convert through a book-a-call / Calendly funnel or a quick-hiring form.

Secondary: engineering candidates in Cloud Employee's talent locations (Philippines, Eastern Europe, LATAM) considering joining the talent pool via the Software Engineers / Hire Engineers page. Their primary application flow lives on the separate `talent.cloudemployee.io` Webflow site, which is not part of this codebase and was not migrated.

## Product Purpose

Cloud Employee sources, vets, and embeds full-time remote software engineers into a client's existing team ("staff augmentation" / "embedded tech teams"), plus adjacent offerings: Fractional CTOs and Managed Pods (a full engineering team as a service). Success for a visitor is booking a call, submitting a quick-hiring inquiry, or otherwise entering the sales funnel with enough confidence in fit and price to move forward.

## Positioning

The differentiator, evidenced by the site's own compare pages, is that engineers are vetted and embedded directly into the client's team so they "feel in-house," delivered through a nearshoring model with named talent locations (Philippines, Eastern Europe, LATAM) — as distinct from a job board (no vetting, self-serve), a marketplace like Toptal/Arc.dev (freelance/contract framing), or a generic staffing agency (headcount without integration). Pricing is transparent and comparison-led rather than "contact us to find out."

## Operating Context

- The live site is `cloudemployee.io` (Next.js 16 + Sanity, hosted on Vercel), migrated from a Webflow original. It has been in production since 3 Aug 2026; every push to `main` deploys live.
- Locales: US (default) and UK (`/uk/` prefix). A discontinued PH locale now routes to the separate talent subdomain.
- Content is CMS-driven through Sanity (Studio at `mygratr-cloudemployee.sanity.studio`), editable by Seb (customer-side content owner) without a code deploy for most fields.
- Conversion funnel: pricing/hiring-cost calculators (email-gated on `/pricing`) → book-a-call (self-loading Calendly embed) or quick-hiring form → HubSpot. Lead routing to HubSpot/Slack currently has known gaps (tracked outside this design work, in the Lead Agent track).
- Content marketing surfaces: blog + 6 topic hubs, videos, tools, downloads, customer stories, reviews, team member bios — all detail-page templates with their own SEO/JSON-LD treatment.
- `talent.cloudemployee.io` is a separate, still-live Webflow site (the candidate-facing recruiting site) and is out of scope for this codebase.

## Capabilities and Constraints

- Full CMS-backed page set: hub/index pages (blog, services, technology, reviews, customer stories, videos/tools/downloads/events, alternatives) and detail templates (blog, video, download, tool, book-a-call, compare, review, team member, customer story, service, technology, download-thank-you).
- Two calculators (price-comparison, hiring-cost) rebuilt from Cloud Employee's real cost models and verified exact against the live originals; currently unstyled to any design (Tech Debt #60) and, per Marker triage, gated behind a feature flag site-wide pending further validation (Tech Debt/CE-67).
- Net-new pages with no live-site equivalent: Locations (Philippines/Eastern Europe/LATAM + cost calculator), Fractional CTO, Managed Pods (not yet built), Referral (built, no design pass yet).
- SEO is a first-class constraint: title/description/canonical/hreflang/JSON-LD are required on every page type, and several live H1s are deliberately kept verbatim from the old site because they carry ranking signal (see Tech Debt #43b) — copy changes to these must not be made casually.
- Accessibility floor already established site-wide (Lighthouse A11y 96-100 on shipped templates); do not regress it.
- No em-dashes anywhere in shipped copy or code (standing project rule) — use hyphens.
- Terminology: "embedded tech teams" / "embedded engineers", not "freelancers" or "contractors"; "talent locations" for the nearshore geographies; "hub" for CMS listing/index pages, "detail template" for individual content pages.

## Brand Commitments

- Name: Cloud Employee. Parent/agency brand building the platform: Saxon.io.
- A locked visual identity already exists and is live in production: dark-default theme, lime accent (`#D4FF3C`), Inter Semi Bold type scale, Source Serif 4 Italic accent, documented in `docs/design/VISUAL_LANGUAGE_SPEC.md` and implemented in `site/src/app/tokens.css`. Any visual work on this codebase is a refinement/extension of this system, not a from-scratch visual world, unless a redesign is explicitly requested.
- Real, non-fabricated social proof already exists and must be preserved as-is, not invented: client logos, 8 live published customer reviews, team member bios (28 people), customer stories, and a 90-second founder overview video (Seb Hall) used on the homepage process section.

## Evidence on Hand

- Real customer logos (`site/src/components/social-proof/client-logo-strip`).
- 8 live published reviews (of an original 11 in the dataset; 3 correspond to since-deleted Webflow source pages and correctly 301 to the reviews hub).
- 28 team member profiles with bios, roles, and LinkedIn links.
- Customer story documents with structured problem/solution/impact narrative + quotes, some with video testimonials.
- Real pricing rate cards: price-comparison rates live in Sanity (editable by Seb); hiring-cost rates are in code (recovered from a minified bundle, not yet moved to Sanity).
- Verified Lighthouse baselines exist for the blog template (desktop, staging, Jul 2026) but production-wide Core Web Vitals have never been measured (Tech Debt #66) — do not assume current numbers without checking.
- Absences future work must not fabricate: no verified `sameAs` social profile URLs in schema yet; no default OG image beyond the Webflow-sourced one unless Seb supplies a replacement; Managed Pods and a designed Referral page do not exist yet.

## Product Principles

1. Preserve the locked dark/lime visual system and its accessibility floor; extend it, do not reinvent it, unless a redesign is explicitly requested.
2. Never fabricate proof. Every testimonial, logo, stat, and case study on the site must trace to a real Cloud Employee customer or figure already in the dataset or docs.
3. SEO-bearing copy (especially H1s carried over from the live site) is load-bearing content, not decoration — treat changes to it as a content decision requiring sign-off, not a routine polish edit.
4. The funnel is the point: every page ultimately serves getting a qualified visitor to a call or a hiring inquiry with enough confidence in fit and price to convert.
5. This is a live production site, not a staging sandbox — every change ships to real visitors and real leads.

## Accessibility & Inclusion

Lighthouse Accessibility scores of 96-100 are already established on shipped templates (blog, hubs, chrome) and are the floor for new or modified UI, not an aspirational target.
