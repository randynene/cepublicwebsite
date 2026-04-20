# CLAUDE.md — Mygratr

> Read this file first. Every session. No exceptions.
> If this file is getting long, see REGISTRY.md for route/component/table lists.

## What Mygratr Is

Automated website migration platform. Takes a production website on a
legacy CMS (Webflow first, then WordPress/Squarespace/Wix) and rebuilds
it on Next.js + Sanity through a six-phase agentic pipeline:
Audit → Schema → Scaffold → Content → Build → QA → Launch.

Parent brand: Saxon.io. Owner: Jake Hall (non-developer, directs Claude Code).

## Current Phase

**MYGRATR-0 — Foundation** — COMPLETE
**Next: MYGRATR-AUDIT-1** — Site Audit Agent

## First Customer: Cloud Employee

- Source: Webflow (cloudemployee.io)
- Target: Next.js + Sanity, hosted on Vercel
- Staging: staging.jakevibes.dev
- Locales: US (default) + UK (/uk/ prefix)
- PH locale: discontinued — Geotargetly routes to talent.cloudemployee.io
- Pages: 522 indexable (sitemap.xml)
- Crawled URLs: 643 total including pagination/archives/locale mirrors
- CMS Collections: 33
- CMS Items: 435 total
- Forms: 25 (HubSpot — decision pending)
- Custom code: to be inventoried via Firecrawl in MYGRATR-AUDIT-1

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Runtime | Node.js |
| Database | Supabase (mygratr, Singapore) |
| Target CMS | Sanity |
| Generated sites | Next.js 16 + Tailwind |
| Hosting | Vercel |
| QA Agent | Playwright + pixelmatch + Claude vision |
| Source readers | Webflow API v2 + Firecrawl |

## Supabase

- Project: mygratr
- URL: https://xpzrhzfzppypxbipvyzm.supabase.co
- Region: ap-southeast-1 (Singapore)
- RLS: enabled on all tables
- org_id on every table

## Cloud Employee IDs (Seeded)

- org_id:       ce000000-0000-0000-0000-000000000001
- migration_id: ce000000-0000-0000-0000-000000000002

## Environment Variables

| Variable | Description |
|---|---|
| WEBFLOW_API_TOKEN | Webflow read-only API token |
| WEBFLOW_SITE_ID | 673326831abed6267051fa11 |
| SUPABASE_URL | https://xpzrhzfzppypxbipvyzm.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | In .env — never commit |
| FIRECRAWL_API_KEY | In .env — never commit |
| ANTHROPIC_API_KEY | In .env — add when needed |

## Repo Structure

| Path | Purpose |
|---|---|
| /CLAUDE.md | This file — read first |
| /CONVENTIONS.md | Code patterns and naming rules |
| /CHANGELOG.md | One paragraph per completed phase |
| /SCHEMA.md | Database schema source of truth |
| /FEATURE_MAP.md | Feature → file mapping |
| /PHASE_HISTORY.md | Detailed phase records |
| /REGISTRY.md | Growing lists — tables, routes, templates |
| /briefs/active/ | Current session brief |
| /briefs/archive/ | Completed session briefs |
| /audit-output/ | Audit artefacts (JSON, screenshots) |
| /scripts/ | One-off run scripts |
| /src/orchestrator/ | Job runner and phase orchestration |
| /src/adapters/webflow/ | WebflowAdapter |
| /src/lib/types.ts | Shared TypeScript interfaces |

## Key Conventions

- TypeScript strict mode — no any types
- Zod for all external data validation
- Every Supabase query includes org_id filter
- RLS always on — service role only for migrations and admin scripts
- Git commit after every working step
- See CONVENTIONS.md for full patterns
- See REGISTRY.md for all tables, templates, and routes
