# Mygratr - Engineer Onboarding

Written for a senior engineer joining cold. Everything here was verified against the code on branch `feat/design-1` (Jul 2026). Where the code could not tell me the answer, it says **⚠️ UNCERTAIN** rather than guessing.

Read `CLAUDE.md` too, but read it *after* this. `CLAUDE.md` is a phase log and it describes some things that are designed but not built.

---

## 1. What this does

Mygratr rebuilds a company's marketing website off a legacy CMS (Webflow) onto Next.js + Sanity without losing its search rankings. It is pitched as a productisable six-phase pipeline (Audit, Schema, Scaffold, Content, Build, QA, Launch), but in practice it is a toolkit of TypeScript scripts that a developer runs by hand, plus the actual rebuilt website. There is exactly one customer: Cloud Employee (`cloudemployee.io`), a UK/US offshore-engineering firm. Roughly 388 CMS documents have been migrated out of Webflow into Sanity, the new Next.js site is largely built and deployed to a staging domain, and the project has not yet cut over: `cloudemployee.io` is still served by Webflow today.

The single most useful framing: **the database schema and the state machine describe a multi-tenant, automated migration SaaS. The code is a single-tenant, manually-driven toolkit that has finished 4 of 7 phases for one customer.** If you take `docs/SCHEMA.md` and `src/lib/pipeline/state-machine.ts` at face value, you will badly mis-model this system.

---

## 2. Architecture

Three independent packages in one Git repo. There are **no npm workspaces and no monorepo tool**; each package has its own `package.json` and its own `node_modules`, and you install each one separately.

```
Mygratr/
├── site/      Next.js 16 + React 19 + Tailwind v4   -> the public website (deployed to Vercel)
├── studio/    Sanity Studio v5                       -> the CMS admin UI (deployed to Sanity's hosting)
├── src/       Pipeline libraries (Supabase, Webflow, Sanity write client)
├── scripts/   ~200 one-shot scripts, run by hand with tsx
├── data/      Tracked inputs: Webflow redirect CSV, live-behaviour snapshot, parity exceptions
└── docs/      Design docs, briefs, phase history, capability log
```

**How they fit together.** `scripts/` reads from the Webflow API and the live website, writes content into Sanity, and records progress in Supabase. `studio/` defines the Sanity schema and gives editors a UI. `site/` reads from Sanity at build and request time and serves the public website. Supabase is **only** touched by the pipeline scripts; neither `site/` nor `studio/` ever talks to it.

**Import isolation is enforced and matters.** Vercel builds with root directory `site/`, so anything outside `site/` is invisible at build time. `site/` must never import from `src/` (the Sanity Zod types are deliberately duplicated into `site/src/types/sanity/`). `next.config.ts` must never import from `audit-output/`, which is gitignored and absent on the build server. The `@/*` path alias means `site/src/*` inside `site/` and `src/*` at the repo root, so the same import string resolves to different files depending on where you are.

**Vercel deployment.** There is **no `vercel.json` anywhere in the repo** and no `.vercel/` directory committed, so every Vercel setting lives in the dashboard. From the docs and code comments, there are two Vercel projects, both pointed at this same Git repo:

| Project | Root directory | Framework preset | Notes |
|---|---|---|---|
| Main app | `site` | Next.js | Currently serves `staging.jakevibes.dev`. Preview-protected. |
| Storybook | `site` | **Other** (deliberately not Next.js, or `next build` would replace `storybook build`) | Build command `npm run build-storybook`, output `storybook-static`. Standard Deployment Protection on. Runbook at `docs/design/storybook-deploy.md`. |

A crucial and counter-intuitive fact, documented at length in `site/src/app/robots.ts`: **`staging.jakevibes.dev` *is* the Vercel "production" deployment.** Vercel calls whatever the main branch deploys to "production", regardless of what the domain means to you. So `VERCEL_ENV === 'production'` does not mean "the real website", and any logic that assumes it does is a bug. Indexing is instead gated on `NEXT_PUBLIC_CANONICAL_HOST` (see §9).

The Sanity Studio does **not** deploy to Vercel. It deploys to Sanity's own hosting at `https://mygratr-cloudemployee.sanity.studio/` via `npm run deploy` from `studio/` (the app ID is pinned in `studio/sanity.cli.ts`).

---

## 3. Data model

### 3.1 Sanity (the real content model)

- **Project `lzbhll1u`, dataset `production`.** That is the only dataset that exists anywhere in the code. There is no dev, staging, or preview dataset, so **local development reads and writes the same content as the live Studio.** ⚠️ UNCERTAIN whether a second dataset exists in the Sanity dashboard but is simply unused; nothing in the repo references one.
- Schema source of truth: `studio/schemas/`. The site re-declares the same shapes as Zod validators in `site/src/types/sanity/` (deliberate duplication, not a shared package).

**22 collection document types** (`studio/schemas/documents/`):

`blogPost`, `compareBlog` (the "Cloud Employee vs X" articles), `customerStory`, `service`, `technology`, `teamMember`, `review`, `video`, `download` (gated lead magnets), `downloadAccess` (the private thank-you pages), `tool`, `event`, `bookACall` (per-rep Calendly pages), `glassdoorReview`, `benefitValue`, `staffBenefit`, `tag`, `blogCategory`, `startHiringStep` (the sign-up funnel), and `industry` / `persona` / `location` (three AI-search landing-page types built from a shared factory).

**36 singletons + 3 globals** (`studio/schemas/singletons/`, `studio/schemas/globals/`). Singletons cover every non-collection page: the 7 blog hubs, 4 resource hubs, 5 collection index pages, 18 static pages (`homePage`, `aboutUsPage`, `pricingPage`, `notFoundPage`, the legal pages, and so on), and 2 calculator pages. The 3 globals are `navigation` (including the mega-menus), `footer`, and `siteSettings`. `homePage` and `howItWorksPage` are bespoke section-by-section schemas; the rest are generated by factories in `studio/schemas/singletons/_factories.ts`.

Singletons are enforced in two places in `studio/sanity.config.ts`: creation templates are filtered out, and the `duplicate` / `delete` document actions are stripped. **A singleton's document `_id` is literally its type name** (`homePage`, `siteSettings`, and so on), set by `S.document().documentId(t)` in `studio/schemas/structure.ts`. Any seed script or GROQ query that assumes a different `_id` will silently create an orphan.

**Key reference edges** (document to document):

| From | Field | To |
|---|---|---|
| `blogPost` | `category` (required) | `blogCategory` |
| `blogPost`, `compareBlog` | `author` (required) | `teamMember` |
| `blogPost`, `compareBlog`, `video`, `download`, `tool`, `event` | `tags` | `tag`, each filtered to a specific `tag.category` |
| `event` | `speakers` | `teamMember` |
| `service` | `associatedTechnologies` | `technology` |

Plus: every hub singleton has a `featuredArticles` / `featuredItems` reference array (max 2) into its collection; the static-page `sections[]` objects reach `review`, `benefitValue`, `staffBenefit`, `glassdoorReview`, and `customerStory`; and `navigation`'s mega-menus hold the schema's only true union references, four arrays of `[service, technology]`, plus `featuredPosts -> blogPost` and `featuredStories -> customerStory`.

**Shared field factories** live in `studio/schemas/_shared.ts` and are worth learning before you touch any schema: `metaFields()` (which imposes a **required 140-to-160-character `metaDescription`** on roughly 30 types), `imageField()`, `slugField()`, `localeField()`, `sourceTrackingFields()`, and `retiredField()`.

**Portable Text** (`studio/schemas/objects/portable-text.ts`) carries two custom block types beyond the usual: `videoEmbed` and `table`. Both exist because Webflow ships free-form HTML inside embed wrappers that the standard HTML-to-Portable-Text converter silently drops; recovering them was its own migration phase.

**Localisation is a flat discriminator, not a plugin.** There is no `@sanity/document-internationalization`. **One document serves both locales.** `/team/jane` and `/uk/team/jane` render the *same* Sanity document; the routes differ, the content does not. Two booleans handle the exceptions:
- `retired: true` means "do not route, do not list, do not put in the sitemap" (35 documents were deleted upstream in Webflow after the migration ran; the documents survive so an accidental deletion is reversible with a Studio toggle).
- `ukOnly: true` means the document renders under `/uk/` and 404s on the default locale. Exactly one `teamMember` needs this, because Webflow publishes per-locale and she was unpublished in the US but not the UK.

### 3.2 Supabase (pipeline bookkeeping only)

Project `mygratr`, region Singapore. **Nothing user-facing touches it.** It records the state of the migration itself.

10 tables (`docs/SCHEMA.md`): `organisations`, `migrations` (the row the state machine advances), `audit_manifests`, `schema_designs`, `content_migrations` (per-collection parity scores), `template_builds`, `qa_runs`, `redirects`, `launches`.

**Only 4 of those are ever read or written by code**: `migrations`, `content_migrations`, `audit_manifests`, `schema_designs`. `template_builds`, `qa_runs`, `redirects`, and `launches` exist in Postgres and have never been touched, because the phases that would write them have not run.

There is **no `supabase/` directory, no `migrations/` folder, and not a single `.sql` file in the repo.** All DDL lives as an array of raw SQL strings in `scripts/run-migrations.js`, which is not exposed as an npm script. It is idempotent but it is not a migration system: no version table, no up/down. Later schema changes were applied **by hand in the Supabase SQL editor**, because direct Postgres access from scripts has been broken since early on (Tech Debt #12; `SUPABASE_DB_URL` fails auth against the pooler).

### 3.3 Multi-tenancy: shaped for it, single-tenant in fact

The schema looks multi-tenant. Every table carries `org_id` with a cascade FK and an index; there is a `plan` / `tier` enum for `internal` / `guided` / `dfy`; `CONVENTIONS.md` insists that every query filters on `org_id`. It was clearly designed for a future product that migrates other people's websites.

As built, it is single-tenant:

- **RLS is enabled on all 10 tables and there are zero policies.** The only `CREATE POLICY` text in the repo is an illustrative snippet in `CONVENTIONS.md`; it is documentation, not executed SQL. Enabled-with-no-policies means deny-all to anon and authenticated roles, and the service-role key bypasses RLS entirely. `src/lib/supabase.ts` only ever builds a service-role client. So RLS currently provides no tenant isolation at all: it is a closed door with no lock, and every caller holds the master key.
- **The org and migration UUIDs are hardcoded as copy-pasted module constants in roughly 40 files** (`ce000000-0000-0000-0000-000000000001` / `...002`). There is one org row and one migration row.
- The delivered website is likewise **single-site**: one Sanity dataset, one Vercel project, and Cloud Employee's script IDs, portal IDs, and domains sit as literal constants in `site/src/components/third-party-scripts.tsx`.

Turning on real multi-tenancy would mean writing the RLS policies, replacing those constants with config, and introducing a non-service-role client. None of that exists.

---

## 4. Auth model

**The public website has no authentication of any kind.** There is no login, no session, no user table, no protected route. `site/src/middleware.ts` exists but only sets an `x-pathname` header so the layout can derive the locale. The only things standing between the internet and the site are Vercel's Deployment Protection (dashboard-side) and the fact that `/demo` and the legal-preview route call `notFound()` when `NODE_ENV === 'production'`.

**Sanity Studio** uses Sanity's own hosted authentication (Google / GitHub / email). Who can log in, and with what role, is managed entirely in the Sanity dashboard at `sanity.io/manage`. **None of that is in this repo** and you cannot see it from the code.

**Draft mode / Presentation (the one real auth surface in `site/`).** Two route handlers, and they are the most security-sensitive code in the project:

- `GET /api/draft-mode/enable` runs a strict, order-dependent sequence, and the comments say in capitals not to reorder it: build an Origin/Referer allow-list from `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_SANITY_STUDIO_URL` → check the request against it (403 on failure) → validate the Sanity preview secret via `@sanity/preview-url-secret` (401 on failure) → confirm the redirect target is same-origin (400 on failure) → *only then* call `draftMode().enable()` → redirect. `draftMode().enable()` must be the last operation before the redirect, so that no failure path can ever emit a `Set-Cookie`.
  There is one escape hatch: Sanity's iframe sometimes sends neither `Origin` nor `Referer`, so a request with both absent is let past the allow-list **only** if the URL carries all three Sanity preview query params. The comments are explicit that this is a forgeable pre-filter, not a security boundary; the secret is the actual gate.
- `POST /api/draft-mode/disable` has no secret to check, so its CSRF barrier is a dual **Origin AND Referer** check (both must be present and both allow-listed).

**Tokens.** `SANITY_API_READ_TOKEN` is a **viewer-scoped** token used three ways: as `serverToken` and `browserToken` on `defineLive`, and as the token on the preview-validation client. `browserToken` is only shipped to the browser in draft mode, which is behind the secret-gated enable route. It is never a write token. Content writes use a separate least-privilege `SANITY_MIGRATION_WRITE_TOKEN` (single dataset, patch/delete/asset-upload only), and `src/lib/env.ts` will **throw if `SANITY_API_READ_TOKEN` is present in a migration script's process**, on the theory that its presence proves the script is running in the wrong context.

---

## 5. External dependencies

**Services with credentials:**

| Service | Used for | Env var |
|---|---|---|
| Sanity | Target CMS, plus hosting for the Studio | `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` (legacy, seed scripts only), `SANITY_MIGRATION_WRITE_TOKEN`, `SANITY_API_READ_TOKEN` |
| Vercel | Hosting for the site and Storybook | (dashboard) |
| Supabase | Pipeline state | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` |
| Webflow API v2 | Source CMS, read-only | `WEBFLOW_API_TOKEN`, `WEBFLOW_SITE_ID` |
| Firecrawl | Crawling and content extraction during audit | `FIRECRAWL_API_KEY` |
| Anthropic API | Two audit scripts only (interaction inventory, template classifier) | `ANTHROPIC_API_KEY` |
| HubSpot | Forms and tracking; portal `22809822` | `HUBSPOT_ACCESS_TOKEN`, `HUBSPOT_PORTAL_ID`, `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` |
| Ahrefs | SEO baseline snapshot | `AHREFS_API_KEY` (⚠️ the CE domain is not on the current Ahrefs plan, so the baseline is empty; Tech Debt #4) |

**Third-party scripts loaded on every page** (`site/src/components/third-party-scripts.tsx`; all IDs are hardcoded constants sourced from the audit output, not env vars): GeoTargetly (geo redirect, `beforeInteractive`), Google Tag Manager `GTM-WL45TCTW`, GA4 `G-2Q22ZM5PLY` (**fires through GTM; never add a separate tag**), LinkedIn Insight `4901289`, Clara chat widget, Hotjar `4985481`, Facebook Pixel, HubSpot tracking, GSAP, Swiper, Finsweet Attributes v2, and Calendly (loaded globally, with a TODO to scope it to the book-a-call pages). Vector Tag, Ahrefs Analytics, and Cloudflare Insights were deliberately not migrated.

**Notable libraries.** Site: `next@16.2.4`, `react@19.2.4`, `next-sanity@12`, `@sanity/client`, `@sanity/visual-editing`, `@portabletext/react`, Radix UI primitives, `react-hook-form` + `zod`, `swiper`, Tailwind v4, Storybook 10. Studio: `sanity@5`, `@sanity/vision`, `styled-components`. Pipeline: `@supabase/supabase-js`, `@sanity/client`, `@sanity/block-tools` (Webflow HTML to Portable Text), `@mendable/firecrawl-js`, `@anthropic-ai/sdk`, `playwright`, `cheerio`, `jsdom`, `pg`, `zod`, `p-limit`, and `pixelmatch` + `pngjs` (**declared but imported by zero files**, left over from the QA agent that was never built).

---

## 6. Background jobs

**There are none. This is a clean negative on every count, and it is the most commonly mis-assumed thing about this repo.**

- No `.github/` directory. No GitHub Actions. No CI of any kind.
- No `vercel.json`, so no Vercel Cron Jobs and no in-repo build hooks.
- No `.husky/`, no git hooks, no lint-staged.
- No webhook handlers. The only two API routes in the entire codebase are the draft-mode enable/disable pair.
- **No Sanity webhook and no revalidation endpoint.** No `export const revalidate`, no `revalidateTag`, no `revalidatePath`, no cron, anywhere in `site/`.

Every phase, every migration, every verification gate is invoked by a developer typing `npm run …` in a shell. A reader who sees the words "pipeline", "orchestrator", and "state machine" will reasonably assume something runs it on a schedule. Nothing does. (`src/orchestrator/` contains a single `.gitkeep`.)

The only live mechanism is `<SanityLive />`, mounted unconditionally in the root layout, which keeps published content flowing into already-rendered pages. See §8.

⚠️ **UNCERTAIN:** whether a Vercel Deploy Hook is wired up on the Sanity side (Sanity's dashboard can call a deploy-hook URL on publish). Nothing in the repo configures one, and I cannot see the Sanity or Vercel dashboards. Confirm this before you assume publishing a brand-new document will ever update the sitemap.

---

## 7. How to run it locally

Node 22. Three separate installs, because there are no workspaces.

```bash
# 1. Pipeline / scripts (repo root)
npm install

# 2. The website
cd site && npm install

# 3. The CMS
cd studio && npm install
```

**Two env files, and they are deliberately not interchangeable.**

`/.env` at the repo root, for the pipeline scripts. Copy from the tracked `.env.example`. Variable **names** only:

```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID
FIRECRAWL_API_KEY, ANTHROPIC_API_KEY
HUBSPOT_ACCESS_TOKEN, HUBSPOT_PORTAL_ID, AHREFS_API_KEY
SANITY_PROJECT_ID, SANITY_DATASET
SANITY_API_TOKEN                  # legacy, seed scripts only
SANITY_MIGRATION_WRITE_TOKEN      # every migration script
```

**`SANITY_API_READ_TOKEN` must NOT appear in the root `.env`.** Its presence makes every migration script throw on startup, on purpose.

`/site/.env.local`, for the Next.js app. Copy from the tracked `site/.env.local.example`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID     # required
NEXT_PUBLIC_SANITY_DATASET        # required
NEXT_PUBLIC_SITE_URL              # required, must parse as a URL
NEXT_PUBLIC_SANITY_STUDIO_URL     # optional in dev only; required on Vercel
SANITY_API_READ_TOKEN             # required, viewer-scoped
NEXT_PUBLIC_HUBSPOT_PORTAL_ID     # optional
NEXT_PUBLIC_FALLBACK_EMAIL        # optional
```

Two more are read straight from `process.env` and are **not** in `env.ts` or either example file, which makes them easy to miss: `NEXT_PUBLIC_CANONICAL_HOST` (controls indexing, see §9) and `SANITY_STEGA_ENABLED` (set to `1` to get click-to-edit overlays in local dev).

**Run:**

```bash
cd site   && npm run dev          # http://localhost:3000
cd studio && npm run dev          # http://localhost:3333
cd site   && npm run storybook    # http://localhost:6006
```

`site/src/lib/env.ts` parses its Zod schema **at module load**, so a missing or malformed variable is a hard startup failure, not a runtime surprise. That is intentional.

Remember there is only one Sanity dataset. **Your local Studio is editing production content.**

---

## 8. Deploy flow

**Code to production.** Push to the Git remote (`github.com/galaxyfunk/mygratr`); Vercel's Git integration builds from root directory `site/`. That is the whole pipeline; there is no CI gate, no test run, no typecheck in between. The main-branch deployment currently serves `staging.jakevibes.dev`. ⚠️ UNCERTAIN which branch Vercel treats as production and how preview branches map to environments; that is dashboard configuration. Work is currently on `feat/design-1`, which is many commits ahead of `main`.

**Studio to production.** Manual: `cd studio && npm run deploy` (`sanity deploy`). Nobody deploys it for you.

**Sanity content publishing to the website.** This is subtler than "publishing triggers a build", and the distinction matters:

- **Edits to content on pages that already exist appear without a rebuild.** `site/src/lib/sanity/live.ts` wraps `defineLive`, and `<SanityLive />` in the root layout subscribes to Sanity's Live Content API and revalidates the tagged fetches behind `sanityFetch`. Every page query goes through `sanityFetch`, so an editor changing a headline sees it on the site without anyone touching Vercel.
- **Brand-new documents get a page on demand.** The 26 detail routes export `generateStaticParams` but never set `dynamicParams = false`, so a slug that was not known at build time is rendered on first request and cached. A new blog post is reachable at its URL without a rebuild.
- **But the sitemap and the redirects do not update.** `site/src/app/sitemap.ts` deliberately uses the bare `sanityClient` rather than `sanityFetch` ("build-time evaluation only"), and there is no `revalidate` export anywhere in the app. So a newly published document is live at its URL but **absent from `/sitemap.xml` until the next deploy.** Redirects are compiled into `next.config.ts` and are likewise frozen until a deploy.

So: **content edits are live; the SEO surface around them is not.** ⚠️ UNCERTAIN whether a Sanity-to-Vercel deploy hook papers over this in the dashboards. If it does not, a periodic rebuild is a real launch requirement, and I would treat it as an open question for whoever owns the cutover.

---

## 9. Fragile and non-obvious parts

Ordered roughly by how easily a new developer would break them.

1. **`!(retired == true)`, never `!retired`.** In GROQ, `!undefined` is not `true`, and the `retired` field is undefined on every document that predates it. Writing the intuitive `!retired` silently excludes the entire back catalogue. The predicate is centralised as `NOT_RETIRED` in `site/src/lib/sanity/queries/_filters.ts` and belongs in three places per document type: the detail query, the metadata query, and the params query feeding `generateStaticParams`. The same file holds `VISIBLE_IN_LOCALE` for the `ukOnly` case.

2. **`NEXT_PUBLIC_CANONICAL_HOST` is the only thing keeping staging out of Google.** `robots.ts` returns `Disallow: /` unless this variable exactly equals the host of `NEXT_PUBLIC_SITE_URL`. Indexing is opt-in by hostname precisely because `VERCEL_ENV === 'production'` is a lie here (staging *is* Vercel production). Set this variable on a second deployment and you hand Google a complete indexable duplicate of the customer's website, which is one of the classic ways to lose a migration and very hard to undo. `npm run launch:verify-noindex` exists to police it.

3. **The redirect files are generated. Hand-edits are destroyed.** `site/src/lib/redirects/*.ts` (669 rules across four files) is regenerated by `npm run redirects:extract` and `npm run redirects:job-roles`. Someone previously hand-patched a regex in the generated file and lost it on the next run. `next.config.ts` also carries a small `lockedRules` array of hand-written redirects; that one is safe to edit, and every rule in it is verified against `data/webflow/live-behaviour.json` and heavily commented explaining *why*. Do not add a redirect there without checking the live site first: three rules in an earlier version would have 301'd away three live, ranking pages at cutover.

4. **Never set `SANITY_STEGA_ENABLED=1` on the production environment.** Stega injects invisible metadata into strings for click-to-edit. On production it would leak into the served HTML. `client.ts` has a raw-env guard that force-disables it and warns rather than throwing, because a module-scope throw there would take down every page render.

5. **Stega breaks `z.enum`.** Draft/Presentation mode adds invisible characters to strings, which makes strict Zod enum parses 500. Use `stegaEnum()` from `site/src/lib/sanity/stega-enum.ts` for any enum you validate; leave display strings alone so the overlays still work. This one cost a debugging session already.

6. **`metaDescription` is required and hard-bounded to 140-160 characters** on roughly 30 document types via `metaFields()`. A document whose description falls outside that window cannot be saved in Studio. Editors will hit this.

7. **The migration scripts read the *staged* Webflow endpoint, knowingly.** `src/lib/content/webflow-read-client.ts` documents that `/items` diverges from live in both directions (it carries deleted items, and it marks items as `isDraft` that are in fact serving) and that `/items/live` is authoritative for parity work. The ~24 content migrators still use the staged endpoint, and the comment says explicitly: **do not repoint them without re-verifying their counts.**

8. **Two `node_modules` trees and an overloaded `@/` alias.** Running `npm install` at the root does nothing for the site. `@/lib/env` means two different files depending on directory.

9. **A custom ESLint rule bans string literals in JSX.** All user-facing copy goes through `site/src/lib/ui-strings.ts`, which is **generated** from `tools/eslint/ui-strings.json` by `npm run generate-ui-strings`. Do not edit the generated file.

10. **No em dashes or en dashes, anywhere.** Code, copy, content, comments, docs. It is a hard project rule and it is enforced socially, not mechanically.

11. **`src/lib/types.ts` exports a legacy `MigrationStatus` enum with different values from the real one** in `src/lib/pipeline/state-machine.ts`. Same name, different shape. Import from the state machine.

12. **The `reveal` scroll animation throws a hydration warning** on every page (`site/src/components/motion/reveal.tsx`). It is dev-console-only and pre-existing (Tech Debt #57). Do not go hunting for it thinking you caused it.

13. Smaller ones: Swiper is loaded twice (npm dependency v12 *and* a CDN v11 script tag); `site/src/app/uk/[...slug]/page.tsx` is a scaffold placeholder that unconditionally 404s and will shadow future UK routes; there is a live TODO in `next.config.ts` to return HTTP 410 for `/archive/old-home`, which `redirects()` cannot express; and the repo has **no README and no test suite** (root `npm test` is the npm stub that exits 1).

---

## 10. What you cannot see from the code

Assume all of the following was done by hand in someone's browser and is not reproducible from this repo.

- **The Supabase schema.** There are no SQL migration files. The initial DDL is a JS string array in `scripts/run-migrations.js`; every change since was typed into the Supabase SQL editor, because direct Postgres access from scripts has been broken for months. **There is no way to rebuild the database from the repo.** The RLS policies that `CONVENTIONS.md` describes were never written.
- **Everything about Vercel.** No `vercel.json`. Root directory, build commands, branch-to-environment mapping, all environment variable *values*, domain assignment, and Deployment Protection settings exist only in the dashboard.
- **Everything about the Sanity project.** Who has Studio access and with what role, the API tokens and their scopes, the CORS origin allow-list (the site's draft-mode flow depends on it), and any webhooks or deploy hooks. The Studio's hosted URL and app ID are pinned in `sanity.cli.ts`, but nothing else is.
- **⚠️ UNCERTAIN: whether Sanity publishing is wired to a Vercel deploy hook.** See §8. This is the single most important unknown in this document, because the answer determines whether new content ever reaches the sitemap.
- **DNS.** `staging.jakevibes.dev` today, `cloudemployee.io` at cutover. The cutover itself, the TTL lowering, and the redirect verification against the real domain are all manual and unwritten.
- **The Webflow side.** The source site is still live and **is still being edited**. Content has drifted since the April 2026 snapshot the migration ran against: 35 documents were deleted or unpublished upstream, which is the entire reason the `retired` flag exists. Webflow's own redirect table, its per-locale publishing state, and its custom code are only visible in Webflow's dashboard. Nobody has stopped the customer from editing.
- **HubSpot and GTM.** Form definitions, workflows, and the GTM container's tag configuration all live in those consoles. The site only holds form IDs and a container ID.
- **`audit-output/` is gitignored** (it contains PII) and is absent on the build server, yet it is the source input for the generated redirect files and the third-party script IDs. If you need to regenerate those, you need to re-run the audit, which needs the Webflow and Firecrawl keys.
- **The visual design.** The current redesign is driven by a Figma file (`CE-REDESIGN.fig`, dark theme with a lime accent) and by raw HTML exports under `docs/raw-html/`. The Figma file is the authority and the repo only holds derived tokens.
- **The Storybook Vercel project's settings**, in particular the Framework Preset of `Other`, which is load-bearing: set it to Next.js and the build silently becomes `next build` and Storybook never deploys.
