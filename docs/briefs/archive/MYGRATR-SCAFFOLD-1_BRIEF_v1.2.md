# MYGRATR-SCAFFOLD-1 — Next.js Scaffold
## Session Brief v1.2 (post self-audit)

> **Executor:** Claude Code
> **Planner sign-off:** Jake Hall
> **Preset:** `preset:full` — run cross-model audit before execution
> **Branch:** `feat/scaffold-1` → merge to main on completion
> **State machine transition:** `schema_complete → scaffold_running → scaffold_complete`

---

## 0. READ FIRST

Before writing a single line of code:

1. Read `CLAUDE.md` — confirm `migrations.status = schema_complete` for CE row. If not, STOP.
2. Read `CONVENTIONS.md` — all patterns apply in full.
3. Read `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` — routing table (§10), locale strategy (§7.11), Presentation Tool (§7.12), redirect strategy (§8), third-party scripts (§7.9), forms (§7.10), JSON-LD (§7.6), hreflang (§7.7), canonical tags (§7.8).
4. Note: `CLAUDE.md` phase status table still shows SCHEMA-1 as "Next" — that is a stale entry. Fix it in Step 0a below before touching anything else.

**Architecture rule:** No decisions in this session. Every routing, locale, and structural decision is locked in the design doc. If something is ambiguous, STOP and write the question to `DEBUG_CONTEXT.md` — do not improvise.

**Session lane:** `SCAFFOLD` touches `site/` and `scripts/scaffold/` only. Never touches `/src/lib/adapters/`, other orchestrator scripts, or studio code except where explicitly instructed (Step 7a).

---

## 0a. Update CLAUDE.md (pre-flight)

Update the phase status table in `CLAUDE.md`:

| Phase | Status change |
|---|---|
| MYGRATR-SCHEMA-1 | `✅ Complete` |
| MYGRATR-SCAFFOLD-1 | `🔜 Next` → `🔄 In Progress` |

Also add the following to the Known Tech Debt table (flagged by Claude Code in SCHEMA-1):

| # | Source | Description | Fix In |
|---|---|---|---|
| 10 | SCHEMA-1 | Legacy `MigrationStatus` enum in `src/lib/types.ts` uses shortform values — conflicts with canonical string-literal union in `src/lib/pipeline/state-machine.ts`. Needs consolidation. | MYGRATR-CONTENT-1 |
| 11 | SCHEMA-1 | `TemplateType` conflict between string-literal and enum representations across `src/lib/types.ts` and `src/lib/audit-types.ts`. | MYGRATR-CONTENT-1 |

Commit: `chore(docs): update CLAUDE.md — SCHEMA-1 complete, SCAFFOLD-1 in progress`

---

## 1. Scaffold the Next.js App

Create the `site/` directory in the repo root. This is the CE customer-facing Next.js app. It lives alongside `studio/` (Sanity Studio) and `src/` (orchestrator lib) in the monorepo.

**Do not create a separate repo.** Vercel deploys from the repo root with a root directory override pointing to `site/`.

### 1a. Initialise Next.js

```bash
cd site
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

Accept all defaults. Confirm the version installed is Next.js 15 (App Router). If create-next-app installs 15+, proceed. If it installs 14, upgrade to 15 before continuing.

### 1b. Install dependencies

```bash
# Sanity client + visual editing
npm install next-sanity @sanity/client @sanity/image-url
npm install @sanity/presentation @sanity/visual-editing

# Utilities
npm install clsx tailwind-merge
```

### 1c. TypeScript path alias

Confirm `site/tsconfig.json` has `@/*` pointing to `site/src/*`. It should be set by create-next-app — verify before proceeding.

### 1d. .gitignore

Append to the root `.gitignore` (not `site/.gitignore`):
```
site/.next/
site/node_modules/
```

The `site/` directory itself is tracked. Only its build artefacts are ignored.

Commit: `feat(scaffold): initialise Next.js 15 app at site/`

---

## 2. Sanity Client

### 2a. Environment variables

Add to `site/.env.local` (create if absent):
```
NEXT_PUBLIC_SANITY_PROJECT_ID=lzbhll1u
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=        # fill from .env at root — read-only token
NEXT_PUBLIC_SITE_URL=https://staging.jakevibes.dev
NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333   # Sanity Studio URL for stega click-to-edit
```

Also add these variable names to `site/.env.local.example` with empty values (committed to repo).

### 2b. Sanity client module

Create `site/src/lib/sanity/client.ts`:

```typescript
import 'server-only'
import { createClient } from '@sanity/client'
import { env } from '@/lib/env'

// Stega must only be enabled on actual preview deployments — not just any
// non-production environment. Both conditions required to prevent stega
// metadata leaking into production on misconfigured deployments.
const isPreviewDeployment =
  process.env.VERCEL_ENV === 'preview' && process.env.NODE_ENV !== 'production'

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: {
    enabled: isPreviewDeployment,
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333',
  },
})

// previewClient: authenticated, no CDN, draft perspective.
// Used for draft-mode/enable secret validation and preview rendering.
// server-only import at top of file prevents accidental client bundle inclusion.
export const previewClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'previewDrafts',
  token: env.SANITY_API_READ_TOKEN,
  stega: { enabled: true, studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333' },
})
```

### 2c. Site-level env validator

Create `site/src/lib/env.ts` — separate from the orchestrator's `src/lib/env.ts`. This validates only the variables the Next.js app needs:

```typescript
import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  // Falls back to NEXT_PUBLIC_VERCEL_URL on preview deployments where
  // NEXT_PUBLIC_SITE_URL is not statically set. Prevents build crashes.
  // Known limitation: both variables may be absent during the build step itself
  // on preview deployments, causing canonical/hreflang URLs to fall back to
  // http://localhost:3000 in the build output. This is acceptable for scaffold
  // phase — CONTENT-1 will enforce NEXT_PUBLIC_SITE_URL in Vercel env settings.
  NEXT_PUBLIC_SITE_URL: z.string().url().catch(() => {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    return vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'
  }),
  SANITY_API_READ_TOKEN: z.string().optional().default(''),
})

export const env = schema.parse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
})
```

### 2d. GROQ query helpers

Create `site/src/lib/sanity/queries.ts`. Stub only — CONTENT-1 and TEMPLATE-* phases will populate this. For now add one verified smoke-test query:

```typescript
import 'server-only'
import { sanityClient } from './client'

export async function getSiteSettings() {
  return sanityClient.fetch(`*[_type == "siteSettings"][0]`)
}
```

Commit: `feat(scaffold): Sanity client, env validator, query stubs`

---

## 3. Locale Routing

CE has two locales: US (default, no prefix) and UK (`/uk/` prefix).
This is NOT Webflow-native localisation — it is a URL prefix convention implemented in Next.js routing.
Do NOT use Next.js's built-in `i18n` config for this. UK pages are a URL prefix pattern, not a framework locale.

### 3a. Locale constants

Create `site/src/lib/locale.ts`:

```typescript
export const LOCALES = ['en-US', 'en-GB'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en-US'

export function getLocaleFromPath(path: string): Locale {
  return path.startsWith('/uk/') || path === '/uk' ? 'en-GB' : 'en-US'
}

export function buildLocalePath(path: string, locale: Locale): string {
  if (locale === 'en-US') return path
  // Guard: only strip /uk if it's actually a locale prefix (startsWith '/uk/' or === '/uk')
  // Avoids corrupting paths like /ukraine/... which also startsWith '/uk'
  const stripped =
    path.startsWith('/uk/')
      ? path.slice(3)
      : path === '/uk'
        ? '/'
        : path
  return `/uk${stripped}`
}
```

### 3b. App Router structure for UK prefix

The UK locale mirror is handled by a catch-all route segment under `/uk/`:

```
site/src/app/
  layout.tsx              ← root layout (applies to all routes)
  page.tsx                ← / (homePage singleton)
  uk/
    layout.tsx            ← UK layout wrapper (passes locale='en-GB' down)
    page.tsx              ← /uk (mirrors /, locale='en-GB')
    [...slug]/
      page.tsx            ← /uk/[...slug] — mirrors all CMS routes
```

Create these files as stubs now. Full template implementations happen in TEMPLATE-* phases.

**Important:** The UK slug catch-all must not shadow individual UK routes. Specific UK static pages (e.g. `/uk/about-us`) are handled by explicit route files, not the catch-all, once TEMPLATE-* builds them. The catch-all is a scaffold placeholder only.

### 3c. Locale context

Create `site/src/components/locale-provider.tsx`:

```typescript
'use client'
import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/locale'

const LocaleContext = createContext<Locale>('en-US')
export const useLocale = () => useContext(LocaleContext)

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}
```

### 3d. Canonical and hreflang helpers

These are locked decisions from the design doc (§7.7, §7.8). Establish the helpers now so every TEMPLATE-* phase uses a consistent implementation — do not let each template solve this independently.

Add to `site/src/lib/locale.ts`:

```typescript
import { env } from '@/lib/env'

// CONTRACT: always pass the canonical US path (no /uk prefix).
// generateCanonical and generateHreflang both normalise defensively,
// but callers should pass the US path for clarity.
// Every page's generateMetadata() must call both functions.

// Generates the canonical URL for a given path + locale.
export function generateCanonical(path: string, locale: Locale): string {
  const base = env.NEXT_PUBLIC_SITE_URL
  // Normalise: strip /uk prefix if caller accidentally passes a UK path
  const usPath = path.startsWith('/uk/')
    ? path.slice(3)
    : path === '/uk' ? '/' : path
  const localePath = locale === 'en-GB' ? `/uk${usPath}` : usPath
  return `${base}${localePath}`
}

// Generates the hreflang alternates object for Next.js metadata.
export function generateHreflang(usPath: string): Record<string, string> {
  const base = env.NEXT_PUBLIC_SITE_URL
  // Normalise: strip /uk prefix if caller accidentally passes a UK path
  const normalisedUsPath = usPath.startsWith('/uk/')
    ? usPath.slice(3)
    : usPath === '/uk' ? '/' : usPath
  return {
    'en-US': `${base}${normalisedUsPath}`,
    'en-GB': `${base}/uk${normalisedUsPath}`,
    'x-default': `${base}${normalisedUsPath}`,
  }
}
```

**Usage contract for TEMPLATE-* phases** — every `generateMetadata()` function must:
```typescript
export async function generateMetadata({ params }) {
  // ...fetch doc...
  return {
    alternates: {
      canonical: generateCanonical(doc.slug, locale),
      languages: generateHreflang(`/${routePrefix}/${doc.slug}`),
    },
  }
}
```

Add this usage contract as a comment block at the top of `locale.ts` so Claude Code in TEMPLATE-* phases sees it immediately.

Commit: `feat(scaffold): locale constants, UK route structure, locale context`

---

## 4. Root Layout — Global `<head>` and Third-Party Scripts

### 4a. Root layout

Create `site/src/app/layout.tsx`. This is the single layout that wraps every page (US and UK).

The root layout must:
- Set `lang="en"` on `<html>` (overridden per-page for UK routes)
- Load all 17 global third-party scripts via Next.js `<Script>` with correct strategies
- Include GeoTargetly script in `<head>` (strategy: `beforeInteractive`)
- Include GTM snippet in `<head>` and `<body>` (strategy: `afterInteractive`)
- Include GA4 script loaded via GTM — **do not add GA4 directly** (GTM fires it)
- Include all other scripts at `strategy="afterInteractive"` unless noted below

**Script loading reference** (from audit — `ce-scripts.json`):

| Script | ID / Key | Strategy |
|---|---|---|
| GeoTargetly | (inline redirect script) | `beforeInteractive` — must fire before render |
| GTM | `GTM-WL45TCTW` | `afterInteractive` — standard GTM snippet |
| LinkedIn Insight | `4901289` | `afterInteractive` |
| Clara chat | workspace `09aa62df-5af6-4cec-b565-c335e907327d` | `afterInteractive` |
| Hotjar | (from audit) | `afterInteractive` |
| Calendly | (widget script) | `lazyOnload` — only needed on BAC pages |
| GSAP | (animation library) | `afterInteractive` |
| Swiper | (slider library) | `afterInteractive` |
| Finsweet | (attribute scripts) | `afterInteractive` |

**Calendly exception:** Calendly is loaded globally in this scaffold for simplicity. TEMPLATE-* phases may optimise to load it only on Book A Call pages.

All script IDs and workspace tokens come from the audit output (`ce-scripts.json` and `ce-global-components.json`). Read these files directly — do not hardcode guessed values.

**Missing ID rule:** If a script ID cannot be found in audit output, the component must return `null` for that specific script — do not render a placeholder or `TODO` value in a `<Script>` tag, as it will execute broken code in production. Pattern:

```tsx
// Read IDs from audit output first, then render conditionally
const gtmId = 'GTM-WL45TCTW' // confirmed from audit
const linkedInId = '4901289'   // confirmed from audit
// For any ID not confirmed: const hotjarId = null

{gtmId && (
  <Script id="gtm" strategy="afterInteractive">
    {`(function(w,d,s,l,i){...})(window,document,'script','dataLayer','${gtmId}')`}
  </Script>
)}
{linkedInId && (
  <Script src={`https://snap.licdn.com/li.lms-analytics/insight.min.js`} strategy="afterInteractive" />
)}
// Unconfirmed IDs: leave a TODO comment in the layout, render nothing
```

### 4b. Fonts

Use `next/font` with Google Fonts. CE uses [**check `ce-global-components.json` for the confirmed font family**]. If the font is not extractable from audit output, use Inter as a safe fallback and leave a `TODO:` comment.

### 4c. Metadata defaults

In `layout.tsx` export a `metadata` object with:
- `metadataBase`: `new URL(env.NEXT_PUBLIC_SITE_URL)`
- `title.default`: `'Cloud Employee'`
- `title.template`: `'%s | Cloud Employee'`
- `robots`: `{ index: true, follow: true }`
- `openGraph.images`: `['/og-default.png']` — fallback OG image for pages that don't specify one

Create `site/public/og-default.png` — Claude Code cannot write valid binary files directly. Use this script pattern to generate a valid 1×1 pixel PNG placeholder:

```typescript
// Run inline or as a one-off script
import fs from 'fs'
// Minimal valid 1×1 transparent PNG (base64)
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
fs.writeFileSync('site/public/og-default.png', Buffer.from(PNG_1X1, 'base64'))
```

Seb replaces this with the real 1200×630 brand OG image before launch.

**OG override convention for TEMPLATE-* phases:** Any `generateMetadata()` that has an `openGraphImage` field from Sanity should override the fallback. The pattern:
```typescript
openGraph: {
  images: doc.openGraphImage
    ? [urlFor(doc.openGraphImage).width(1200).height(630).url()]
    : ['/og-default.png'],
}
```
Add this as a comment in `layout.tsx` so TEMPLATE-* phases inherit the pattern.

### 4d. robots.txt

Create `site/src/app/robots.ts`:

```typescript
import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/download-thank-you/'],  // gated pages — noindex per design doc §10
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

### 4e. sitemap.xml

Create `site/src/app/sitemap.ts`. Scaffold phase: returns the seeded singleton stubs only. CONTENT-1 expands this to include all CMS documents.

```typescript
import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
// Note: sanityClient intentionally omitted from scaffold stub.
// Add it in CONTENT-1 when the full document query is implemented.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL

  // Scaffold stub — returns homepage only until CONTENT-1 populates Sanity.
  // CONTENT-1 expands this to fetch all published CMS documents and singletons.
  // TODO(CONTENT-1): replace with full document query across all 21 CMS types + singletons.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/uk/`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  return staticRoutes
}
```

Commit: `feat(scaffold): root layout, global scripts, fonts, metadata defaults, OG fallback, robots.txt, sitemap stub`

---

## 5. Global Nav and Footer — Stub Components

Full nav and footer implementation happens in TEMPLATE-* phases. Scaffold stubs now so the layout compiles.

**Tech Debt #5 reminder:** `ce-global-components.json` has the nav Technology dropdown merged into Services due to a selector issue in AUDIT-1. Do not treat the merged nav as authoritative for link structure. The final nav is built from `navigation` Sanity global in TEMPLATE-*.

### 5a. Nav stub

Create `site/src/components/layout/nav.tsx`:
- Server component
- Fetches `navigation` singleton from Sanity via `getSiteSettings()` stub
- **Must null-check the result** — Sanity returns `null` if the document doesn't exist yet. Never destructure or access properties without a null guard:
```tsx
const settings = await getSiteSettings()
if (!settings) return <nav aria-label="Main navigation">{/* TODO: TEMPLATE-* */}</nav>
```
- Renders a placeholder `<nav>` with a `TODO:` comment referencing TEMPLATE-* phase

### 5b. Footer stub

Create `site/src/components/layout/footer.tsx`:
- Same null-check pattern as nav stub:
```tsx
const settings = await getSiteSettings()
if (!settings) return <footer>{/* TODO: TEMPLATE-* */}</footer>
```
- Fetches `footer` singleton
- Renders placeholder `<footer>`

### 5c. Wire into layout

Import both into `site/src/app/layout.tsx`. Root layout renders `<Nav />` and `<Footer />` wrapping `{children}`.

Commit: `feat(scaffold): nav and footer stub components`

---

## 6. Redirects — next.config.js

Redirects are locked in `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md §8` and in `docs/investigations-2026-04-23/redirects-verification.md`. Do not re-derive or re-verify them. Implement exactly as locked.

### 6a. Sources

Three sources, all already verified:
1. `audit-output/ce-regex-redirects.json` — 11 Webflow regex redirects
2. `audit-output/ce-canonical-urls.json` — 30 crawl-discovered redirects (filter where `status = 301` or `302`)
3. `docs/investigations-2026-04-23/redirects-verification.md` — 317 individual heterogeneous Webflow redirects + 1 catch-all regex for `/live-job-role/*`

### 6b. Additional locked rules (from §8)

```
/live-job-role/:path* → https://talent.cloudemployee.io/live-job-role/:path* (301)
/team → /about-us (301)
/our-work → /customer-stories (301)
/alternatives → /compare (301)
/archive/old-home → 410 Gone
/uk/archive/old-home → 410 Gone
```

### 6c. Pre-build extraction script (run once, before next.config.ts)

**Critical:** `audit-output/` is gitignored and will not exist on Vercel's build server. `next.config.ts` must never import directly from `audit-output/`. Instead, run a one-time extraction script that reads from `audit-output/` and writes the redirect data into a tracked file inside `site/`.

Create `scripts/scaffold/extract-redirects.ts`:

```typescript
import fs from 'fs'
import path from 'path'
import type { CanonicalUrl } from '../../src/lib/audit-types'

const canonicalUrls: CanonicalUrl[] = JSON.parse(
  fs.readFileSync('audit-output/ce-canonical-urls.json', 'utf-8')
)

// Use the correct CanonicalUrl field names from src/lib/audit-types.ts
// Field is `status` (UrlStatus enum), not `statusCode` (number)
const crawlRedirects = canonicalUrls
  .filter((u) => u.status === 'REDIRECT_301' || u.status === 'REDIRECT_302')
  .map((u) => ({
    source: u.path,
    destination: u.redirectTarget, // verify exact field name against CanonicalUrl type
    permanent: u.status === 'REDIRECT_301',
  }))

const output = `// AUTO-GENERATED by scripts/scaffold/extract-redirects.ts
// Do not edit manually. Re-run the script if audit-output/ changes.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const crawlRedirects: Redirect[] = ${JSON.stringify(crawlRedirects, null, 2)}
`

fs.mkdirSync('site/src/lib/redirects', { recursive: true })
fs.writeFileSync('site/src/lib/redirects/generated-redirects.ts', output)
console.log(`Extracted ${crawlRedirects.length} crawl redirects`)
```

Add npm script: `"redirects:extract": "tsx scripts/scaffold/extract-redirects.ts"`

**Run this script first, before writing next.config.ts:**
```bash
npm run redirects:extract
```

Commit the generated file: `site/src/lib/redirects/generated-redirects.ts` is tracked in git.

**Important:** Before running, open `src/lib/audit-types.ts` and confirm the exact field names on `CanonicalUrl` for the redirect target URL. The script uses `u.redirectTarget` as a placeholder — replace with the actual field name if different.

### 6d. next.config.ts

Create `site/next.config.ts` importing only from tracked files:

```typescript
import type { NextConfig } from 'next'
import { crawlRedirects } from './src/lib/redirects/generated-redirects'
import { webflowRedirects } from './src/lib/redirects/webflow-redirects'

const lockedRules = [
  {
    source: '/live-job-role/:path*',
    destination: 'https://talent.cloudemployee.io/live-job-role/:path*',
    permanent: true,
  },
  { source: '/team', destination: '/about-us', permanent: true },
  { source: '/our-work', destination: '/customer-stories', permanent: true },
  { source: '/alternatives', destination: '/compare', permanent: true },
]

const config: NextConfig = {
  async redirects() {
    return [...crawlRedirects, ...webflowRedirects, ...lockedRules]
  },
}

export default config
```

The 317 heterogeneous redirects from `redirects-verification.md` — create `site/src/lib/redirects/webflow-redirects.ts` as follows:

1. Open `docs/investigations-2026-04-23/redirects-verification.md`
2. Extract every redirect entry into a typed array using this pattern:

```typescript
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const webflowRedirects: Redirect[] = [
  { source: '/old-path', destination: '/new-path', permanent: true },
  // ... all 317 entries
]
```

3. Every entry must have `source`, `destination`, and `permanent` (true for 301, false for 302). No other fields.
4. Do not put entries inline in `next.config.ts` — import from this file only.

This file is hand-authored from the verified markdown source, not generated by a script.

**410 Gone for `/archive/old-home` and `/uk/archive/old-home`:** Next.js `redirects()` doesn't natively support 410. Handle these in `site/src/app/[...slug]/page.tsx` — if `slug` matches either path, call `notFound()` which Next.js renders with a 404 by default. Then set a custom 410 status via route segment config:
```typescript
export const dynamic = 'force-dynamic'
// + custom response with status 410 in the page component
```
Leave a `TODO:` comment on this — exact 410 implementation confirmed in TEMPLATE-* STATIC phase.

Commit: `feat(scaffold): next.config.ts with redirects from audit output`

---

## 7. Presentation Tool (Sanity Visual Editing)

Decision D22 from the design doc: `@sanity/presentation` and `@sanity/visual-editing` installed and wired up in SCAFFOLD-1.

### 7a. Studio-side Presentation plugin

In `studio/sanity.config.ts`, add the Presentation plugin:

```typescript
import { presentationTool } from '@sanity/presentation'

// in defineConfig plugins array:
presentationTool({
  previewUrl: {
    previewMode: {
      enable: '/api/draft-mode/enable',
    },
    draftMode: {
      enable: '/api/draft-mode/enable',
    },
  },
})
```

### 7b. Draft mode API route

Create `site/src/app/api/draft-mode/enable/route.ts`:

```typescript
import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { previewClient } from '@/lib/sanity/client'
import { env } from '@/lib/env'

function ensureSanityPreviewToken() {
  if (!env.SANITY_API_READ_TOKEN) {
    throw new Error('SANITY_API_READ_TOKEN is required for preview/draft mode')
  }
}

export async function GET(request: Request) {
  ensureSanityPreviewToken()

  // Use previewClient (authenticated, no CDN) for secret validation — not sanityClient
  const { isValid, redirectTo = '/' } = await validatePreviewUrl(
    previewClient,
    request.url,
  )
  if (!isValid) {
    return new Response('Invalid secret', { status: 401 })
  }

  // F10: validate redirectTo is same-origin before redirecting
  const base = new URL(env.NEXT_PUBLIC_SITE_URL)
  const target = new URL(redirectTo, base)
  if (target.origin !== base.origin) {
    return new Response('Invalid redirect target', { status: 400 })
  }

  ;(await draftMode()).enable()
  redirect(`${target.pathname}${target.search}${target.hash}`)
}
```

Also create `site/src/app/api/draft-mode/disable/route.ts`:

```typescript
import { draftMode } from 'next/headers'
export async function GET() {
  ;(await draftMode()).disable()
  return new Response('Draft mode disabled')
}
```

### 7c. Visual editing enablement

In `site/src/app/layout.tsx`, add:

```typescript
import { VisualEditing } from '@sanity/visual-editing/next-app-router'
import { draftMode } from 'next/headers'

// inside the layout body, after {children}:
{(await draftMode()).isEnabled && <VisualEditing />}
```

### 7d. Sanity Live (Next.js 15 pattern)

`SanityLive` is exported from `next-sanity` (v9+), which is already installed in Step 1b. Do not attempt to install `@sanity/next-sanity-live` — that package does not exist and will fail.

Create `site/src/lib/sanity/live.ts`:

```typescript
// SanityLive is re-exported from next-sanity for consistent import paths
// across the site. Do not import directly from 'next-sanity' in page components.
export { SanityLive } from 'next-sanity'
```

Add `<SanityLive />` to the root layout as a server component — it enables live content updates in preview/draft mode without full page reloads.

Commit: `feat(scaffold): Presentation Tool, draft mode API routes, visual editing`

---

## 8. Smoke Test — Staging Deploy

### 8a. Pre-deploy checks

Run locally before pushing:
```bash
cd site
npm run build
```

Build must pass with zero TypeScript errors and zero ESLint errors. Fix any before continuing.

If the build fails due to missing Sanity types (the Zod types in `src/types/sanity/` are in the orchestrator package, not `site/`), resolve by copying the required Zod types into `site/src/types/sanity/`. Leave a `TODO:` comment: "Consolidate into shared package in CONTENT-1."

**Do not use relative imports outside `site/` (e.g. `../../src/types/sanity`).** Vercel's build environment for a Next.js app with root directory set to `site/` will not compile TypeScript files outside that directory, causing a guaranteed build failure.

### 8b. Transition migration status

Create `scripts/scaffold/start-scaffold-phase.ts`:
- Calls `assertValidTransition('schema_complete', 'scaffold_running')`
- Updates `migrations.status = 'scaffold_running'` and `current_phase = 'scaffold_running'` for CE migration
- Uses `createServerClient()` from `src/lib/supabase.ts`
- Requires `--confirm` flag — must parse `process.argv` and `throw new Error('Missing --confirm flag. Run with --confirm to proceed.')` immediately if absent. **No interactive prompts** (readline, inquirer etc.) — the script must be safe to run in CI.

Add npm script: `"scaffold:start": "tsx scripts/scaffold/start-scaffold-phase.ts"`

Run it: `npm run scaffold:start -- --confirm`

Commit: `feat(scaffold): scaffold phase start script, transition to scaffold_running`

### 8c. Vercel deploy

**Before pushing the branch**, configure the Vercel project root directory. Vercel auto-deploys on push — if the root directory is not set first, the first deployment will target the repo root, fail to find a Next.js app, and crash.

Configure Vercel first:
- Go to Vercel project settings → General → Root Directory
- Set to `site`
- Save

Then push `feat/scaffold-1`. Vercel auto-deploys the preview.

Confirm the preview deploy builds successfully. Check:
- [ ] Build completes without errors
- [ ] `https://{preview-url}/` returns 200 with placeholder layout
- [ ] `https://{preview-url}/uk/` returns 200
- [ ] `https://{preview-url}/team` redirects to `/about-us` (301)
- [ ] `https://{preview-url}/our-work` redirects to `/customer-stories` (301)
- [ ] One redirect from the 317-entry heterogeneous array (pick the first entry from `webflow-redirects.ts`) returns correct destination and 301
- [ ] `https://{preview-url}/live-job-role/some-test-slug` redirects to `https://talent.cloudemployee.io/live-job-role/some-test-slug` (301) — validates the catch-all regex
- [ ] `https://{preview-url}/sitemap.xml` returns 200 with valid XML containing at least the homepage URL
- [ ] `https://{preview-url}/robots.txt` returns 200 and contains `Disallow: /download-thank-you/`
- [ ] GTM script tag present in page source
- [ ] GeoTargetly script present in page source

### 8d. Transition to scaffold_complete

Create `scripts/scaffold/complete-scaffold-phase.ts`:
- Calls `assertValidTransition('scaffold_running', 'scaffold_complete')`
- Updates `migrations.status = 'scaffold_complete'` and `current_phase = 'scaffold_complete'`
- Sets `metadata.scaffold_phase = { completed_at: new Date().toISOString(), vercel_preview_url: '<url>' }`

Add npm script: `"scaffold:complete": "tsx scripts/scaffold/complete-scaffold-phase.ts"`

Run it after all smoke tests pass.

Commit: `feat(scaffold): scaffold phase complete script, transition to scaffold_complete`

---

## 9. Merge and Post-Phase

### 9a. Merge

Merge `feat/scaffold-1` → `main` after smoke tests pass. Squash merge not permitted — preserve commit history.

### 9b. Post-phase context file updates

Follow the post-phase protocol from `CLAUDE.md §Post-Phase Checklist` in exact order:

1. **CHANGELOG.md** — one paragraph: what shipped, key files, data state
2. **PHASE_HISTORY.md** — detailed record: every file created, patterns established, data state after phase, any surprises
3. **CONVENTIONS.md** — add any new patterns established in this phase (Next.js App Router conventions, locale routing pattern, Presentation Tool wiring pattern)
4. **FEATURE_MAP.md** — add `Next.js Scaffold` feature entry with all files, routes, API routes
5. **CLAUDE.md** — update phase status table (SCAFFOLD-1 → ✅ Complete, CONTENT-1 → 🔜 Next), add new env vars to env table, update repo structure table with `site/`
6. **SCHEMA.md** — no migrations ran in this phase; no update needed
7. **REGISTRY.md** — add API routes (`/api/draft-mode/enable`, `/api/draft-mode/disable`), add scaffold scripts

Commit: `chore(docs): post-phase context file updates — SCAFFOLD-1 complete`

---

## Session Outputs (Definition of Done)

- [ ] `site/` Next.js 15 app initialised and committed
- [ ] Sanity client (`sanityClient` + `previewClient`) wired to project `lzbhll1u`
- [ ] `studioUrl` in stega config points to `NEXT_PUBLIC_SANITY_STUDIO_URL` env var
- [ ] Site-level `env.ts` validates all required variables
- [ ] Locale constants, `getLocaleFromPath`, `buildLocalePath`, `generateCanonical`, `generateHreflang` in `site/src/lib/locale.ts`
- [ ] App Router structure: root layout, `/uk/` mirror route stubs
- [ ] Root layout loads all 17 global third-party scripts with correct strategies
- [ ] OG fallback image at `site/public/og-default.png`, override pattern in layout comment
- [ ] `site/src/app/robots.ts` — disallows `/download-thank-you/`, points to sitemap
- [ ] `site/src/app/sitemap.ts` — scaffold stub returning homepage + UK homepage
- [ ] Nav and footer stub components compiled without errors
- [ ] `next.config.ts` with full redirects (11 regex + 30 crawl + 317 individual + locked rules)
- [ ] Presentation Tool plugin in `studio/sanity.config.ts`
- [ ] Draft mode API routes (`/api/draft-mode/enable`, `/api/draft-mode/disable`)
- [ ] Visual editing `<VisualEditing />` component in layout (preview-mode-only)
- [ ] `npm run build` passes with zero errors in `site/`
- [ ] Vercel preview deploy live at a preview URL
- [ ] Smoke tests: all checklist items in Step 8c pass
- [ ] `migrations.status = scaffold_complete` in Supabase
- [ ] All context files updated per post-phase protocol
- [ ] All commits on main

---

## Known Risks and Constraints

**Sanity types in `site/`:** The Zod schemas live in the orchestrator's `src/types/sanity/`. The Next.js app in `site/` needs them for type safety. The clean solution (shared package) is deferred to CONTENT-1. For this phase, copy or symlink the types and leave a TODO.

**Script values from audit output:** All third-party script IDs come from `audit-output/ce-scripts.json` and `audit-output/ce-global-components.json`. If any value is missing from audit output, add a `TODO:` comment and leave a placeholder — never fabricate an ID.

**Tech Debt #5 — nav Technology dropdown:** `ce-global-components.json` has this dropdown merged into Services. Do not use it to build nav link structure. Nav is built from Sanity `navigation` global in TEMPLATE-*.

**410 Gone:** Next.js does not natively support 410 responses from `redirects()`. The implementation in Step 6 is a scaffold-phase approximation. Exact 410 handling is confirmed in TEMPLATE-* STATIC phase.

**No architecture decisions in this session.** Everything is locked. If something is not covered by this brief or the design doc, write a `DEBUG_CONTEXT.md` and stop.

---

## Deferred Items

| # | Finding | Rationale |
|---|---|---|
| F15 | Draft mode disable endpoint should be POST-only with origin check | Disabling draft mode has no harmful impact — it can't enable anything sensitive. GET-only is acceptable for scaffold phase. Harden to POST in TEMPLATE-* or pre-launch hardening pass. |

---

*MYGRATR-SCAFFOLD-1 Session Brief v1.2 — post cross-model audit + self-audit, 23 fixes total, ready for execution.*
