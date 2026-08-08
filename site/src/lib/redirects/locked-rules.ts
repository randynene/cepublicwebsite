// HAND-MAINTAINED. This is the one redirect file in this directory that is NOT
// auto-generated: the other four are emitted by scripts/scaffold/extract-redirects.ts
// and scripts/scaffold/generate-job-role-redirects.ts from data/webflow/, and
// editing those by hand is destroyed on the next extract.
//
// Moved here verbatim from site/next.config.ts (SEO session S1, 8 Aug 2026) so
// that the sitemap can import the same list the router uses. A URL that the
// redirect table intercepts must never appear in the sitemap, and the only way to
// guarantee that is for both to read one source. See ./index.ts.
//
// Rules that are not derived from the Webflow export.
//
// These were originally written from MYGRATR_SCHEMA_DESIGN_DECISIONS §8, i.e.
// from what we INTENDED the URL structure to become, not from what the live site
// does. `npm run launch:verify-parity` caught the consequence: /our-work,
// /alternatives and /pricing are all live pages returning 200 on Webflow, and
// three of these rules would have 301'd them away at cutover, deleting them and
// their rankings. They are gone. Those three URLs need real routes; the parity
// gate now fails until they exist, which is the correct place for that pressure.
//
// Verify any rule added here against data/webflow/live-behaviour.json first.
// "What the redesign wants the URL to be" is a migration to run deliberately
// after launch, not a redirect to smuggle in during it.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const lockedRules: Redirect[] = [
  // Job listings moved to a separate subdomain. The rules are NOT here any more:
  // they are one-per-slug in `jobRoleRedirects`, generated from Webflow's export.
  //
  // They used to be a catch-all, `/live-job-role/:path+` -> talent.cloudemployee.io,
  // which read as a tidy collapse of 333 near-identical rows. It was a guess about
  // the list rather than the list, and it was wrong: Webflow has no rule for 29 of
  // the job slugs and serves them a clean 404. The catch-all redirected those 29 as
  // well, to a talent URL that is itself a 404 - turning a 404 into a cross-domain
  // redirect chain that ends in a 404, which is worse for a crawler and for a
  // visitor. The parity gate caught it; see scripts/scaffold/generate-job-role-redirects.ts.

  // Verified against live: /team is a genuine 301 to /about-us.
  { source: '/team', destination: '/about-us', permanent: true },

  // INTERIM - SEO session S1, 8 Aug 2026. Roadmap item 1.1.
  //
  // /team/shawnee-malesich 404s on the live site and on ours. The teamMember doc
  // was retired, the same per-locale retirement shape as Tech Debt #58.
  //
  // It is not a quiet URL. It is the 9th most AI-cited page on the site (286
  // Copilot citations) and "shawnee malesich" is a 2,877-impression / 112-click
  // query in Search Console, so the 404 is losing live citations and live clicks
  // every day it stands.
  //
  // Destination is /about-us, NOT /team: /team is itself a 301 to /about-us (the
  // rule above), so pointing here at /team would build a two-hop chain, which is
  // the exact defect this session exists to remove.
  //
  // INTERIM because the real decision is Seb's: restore the person's page, or
  // accept the 301 permanently (D-EDIT in docs/seo/EXECUTION_SESSIONS.md). If the
  // page is restored, delete these two lines - a redirect on a URL that has a
  // page again is worse than no rule at all.
  { source: '/team/shawnee-malesich', destination: '/about-us', permanent: true },
  { source: '/uk/team/shawnee-malesich', destination: '/uk/about-us', permanent: true },

  // DELIBERATE DIVERGENCE FROM LIVE - Jake, 30 Jul 2026 (launch consolidation).
  //
  // The whole /start-hiring funnel is RETIRED. It was 17 URLs (8 US steps + 9 UK)
  // driven by nine separate HubSpot forms, and the step order lived in HubSpot's
  // redirect settings rather than in this repo. Jake's launch decision: the site
  // has one aim, book a call, and a nine-step form is the opposite of that.
  //
  // RETIRED VIA REDIRECT, NOT DELETION. The pages carry almost no traffic
  // (/start-hiring/get-started: 2 clicks / 1,156 impressions; /start-hiring:
  // 0 / 177; /uk/start-hiring: 0 / 28) but /start-hiring has 4 referring domains,
  // and every one of these URLs returns 200 on live today. Letting them 404 during
  // a domain migration bins the link equity and fails the parity gate. A 301 to
  // /book-a-call costs nothing and lands the visitor on the thing we actually want
  // them to do.
  //
  // The Sanity documents and Studio schemas are deliberately LEFT IN PLACE. Nothing
  // routes to them, so they render nowhere; removing them would be a schema change
  // that orphans live data for no gain. Reversible if Jake ever wants the funnel
  // back.
  //
  // Recorded in data/webflow/parity-exceptions.json.
  { source: '/start-hiring', destination: '/book-a-call', permanent: true },
  { source: '/start-hiring/:step*', destination: '/book-a-call', permanent: true },
  { source: '/start-hiring-now', destination: '/book-a-call', permanent: true },
  { source: '/uk/start-hiring', destination: '/uk/book-a-call', permanent: true },
  { source: '/uk/start-hiring/:step*', destination: '/uk/book-a-call', permanent: true },
  { source: '/uk/start-hiring-now', destination: '/uk/book-a-call', permanent: true },

  // DELIBERATE DIVERGENCE FROM LIVE - Jake, Jul 2026.
  //
  // /sourcing, /embedding and /retention return 200 on Webflow. We are choosing
  // not to rebuild them: they are the three chapters of the source-embed-retain
  // story that /how-it-works already tells in full.
  //
  // They are REDIRECTED rather than dropped because they rank. Search Console
  // has them at positions 8.3, 8.9 and 8.5, page one, on 4,373 combined
  // impressions. Letting them 404 would bin that; a 301 to the page that covers
  // the same subject passes the relevance across. Neither has a single backlink,
  // so a redirect is all they need. Cost: three lines instead of three page builds.
  //
  // /scale-this-week (321 impressions, position 19) is a booking CTA we are not
  // rebuilding. It goes to the homepage, Jake's call, 26 Jul 2026, overriding the
  // original start-hiring destination.
  //
  // Recorded in data/webflow/parity-exceptions.json so the parity gate reports
  // them as expected, not as failures.
  // Location pages render a bespoke template at the existing ranking service
  // URLs; the short /location/* paths (briefly shipped as static HTML) 301 to
  // them so there is one canonical URL per region.
  { source: '/location/latam', destination: '/services/latam-developers', permanent: true },
  { source: '/location/philippines', destination: '/services/philippines-developers', permanent: true },
  { source: '/location/eastern-europe', destination: '/services/eastern-europe-developers', permanent: true },

  // DELIBERATE DIVERGENCE FROM LIVE - Jake, 22 Jul 2026 (Phase 4.2).
  //
  // /compare and /alternatives are two hubs over the SAME 27 compareBlog docs.
  // Live serves both 200, but they compete for the same "Cloud Employee vs X"
  // intent and /alternatives ranks better (Search Console ~9.1 vs ~25.9). Rather
  // than maintain two pages, we consolidate onto the stronger URL: /alternatives
  // is the rebuilt hub, and the /compare HUB ROOT 301s into it.
  //
  // EXACT-PATH ONLY. This matches /compare, not /compare/:slug - the individual
  // comparison articles keep their URLs (they are the content that ranks, and the
  // /alternatives cards link straight to them). Recorded in parity-exceptions.json.
  { source: '/compare', destination: '/alternatives', permanent: true },
  { source: '/uk/compare', destination: '/uk/alternatives', permanent: true },

  // Dead booking path found by Screaming Frog (internal links + CTAs). Canonical
  // booking URL is /book-a-call. Not present in the Webflow redirect export.
  { source: '/schedule-a-call', destination: '/book-a-call', permanent: true },
  { source: '/uk/schedule-a-call', destination: '/uk/book-a-call', permanent: true },

  // SEO session S1, 8 Aug 2026. The discontinued /ph locale.
  //
  // The Webflow export carries /ph/* rules whose destinations are also /ph/*. The
  // PH locale no longer exists on this site (visitors from the Philippines are
  // routed to talent.cloudemployee.io), so those destinations 404, and the export
  // rows turn an inbound /ph link into a 308 that lands on nothing.
  //
  // /ph/services/filipino-developers is the one that matters: it carries live
  // referral traffic tagged utm_source=chatgpt.com. Point it at the default-locale
  // page that actually answers the query. The rule sits here rather than in the
  // generated table because it is a decision about a retired locale, not a fact
  // about Webflow's export.
  //
  // NOT GENERALISED to /ph/:path*. 40 other /ph rows have the same shape and a
  // blanket rule would also swallow /ph paths that correctly 404 today, which is
  // the /live-job-role catch-all mistake again. The wider /ph cleanup is reported
  // in docs/seo/EXECUTION_SESSIONS.md for a later session to scope properly.
  { source: '/ph/services/filipino-developers', destination: '/services/philippines-developers', permanent: true },
  { source: '/ph/services/philippines-developers', destination: '/services/philippines-developers', permanent: true },

  // DELIBERATE DIVERGENCE FROM LIVE - Jake, 3 Aug 2026.
  //
  // /customer-story/virgin returns 200 on Webflow, but the page has no story on
  // it: the body reads "Customer story in progress... We haven't yet had a chance
  // to write up this particular story." It is a thin page with an optimised title
  // and nothing behind it, on both sites. Rather than carry it across, it goes to
  // the hub, which is where its own body already tells visitors to go.
  //
  // A 301 rather than a 404 because it is a live indexed URL, and the hub is the
  // honest destination. Recorded in parity-exceptions.json.
  { source: '/customer-story/virgin', destination: '/customer-stories', permanent: true },
  { source: '/uk/customer-story/virgin', destination: '/uk/customer-stories', permanent: true },

  { source: '/sourcing', destination: '/how-it-works', permanent: true },
  { source: '/embedding', destination: '/how-it-works', permanent: true },
  { source: '/retention', destination: '/how-it-works', permanent: true },
  { source: '/scale-this-week', destination: '/', permanent: true },
  { source: '/uk/sourcing', destination: '/uk/how-it-works', permanent: true },
  { source: '/uk/embedding', destination: '/uk/how-it-works', permanent: true },
  { source: '/uk/retention', destination: '/uk/how-it-works', permanent: true },
  { source: '/uk/scale-this-week', destination: '/uk', permanent: true },
]
