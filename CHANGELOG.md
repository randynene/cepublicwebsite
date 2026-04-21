# CHANGELOG.md

## MYGRATR-AUDIT-1 — Site Audit Agent (April 2026)
Complete authoritative inventory of cloudemployee.io built and written to
Supabase `audit_manifests`. Fourteen audit scripts run in three chunks:
URL reconciliation from four sources (Screaming Frog + sitemap.xml +
Firecrawl + Webflow redirects) yields 636 canonical URLs (602 indexable,
288 US + 314 UK). Firecrawl deep-extracts 312 US pages to
`audit-output/pages/{slug}/content.json`. Webflow API pulls field
population and EN/EN-GB locale diff for all 33 collections (451 items).
Global components, 608 CDN assets, 44 Playwright screenshots across three
breakpoints, and 17 global third-party scripts (GTM, GA4, LinkedIn
Insight, Clara chat, Hotjar, GeoTargetly, GSAP, Swiper, Finsweet,
Calendly) are inventoried. Three HubSpot forms verified live via Forms
v2 API. Claude Opus 4.7 drives tier-2 interaction analysis on 248
content-complex pages (5560 content-affecting + 2021 cosmetic elements)
and template classification for the 41 URLs rules couldn't match (only
4 remain UNKNOWN — Cloudflare scripts, sitemap.xml, a hash URL, and
`/uk/embedding`). Migration manifest (119 MB) upserted to Supabase;
`migrations.current_phase = audit_complete`. Zero critical anomalies.

## MYGRATR-0 — Foundation (April 2026)
Project foundation established. Repo scaffolded with TypeScript strict mode,
all dependencies installed, Supabase schema live with 10 tables and RLS
enabled on all. CE org and migration seeded with fixed UUIDs. All context
files written at root level. Webflow inventory and Firecrawl sitemap scripts
complete from pre-session work — full CE audit data in audit-output/.
