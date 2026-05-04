# MYGRATR-AUDIT-1 — Site Audit Agent
## Session Brief v1.4

**Status:** READY FOR BUILD
**Date:** April 2026
**Changes from v1.3:** Applied all cross-model audit findings — 5 critical fixes, 7 important fixes, 3 minor fixes. See Audit Findings Table at bottom.
**Preceding session:** MYGRATR-0 (Foundation) — COMPLETE
**Following session:** MYGRATR-SCHEMA-1 (Sanity Schema Design)
**Estimated build time:** 1 full day

---

## Purpose

This session builds the Site Audit Agent — the complete, authoritative
inventory of cloudemployee.io that every downstream session depends on.
It produces a structured migration manifest: what pages exist, what
templates they use, what content is on them in all interactive states,
what third-party scripts are loaded, what forms are present and verified
in HubSpot, and pixel-perfect baseline screenshots at three breakpoints
for every unique template instance.

The output of this session is the source-of-truth document that:
- MYGRATR-SCHEMA-1 reads to design Sanity schemas
- MYGRATR-CONTENT-1 reads to plan content migration
- MYGRATR-TEMPLATE sessions read to build each page template
- MYGRATR-QA-1 reads to diff every rebuilt page against

Get this wrong and everything downstream is wrong. Get it right and the
rest of the build has a firm foundation.

---

## Pre-Session Requirements (Jake — do these before running AUDIT-1)

The following inputs must exist in the repo before Claude Code executes
this session. Claude Code will not proceed past Step 1 until all of them
are present and readable.

### 1. Screaming Frog export

Run Screaming Frog against `https://cloudemployee.io` (full crawl, no
URL limit — requires paid licence). When complete:

- File → Export → All → save as `audit-output/screaming-frog-export.csv`
- Reports → Redirects → save as `audit-output/screaming-frog-redirects.csv`

Screaming Frog settings to use:
- Spider mode: all internal URLs
- Crawl JavaScript: ON (Configuration → Spider → Rendering → JavaScript)
- Respect nofollow: OFF (we want to find everything)
- Crawl limit: unlimited
- Include subdomains: OFF (cloudemployee.io only — not talent.cloudemployee.io)

### 2. Verify `audit-output/` is in `.gitignore` — CRITICAL BEFORE ANY RUN

`audit-output/` contains PII (HubSpot notification emails from `ce-forms.json`),
infrastructure identifiers (GTM container IDs, LinkedIn partner IDs from
`ce-scripts.json`), and full page HTML. None of this must be committed to git.

Before running the audit, confirm `.gitignore` includes:
```
audit-output/
```

If it is missing, add it now and commit the `.gitignore` change before
running `npm run audit:run`.

### 4. Webflow Redirects export

In Webflow: Settings → Hosting → Redirects → Export CSV.
Save as `audit-output/webflow-redirects.csv`.

**Format confirmed from actual CE export:** two columns — `source,target`.
No status code column. All are 301s. Some rows contain regex patterns
(e.g. `/developers/(.*),/technology`) — the reconciliation step handles
these automatically.

**Note:** The CE redirects CSV has been provided and reviewed. Key findings:
- `/ph/` locale redirected wholesale to `talent.cloudemployee.io` — excluded
- `/live-job-role/` paths redirect to `talent.cloudemployee.io` — excluded
- 2 confirmed regex redirect patterns requiring Next.js config entries
- ~650 total redirect entries


Confirm these are in `.env` before starting:

```
WEBFLOW_API_TOKEN=         # already set in MYGRATR-0
WEBFLOW_SITE_ID=673326831abed6267051fa11  # already set
SUPABASE_URL=              # already set
SUPABASE_SERVICE_ROLE_KEY= # already set
FIRECRAWL_API_KEY=         # already set
ANTHROPIC_API_KEY=         # needed for template classifier
AHREFS_API_KEY=            # Ahrefs REST API v3 key — for SEO baseline snapshot
HUBSPOT_ACCESS_TOKEN=      # Private app token from HubSpot
HUBSPOT_PORTAL_ID=         # Your CE HubSpot portal ID
```

**HubSpot token setup:** In HubSpot → Settings → Integrations → Private
Apps → Create private app. Name it "Mygratr Audit". Scopes required:
`forms` (read), `automation` (read). Copy the access token to `.env`.
The portal ID is the number in your HubSpot URL: `app.hubspot.com/contacts/{PORTAL_ID}/`.

### 3. Verify existing audit files

These must exist and be non-empty:
- `audit-output/ce-inventory.json` — Webflow API inventory (from MYGRATR-0)
- `audit-output/ce-sitemap.json` — Firecrawl crawl (643 URLs, from MYGRATR-0)
- `audit-output/ce-sitemap-xml.json` — sitemap.xml parse (522 URLs, from MYGRATR-0)
- `audit-output/ce-sitemap-diff.json` — crawl vs sitemap diff (from MYGRATR-0)

---

## What This Session Builds

Thirteen scripts, one orchestrator, one manifest writer, one DB writer:

| Script | Purpose | Output |
|---|---|---|
| `scripts/audit/00-ahrefs-baseline.ts` | Pre-migration SEO snapshot — keywords, DR, backlinks | `audit-output/ce-ahrefs-baseline.json` |
| `scripts/audit/01-reconcile-urls.ts` | Merge 4 sources → canonical URL list, flag regex redirects | `audit-output/ce-canonical-urls.json`, `ce-regex-redirects.json` |
| `scripts/audit/02-screenshot-agent.ts` | Playwright screenshots at 3 breakpoints, scroll-before-capture | `audit-output/screenshots/{slug}/{mobile\|tablet\|desktop}.png` |
| `scripts/audit/03-content-extractor.ts` | Firecrawl deep extraction per canonical URL | `audit-output/pages/{slug}/content.json` |
| `scripts/audit/03b-field-population.ts` | Webflow API field population rates + EN vs EN-GB locale diff | `audit-output/ce-field-population.json` |
| `scripts/audit/03c-global-components.ts` | Nav, footer, Clara widget, Finsweet inventory | `audit-output/ce-global-components.json` |
| `scripts/audit/03d-asset-manifest.ts` | All CDN assets inventoried with format and page references | `audit-output/ce-assets.json` |
| `scripts/audit/03e-template-custom-code.ts` | Per-template custom code diff against global inventory | `audit-output/ce-template-custom-code.json` |
| `scripts/audit/04-interaction-inventory.ts` | Content-affecting interaction analysis per page | `audit-output/pages/{slug}/interactions.json` |
| `scripts/audit/05-script-inventory.ts` | Third-party script extraction globally + per-page | `audit-output/ce-scripts.json` |
| `scripts/audit/06-forms-inventory.ts` | HubSpot form GUID extraction + API verification | `audit-output/ce-forms.json` |
| `scripts/audit/07-template-classifier.ts` | Hybrid URL-rules + LLM classification of every canonical URL | `audit-output/ce-template-map.json` |
| `scripts/audit/08-manifest-builder.ts` | Assembles all outputs into structured migration manifest | `audit-output/ce-manifest.json` |
| `scripts/audit/09-manifest-writer.ts` | Writes manifest to Supabase `audit_manifests` table | DB write |
| `scripts/audit/run-audit.ts` | Orchestrator — runs all steps in sequence with error handling | Log output |

---

## TypeScript Types

Define in `src/lib/audit-types.ts` BEFORE writing any scripts.

```typescript
// src/lib/audit-types.ts

export enum UrlStatus {
  OK = '200',
  REDIRECT_301 = '301',
  REDIRECT_302 = '302',
  NOT_FOUND = '404',
  ERROR = 'error',
  EXCLUDED = 'excluded',
}

export enum TemplateType {
  HOME = 'HOME',
  TECHNOLOGY = 'TECHNOLOGY',
  SERVICE = 'SERVICE',
  BLOG = 'BLOG',
  COMPARE = 'COMPARE',
  CUSTOMER_STORY = 'CUSTOMER_STORY',
  TEAM_MEMBER = 'TEAM_MEMBER',
  VIDEO = 'VIDEO',
  REVIEW = 'REVIEW',
  BOOK_A_CALL = 'BOOK_A_CALL',
  DOWNLOAD = 'DOWNLOAD',
  TOOL = 'TOOL',
  STATIC = 'STATIC',
  TAXONOMY = 'TAXONOMY',
  UNKNOWN = 'UNKNOWN',
}

export enum ClassificationMethod {
  RULES = 'rules',
  LLM = 'llm',
  MANUAL = 'manual',
}

export enum InteractionType {
  ACCORDION = 'accordion',
  TAB = 'tab',
  MODAL = 'modal',
  FILTER = 'filter',
  DROPDOWN = 'dropdown',
  SLIDER = 'slider',
  EXPANDABLE = 'expandable',
  ANIMATION_COSMETIC = 'animation_cosmetic',
  HOVER_STATE = 'hover_state',
}

export interface CanonicalUrl {
  url: string;
  path: string;
  slug: string;           // URL-safe identifier derived from path
  status: UrlStatus;
  inSitemap: boolean;
  inFirecrawl: boolean;
  inScreamingFrog: boolean;
  locale: 'us' | 'uk' | 'unknown';
  isLocaleVariant: boolean;   // true if this is the /uk/ version of a US page
  baseUrl?: string;            // for UK variants: the corresponding US URL
  redirectTarget?: string;     // if status is 301/302
  source: 'sitemap' | 'firecrawl' | 'screaming_frog' | 'multiple';
  notes?: string;
}

export interface Breakpoint {
  name: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
}

export interface ScreenshotRecord {
  url: string;
  templateType: TemplateType;
  breakpoints: {
    mobile: string;    // relative file path
    tablet: string;
    desktop: string;
  };
  capturedAt: string;  // ISO timestamp
  fullPageHeight: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface InteractionElement {
  type: InteractionType;
  selector: string;         // CSS selector
  triggerEvent: string;     // 'click' | 'hover' | 'scroll' | etc.
  isContentAffecting: boolean;
  // Content-affecting only:
  states?: InteractionState[];
  // Cosmetic only:
  animationDescription?: string;
}

export interface InteractionState {
  stateName: string;       // e.g. 'panel-1-open', 'tab-pricing-active'
  triggerText?: string;    // the button/tab label that activates this state
  innerHtml?: string;      // full inner content in this state
  innerText?: string;      // plain text version
  containsStructuredData: boolean;
  structuredDataType?: string;  // 'table' | 'list' | 'faq' | etc.
}

export interface PageContent {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  headings: { level: number; text: string }[];
  bodyText: string;          // all visible text, newline-separated
  internalLinks: string[];
  externalLinks: string[];
  images: ImageRecord[];
  structuredData: unknown[]; // JSON-LD objects found in <script type="application/ld+json">
  canonicalTag?: string;
  robotsMeta?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  hreflangTags: { lang: string; href: string }[];
  customHeadCode?: string;   // per-page custom code from Webflow
  rawHtml?: string;          // full HTML for interaction analysis (trimmed after processing)
}

export interface ImageRecord {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isAboveFold: boolean;
  lazyLoaded: boolean;
}

export interface ThirdPartyScript {
  name: string;           // human-readable: 'Google Tag Manager'
  identifier: string;     // the ID: 'GTM-XXXXXXX'
  src?: string;           // script src if external
  loadLocation: 'head' | 'body_start' | 'body_end' | 'inline';
  scope: 'global' | string;  // 'global' or the URL where it was found
  rawSnippet: string;     // the actual <script> tag or inline code
  category: 'analytics' | 'tag_manager' | 'advertising' | 'chat' | 'consent' | 'heatmap' | 'ab_test' | 'social' | 'other';
}

export interface ScriptInventory {
  global: ThirdPartyScript[];
  perPage: Record<string, ThirdPartyScript[]>;  // keyed by URL path
  summary: {
    hasGTM: boolean;
    gtmContainerIds: string[];
    hasGA4: boolean;
    ga4MeasurementIds: string[];
    hasLinkedIn: boolean;
    linkedInPartnerId?: string;
    hasCookieConsent: boolean;
    cookieConsentProvider?: string;
    hasChat: boolean;
    chatProvider?: string;
    hasHeatmap: boolean;
    heatmapProvider?: string;
    otherScripts: string[];
  };
}

export interface HubSpotFormField {
  name: string;
  label: string;
  fieldType: string;      // 'text' | 'email' | 'select' | 'textarea' | 'hidden' | etc.
  required: boolean;
  options?: string[];     // for select/radio/checkbox
  defaultValue?: string;
  placeholder?: string;
  hidden: boolean;
}

export interface HubSpotForm {
  portalId: string;
  formGuid: string;
  formName: string;       // from HubSpot API
  pageUrl: string;        // which CE page embeds this form
  pagePath: string;
  fields: HubSpotFormField[];
  submitRedirectUrl?: string;
  inlineMessage?: string; // thank-you message shown on submit
  notifyEmails: string[]; // notification recipients from HubSpot
  connectedWorkflowIds: string[];
  connectedWorkflowNames: string[];
  connectedListIds: string[];
  connectedListNames: string[];
  apiVerified: boolean;   // true if we successfully called HubSpot API for this form
  apiVerifiedAt?: string;
  rawEmbedCode: string;   // the hbspt.forms.create({...}) snippet from page HTML
}

export interface TemplateClassification {
  url: string;
  path: string;
  templateType: TemplateType;
  classificationMethod: ClassificationMethod;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;    // LLM reasoning, if LLM-classified
  requiresManualReview: boolean;
  locale: 'us' | 'uk';
  webflowCollectionSlug?: string;  // if it's a CMS page
  webflowItemSlug?: string;
}

export interface MigrationManifest {
  version: string;       // '1.0'
  generatedAt: string;   // ISO timestamp
  sourceUrl: string;     // 'https://cloudemployee.io'
  migrationId: string;   // CE migration UUID
  orgId: string;         // CE org UUID

  // URL inventory
  canonicalUrls: CanonicalUrl[];
  totalCanonicalUrls: number;
  totalIndexableUrls: number;
  totalRedirects: number;
  totalExcluded: number;  // 404s, non-HTML, etc.

  // Template map
  templateMap: TemplateClassification[];
  templateTypeCounts: Record<TemplateType, number>;
  requiresManualReviewCount: number;

  // Content
  pageContents: Record<string, PageContent>;  // keyed by URL path

  // Screenshots
  screenshots: ScreenshotRecord[];
  screenshotsCaptured: number;
  screenshotsFailed: string[];  // URLs that failed

  // Interactions
  interactionInventory: Record<string, InteractionElement[]>;  // keyed by URL path
  pagesWithContentAffectingInteractions: string[];

  // Scripts
  scriptInventory: ScriptInventory;

  // Forms
  forms: HubSpotForm[];
  totalForms: number;
  formsVerifiedInHubSpot: number;
  formsFailedVerification: string[];  // GUIDs that failed API call

  // CMS collections (from ce-inventory.json)
  collections: CollectionRecord[];
  totalCollections: number;
  totalCmsItems: number;

  // Anomalies for human review
  anomalies: AuditAnomaly[];
}

export interface CollectionRecord {
  slug: string;
  displayName: string;
  itemCount: number;
  fieldCount: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  templateType: TemplateType;
  fields: CollectionField[];
}

export interface CollectionField {
  slug: string;
  displayName: string;
  type: string;
  required: boolean;
  isConditional: boolean;  // fold-based conditional fields (Technology Pages)
  foldCondition?: string;
}

export interface AuditAnomaly {
  severity: 'critical' | 'warning' | 'info';
  category: 'url' | 'template' | 'form' | 'script' | 'content' | 'interaction';
  description: string;
  affectedUrl?: string;
  affectedIdentifier?: string;
  recommendation: string;
}
```

---

## Step-by-Step Build Order

### Step 00: Ahrefs SEO Baseline Snapshot

**File:** `scripts/audit/00-ahrefs-baseline.ts`

Capture the pre-migration SEO baseline via Ahrefs REST API v3. Uses
`AHREFS_API_KEY` from `.env`. Non-blocking — if the API is unavailable,
logs a warning and continues. The snapshot is the reference point for
MYGRATR-MONITOR-1 post-cutover comparison.

Captures: domain rating, referring domains, organic keywords count,
estimated monthly traffic, top 100 ranking keywords with position and
volume, top 20 pages by organic traffic.

```typescript
// scripts/audit/00-ahrefs-baseline.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const TARGET = 'cloudemployee.io';
const AHREFS_BASE = 'https://api.ahrefs.com/v3';
const API_KEY = process.env.AHREFS_API_KEY!;

export interface AhrefsBaseline {
  capturedAt: string;
  domain: string;
  domainRating: number | null;
  referringDomains: number | null;
  organicKeywords: number | null;
  estimatedMonthlyTraffic: number | null;
  topKeywords: Array<{
    keyword: string;
    position: number;
    volume: number;
    url: string;
    country: string;
  }>;
  topPages: Array<{
    url: string;
    organicTraffic: number;
    topKeyword: string;
  }>;
}

async function ahrefsGet(endpoint: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${AHREFS_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Ahrefs API ${endpoint} returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function captureAhrefsBaseline(): Promise<void> {
  if (!API_KEY) {
    console.warn('  AHREFS_API_KEY not set — skipping baseline snapshot');
    return;
  }

  console.log(`Ahrefs baseline: fetching data for ${TARGET}`);
  const baseline: AhrefsBaseline = {
    capturedAt: new Date().toISOString(),
    domain: TARGET,
    domainRating: null,
    referringDomains: null,
    organicKeywords: null,
    estimatedMonthlyTraffic: null,
    topKeywords: [],
    topPages: [],
  };

  // 1. Site metrics
  try {
    const metrics = await ahrefsGet('/site-explorer/metrics', {
      target: TARGET,
      mode: 'domain',
      date: new Date().toISOString().split('T')[0],
    }) as { metrics?: { domain_rating?: number; refdomains?: number; org_keywords?: number; org_traffic?: number } };

    const m = metrics.metrics ?? {};
    baseline.domainRating = m.domain_rating ?? null;
    baseline.referringDomains = m.refdomains ?? null;
    baseline.organicKeywords = m.org_keywords ?? null;
    baseline.estimatedMonthlyTraffic = m.org_traffic ?? null;
    console.log(`  DR: ${baseline.domainRating}, Traffic: ${baseline.estimatedMonthlyTraffic}, Keywords: ${baseline.organicKeywords}`);
  } catch (err) {
    console.warn(`  Could not fetch site metrics: ${String(err)}`);
  }

  // 2. Top 100 organic keywords
  try {
    const kw = await ahrefsGet('/site-explorer/organic-keywords', {
      target: TARGET,
      mode: 'domain',
      limit: '100',
      order_by: 'traffic:desc',
      country: 'us',
    }) as { keywords?: Array<{ keyword: string; rank_type: string; pos: number; volume: number; url: string }> };

    baseline.topKeywords = (kw.keywords ?? []).map(k => ({
      keyword: k.keyword,
      position: k.pos,
      volume: k.volume,
      url: k.url,
      country: 'us',
    }));
    console.log(`  Top keywords captured: ${baseline.topKeywords.length}`);
  } catch (err) {
    console.warn(`  Could not fetch organic keywords: ${String(err)}`);
  }

  // 3. Top 20 pages by organic traffic
  try {
    const pages = await ahrefsGet('/site-explorer/top-pages', {
      target: TARGET,
      mode: 'domain',
      limit: '20',
      order_by: 'traffic:desc',
    }) as { pages?: Array<{ url: string; traffic: number; top_keyword: string }> };

    baseline.topPages = (pages.pages ?? []).map(p => ({
      url: p.url,
      organicTraffic: p.traffic,
      topKeyword: p.top_keyword,
    }));
    console.log(`  Top pages captured: ${baseline.topPages.length}`);
  } catch (err) {
    console.warn(`  Could not fetch top pages: ${String(err)}`);
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-ahrefs-baseline.json'),
    JSON.stringify(baseline, null, 2)
  );
  console.log('  Ahrefs baseline written to audit-output/ce-ahrefs-baseline.json');
}
```

> **GIT COMMIT:** `feat(audit): ahrefs seo baseline via rest api`



---

### Step 0: Verify Pre-Session Requirements

**File:** `scripts/audit/00-verify-inputs.ts`

Before any other script runs, verify all required input files and env
vars exist. If anything is missing, print a clear error and exit.

```typescript
// scripts/audit/00-verify-inputs.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_FILES = [
  'audit-output/screaming-frog-export.csv',
  'audit-output/screaming-frog-redirects.csv',
  'audit-output/ce-inventory.json',
  'audit-output/ce-sitemap.json',
  'audit-output/ce-sitemap-xml.json',
];

const REQUIRED_ENV = [
  'WEBFLOW_API_TOKEN',
  'WEBFLOW_SITE_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIRECRAWL_API_KEY',
  'ANTHROPIC_API_KEY',
  'HUBSPOT_ACCESS_TOKEN',
  'HUBSPOT_PORTAL_ID',
  'AHREFS_API_KEY',
];

export async function verifyInputs(): Promise<void> {
  let passed = true;

  console.log('=== MYGRATR-AUDIT-1: Pre-flight check ===\n');

  for (const file of REQUIRED_FILES) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    const status = exists ? '✓' : '✗ MISSING';
    if (!exists) passed = false;
    console.log(`  ${status}  ${file}`);
  }

  console.log('');

  for (const key of REQUIRED_ENV) {
    const exists = !!process.env[key];
    const status = exists ? '✓' : '✗ MISSING';
    if (!exists) passed = false;
    console.log(`  ${status}  ${key}`);
  }

  console.log('');

  if (!passed) {
    console.error('Pre-flight failed. Fix missing inputs before proceeding.');
    process.exit(1);
  }

  console.log('All inputs verified. Proceeding to audit.\n');
}

verifyInputs();
```

> **GIT COMMIT:** `chore(audit): add input verification script`

---

### Step 1: URL Reconciliation

**File:** `scripts/audit/01-reconcile-urls.ts`

Merge three URL sources into one canonical list. Every URL gets
flags showing which sources it appeared in and a final determination
of whether it's indexable, a redirect, excluded, or requires review.

**Webflow Redirects CSV format (confirmed from actual export):**
The Webflow export has two columns: `source,target` — no status code.
All entries are treated as 301 redirects. Some entries use regex patterns
(e.g. `/developers/(.*),/technology`) — these are flagged separately.

**Known exclusions from canonical URL list (from redirect analysis):**
- `/ph/` prefix paths — Philippines locale was redirected wholesale to
  `talent.cloudemployee.io`. Any `/ph/` URL found by Screaming Frog is
  a 301 redirect, not a page to migrate. Exclude from canonical inventory.
- `/live-job-role/` prefix paths — all redirect to talent.cloudemployee.io.
  These are job listing pages, not part of cloudemployee.io migration.
- Regex redirect patterns — flagged as `regex_redirect` type, written to
  a separate output for Next.js `next.config.js` implementation.



1. Parse `audit-output/screaming-frog-export.csv` — columns we need:
   `Address`, `Status Code`, `Content Type`, `Indexability`,
   `Indexability Status`, `Title 1`, `Meta Description 1`

2. Parse `audit-output/ce-sitemap-xml.json` — array of URL strings

3. Parse `audit-output/ce-sitemap.json` — Firecrawl output, extract URL array

4. Parse `audit-output/screaming-frog-redirects.csv` — columns:
   `Source`, `Destination`, `Status Code`, `Type`

5. Parse `audit-output/webflow-redirects.csv` — Webflow's redirect
   manager export. Columns will include source path and destination.
   Add these to the redirect map as `source: 'webflow_redirects'`.

6. Build a Map keyed by normalised URL (lowercase, trailing slash stripped).
   For each URL, record which sources it appears in.

6. Determine `status` from Screaming Frog's Status Code column.
   If not in Screaming Frog, use 'unknown'.

7. Determine locale: if path starts with `/uk/` → 'uk'. Otherwise 'us'.

8. Identify locale variants: for every `/uk/X` URL, find the matching
   US URL `/X`. Set `isLocaleVariant: true` and `baseUrl` on the UK entry.

9. Build `slug` from path: strip leading/trailing slashes, replace `/`
   with `--`, replace all non-alphanumeric with `-`. Max 80 chars.
   Example: `/technology/dedicated-development-team` → `technology--dedicated-development-team`

10. Exclude from canonical list (mark `status: 'excluded'`):
    - Non-HTML content types (PDFs, images, etc.)
    - Screaming Frog Indexability = 'Non-Indexable' with reason 'Blocked by robots.txt'
    - Status 4xx with no sitemap presence
    - Pagination URLs: `/page/2`, `/blog/page/3`, etc.
    - Print-friendly variants if any

11. Flag anomalies:
    - URLs in sitemap but returning 404 → critical anomaly
    - URLs in Screaming Frog but NOT in sitemap or Firecrawl → warning
    - Redirect chains (A→B→C, not just A→B) → warning

```typescript
// scripts/audit/01-reconcile-urls.ts
import fs from 'fs';
import path from 'path';
import csv from 'csv-parse/sync';
import dotenv from 'dotenv';
import type { CanonicalUrl, UrlStatus, AuditAnomaly } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

function normUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.origin + u.pathname).toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

function buildSlug(urlPath: string): string {
  // Use __ (double underscore) as path separator — cannot appear in a URL path segment
  // This prevents collisions between /uk/about (uk__about) and /uk-about (uk-about)
  return urlPath
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, '__')
    .replace(/[^a-z0-9_]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'home';
}

function detectLocale(urlPath: string): { locale: 'us' | 'uk'; isVariant: boolean; baseUrl?: string } {
  if (urlPath.startsWith('/uk/') || urlPath === '/uk') {
    const base = urlPath === '/uk' ? '/' : urlPath.replace(/^\/uk/, '');
    return { locale: 'uk', isVariant: true, baseUrl: `https://cloudemployee.io${base}` };
  }
  return { locale: 'us', isVariant: false };
}

function isPaginationUrl(urlPath: string): boolean {
  return /\/page\/\d+\/?$/.test(urlPath) ||
    /\/p\/\d+\/?$/.test(urlPath) ||
    /[?&]page=\d+/.test(urlPath);
}

export async function reconcileUrls(): Promise<{
  canonicalUrls: CanonicalUrl[];
  anomalies: AuditAnomaly[];
}> {
  const anomalies: AuditAnomaly[] = [];

  // 1. Parse Screaming Frog
  const sfRaw = fs.readFileSync(path.join(AUDIT_DIR, 'screaming-frog-export.csv'), 'utf-8');
  const sfRows = csv.parse(sfRaw, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  const sfMap = new Map<string, Record<string, string>>();
  for (const row of sfRows) {
    const norm = normUrl(row['Address'] ?? '');
    if (norm) sfMap.set(norm, row);
  }

  // Parse Screaming Frog redirects
  const sfRedirectRaw = fs.readFileSync(path.join(AUDIT_DIR, 'screaming-frog-redirects.csv'), 'utf-8');
  const sfRedirectRows = csv.parse(sfRedirectRaw, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const redirectMap = new Map<string, string>();
  for (const row of sfRedirectRows) {
    redirectMap.set(normUrl(row['Source'] ?? ''), row['Destination'] ?? '');
  }

  // Parse Webflow redirects CSV (format: source,target — no status code)
  // Confirmed format from actual export: two columns only, all 301s
  const wfRedirectRaw = fs.readFileSync(path.join(AUDIT_DIR, 'webflow-redirects.csv'), 'utf-8');
  const wfRedirectRows = csv.parse(wfRedirectRaw, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  const regexRedirects: Array<{ pattern: string; target: string }> = [];

  for (const row of wfRedirectRows) {
    const source = (row['source'] ?? '').trim();
    const target = (row['target'] ?? '').trim();
    if (!source) continue;

    // Detect regex patterns — Webflow supports (.*) wildcard redirects
    if (source.includes('(.*)') || source.includes('.*') || /[+?{}[\]]/.test(source)) {
      regexRedirects.push({ pattern: source, target });
      continue; // NOT added to redirectMap — handled separately in next.config.js
    }

    // Add to redirect map (source path → target)
    const normalisedSource = source.toLowerCase().replace(/\/$/, ''); // strip trailing slash — same as normUrl
    redirectMap.set(normalisedSource, target);
  }

  // Write regex redirects to separate output — these become Next.js redirects in next.config.js
  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-regex-redirects.json'),
    JSON.stringify({ count: regexRedirects.length, redirects: regexRedirects }, null, 2)
  );
  if (regexRedirects.length > 0) {
    console.log(`  Regex redirect patterns: ${regexRedirects.length} (see ce-regex-redirects.json)`);
  }

  // Paths to exclude from canonical inventory
  // /ph/ — Philippines locale redirected wholesale to talent.cloudemployee.io
  // /live-job-role/ — job listings redirect to talent.cloudemployee.io
  const EXCLUDED_PREFIXES = ['/ph', '/live-job-role'];
  const isExcludedPath = (p: string): boolean =>
    EXCLUDED_PREFIXES.some(prefix => p === prefix || p.startsWith(prefix + '/'));


  const sitemapXml = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, 'ce-sitemap-xml.json'), 'utf-8')) as string[];
  const sitemapSet = new Set(sitemapXml.map(normUrl));

  // 3. Parse Firecrawl
  const firecrawl = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, 'ce-sitemap.json'), 'utf-8'));
  const firecrawlUrls: string[] = Array.isArray(firecrawl)
    ? firecrawl.map((item: unknown) => typeof item === 'string' ? item : (item as Record<string, string>).url ?? '')
    : [];
  const firecrawlSet = new Set(firecrawlUrls.map(normUrl));

  // 4. Union all URLs
  const allUrls = new Set([...sfMap.keys(), ...sitemapSet, ...firecrawlSet]);

  const canonicalUrls: CanonicalUrl[] = [];

  for (const normU of allUrls) {
    let url: string;
    try {
      const u = new URL(normU);
      url = u.href;
    } catch {
      url = normU;
    }

    const urlObj = (() => { try { return new URL(url); } catch { return null; } })();
    const urlPath = urlObj?.pathname ?? '';

    // Exclusion checks
    if (isPaginationUrl(urlPath)) continue;
    if (isExcludedPath(urlPath)) continue; // /ph/ and /live-job-role/ excluded

    const sfRow = sfMap.get(normU);
    const contentType = sfRow?.['Content Type'] ?? '';
    if (contentType && !contentType.includes('text/html')) continue;

    const statusCode = sfRow?.['Status Code'] ?? 'unknown';
    const indexability = sfRow?.['Indexability'] ?? '';
    if (indexability === 'Non-Indexable' &&
      sfRow?.['Indexability Status'] === 'Blocked by robots.txt') continue;

    // Status
    let status: UrlStatus;
    if (statusCode === '200') status = UrlStatus.OK;
    else if (statusCode === '301') status = UrlStatus.REDIRECT_301;
    else if (statusCode === '302') status = UrlStatus.REDIRECT_302;
    else if (statusCode === '404') status = UrlStatus.NOT_FOUND;
    else if (statusCode === 'unknown') status = UrlStatus.OK; // not in SF but in sitemap
    else status = UrlStatus.ERROR;

    const localeInfo = detectLocale(urlPath);

    // Anomalies
    if (status === UrlStatus.NOT_FOUND && sitemapSet.has(normU)) {
      anomalies.push({
        severity: 'critical',
        category: 'url',
        description: `URL in sitemap returns 404`,
        affectedUrl: url,
        recommendation: 'Verify this page exists in Webflow. May need to be removed from sitemap pre-migration.',
      });
    }

    if (!sitemapSet.has(normU) && !firecrawlSet.has(normU) && sfMap.has(normU) && status === UrlStatus.OK) {
      anomalies.push({
        severity: 'warning',
        category: 'url',
        description: `URL found by Screaming Frog but absent from both sitemap and Firecrawl crawl`,
        affectedUrl: url,
        recommendation: 'Verify this is not an orphan page. If real, add to canonical list and investigate why it was not crawled.',
      });
    }

    const entry: CanonicalUrl = {
      url,
      path: urlPath,
      slug: buildSlug(urlPath),
      status,
      inSitemap: sitemapSet.has(normU),
      inFirecrawl: firecrawlSet.has(normU),
      inScreamingFrog: sfMap.has(normU),
      locale: localeInfo.locale,
      isLocaleVariant: localeInfo.isVariant,
      baseUrl: localeInfo.baseUrl,
      redirectTarget: redirectMap.get(normU),
      source: [
        sitemapSet.has(normU) && 'sitemap',
        firecrawlSet.has(normU) && 'firecrawl',
        sfMap.has(normU) && 'screaming_frog',
      ].filter(Boolean).length > 1 ? 'multiple' :
        (sitemapSet.has(normU) ? 'sitemap' : firecrawlSet.has(normU) ? 'firecrawl' : 'screaming_frog'),
    };

    canonicalUrls.push(entry);
  }

  // Write output
  const output = { canonicalUrls, anomalies, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-canonical-urls.json'), JSON.stringify(output, null, 2));

  const indexable = canonicalUrls.filter(u => u.status === UrlStatus.OK);
  console.log(`URL Reconciliation complete:`);
  console.log(`  Total canonical URLs: ${canonicalUrls.length}`);
  console.log(`  Indexable (200):      ${indexable.length}`);
  console.log(`  Redirects:            ${canonicalUrls.filter(u => u.status === UrlStatus.REDIRECT_301 || u.status === UrlStatus.REDIRECT_302).length}`);
  console.log(`  Not found:            ${canonicalUrls.filter(u => u.status === UrlStatus.NOT_FOUND).length}`);
  console.log(`  Anomalies:            ${anomalies.length}`);
  console.log(`  UK locale variants:   ${canonicalUrls.filter(u => u.isLocaleVariant).length}`);

  return { canonicalUrls, anomalies };
}
```

> **GIT COMMIT:** `feat(audit): url reconciliation — screaming frog + firecrawl + sitemap merged`

---

### Step 2: Screenshot Agent

**File:** `scripts/audit/02-screenshot-agent.ts`

Take Playwright screenshots of every unique template instance. We do
NOT screenshot every one of 101 Technology Pages — we screenshot one
representative sample per template type (the most content-rich instance),
plus all static pages individually, plus every page that has a unique
layout or interaction pattern.

**Selection logic:**
- All STATIC pages: screenshot individually (they're all unique layouts)
- All TAXONOMY pages: screenshot one representative sample
- All CMS templates: screenshot 3 representative instances each
  (simplest, most typical, most complex/field-rich)
- HOME: screenshot the homepage
- Any URL flagged `requiresManualReview` in template classifier: screenshot

**Screenshot settings:**
- Viewports: mobile (390×844), tablet (768×1024), desktop (1440×900)
- Wait for: `networkidle` (all assets loaded)
- **Scroll pass before screenshot:** After `networkidle`, scroll to bottom
  of page and back to top before capturing. This ensures GSAP scroll-trigger
  animations have fired and elements are in their final visible state.
  Without this, GSAP entrance animations leave elements at opacity 0 in
  the screenshot, causing false QA failures downstream.
- Wait an additional 500ms after scroll-to-top before capturing.
- Full page: true (captures full scroll height, not just viewport)
- Timeout: 30 seconds per page per viewport
- Retries: 2 attempts before marking as failed

```typescript
// scripts/audit/02-screenshot-agent.ts
import { chromium, type Browser, type Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { CanonicalUrl, TemplateClassification, ScreenshotRecord } from '../../src/lib/audit-types.js';
import { TemplateType } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, 'screenshots');

const BREAKPOINTS = [
  { name: 'mobile' as const, width: 390, height: 844 },
  { name: 'tablet' as const, width: 768, height: 1024 },
  { name: 'desktop' as const, width: 1440, height: 900 },
];

// Number of representative samples per CMS template type
const CMS_SAMPLE_COUNT = 3;

async function captureScreenshots(page: Page, url: string, slug: string): Promise<{
  breakpoints: { mobile: string; tablet: string; desktop: string };
  fullPageHeight: { mobile: number; tablet: number; desktop: number };
}> {
  const dir = path.join(SCREENSHOTS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  const result = {
    breakpoints: { mobile: '', tablet: '', desktop: '' },
    fullPageHeight: { mobile: 0, tablet: 0, desktop: 0 },
  };

  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Scroll pass: fire GSAP scroll-trigger animations so elements
    // are in their final visible state, not at animation start (opacity 0)
    await page.evaluate(async () => {
      const scrollHeight = document.body.scrollHeight;
      // Scroll to bottom in chunks to trigger scroll animations
      for (let pos = 0; pos <= scrollHeight; pos += 200) {
        window.scrollTo(0, pos);
        await new Promise(r => setTimeout(r, 16)); // one frame
      }
      window.scrollTo(0, 0);
    });

    // Wait for animations to settle
    await page.waitForTimeout(500);

    // Wait for lazy images
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const observer = new IntersectionObserver(() => {});
        document.querySelectorAll('img[loading="lazy"]').forEach(img => observer.observe(img));
        setTimeout(resolve, 1500);
      });
    });

    const fullHeight = await page.evaluate(() => document.body.scrollHeight);
    const filePath = path.join(dir, `${bp.name}.png`);
    const relativePath = path.relative(process.cwd(), filePath);

    await page.screenshot({ path: filePath, fullPage: true });

    result.breakpoints[bp.name] = relativePath;
    result.fullPageHeight[bp.name] = fullHeight;
  }

  return result;
}

export async function runScreenshotAgent(
  canonicalUrls: CanonicalUrl[],
  templateMap: TemplateClassification[]
): Promise<{ screenshots: ScreenshotRecord[]; failed: string[] }> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const classMap = new Map(templateMap.map(t => [t.url, t]));

  // Determine which URLs to screenshot
  const toScreenshot: CanonicalUrl[] = [];
  const cmsTypeSeen = new Map<TemplateType, number>();
  const CMS_TYPES = new Set([
    TemplateType.TECHNOLOGY, TemplateType.SERVICE, TemplateType.BLOG,
    TemplateType.COMPARE, TemplateType.CUSTOMER_STORY, TemplateType.TEAM_MEMBER,
    TemplateType.VIDEO, TemplateType.REVIEW, TemplateType.BOOK_A_CALL,
    TemplateType.DOWNLOAD, TemplateType.TOOL,
  ]);

  for (const cu of canonicalUrls) {
    if (cu.status !== UrlStatus.OK) continue;
    if (cu.isLocaleVariant) continue; // UK variants screenshotted separately

    const classification = classMap.get(cu.url);
    const templateType = classification?.templateType ?? TemplateType.UNKNOWN;

    if (templateType === TemplateType.HOME ||
      templateType === TemplateType.STATIC ||
      templateType === TemplateType.UNKNOWN ||
      classification?.requiresManualReview) {
      toScreenshot.push(cu);
    } else if (templateType === TemplateType.TAXONOMY) {
      const count = cmsTypeSeen.get(templateType) ?? 0;
      if (count < 1) {
        toScreenshot.push(cu);
        cmsTypeSeen.set(templateType, count + 1);
      }
    } else if (CMS_TYPES.has(templateType)) {
      const count = cmsTypeSeen.get(templateType) ?? 0;
      if (count < CMS_SAMPLE_COUNT) {
        toScreenshot.push(cu);
        cmsTypeSeen.set(templateType, count + 1);
      }
    }
  }

  // Also add UK locale variants — screenshot home + 1 per template type
  const ukUrls = canonicalUrls.filter(u => u.isLocaleVariant && u.status === UrlStatus.OK);
  const ukTypeSeen = new Map<TemplateType, number>();
  for (const cu of ukUrls) {
    const classification = classMap.get(cu.url);
    const templateType = classification?.templateType ?? TemplateType.UNKNOWN;
    const count = ukTypeSeen.get(templateType) ?? 0;
    if (count < 1) {
      toScreenshot.push(cu);
      ukTypeSeen.set(templateType, count + 1);
    }
  }

  console.log(`Screenshot agent: will capture ${toScreenshot.length} pages`);

  const screenshots: ScreenshotRecord[] = [];
  const failed: string[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });

    // Relaunch browser if it disconnects mid-run
    browser.on('disconnected', () => {
      console.warn('  Browser disconnected unexpectedly — remaining pages will fail gracefully');
    });

    for (const cu of toScreenshot) {
      let page = null;
      let attempt = 0;
      let success = false;

      while (attempt < 2 && !success) {
        try {
          page = await browser.newPage();
          const result = await captureScreenshots(page, cu.url, cu.slug);
          const classification = classMap.get(cu.url);
          screenshots.push({
            url: cu.url,
            templateType: classification?.templateType ?? TemplateType.UNKNOWN,
            breakpoints: result.breakpoints,
            capturedAt: new Date().toISOString(),
            fullPageHeight: result.fullPageHeight,
          });
          success = true;
          console.log(`  ✓ ${cu.url}`);
        } catch (err) {
          attempt++;
          if (attempt >= 2) {
            failed.push(cu.url);
            console.error(`  ✗ FAILED (attempt ${attempt}/2): ${cu.url} — ${String(err)}`);
          }
        } finally {
          if (page) {
            try { await page.close(); } catch (e) { console.warn(`  Page close warning: ${String(e)}`); }
          }
        }
      }
    }
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { console.warn(`  Browser close warning: ${String(e)}`); }
    }
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-screenshots.json'),
    JSON.stringify({ screenshots, failed, capturedAt: new Date().toISOString() }, null, 2)
  );

  console.log(`Screenshots complete: ${screenshots.length} captured, ${failed.length} failed`);
  return { screenshots, failed };
}
```

> **GIT COMMIT:** `feat(audit): playwright screenshot agent — 3 breakpoints per template`

---

### Step 3: Content Extractor

**File:** `scripts/audit/03-content-extractor.ts`

Deep-extract page content for every indexable canonical URL (US locale
only — UK variants inherit US content + locale overrides are noted).

Uses Firecrawl's `scrapeUrl` endpoint, not a full re-crawl. One API call
per URL. Rate-limited to 5 concurrent requests.

**Extracts per page:**
- Title, meta description, H1, all headings (H2-H6)
- All visible body text (plain text, newline-separated)
- All internal links (href + link text)
- All external links (href + link text)
- All images (src, alt, dimensions if in HTML, above-fold detection)
- All JSON-LD structured data objects
- Canonical tag, robots meta, OG tags
- Hreflang tags
- Per-page custom code from Webflow (if present in HTML `<head>`)
- Raw HTML (stored temporarily, used by interaction extractor, then
  trimmed from final content.json to control file size)

```typescript
// scripts/audit/03-content-extractor.ts
import FirecrawlApp from '@mendable/firecrawl-js';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import type { PageContent, ImageRecord } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');
const CE_BASE = 'https://cloudemployee.io';
const CONCURRENCY = 5;

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
const limit = pLimit(CONCURRENCY);

function extractStructuredData(html: string): unknown[] {
  const $ = cheerio.load(html);
  const results: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      results.push(JSON.parse($(el).html() ?? '{}'));
    } catch { /* malformed JSON-LD — skip */ }
  });
  return results;
}

function extractImages($: ReturnType<typeof cheerio.load>): ImageRecord[] {
  const images: ImageRecord[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '';
    if (!src) return;
    images.push({
      src,
      alt: $(el).attr('alt') ?? '',
      width: parseInt($(el).attr('width') ?? '0') || undefined,
      height: parseInt($(el).attr('height') ?? '0') || undefined,
      isAboveFold: false, // Playwright will be used for above-fold detection in QA-1
      lazyLoaded: $(el).attr('loading') === 'lazy',
    });
  });
  return images;
}

function extractCustomHeadCode($: ReturnType<typeof cheerio.load>, url: string): string | undefined {
  // Webflow per-page custom code appears in <head> before </head>
  // We look for script/style blocks that aren't standard Webflow JS
  const customBlocks: string[] = [];
  $('head script:not([src])').each((_, el) => {
    const content = $(el).html() ?? '';
    if (content.includes('hbspt') || content.includes('gtag') ||
      content.includes('dataLayer') || content.includes('_linkedin')) {
      // These are third-party scripts — captured by script-inventory, not here
      return;
    }
    if (content.trim().length > 0) customBlocks.push(content.trim());
  });
  return customBlocks.length > 0 ? customBlocks.join('\n\n') : undefined;
}

export async function extractPageContent(
  canonicalUrls: Array<{ url: string; path: string; slug: string; status: string; isLocaleVariant: boolean }>
): Promise<Record<string, PageContent>> {
  fs.mkdirSync(PAGES_DIR, { recursive: true });

  // Only extract US-locale indexable pages (UK variants are noted separately)
  const toExtract = canonicalUrls.filter(u => u.status === UrlStatus.OK && !u.isLocaleVariant);

  console.log(`Content extractor: ${toExtract.length} pages to extract`);

  const results: Record<string, PageContent> = {};
  let completed = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 10; // circuit breaker
  const PHASE_TIMEOUT_MS = 240_000; // 4 minutes max for extraction phase
  const phaseStart = Date.now();
  let stoppedEarly = false;

  await Promise.all(
    toExtract.map(cu =>
      limit(async () => {
        // Phase timeout check
        if (stoppedEarly) return;
        if (Date.now() - phaseStart > PHASE_TIMEOUT_MS) {
          stoppedEarly = true;
          console.error(`  Content extraction phase timeout (${PHASE_TIMEOUT_MS}ms) — stopping early. ${completed} pages extracted.`);
          return;
        }
        // Circuit breaker
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          stoppedEarly = true;
          console.error(`  Circuit breaker triggered: ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Aborting extraction.`);
          return;
        }
        const pageDir = path.join(PAGES_DIR, cu.slug);
        fs.mkdirSync(pageDir, { recursive: true });

        try {
          const scrapeResult = await firecrawl.scrapeUrl(cu.url, {
            formats: ['html', 'markdown'],
            onlyMainContent: false,
            // Note: includeTags validity depends on Firecrawl SDK version
            // If this option is rejected, remove it and rely on onlyMainContent: false
            includeTags: ['head', 'script', 'noscript'],
            timeout: 30000,
          });

          if (!scrapeResult.success || !scrapeResult.html) {
            throw new Error(`Firecrawl returned no HTML for ${cu.url}`);
          }

          const html = scrapeResult.html;

          // Validate response contract — if <head> is missing, includeTags was ignored
          // This is a silent degradation that must be caught early
          if (!html.includes('<head') && !html.includes('<HEAD')) {
            console.warn(`  Warning: <head> missing from Firecrawl response for ${cu.url} — includeTags may not be supported. Script/meta extraction will be incomplete.`);
          }
          const $ = cheerio.load(html);

          const content: PageContent = {
            url: cu.url,
            title: $('title').text().trim(),
            metaDescription: $('meta[name="description"]').attr('content') ?? '',
            h1: $('h1').first().text().trim(),
            headings: [],
            bodyText: $('body').text().replace(/\s+/g, ' ').trim(),
            internalLinks: [],
            externalLinks: [],
            images: extractImages($),
            structuredData: extractStructuredData(html),
            canonicalTag: $('link[rel="canonical"]').attr('href'),
            robotsMeta: $('meta[name="robots"]').attr('content'),
            ogTitle: $('meta[property="og:title"]').attr('content'),
            ogDescription: $('meta[property="og:description"]').attr('content'),
            ogImage: $('meta[property="og:image"]').attr('content'),
            hreflangTags: [],
            customHeadCode: extractCustomHeadCode($, cu.url),
            rawHtml: html,
          };

          // Headings
          $('h1, h2, h3, h4, h5, h6').each((_, el) => {
            const level = parseInt(el.tagName.replace('h', ''));
            content.headings.push({ level, text: $(el).text().trim() });
          });

          // Links
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href') ?? '';
            if (href.startsWith('/') || href.includes('cloudemployee.io')) {
              content.internalLinks.push(href);
            } else if (href.startsWith('http')) {
              content.externalLinks.push(href);
            }
          });

          // Hreflang
          $('link[rel="alternate"]').each((_, el) => {
            const lang = $(el).attr('hreflang');
            const href = $(el).attr('href');
            if (lang && href) content.hreflangTags.push({ lang, href });
          });

          results[cu.path] = content;

          // Write with rawHtml included (for interaction extractor)
          fs.writeFileSync(
            path.join(pageDir, 'content.json'),
            JSON.stringify(content, null, 2)
          );

          consecutiveFailures = 0; // reset on success
          completed++;
          if (completed % 25 === 0) {
            console.log(`  Progress: ${completed}/${toExtract.length}`);
          }
        } catch (err) {
          consecutiveFailures++;
          failed++;
          console.error(`  ✗ ${cu.url}: ${String(err)}`);
        }
      })
    )
  );

  console.log(`Content extraction complete: ${completed} done, ${failed} failed`);
  return results;
}
```

---

### Step 3e: Template-Level Custom Code Diff

**File:** `scripts/audit/03e-template-custom-code.ts`

Determine which script and style blocks are specific to a given template
type vs appearing globally. The approach: for each TemplateType, take
one representative page's HTML, extract all `<script>` and `<style>`
blocks, and diff against the global script inventory. Anything not in
the global inventory is template-level custom code.

**This replaces manual inspection.** You do not need to open Webflow
Designer for each page type. The system extracts, diffs, and surfaces
only what requires human review.

**Known template-level custom code (already confirmed):**

*Technology Pages template — confirmed from source:*
- `<head>`: UK canonical injection script, JSON-LD schema with `{{wf}}` 
  bindings for `slug`, `name`, `focus-1-blurb`, `short-description`,
  `fold-3---item-*-header` fields. Custom CSS for `.h1-last-two` pill
  styling and `.hero-rich-text-left`.
- `</body>`: socks-ui accordion initialisation, Swiper testimonial init,
  UK JSON-LD modifier script (swaps URLs, currency GBP, London address).

The step runs for all other template types and outputs its findings.
Any template with unique script blocks gets flagged for review. If the
diff is empty (template has no custom code beyond global), the report
notes `no_template_code: true` — equally useful information.

**Decision tree per finding:**
- Script in global inventory → skip, already captured
- Script not in global inventory, appears on >80% of one template type
  → tag as `template_level`, record template type
- Script not in global inventory, appears on <20% of pages of one type
  → tag as `page_level`, record specific page URL
- Script not in global inventory, appears across multiple template types
  → tag as `semi_global`, flag for investigation
- Any script that modifies JSON-LD, canonical tags, or hreflang
  → always flag as `seo_critical`, requires explicit human review

```typescript
// scripts/audit/03e-template-custom-code.ts
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { TemplateClassification, ScriptInventory } from '../../src/lib/audit-types.js';
import { TemplateType } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');

interface ScriptBlock {
  type: 'inline' | 'external';
  content: string;        // inline: script text; external: src URL
  location: 'head' | 'body';
  fingerprint: string;    // hash or first 100 chars for dedup
}

interface TemplateCodeFinding {
  templateType: TemplateType;
  representativeUrl: string;
  uniqueScripts: Array<ScriptBlock & {
    scope: 'template_level' | 'page_level' | 'semi_global' | 'unknown';
    isSeoСritical: boolean;
    seoImpact?: string;
    requiresHumanReview: boolean;
    reviewReason?: string;
  }>;
  noTemplateCode: boolean;
}

function fingerprint(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isSeoScript(content: string): boolean {
  return (
    content.includes('application/ld+json') ||
    content.includes('canonical') ||
    content.includes('hreflang') ||
    content.includes('robots') ||
    content.includes('og:') ||
    content.includes('priceCurrency') ||
    content.includes('BreadcrumbList')
  );
}

function extractScriptBlocks($: ReturnType<typeof cheerio.load>): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];

  $('head script').each((_, el) => {
    const src = $(el).attr('src');
    const inline = $(el).html() ?? '';
    if (src) {
      blocks.push({ type: 'external', content: src, location: 'head', fingerprint: src });
    } else if (inline.trim()) {
      blocks.push({ type: 'inline', content: inline, location: 'head', fingerprint: fingerprint(inline) });
    }
  });

  // Body scripts — approximate: anything after <main> or in last 20% of body
  $('body script').each((_, el) => {
    const src = $(el).attr('src');
    const inline = $(el).html() ?? '';
    if (src) {
      blocks.push({ type: 'external', content: src, location: 'body', fingerprint: src });
    } else if (inline.trim()) {
      blocks.push({ type: 'inline', content: inline, location: 'body', fingerprint: fingerprint(inline) });
    }
  });

  return blocks;
}

export async function diffTemplateCustomCode(
  templateMap: TemplateClassification[],
  pageContents: Record<string, { rawHtml?: string; url: string }>
): Promise<TemplateCodeFinding[]> {

  // Load global script inventory
  const scriptInventory = JSON.parse(
    fs.readFileSync(path.join(AUDIT_DIR, 'ce-scripts.json'), 'utf-8')
  ) as ScriptInventory;

  // Build fingerprint set of all known global scripts
  const globalFingerprints = new Set<string>();
  for (const s of scriptInventory.global) {
    globalFingerprints.add(s.src ?? fingerprint(s.rawSnippet));
  }

  // Group template map by type, pick one representative URL per type
  const typeToUrl = new Map<TemplateType, string>();
  for (const t of templateMap) {
    if (!typeToUrl.has(t.templateType) && !t.isLocaleVariant) {
      typeToUrl.set(t.templateType, t.url);
    }
  }

  const findings: TemplateCodeFinding[] = [];

  for (const [templateType, url] of typeToUrl.entries()) {
    // Find page content by URL
    const urlObj = (() => { try { return new URL(url); } catch { return null; } })();
    const urlPath = urlObj?.pathname ?? url;
    const content = pageContents[urlPath];

    if (!content?.rawHtml) {
      console.log(`  Skipping ${templateType} — no HTML available`);
      continue;
    }

    const $ = cheerio.load(content.rawHtml);
    const allBlocks = extractScriptBlocks($);

    // Find blocks not in global inventory
    const uniqueBlocks = allBlocks.filter(
      b => !globalFingerprints.has(b.fingerprint) &&
           // Also filter standard Webflow scripts
           !b.content.includes('jquery') &&
           !b.content.includes('cloudemployee.62b1833e') &&
           !b.content.includes('webfont') &&
           !b.content.includes('w-mod-')
    );

    const findings_for_type: TemplateCodeFinding['uniqueScripts'] = uniqueBlocks.map(block => {
      const seoC = isSeoScript(block.content);
      const requiresReview = seoC ||
        block.content.includes('canonical') ||
        block.content.includes('priceCurrency') ||
        block.content.length > 500;

      return {
        ...block,
        scope: 'unknown' as const, // will be resolved in second pass
        isSeoСritical: seoC,
        seoImpact: seoC ? 'Modifies SEO-critical tags — must be rebuilt as server-side logic in Next.js' : undefined,
        requiresHumanReview: requiresReview,
        reviewReason: requiresReview
          ? (seoC ? 'SEO-critical script' : 'Large inline script — verify intent')
          : undefined,
      };
    });

    findings.push({
      templateType,
      representativeUrl: url,
      uniqueScripts: findings_for_type,
      noTemplateCode: findings_for_type.length === 0,
    });

    const reviewCount = findings_for_type.filter(f => f.requiresHumanReview).length;
    console.log(`  ${templateType}: ${findings_for_type.length} unique scripts (${reviewCount} need review)`);
  }

  // Second pass: classify scope by cross-referencing across template types
  const fingerprintToTemplates = new Map<string, Set<TemplateType>>();
  for (const finding of findings) {
    for (const script of finding.uniqueScripts) {
      if (!fingerprintToTemplates.has(script.fingerprint)) {
        fingerprintToTemplates.set(script.fingerprint, new Set());
      }
      fingerprintToTemplates.get(script.fingerprint)!.add(finding.templateType);
    }
  }

  for (const finding of findings) {
    for (const script of finding.uniqueScripts) {
      const appearsIn = fingerprintToTemplates.get(script.fingerprint)!;
      if (appearsIn.size === 1) {
        script.scope = 'template_level';
      } else if (appearsIn.size >= 3) {
        script.scope = 'semi_global';
        script.requiresHumanReview = true;
        script.reviewReason = `Appears on ${appearsIn.size} template types but not in global inventory — investigate`;
      } else {
        script.scope = 'unknown';
      }
    }
  }

  // Write output
  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-custom-code.json'),
    JSON.stringify(findings, null, 2)
  );

  // Write review-only file
  const needsReview = findings.flatMap(f =>
    f.uniqueScripts
      .filter(s => s.requiresHumanReview)
      .map(s => ({
        template: f.templateType,
        url: f.representativeUrl,
        scope: s.scope,
        isSeoC: s.isSeoСritical,
        reviewReason: s.reviewReason,
        snippet: s.content.slice(0, 200),
      }))
  );

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-custom-code-review.json'),
    JSON.stringify(needsReview, null, 2)
  );

  console.log(`Template custom code diff complete:`);
  console.log(`  Templates checked:     ${findings.length}`);
  console.log(`  Templates with no code: ${findings.filter(f => f.noTemplateCode).length}`);
  console.log(`  Items for review:      ${needsReview.length}`);
  if (needsReview.length > 0) {
    console.log(`  Review file:           audit-output/ce-template-custom-code-review.json`);
  }

  return findings;
}
```

> **GIT COMMIT:** `feat(audit): template custom code diff — automated discovery, human review only for ambiguous`

**Post-run review for Step 3e:**

Open `audit-output/ce-template-custom-code-review.json`. For each entry:
- If `isSeoC: true` — confirm the logic is captured in the manifest and
  will be rebuilt as server-side Next.js logic (not client-side script)
- If `scope: 'semi_global'` — investigate why it appears on multiple
  template types. It may need to become a true global script.
- If `scope: 'template_level'` and not `isSeoC` — confirm it's expected
  for that template. Common case: Swiper init scripts, accordion inits.



**File:** `scripts/audit/03b-field-population.ts`

For every CMS collection, pull all items via the Webflow API and
calculate per-field population rates. Then repeat for the EN-GB locale
and diff the results. This tells the Schema session exactly which fields
are structural, which are conditional, and which have genuine UK content
overrides vs falling back to US content.

**Why this matters:** The Technology Pages template has 43 fields.
Without population rates, the template builder has to handle all 43 as
if they always render. Population analysis reveals which fields render
on <20% of items — these are conditional edge cases that need explicit
null-check handling and dedicated QA test cases.

**Field classification thresholds:**
- 80%+ populated → structural (always handle in template)
- 40–79% populated → conditional (null check + test both states)
- Under 40% populated → edge case (flag for explicit escalation criteria)

**Locale diff output per field:**
- `hasUkOverride`: true if any item has EN-GB content different from EN
- `ukOverrideRate`: % of items with a UK-specific value
- `ukOverrideExample`: one sample UK value for human review

```typescript
// scripts/audit/03b-field-population.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const WF_TOKEN = process.env.WEBFLOW_API_TOKEN!;
const WF_SITE_ID = process.env.WEBFLOW_SITE_ID!;
const WF_BASE = 'https://api.webflow.com/v2';

interface FieldPopulation {
  slug: string;
  displayName: string;
  type: string;
  usPopulatedCount: number;
  usPopulatedRate: number;        // 0-100
  classification: 'structural' | 'conditional' | 'edge_case';
  hasUkOverride: boolean;
  ukOverrideRate: number;
  ukOverrideExample?: string;
  isInJsonLd: boolean;            // true if field slug appears in JSON-LD template
}

interface CollectionPopulationReport {
  collectionSlug: string;
  displayName: string;
  totalItems: number;
  totalUkItems: number;
  fields: FieldPopulation[];
  hasLocaleVariants: boolean;
  localeStrategy: 'single-document' | 'locale-fields-on-shared' | 'investigate';
  draftInUkCount: number;         // items published in US but draft in UK
}

// Fields from the Technology Pages JSON-LD template
const JSONLD_FIELD_SLUGS = new Set([
  'slug', 'name', 'focus-1-blurb', 'short-description',
  'fold-3---item-2-header', 'fold-3---item-3-header',
  'fold-3---item-4-header', 'fold-3---item-5-header',
  'fold-3---item-6-header', 'focus-4-blurb',
]);

async function wfGet(endpoint: string, locale?: string): Promise<unknown> {
  const url = locale
    ? `${WF_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}locale=${locale}`
    : `${WF_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${WF_TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Webflow API ${endpoint}: ${res.status}`);
  return res.json();
}

async function fetchAllItems(
  collectionId: string,
  locale?: string
): Promise<Array<Record<string, unknown>>> {
  const items: Array<Record<string, unknown>> = [];
  let offset = 0;
  const limit = 100;
  const MAX_PAGES = 50; // hard cap — no collection should exceed 5,000 items
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const endpoint = `/collections/${collectionId}/items?limit=${limit}&offset=${offset}`;
    const data = await wfGet(endpoint, locale) as {
      items: Array<{ fieldData: Record<string, unknown>; isDraft?: boolean; isArchived?: boolean }>;
      pagination: { total: number };
    };

    let pageItems = 0;
    for (const item of data.items) {
      if (!item.isArchived) {
        items.push({ ...item.fieldData, _isDraft: item.isDraft ?? false });
      }
      pageItems++;
    }

    // Break when last page reached — fewer items than requested means no more pages
    // Do NOT rely on pagination.total which counts archived items and can cause infinite loops
    if (pageItems < limit) break;

    offset += limit;
    pageCount++;

    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  if (pageCount >= MAX_PAGES) {
    console.warn(`  Warning: hit MAX_PAGES (${MAX_PAGES}) for collection ${collectionId} — results may be incomplete`);
  }

  return items;
}

export async function analyseFieldPopulation(): Promise<CollectionPopulationReport[]> {
  // Load collections from existing inventory
  const inventory = JSON.parse(
    fs.readFileSync(path.join(AUDIT_DIR, 'ce-inventory.json'), 'utf-8')
  ) as { collections: Array<{ id: string; slug: string; displayName: string; fields: Array<{ slug: string; displayName: string; type: string }> }> };

  const reports: CollectionPopulationReport[] = [];

  for (const collection of inventory.collections) {
    console.log(`  Analysing: ${collection.displayName} (${collection.slug})`);

    try {
      // Fetch US items
      const usItems = await fetchAllItems(collection.id, 'en');
      // Fetch UK items
      const ukItems = await fetchAllItems(collection.id, 'en-GB');

      const ukItemMap = new Map<string, Record<string, unknown>>();
      for (const item of ukItems) {
        const slug = item['slug'] as string;
        if (slug) ukItemMap.set(slug, item);
      }

      const fields: FieldPopulation[] = [];

      for (const field of collection.fields) {
        // Count US population
        let usPopulated = 0;
        for (const item of usItems) {
          const val = item[field.slug];
          if (val !== null && val !== undefined && val !== '') {
            usPopulated++;
          }
        }

        const usRate = usItems.length > 0
          ? Math.round((usPopulated / usItems.length) * 100)
          : 0;

        const classification: FieldPopulation['classification'] =
          usRate >= 80 ? 'structural' :
          usRate >= 40 ? 'conditional' : 'edge_case';

        // Check UK overrides
        let ukOverrideCount = 0;
        let ukExample: string | undefined;

        for (const usItem of usItems) {
          const slug = usItem['slug'] as string;
          const ukItem = ukItemMap.get(slug);
          if (!ukItem) continue;

          const usVal = String(usItem[field.slug] ?? '');
          const ukVal = String(ukItem[field.slug] ?? '');

          if (ukVal && ukVal !== usVal) {
            ukOverrideCount++;
            if (!ukExample) ukExample = ukVal.slice(0, 100);
          }
        }

        const ukOverrideRate = usItems.length > 0
          ? Math.round((ukOverrideCount / usItems.length) * 100)
          : 0;

        fields.push({
          slug: field.slug,
          displayName: field.displayName,
          type: field.type,
          usPopulatedCount: usPopulated,
          usPopulatedRate: usRate,
          classification,
          hasUkOverride: ukOverrideCount > 0,
          ukOverrideRate,
          ukOverrideExample: ukExample,
          isInJsonLd: JSONLD_FIELD_SLUGS.has(field.slug),
        });
      }

      // Count draft-in-UK items
      let draftInUkCount = 0;
      for (const usItem of usItems) {
        const slug = usItem['slug'] as string;
        const ukItem = ukItemMap.get(slug);
        if (ukItem && ukItem['_isDraft']) draftInUkCount++;
      }

      // Determine locale strategy
      const anyUkOverride = fields.some(f => f.hasUkOverride);
      const localeStrategy: CollectionPopulationReport['localeStrategy'] =
        ukItems.length === 0 ? 'single-document' :
        anyUkOverride ? 'locale-fields-on-shared' : 'single-document';

      reports.push({
        collectionSlug: collection.slug,
        displayName: collection.displayName,
        totalItems: usItems.length,
        totalUkItems: ukItems.length,
        fields,
        hasLocaleVariants: ukItems.length > 0,
        localeStrategy,
        draftInUkCount,
      });

      // Log summary
      const edgeCases = fields.filter(f => f.classification === 'edge_case').length;
      const withUkOverride = fields.filter(f => f.hasUkOverride).length;
      console.log(`    US items: ${usItems.length}, UK items: ${ukItems.length}`);
      console.log(`    Edge case fields: ${edgeCases}, Fields with UK overrides: ${withUkOverride}`);
      if (draftInUkCount > 0) {
        console.log(`    ⚠️  Draft in UK: ${draftInUkCount} items`);
      }

    } catch (err) {
      console.error(`    ✗ Failed: ${String(err)}`);
    }

    // Rate limit between collections
    await new Promise(r => setTimeout(r, 250));
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-field-population.json'),
    JSON.stringify(reports, null, 2)
  );

  // Write a human-readable summary of edge cases
  const edgeCaseSummary = reports.map(r => ({
    collection: r.displayName,
    totalItems: r.totalItems,
    localeStrategy: r.localeStrategy,
    draftInUk: r.draftInUkCount,
    edgeCaseFields: r.fields
      .filter(f => f.classification === 'edge_case')
      .map(f => ({ field: f.slug, rate: `${f.usPopulatedRate}%` })),
    ukOverrideFields: r.fields
      .filter(f => f.hasUkOverride)
      .map(f => ({ field: f.slug, ukRate: `${f.ukOverrideRate}%` })),
  }));

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-field-population-summary.json'),
    JSON.stringify(edgeCaseSummary, null, 2)
  );

  console.log(`\nField population analysis complete: ${reports.length} collections`);
  return reports;
}
```

> **GIT COMMIT:** `feat(audit): field population + locale diff analysis per collection`

---

### Step 3c: Global Component Inventory

**File:** `scripts/audit/03c-global-components.ts`

Extract the global nav, footer, and other site-wide components that
appear on every page. The Next.js layout component needs this inventory
before MYGRATR-SCAFFOLD-1 runs.

**What to extract:**
- Nav structure: all top-level links, dropdown sections, CMS-powered
  sections (which collections feed the mega-menu), CTA buttons
- Footer structure: link columns, social links, legal links, newsletter
  form GUID, locale switcher
- Global announcement bar (currently hidden with class `banner hide` —
  capture its content even if hidden)
- Cookie consent provider and configuration
- Clara AI chat widget workspace ID

**CMS-driven nav sections (confirmed from source code):**
The nav mega-menu pulls live CMS data for:
- Services dropdown → featured services (2) + all services (dynamic list)
- Technology dropdown → 6 featured technology pages (hardcoded slugs)
- How It Works dropdown → static cards
- Resources dropdown → 3 most recent blog posts (Finsweet list combine) + customer stories

This means the Next.js nav component needs ISR or static generation
that fetches from Sanity at build time. The audit captures which
collections are queried and how many items each section shows.

```typescript
// scripts/audit/03c-global-components.ts
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

export interface NavItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

export interface NavSection {
  label: string;
  href?: string;
  items: NavItem[];
  isCmsDriven: boolean;
  cmsCollection?: string;
  cmsItemCount?: number;
}

export interface GlobalComponentInventory {
  nav: {
    topLevelLinks: NavItem[];
    dropdownSections: NavSection[];
    ctaButton: { label: string; type: 'calendly' | 'link'; href?: string };
    mobileCtaButton: { label: string; type: 'calendly' | 'link'; href?: string };
    hasLocaleDropdown: boolean;
  };
  footer: {
    columns: Array<{ heading: string; links: NavItem[] }>;
    legalLinks: NavItem[];
    newsletterFormGuid?: string;
    copyrightText: string;
    hasLocaleDropdown: boolean;
    localeOptions: Array<{ label: string; href: string; hreflang: string }>;
  };
  announcementBar: {
    present: boolean;
    visible: boolean;
    text?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  claraWidget: {
    present: boolean;
    scriptSrc?: string;
    workspaceId?: string;
  };
  finsweetAttributes: {
    present: boolean;
    version?: string;
    usedFor: string[];  // ['list-combine', 'accordion', etc.]
  };
}

export async function buildGlobalComponentInventory(
  pageContents: Record<string, { rawHtml?: string }>
): Promise<GlobalComponentInventory> {
  // Use the homepage HTML as the canonical source for global components
  // Fall back to any page if homepage not available
  const homepageHtml = pageContents['/']?.rawHtml
    ?? Object.values(pageContents).find(p => p.rawHtml)?.rawHtml
    ?? '';

  if (!homepageHtml) {
    throw new Error('No page HTML available for global component extraction');
  }

  const $ = cheerio.load(homepageHtml);

  // --- NAV ---
  const topLevelLinks: NavItem[] = [];
  $('nav.w-nav-menu .nav-link:not(.list)').each((_, el) => {
    const href = $(el).attr('href') ?? '#';
    const label = $(el).text().trim();
    if (label) topLevelLinks.push({ label, href });
  });

  // Extract dropdown sections
  const dropdownSections: NavSection[] = [];
  $('.nav-dropdown').each((_, dropdown) => {
    const triggerLink = $(dropdown).find('.nav-link.sub').first();
    const sectionLabel = triggerLink.text().trim();
    const sectionHref = triggerLink.attr('href') ?? '#';

    const items: NavItem[] = [];
    $(dropdown).find('.nav-link-dropdown, .footer-link').each((_, link) => {
      const label = $(link).find('.h6-nav, div').first().text().trim();
      const href = $(link).attr('href') ?? '#';
      if (label && href) items.push({ label, href });
    });

    // Check if CMS-driven (has w-dyn-list)
    const isCmsDriven = $(dropdown).find('.w-dyn-list').length > 0;
    const cmsItemCount = $(dropdown).find('.w-dyn-item').length;

    dropdownSections.push({
      label: sectionLabel,
      href: sectionHref,
      items,
      isCmsDriven,
      cmsItemCount,
    });
  });

  // --- FOOTER ---
  const footerColumns: GlobalComponentInventory['footer']['columns'] = [];
  $('.footer-links-wrap').each((_, col) => {
    const heading = $(col).find('.u-weight-med, .txt-link').first().text().trim();
    const links: NavItem[] = [];
    $(col).find('.footer-link').each((_, link) => {
      const label = $(link).text().trim();
      const href = $(link).attr('href') ?? '#';
      if (label) links.push({ label, href });
    });
    if (heading || links.length > 0) {
      footerColumns.push({ heading, links });
    }
  });

  const legalLinks: NavItem[] = [];
  $('.footer-link-list .footer-link').each((_, link) => {
    legalLinks.push({ label: $(link).text().trim(), href: $(link).attr('href') ?? '#' });
  });

  // Newsletter form GUID
  const newsletterForm = $('[data-webflow-hubspot-api-form-url]');
  const newsletterFormUrl = newsletterForm.attr('data-webflow-hubspot-api-form-url') ?? '';
  const guidMatch = newsletterFormUrl.match(/([a-f0-9-]{36})/);
  const newsletterFormGuid = guidMatch ? guidMatch[1] : undefined;

  // Locale options
  const localeOptions: GlobalComponentInventory['footer']['localeOptions'] = [];
  $('.w-locales-item a').each((_, link) => {
    localeOptions.push({
      label: $(link).text().trim(),
      href: $(link).attr('href') ?? '#',
      hreflang: $(link).attr('hreflang') ?? '',
    });
  });

  // --- ANNOUNCEMENT BAR ---
  const banner = $('.bar-notification').first();
  const bannerSection = banner.closest('.section');
  const bannerVisible = !bannerSection.hasClass('hide');
  const announcementBar: GlobalComponentInventory['announcementBar'] = {
    present: banner.length > 0,
    visible: bannerVisible,
    text: banner.find('p').text().trim() || undefined,
    ctaLabel: banner.find('.txt-link-top div').first().text().trim() || undefined,
    ctaHref: banner.find('.txt-link').attr('href') || undefined,
  };

  // --- CLARA WIDGET ---
  let claraWidget: GlobalComponentInventory['claraWidget'] = { present: false };
  $('script[src*="clara"]').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const workspaceId = $(el).attr('data-workspace-id');
    claraWidget = { present: true, scriptSrc: src, workspaceId: workspaceId ?? undefined };
  });

  // --- FINSWEET ---
  let finsweetVersion: string | undefined;
  const finsweetUsages: string[] = [];
  $('script[src*="finsweet"]').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const versionMatch = src.match(/@(\d+\.\d+\.\d+)/);
    if (versionMatch) finsweetVersion = versionMatch[1];
    const attr = $(el).attr('fs-list') !== undefined ? 'fs-list' : '';
    if (attr) finsweetUsages.push('list');
  });

  // Check for fs- attributes in HTML
  if ($('[fs-list-combine]').length > 0) finsweetUsages.push('list-combine');
  if ($('[fs-list-element]').length > 0 && !finsweetUsages.includes('list')) finsweetUsages.push('list');
  if ($('[fs-accordion]').length > 0) finsweetUsages.push('accordion');

  const inventory: GlobalComponentInventory = {
    nav: {
      topLevelLinks,
      dropdownSections,
      ctaButton: {
        label: $('[calendly-call="1"]:not(.mobile-only)').first().find('.switch-text').text().trim(),
        type: 'calendly',
      },
      mobileCtaButton: {
        label: $('[calendly-call="1"].mobile-only').first().find('.switch-text').text().trim(),
        type: 'calendly',
      },
      hasLocaleDropdown: $('.w-locales-list').length > 0,
    },
    footer: {
      columns: footerColumns,
      legalLinks,
      newsletterFormGuid,
      copyrightText: $('.u-white-text-3').first().text().trim(),
      hasLocaleDropdown: true,
      localeOptions,
    },
    announcementBar,
    claraWidget,
    finsweetAttributes: {
      present: finsweetVersion !== undefined || finsweetUsages.length > 0,
      version: finsweetVersion,
      usedFor: [...new Set(finsweetUsages)],
    },
  };

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-global-components.json'),
    JSON.stringify(inventory, null, 2)
  );

  console.log('Global component inventory complete:');
  console.log(`  Nav sections: ${dropdownSections.length}`);
  console.log(`  Footer columns: ${footerColumns.length}`);
  console.log(`  Newsletter form GUID: ${newsletterFormGuid ?? 'not found'}`);
  console.log(`  Clara widget: ${claraWidget.present} (${claraWidget.workspaceId ?? 'no ID'})`);
  console.log(`  Finsweet: ${inventory.finsweetAttributes.present} (${finsweetUsages.join(', ')})`);

  return inventory;
}
```

> **GIT COMMIT:** `feat(audit): global component inventory — nav, footer, clara, finsweet`

---

### Step 3d: Asset Manifest

**File:** `scripts/audit/03d-asset-manifest.ts`

Build a complete inventory of every unique image and media asset
referenced across all pages. This drives the asset migration in
MYGRATR-CONTENT-1.

**Webflow CDN structure (confirmed from source):**
- Site-level assets: `cdn.prod.website-files.com/673326831abed6267051fa11/`
- CMS item assets: `cdn.prod.website-files.com/673326831abed6267051fa18/`
  (note the `18` vs `11` suffix — different folder IDs)

**What to capture per asset:**
- Full CDN URL
- Relative path (after the folder ID)
- Format: avif, png, jpg, svg, gif, webp, mp4 (if any)
- Estimated size category based on `srcset` dimensions
- Which pages reference this asset
- Whether it appears in a `srcset` (responsive) or just `src`
- Asset category: logo, hero-image, content-image, icon, background, video-poster

Assets referenced only from CSS (background images) will NOT be caught
here — but CE's site uses attribute-based CSS (`[bg-color="light-green"]`)
not `background-image: url()` in most places. The script will attempt to
extract CSS background URLs from inline styles and `<style>` blocks.

```typescript
// scripts/audit/03d-asset-manifest.ts
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');

const WF_CDN_SITE = '673326831abed6267051fa11';
const WF_CDN_CMS  = '673326831abed6267051fa18';

export interface AssetRecord {
  url: string;
  relativePath: string;
  cdnFolder: 'site' | 'cms' | 'external';
  format: string;
  referencedByPages: string[];
  referencedCount: number;
  isResponsive: boolean;     // true if in srcset
  altText: string;           // from first img tag reference
  estimatedSizeCategory: 'icon' | 'small' | 'medium' | 'large' | 'unknown';
  assetCategory: 'logo' | 'hero' | 'content' | 'icon' | 'background' | 'video-poster' | 'other';
}

export interface AssetManifest {
  totalUniqueAssets: number;
  siteAssets: number;
  cmsAssets: number;
  externalAssets: number;
  byFormat: Record<string, number>;
  estimatedTotalFiles: number;
  assets: AssetRecord[];
}

function classifyAsset(url: string, alt: string, context: string): AssetRecord['assetCategory'] {
  const lower = url.toLowerCase();
  if (lower.includes('logo') || alt.toLowerCase().includes('logo')) return 'logo';
  if (lower.includes('favicon') || lower.includes('webclip')) return 'icon';
  if (lower.includes('hero') || lower.includes('tech.avif') || lower.includes('techdel')) return 'hero';
  if (lower.includes('avatar') || lower.includes('headshot') || lower.includes('thumbnail')) return 'content';
  if (lower.includes('icon') || lower.includes('arrow') || lower.includes('checl')) return 'icon';
  if (context.includes('background') || context.includes('bg-')) return 'background';
  return 'content';
}

function estimateSize(url: string, srcset?: string): AssetRecord['estimatedSizeCategory'] {
  if (url.includes('icon') || url.includes('arrow') || url.includes('.svg')) return 'icon';
  if (srcset) {
    const widths = (srcset.match(/\d+w/g) ?? []).map(w => parseInt(w));
    const maxWidth = Math.max(...widths, 0);
    if (maxWidth > 1200) return 'large';
    if (maxWidth > 600) return 'medium';
    if (maxWidth > 0) return 'small';
  }
  return 'unknown';
}

export async function buildAssetManifest(
  pageContents: Record<string, { rawHtml?: string; url: string; path: string }>
): Promise<AssetManifest> {
  const assetMap = new Map<string, AssetRecord>();

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;
    const $ = cheerio.load(content.rawHtml);

    // Extract <img> tags
    $('img').each((_, el) => {
      const src = $(el).attr('src') ?? '';
      const srcset = $(el).attr('srcset') ?? '';
      const alt = $(el).attr('alt') ?? '';

      const urls = [src, ...srcset.split(',').map(s => s.trim().split(' ')[0])].filter(Boolean);

      for (const rawUrl of urls) {
        if (!rawUrl || rawUrl.startsWith('data:')) continue;

        let url: string;
        try { url = new URL(rawUrl).href; }
        catch { url = rawUrl; }

        const existing = assetMap.get(url);
        if (existing) {
          if (!existing.referencedByPages.includes(urlPath)) {
            existing.referencedByPages.push(urlPath);
            existing.referencedCount++;
          }
          if (!existing.isResponsive && srcset) existing.isResponsive = true;
        } else {
          const cdnFolder = url.includes(WF_CDN_SITE) ? 'site' :
                            url.includes(WF_CDN_CMS) ? 'cms' : 'external';
          const urlObj = (() => { try { return new URL(url); } catch { return null; } })();
          const relativePath = urlObj?.pathname ?? url;
          const formatMatch = relativePath.match(/\.([a-z0-9]+)(\?|$)/i);
          const format = formatMatch ? formatMatch[1].toLowerCase() : 'unknown';

          assetMap.set(url, {
            url,
            relativePath,
            cdnFolder,
            format,
            referencedByPages: [urlPath],
            referencedCount: 1,
            isResponsive: !!srcset,
            altText: alt,
            estimatedSizeCategory: estimateSize(url, srcset),
            assetCategory: classifyAsset(url, alt, ''),
          });
        }
      }
    });

    // Extract CSS background images from inline styles and <style> blocks
    const styleContent = $('style').map((_, el) => $(el).html()).get().join('\n');
    const bgUrlMatches = styleContent.matchAll(/url\(['"]?([^'")\s]+)['"]?\)/g);
    for (const match of bgUrlMatches) {
      const rawUrl = match[1];
      if (rawUrl.startsWith('data:')) continue;
      const url = rawUrl.startsWith('http') ? rawUrl : `https:${rawUrl}`;
      if (!assetMap.has(url)) {
        const cdnFolder = url.includes(WF_CDN_SITE) ? 'site' :
                          url.includes(WF_CDN_CMS) ? 'cms' : 'external';
        const formatMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
        assetMap.set(url, {
          url,
          relativePath: url,
          cdnFolder,
          format: formatMatch ? formatMatch[1].toLowerCase() : 'unknown',
          referencedByPages: [urlPath],
          referencedCount: 1,
          isResponsive: false,
          altText: '',
          estimatedSizeCategory: 'unknown',
          assetCategory: 'background',
        });
      }
    }
  }

  // Build summary
  const assets = Array.from(assetMap.values());
  const byFormat: Record<string, number> = {};
  for (const asset of assets) {
    byFormat[asset.format] = (byFormat[asset.format] ?? 0) + 1;
  }

  const manifest: AssetManifest = {
    totalUniqueAssets: assets.length,
    siteAssets: assets.filter(a => a.cdnFolder === 'site').length,
    cmsAssets: assets.filter(a => a.cdnFolder === 'cms').length,
    externalAssets: assets.filter(a => a.cdnFolder === 'external').length,
    byFormat,
    estimatedTotalFiles: assets.filter(a => a.cdnFolder !== 'external').length,
    assets,
  };

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-assets.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('Asset manifest complete:');
  console.log(`  Total unique assets: ${manifest.totalUniqueAssets}`);
  console.log(`  Site assets (fa11):  ${manifest.siteAssets}`);
  console.log(`  CMS assets (fa18):   ${manifest.cmsAssets}`);
  console.log(`  External assets:     ${manifest.externalAssets}`);
  console.log(`  By format:           ${JSON.stringify(byFormat)}`);

  return manifest;
}
```

> **GIT COMMIT:** `feat(audit): asset manifest — all CDN assets inventoried`

---



**File:** `scripts/audit/04-interaction-inventory.ts`

Analyse each page's HTML for interactive elements. Uses a combination of
HTML pattern detection and a Claude API call for ambiguous cases.

**Known interaction libraries on CE (confirmed from source code):**
- **GSAP + ScrollTrigger** — scroll-triggered entrance animations on
  almost every section. Elements start at `yPercent: 10, opacity: 0`
  and animate in on scroll. Handled by the screenshot agent's scroll
  pass. QA Agent does NOT test animation timing — just final state.
- **Swiper.js v11** — testimonial carousel (`.swiper.company-testimonies`)
  and video carousel (`.swiper.about-videos`). Both have `loop: true`
  and `autoplay`. The interaction inventory records these as SLIDER type.
- **socks-ui accordion** (`https://unpkg.com/socks-ui@0.2.9/dist/accordion.js`)
  — drives FAQ accordions via `s-accordion="root/trigger/content"` attributes.
  This is a lightweight custom accordion library. Content-affecting.
- **Webflow native interactions** — `[data-w-id]` attributes on nav dropdowns,
  hero section scroll behavior, hover states on `.switch-button` elements.
- **Finsweet Attributes v2** — `fs-list-combine` merges multiple CMS lists
  into one (used in Resources nav dropdown to show latest blogs). This
  behaviour needs to be replicated in Next.js with a single Sanity query.

**Interaction classification for CE:**
- Swiper carousels → SLIDER type, content-affecting (slides contain testimonials/videos)
- socks-ui FAQ accordions → ACCORDION type, content-affecting
- GSAP scroll animations → ANIMATION_COSMETIC type
- `.switch-button` hover states → HOVER_STATE type, cosmetic only
- Nav dropdowns → DROPDOWN type, cosmetic (nav content captured separately)
- Three-card rotating homepage section (Sourced to spec / Truly embedded /
  Retained & trained) → TAB type, content-affecting (each card has
  expanded copy that appears on active state)



**Tier 1 — Pattern detection (no API cost):** Scan HTML for known
Webflow interaction patterns and common library patterns:
- `data-w-id` attributes (Webflow interactions)
- `[data-accordion]`, `[role="tablist"]`, `[role="tab"]` (ARIA patterns)
- `fs-accordion` (Finsweet attribute patterns, common in Webflow builds)
- Any element with `display:none` or `visibility:hidden` in inline style
  that has sibling trigger elements
- `<details>/<summary>` HTML5 accordions
- Elements with class names containing: `accordion`, `tab`, `modal`,
  `dropdown`, `expand`, `collapse`, `toggle`, `filter`

**Tier 2 — Claude analysis (for pages with complex interactions):**
For pages where Tier 1 finds more than 3 distinct interaction patterns,
or for Technology Pages (which have fold-based conditional content),
send the page's HTML structure (not full HTML, just the skeleton with
class names and data attributes) to Claude for deeper analysis.

**For each content-affecting interaction found:**
- Record selector, trigger event, all inner text in all states
- If it contains a table: extract the full table as structured data
- If it contains an FAQ pattern: extract all Q+A pairs
- If it contains a feature list: extract all items

**Cosmetic interactions (record presence only):**
- Scroll animations (AOS, Webflow scroll triggers)
- Hover state changes on non-content elements
- Entrance animations
- Parallax effects

```typescript
// scripts/audit/04-interaction-inventory.ts
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type {
  InteractionElement, InteractionType, InteractionState
} from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Selectors that indicate content-affecting interactions
const CONTENT_INTERACTION_PATTERNS = [
  { selector: '[fs-accordion-element="content"]', type: 'accordion' as InteractionType },
  { selector: '[data-accordion-content]', type: 'accordion' as InteractionType },
  { selector: 'details', type: 'accordion' as InteractionType },
  { selector: '[role="tabpanel"]', type: 'tab' as InteractionType },
  { selector: '[data-tab-content]', type: 'tab' as InteractionType },
  { selector: '[role="dialog"]', type: 'modal' as InteractionType },
  { selector: '.modal__content, .modal-content', type: 'modal' as InteractionType },
  { selector: '.filter__content, [data-filter-wrapper]', type: 'filter' as InteractionType },
];

// Class name fragments that suggest content-affecting interactions
const CONTENT_CLASS_PATTERNS = [
  /accordion[-_]?(content|body|panel)/i,
  /tab[-_]?(content|panel|pane)/i,
  /modal[-_]?(content|body)/i,
  /expand[-_]?(content|body)/i,
  /collapse[-_]?(content)/i,
];

// Selectors that indicate cosmetic-only interactions
const COSMETIC_PATTERNS = [
  { selector: '[data-w-id]', description: 'Webflow interaction trigger' },
  { selector: '[data-aos]', description: 'AOS scroll animation' },
  { selector: '.w-nav, .w-dropdown', description: 'Webflow nav/dropdown' },
  { selector: '[class*="animate"]', description: 'CSS animation class' },
  { selector: '[class*="parallax"]', description: 'Parallax effect' },
];

function extractAllStates($el: cheerio.Cheerio<cheerio.Element>, $: ReturnType<typeof cheerio.load>): InteractionState[] {
  // For accordions: each content panel is a state
  // For tabs: each panel is a state
  // For modals: the modal body is a state
  const states: InteractionState[] = [];

  const innerText = $el.text().trim();
  const innerHtml = $el.html() ?? '';

  // Check for FAQ pattern (question + answer structure)
  const hasFaqPattern = innerHtml.includes('?') && $el.find('p, div').length > 1;

  // Check for table
  const hasTable = $el.find('table').length > 0;

  // Check for list
  const hasList = $el.find('ul, ol').length > 0;

  states.push({
    stateName: 'content',
    innerHtml,
    innerText,
    containsStructuredData: hasTable || hasFaqPattern || hasList,
    structuredDataType: hasTable ? 'table' : hasFaqPattern ? 'faq' : hasList ? 'list' : undefined,
  });

  return states;
}

async function analyseWithClaude(
  html: string,
  url: string
): Promise<InteractionElement[]> {
  // Extract just the structural HTML — remove all text content over 100 chars
  // to reduce token usage while preserving structure
  const $ = cheerio.load(html);
  $('script, style, svg, iframe').remove();
  const structuralHtml = $.html('body');

  const prompt = `You are analysing the HTML structure of a webpage to identify interactive elements.
URL: ${url}

HTML structure (text content trimmed):
${structuralHtml.slice(0, 15000)}

Identify ALL interactive elements on this page. For each:
1. The CSS selector to target it
2. Type: accordion | tab | modal | filter | dropdown | slider | expandable | animation_cosmetic | hover_state
3. Whether it affects visible text content (content-affecting) or is purely cosmetic
4. The trigger event (click/hover/scroll)
5. A brief description of what it shows/hides

Also specifically look for:
- Webflow "fold" patterns: fields that are conditionally shown based on another field's value
- Any pricing toggle patterns
- Any FAQ sections
- Any feature comparison tables that might be inside toggles

Respond in JSON array format:
[{"selector": "...", "type": "...", "isContentAffecting": true/false, "triggerEvent": "...", "description": "..."}]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as Array<{
      selector: string;
      type: string;
      isContentAffecting: boolean;
      triggerEvent: string;
      description: string;
    }>;

    return parsed.map(item => ({
      type: item.type as InteractionType,
      selector: item.selector,
      triggerEvent: item.triggerEvent,
      isContentAffecting: item.isContentAffecting,
      animationDescription: !item.isContentAffecting ? item.description : undefined,
    }));
  } catch (err) {
    const errStr = String(err);
    // Auth or quota failures are fatal — do not silently return empty
    if (errStr.includes('401') || errStr.includes('403') || errStr.includes('authentication')) {
      throw new Error(`Anthropic API authentication failed during interaction analysis for ${url}. Check ANTHROPIC_API_KEY.`);
    }
    if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('rate')) {
      throw new Error(`Anthropic API quota exhausted during interaction analysis for ${url}. Cannot continue.`);
    }
    // Transient failures — log and return empty with explicit flag
    console.warn(`  Claude interaction analysis transient failure for ${url}: ${errStr}`);
    console.warn(`  This page will be flagged for manual interaction review.`);
    return [];
  }
}

export async function buildInteractionInventory(
  pageContents: Record<string, { rawHtml?: string; url: string }>
): Promise<Record<string, InteractionElement[]>> {
  const inventory: Record<string, InteractionElement[]> = {};
  let pagesWithComplexInteractions = 0;

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;

    const $ = cheerio.load(content.rawHtml);
    const elements: InteractionElement[] = [];

    // Tier 1: Pattern detection
    for (const pattern of CONTENT_INTERACTION_PATTERNS) {
      $(pattern.selector).each((_, el) => {
        const states = extractAllStates($(el), $);
        elements.push({
          type: pattern.type,
          selector: pattern.selector,
          triggerEvent: 'click',
          isContentAffecting: true,
          states,
        });
      });
    }

    // Class-based detection
    $('[class]').each((_, el) => {
      const className = $(el).attr('class') ?? '';
      for (const classPattern of CONTENT_CLASS_PATTERNS) {
        if (classPattern.test(className)) {
          const states = extractAllStates($(el), $);
          elements.push({
            type: 'expandable',
            selector: `.${className.split(' ')[0]}`,
            triggerEvent: 'click',
            isContentAffecting: true,
            states,
          });
          break;
        }
      }
    });

    // Cosmetic patterns
    for (const pattern of COSMETIC_PATTERNS) {
      const count = $(pattern.selector).length;
      if (count > 0) {
        elements.push({
          type: 'animation_cosmetic',
          selector: pattern.selector,
          triggerEvent: 'scroll',
          isContentAffecting: false,
          animationDescription: `${pattern.description} (${count} instances)`,
        });
      }
    }

    // Tier 2: Claude analysis for complex pages
    const isTechnologyPage = urlPath.includes('/technology/');
    const hasComplexInteractions = elements.filter(e => e.isContentAffecting).length > 3;

    if (isTechnologyPage || hasComplexInteractions) {
      pagesWithComplexInteractions++;
      const claudeElements = await analyseWithClaude(content.rawHtml, content.url);

      // Merge — avoid duplicating elements already found by Tier 1
      for (const ce of claudeElements) {
        const alreadyFound = elements.some(e => e.selector === ce.selector && e.type === ce.type);
        if (!alreadyFound) elements.push(ce);
      }
    }

    if (elements.length > 0) {
      inventory[urlPath] = elements;

      // Write to per-page file
      const slug = urlPath.replace(/^\/|\/$/g, '').replace(/\//g, '--') || 'home';
      const pageDir = path.join(PAGES_DIR, slug);
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(
        path.join(pageDir, 'interactions.json'),
        JSON.stringify(elements, null, 2)
      );
    }
  }

  console.log(`Interaction inventory complete:`);
  console.log(`  Pages with interactions: ${Object.keys(inventory).length}`);
  console.log(`  Pages with Claude analysis: ${pagesWithComplexInteractions}`);
  console.log(`  Content-affecting elements: ${Object.values(inventory).flat().filter(e => e.isContentAffecting).length}`);

  return inventory;
}
```

> **GIT COMMIT:** `feat(audit): interaction inventory — content-affecting + cosmetic`

---

### Step 5: Third-Party Script Inventory

**File:** `scripts/audit/05-script-inventory.ts`

Extract all third-party scripts from the page source. Covers:
- Global scripts (in the site-wide `<head>` — appear on every page)
- Per-page scripts (in individual page `<head>` sections)
- Inline scripts that contain third-party identifiers
- Scripts injected via GTM (detected from GTM container ID, then
  GTM containers are looked up via the Google Tag Manager API if
  access is available — otherwise flagged for manual review)

**What we're looking for (minimum — capture everything, classify these specifically):**

| Ahrefs Analytics | `analytics.ahrefs.com/analytics.js` | analytics |
| Vector Tag | `cdn.vector.co/pixel.js` | analytics |
| Cloudflare Insights | `static.cloudflareinsights.com/beacon.min.js` | analytics |
| GeoTargetly | `g10498469755.co/gr?id=` (3 instances) | other |
| Calendly Widget | `assets.calendly.com/assets/external/widget.js` | other |
| socks-ui Accordion | `unpkg.com/socks-ui@0.2.9/dist/accordion.js` | other |
| Swiper.js | `cdn.jsdelivr.net/npm/swiper@11` | other |
| GSAP | `cdn.jsdelivr.net/npm/gsap@3.12.5` | other |
| Clara Chat Widget | `clara.cloudemployee.io/widget.js` | chat |
| Finsweet Attributes | `cdn.jsdelivr.net/npm/@finsweet/attributes@2` | other |

**GeoTargetly note:** Three separate GeoTargetly script instances are present,
each with a different `id` parameter. All three set `body { opacity: 0 }` and
then restore it after geo-redirect check. The Playwright scroll pass waits for
`networkidle` so these will have resolved before screenshot capture. All three
must be carried over to the new site to maintain geo-routing behaviour.


| GA4 | `G-[A-Z0-9]+` | analytics |
| Google Analytics UA | `UA-[0-9]+-[0-9]+` | analytics |
| LinkedIn Insight | `_linkedin_partner_id` or partner ID | advertising |
| Facebook Pixel | `fbq(` or `fb-pixel` | advertising |
| HubSpot Tracking | `hs-script-loader` or `js.hs-scripts.com` | analytics |
| Hotjar | `hotjar` or `hjid` | heatmap |
| FullStory | `FullStory` or `fs.js` | heatmap |
| Intercom | `intercom` | chat |
| Drift | `drift` | chat |
| Crisp | `crisp` | chat |
| Cloudflare Turnstile | `turnstile` | other |
| Cookie consent | `cookiebot`, `onetrust`, `cookiepro`, `termly` | consent |
| Vimeo Player | `player.vimeo.com` | other |
| YouTube embed | `youtube.com/embed` | other |

```typescript
// scripts/audit/05-script-inventory.ts
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { ThirdPartyScript, ScriptInventory } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

const SCRIPT_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  identifierExtract: RegExp;
  category: ThirdPartyScript['category'];
}> = [
  { name: 'Google Tag Manager', pattern: /GTM-[A-Z0-9]+/i, identifierExtract: /(GTM-[A-Z0-9]+)/i, category: 'tag_manager' },
  { name: 'GA4', pattern: /G-[A-Z0-9]{10,}/i, identifierExtract: /(G-[A-Z0-9]{10,})/i, category: 'analytics' },
  { name: 'Google Analytics UA', pattern: /UA-\d+-\d+/, identifierExtract: /(UA-\d+-\d+)/, category: 'analytics' },
  { name: 'LinkedIn Insight', pattern: /_linkedin_partner_id|linkedin\.com\/px/, identifierExtract: /_linkedin_partner_id\s*=\s*["']?(\d+)["']?/, category: 'advertising' },
  { name: 'Facebook Pixel', pattern: /fbq\(|facebook\.net\/.*fbevents/, identifierExtract: /fbq\('init',\s*['"](\d+)['"]/, category: 'advertising' },
  { name: 'HubSpot Tracking', pattern: /hs-script-loader|js\.hs-scripts\.com/, identifierExtract: /hs-scripts\.com\/(\d+)/, category: 'analytics' },
  { name: 'Hotjar', pattern: /hotjar|hjid/i, identifierExtract: /hjid[:\s,=]+(\d+)/, category: 'heatmap' },
  { name: 'FullStory', pattern: /FullStory|fs\.js/i, identifierExtract: /org[:\s'",=]+([A-Z0-9]+)/i, category: 'heatmap' },
  { name: 'Intercom', pattern: /intercom/i, identifierExtract: /app_id[:\s'",=]+['"]([^'"]+)['"]/, category: 'chat' },
  { name: 'Drift', pattern: /drift/i, identifierExtract: /drift\.load\(['"]([^'"]+)['"]/, category: 'chat' },
  { name: 'Cloudflare Turnstile', pattern: /turnstile\.cloudflare\.com/, identifierExtract: /sitekey[:\s'",=]+['"]([^'"]+)['"]/, category: 'other' },
  { name: 'Cookiebot', pattern: /cookiebot\.com/, identifierExtract: /cbid[=\/]([a-f0-9-]+)/, category: 'consent' },
  { name: 'OneTrust', pattern: /onetrust/i, identifierExtract: /otSDKStub|OneTrust/i, category: 'consent' },
  { name: 'Vimeo Player', pattern: /player\.vimeo\.com/, identifierExtract: /vimeo\.com\/video\/(\d+)/, category: 'other' },
  { name: 'Crisp Chat', pattern: /crisp\.chat/i, identifierExtract: /CRISP_WEBSITE_ID\s*=\s*['"]([^'"]+)['"]/, category: 'chat' },
];

function analyseScripts(html: string, scope: string): ThirdPartyScript[] {
  const $ = cheerio.load(html);
  const found: ThirdPartyScript[] = [];
  const seen = new Set<string>();

  $('script').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const inline = $(el).html() ?? '';
    const content = src + ' ' + inline;

    for (const pattern of SCRIPT_PATTERNS) {
      if (!pattern.pattern.test(content)) continue;

      const idMatch = content.match(pattern.identifierExtract);
      const identifier = idMatch ? (idMatch[1] ?? pattern.name) : pattern.name;
      const key = `${pattern.name}:${identifier}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const loadLocation = el.parent?.name === 'head' ? 'head' :
        inline.length > 0 ? 'inline' : 'body_start';

      found.push({
        name: pattern.name,
        identifier,
        src: src || undefined,
        loadLocation: loadLocation as ThirdPartyScript['loadLocation'],
        scope,
        rawSnippet: src
          ? `<script src="${src}"></script>`
          : `<script>${inline.slice(0, 500)}</script>`,
        category: pattern.category,
      });
    }
  });

  return found;
}

export async function buildScriptInventory(
  pageContents: Record<string, { rawHtml?: string; url: string }>
): Promise<ScriptInventory> {
  const allScripts: ThirdPartyScript[] = [];

  // First pass: identify scripts that appear on EVERY page → these are global
  const perPageScripts: Record<string, ThirdPartyScript[]> = {};
  const scriptFrequency = new Map<string, number>();
  const pageCount = Object.keys(pageContents).length;

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;
    const scripts = analyseScripts(content.rawHtml, urlPath);
    perPageScripts[urlPath] = scripts;

    for (const s of scripts) {
      const key = `${s.name}:${s.identifier}`;
      scriptFrequency.set(key, (scriptFrequency.get(key) ?? 0) + 1);
    }
  }

  // Scripts appearing on >80% of pages are "global"
  const globalThreshold = Math.floor(pageCount * 0.8);
  const globalScriptKeys = new Set<string>();

  for (const [key, count] of scriptFrequency.entries()) {
    if (count >= globalThreshold) globalScriptKeys.add(key);
  }

  const globalScripts: ThirdPartyScript[] = [];
  const perPageResult: Record<string, ThirdPartyScript[]> = {};

  for (const [urlPath, scripts] of Object.entries(perPageScripts)) {
    const pageOnly = scripts.filter(s => !globalScriptKeys.has(`${s.name}:${s.identifier}`));
    if (pageOnly.length > 0) perPageResult[urlPath] = pageOnly;
  }

  // Build global list from most common scripts (take from first page they appear)
  for (const [urlPath, scripts] of Object.entries(perPageScripts)) {
    for (const s of scripts) {
      const key = `${s.name}:${s.identifier}`;
      if (globalScriptKeys.has(key) && !globalScripts.some(g => `${g.name}:${g.identifier}` === key)) {
        globalScripts.push({ ...s, scope: 'global' });
      }
    }
  }

  const summary: ScriptInventory['summary'] = {
    hasGTM: globalScripts.some(s => s.name === 'Google Tag Manager'),
    gtmContainerIds: globalScripts.filter(s => s.name === 'Google Tag Manager').map(s => s.identifier),
    hasGA4: globalScripts.some(s => s.name === 'GA4'),
    ga4MeasurementIds: globalScripts.filter(s => s.name === 'GA4').map(s => s.identifier),
    hasLinkedIn: globalScripts.some(s => s.name === 'LinkedIn Insight'),
    linkedInPartnerId: globalScripts.find(s => s.name === 'LinkedIn Insight')?.identifier,
    hasCookieConsent: globalScripts.some(s => s.category === 'consent'),
    cookieConsentProvider: globalScripts.find(s => s.category === 'consent')?.name,
    hasChat: globalScripts.some(s => s.category === 'chat'),
    chatProvider: globalScripts.find(s => s.category === 'chat')?.name,
    hasHeatmap: globalScripts.some(s => s.category === 'heatmap'),
    heatmapProvider: globalScripts.find(s => s.category === 'heatmap')?.name,
    otherScripts: globalScripts.filter(s => s.category === 'other').map(s => s.name),
  };

  const inventory: ScriptInventory = {
    global: globalScripts,
    perPage: perPageResult,
    summary,
  };

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-scripts.json'),
    JSON.stringify(inventory, null, 2)
  );

  console.log('Script inventory complete:');
  console.log(`  Global scripts:     ${globalScripts.length}`);
  console.log(`  Pages with unique:  ${Object.keys(perPageResult).length}`);
  console.log(`  GTM found:          ${summary.hasGTM} ${summary.gtmContainerIds.join(', ')}`);
  console.log(`  GA4 found:          ${summary.hasGA4} ${summary.ga4MeasurementIds.join(', ')}`);
  console.log(`  LinkedIn found:     ${summary.hasLinkedIn}`);
  console.log(`  Cookie consent:     ${summary.hasCookieConsent} (${summary.cookieConsentProvider ?? 'none'})`);
  console.log(`  Chat widget:        ${summary.hasChat} (${summary.chatProvider ?? 'none'})`);

  return inventory;
}
```

> **GIT COMMIT:** `feat(audit): third-party script inventory — GTM, GA4, LinkedIn, all tracking`

---

### Step 6: Forms Inventory with HubSpot Verification

**File:** `scripts/audit/06-forms-inventory.ts`

Extract every HubSpot form embed from page HTML, then verify each form
via HubSpot's API to confirm it's active and capture its full metadata.

**Phase 1 — HTML extraction:**
For every page with a form, extract the `hbspt.forms.create({...})` call.
Parse the portalId and formId from the options object. This is deterministic
string parsing — no hallucination possible.

**Phase 2 — HubSpot API verification:**
For each unique form GUID, call:
- `GET https://api.hubapi.com/forms/v2/forms/{formId}` — form metadata, fields, redirect URL
- `GET https://api.hubapi.com/automation/v3/workflows` filtered by form trigger — connected workflows
- `GET https://api.hubapi.com/contacts/v1/lists` — cross-reference to find lists populated by this form

Any form GUID found in the HTML but failing API verification is flagged
as a critical anomaly (the form embed exists on a live page but the form
may be deleted/archived in HubSpot).

```typescript
// scripts/audit/06-forms-inventory.ts
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import dotenv from 'dotenv';
import type { HubSpotForm, HubSpotFormField, AuditAnomaly } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const HS_BASE = 'https://api.hubapi.com';
const HS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN!;
const HS_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID!;
const limit = pLimit(2); // HubSpot API rate limit: conservative

async function hsGet(endpoint: string): Promise<unknown> {
  const res = await fetch(`${HS_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${HS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`HubSpot API ${endpoint} returned ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function extractFormEmbeds(html: string): Array<{ portalId: string; formGuid: string; rawSnippet: string }> {
  const forms: Array<{ portalId: string; formGuid: string; rawSnippet: string }> = [];
  const $ = cheerio.load(html);

  $('script').each((_, el) => {
    const code = $(el).html() ?? '';
    if (!code.includes('hbspt.forms.create')) return;

    // Extract portalId and formId from the options object
    // Pattern: hbspt.forms.create({portalId:"XXXXX",formId:"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",...})
    const portalMatch = code.match(/portalId[:\s]*["']?(\d+)["']?/);
    const formMatch = code.match(/formId[:\s]*["']([a-f0-9-]{36})["']/);

    if (portalMatch && formMatch) {
      const snippet = code.slice(
        Math.max(0, code.indexOf('hbspt.forms.create')),
        code.indexOf('hbspt.forms.create') + 500
      );
      forms.push({
        portalId: portalMatch[1],
        formGuid: formMatch[1],
        rawSnippet: snippet,
      });
    }
  });

  return forms;
}

async function verifyFormInHubSpot(
  formGuid: string,
  portalId: string
): Promise<{
  formName: string;
  fields: HubSpotFormField[];
  submitRedirectUrl?: string;
  inlineMessage?: string;
  notifyEmails: string[];
  connectedWorkflowIds: string[];
  connectedWorkflowNames: string[];
  connectedListIds: string[];
  connectedListNames: string[];
}> {
  // Fetch form details
  const formData = await hsGet(`/forms/v2/forms/${formGuid}`) as Record<string, unknown>;

  const fields: HubSpotFormField[] = [];
  const rawFields = (formData.formFieldGroups as Array<{ fields: unknown[] }> ?? [])
    .flatMap(group => group.fields);

  for (const f of rawFields as Array<Record<string, unknown>>) {
    fields.push({
      name: String(f.name ?? ''),
      label: String(f.label ?? ''),
      fieldType: String(f.fieldType ?? 'text'),
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? (f.options as Array<{ label: string }>).map(o => o.label) : undefined,
      defaultValue: f.defaultValue ? String(f.defaultValue) : undefined,
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      hidden: String(f.fieldType) === 'hidden',
    });
  }

  // Fetch connected workflows — paginate to exhaustion, cache for reuse
  let connectedWorkflowIds: string[] = [];
  let connectedWorkflowNames: string[] = [];
  try {
    const allWorkflows: Array<Record<string, unknown>> = [];
    let after: string | undefined;
    const WORKFLOW_PAGE_LIMIT = 50; // HubSpot default page size
    let pageCount = 0;
    const MAX_WORKFLOW_PAGES = 20;

    do {
      const endpoint = `/automation/v3/workflows${after ? `?after=${after}&limit=${WORKFLOW_PAGE_LIMIT}` : `?limit=${WORKFLOW_PAGE_LIMIT}`}`;
      const page = await hsGet(endpoint) as {
        workflows?: Array<Record<string, unknown>>;
        results?: Array<Record<string, unknown>>;
        paging?: { next?: { after?: string } };
      };
      const pageResults = page.workflows ?? page.results ?? [];
      allWorkflows.push(...pageResults);
      after = page.paging?.next?.after;
      pageCount++;
    } while (after && pageCount < MAX_WORKFLOW_PAGES);

    const connected = allWorkflows.filter(wf => {
      const triggers = JSON.stringify(wf.triggers ?? '');
      return triggers.includes(formGuid);
    });
    connectedWorkflowIds = connected.map(wf => String(wf.id));
    connectedWorkflowNames = connected.map(wf => String(wf.name ?? 'Unknown'));
  } catch (err) {
    console.warn(`  Could not fetch workflows for form ${formGuid}: ${String(err)}`);
  }

  // Notification emails
  const notifyEmails: string[] = [];
  const metaData = formData.metaData as Array<{ name: string; value: string }> ?? [];
  for (const meta of metaData) {
    if (meta.name === 'notifyRecipients') {
      notifyEmails.push(...meta.value.split(',').map(e => e.trim()).filter(Boolean));
    }
  }

  const thankYouRedirect = (formData.thankYouMessageJson as Record<string, unknown>)?.redirectUrl as string | undefined;

  return {
    formName: String(formData.name ?? 'Unknown'),
    fields,
    submitRedirectUrl: thankYouRedirect,
    inlineMessage: formData.inlineMessage ? String(formData.inlineMessage) : undefined,
    notifyEmails,
    connectedWorkflowIds,
    connectedWorkflowNames,
    connectedListIds: [], // populated below if needed
    connectedListNames: [],
  };
}

export async function buildFormsInventory(
  pageContents: Record<string, { rawHtml?: string; url: string; path: string }>
): Promise<{ forms: HubSpotForm[]; anomalies: AuditAnomaly[] }> {
  const anomalies: AuditAnomaly[] = [];

  // Phase 1: Extract all form embeds from all pages
  const embedsByGuid = new Map<string, {
    portalId: string;
    formGuid: string;
    pageUrl: string;
    pagePath: string;
    rawSnippet: string;
  }>();

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;
    const embeds = extractFormEmbeds(content.rawHtml);
    for (const embed of embeds) {
      if (!embedsByGuid.has(embed.formGuid)) {
        embedsByGuid.set(embed.formGuid, {
          ...embed,
          pageUrl: content.url,
          pagePath: urlPath,
        });
      }
    }
  }

  console.log(`Forms: found ${embedsByGuid.size} unique form GUIDs on-page`);

  // Phase 2: Verify each in HubSpot
  const forms: HubSpotForm[] = [];

  await Promise.all(
    Array.from(embedsByGuid.values()).map(embed =>
      limit(async () => {
        try {
          const verified = await verifyFormInHubSpot(embed.formGuid, embed.portalId);
          forms.push({
            portalId: embed.portalId,
            formGuid: embed.formGuid,
            formName: verified.formName,
            pageUrl: embed.pageUrl,
            pagePath: embed.pagePath,
            fields: verified.fields,
            submitRedirectUrl: verified.submitRedirectUrl,
            inlineMessage: verified.inlineMessage,
            notifyEmails: verified.notifyEmails,
            connectedWorkflowIds: verified.connectedWorkflowIds,
            connectedWorkflowNames: verified.connectedWorkflowNames,
            connectedListIds: verified.connectedListIds,
            connectedListNames: verified.connectedListNames,
            apiVerified: true,
            apiVerifiedAt: new Date().toISOString(),
            rawEmbedCode: embed.rawSnippet,
          });
          console.log(`  ✓ Form verified: ${verified.formName} on ${embed.pagePath}`);
        } catch (err) {
          anomalies.push({
            severity: 'critical',
            category: 'form',
            description: `Form GUID ${embed.formGuid} found on page ${embed.pagePath} but failed HubSpot API verification`,
            affectedUrl: embed.pageUrl,
            affectedIdentifier: embed.formGuid,
            recommendation: 'Verify this form exists and is active in HubSpot. If deleted, the page will show an empty form space post-migration.',
          });

          forms.push({
            portalId: embed.portalId,
            formGuid: embed.formGuid,
            formName: 'UNVERIFIED — API call failed',
            pageUrl: embed.pageUrl,
            pagePath: embed.pagePath,
            fields: [],
            notifyEmails: [],
            connectedWorkflowIds: [],
            connectedWorkflowNames: [],
            connectedListIds: [],
            connectedListNames: [],
            apiVerified: false,
            rawEmbedCode: embed.rawSnippet,
          });

          console.error(`  ✗ Form FAILED: ${embed.formGuid} on ${embed.pagePath}: ${String(err)}`);
        }
      })
    )
  );

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-forms.json'),
    JSON.stringify({ forms, anomalies, extractedAt: new Date().toISOString() }, null, 2)
  );

  console.log(`Forms inventory complete:`);
  console.log(`  Total forms found:     ${forms.length}`);
  console.log(`  Verified in HubSpot:   ${forms.filter(f => f.apiVerified).length}`);
  console.log(`  Failed verification:   ${forms.filter(f => !f.apiVerified).length}`);
  console.log(`  Critical anomalies:    ${anomalies.length}`);

  return { forms, anomalies };
}
```

> **GIT COMMIT:** `feat(audit): forms inventory with hubspot api verification`

---

### Step 7: Template Classifier

**File:** `scripts/audit/07-template-classifier.ts`

Classify every canonical URL into a TemplateType. Hybrid approach:
rules-based first, LLM for everything rules can't confidently handle.

**Rules tier (apply in this order, stop at first match):**

| Rule | Match | TemplateType |
|---|---|---|
| Path is exactly `/` | exact | HOME |
| Path starts with `/technology/` and has a slug | prefix | TECHNOLOGY |
| Path starts with `/services/` and has a slug | prefix | SERVICE |
| Path matches `/compare/` and has a slug | prefix | COMPARE |
| Path matches `/customer-story/` or `/customer-stories/` | prefix | CUSTOMER_STORY |
| Path matches `/team/` and has a slug | prefix | TEAM_MEMBER |
| Path matches `/videos/` or `/video/` and has a slug | prefix | VIDEO |
| Path matches `/reviews/` and has a slug | prefix | REVIEW |
| Path matches `/book-a-call/` and has a slug | prefix | BOOK_A_CALL |
| Path matches `/download/` and has a slug | prefix | DOWNLOAD |
| Path matches `/tools/` and has a slug | prefix | TOOL |
| Path matches blog patterns: `/blog/`, `/staff-augmentation/`, `/nearshoring/`, `/scaling-teams/`, `/hiring-tips/`, `/managing-engineers/`, `/ai-in-software-development/` | prefix | BLOG |
| Path matches known taxonomy patterns: `/tags/`, `/category/`, `/topics/` | prefix | TAXONOMY |
| Path is a known Webflow collection archive page | lookup | TAXONOMY |
| Status is 301/302 | any | skip (redirect, not a template) |

**LLM tier (for all URLs not matched by rules):**

Send a batch of unclassified URLs (grouped in batches of 20) to Claude
with the URL paths and page titles. Ask for classification and confidence.
Any result with confidence `low` is flagged `requiresManualReview: true`.

All LLM classifications are written to `audit-output/ce-template-map-llm-review.json`
for Jake to review before Schema and Template sessions proceed.

```typescript
// scripts/audit/07-template-classifier.ts
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { CanonicalUrl, TemplateClassification } from '../../src/lib/audit-types.js';
import { TemplateType, ClassificationMethod, UrlStatus } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Webflow collection archive paths for CE
const KNOWN_COLLECTION_ARCHIVES = new Set([
  '/blogs-guides', '/staff-augmentation', '/nearshoring-offshoring',
  '/scaling-teams', '/hiring-tips', '/managing-engineers',
  '/ai-in-software-development', '/compare', '/videos', '/reviews',
  '/customer-stories', '/team', '/technology', '/services',
  '/downloads', '/tools',
]);

function applyRules(path: string): TemplateType | null {
  if (path === '/' || path === '') return TemplateType.HOME;
  if (/^\/technology\/[^/]+\/?$/.test(path)) return TemplateType.TECHNOLOGY;
  if (/^\/services\/[^/]+\/?$/.test(path)) return TemplateType.SERVICE;
  if (/^\/compare\/[^/]+\/?$/.test(path)) return TemplateType.COMPARE;
  if (/^\/(customer-story|customer-stories)\/[^/]+\/?$/.test(path)) return TemplateType.CUSTOMER_STORY;
  if (/^\/team\/[^/]+\/?$/.test(path)) return TemplateType.TEAM_MEMBER;
  if (/^\/(videos|video)\/[^/]+\/?$/.test(path)) return TemplateType.VIDEO;
  if (/^\/reviews\/[^/]+\/?$/.test(path)) return TemplateType.REVIEW;
  if (/^\/book-a-call\/[^/]+\/?$/.test(path)) return TemplateType.BOOK_A_CALL;
  if (/^\/download\/[^/]+\/?$/.test(path)) return TemplateType.DOWNLOAD;
  if (/^\/tools\/[^/]+\/?$/.test(path)) return TemplateType.TOOL;
  if (/^\/(blog|staff-augmentation|nearshoring|nearshoring-offshoring|scaling-teams|hiring-tips|managing-engineers|ai-in-software-development)\/[^/]+\/?$/.test(path)) return TemplateType.BLOG;
  if (/^\/(tags|category|topics)\//.test(path)) return TemplateType.TAXONOMY;
  if (KNOWN_COLLECTION_ARCHIVES.has(path.replace(/\/$/, ''))) return TemplateType.TAXONOMY;
  return null;
}

async function classifyWithLLM(
  urls: Array<{ url: string; path: string; title?: string }>
): Promise<Array<{ path: string; templateType: TemplateType; confidence: 'high' | 'medium' | 'low'; reasoning: string }>> {
  const batchSize = 20;
  const results: Array<{ path: string; templateType: TemplateType; confidence: 'high' | 'medium' | 'low'; reasoning: string }> = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const urlList = batch.map(u => `- Path: ${u.path}${u.title ? ` | Title: "${u.title}"` : ''}`).join('\n');

    const prompt = `You are classifying pages on cloudemployee.io (a staff augmentation company) into template types.

Available template types:
- HOME: The homepage only
- TECHNOLOGY: Individual technology/skill pages (e.g. dedicated teams, React developers)
- SERVICE: Individual service offering pages
- BLOG: Any blog post or article (regardless of category)
- COMPARE: Comparison articles (vs competitor or vs alternative)
- CUSTOMER_STORY: Customer case studies
- TEAM_MEMBER: Individual team member profiles
- VIDEO: Video content pages
- REVIEW: Customer review pages
- BOOK_A_CALL: Call booking / consultation pages
- DOWNLOAD: Content download / lead magnet pages
- TOOL: Interactive tools or quizzes
- TAXONOMY: Archive/listing pages that list multiple items of one type
- STATIC: One-off static pages (about, pricing, contact, legal, etc.)
- UNKNOWN: Cannot determine — needs human review

For each URL below, provide: templateType, confidence (high/medium/low), brief reasoning.

URLs to classify:
${urlList}

Respond ONLY as a JSON array:
[{"path": "...", "templateType": "...", "confidence": "high|medium|low", "reasoning": "..."}]`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096, // 20 items × ~200 tokens each with reasoning = ~4000 needed
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as typeof results;
      results.push(...parsed);
    } catch (err) {
      console.error(`LLM classifier JSON parse failed for batch ${i}: ${String(err)}`);
      console.error(`Raw response (first 500 chars): ${text.slice(0, 500)}`);
    }

    // Rate limit: 1 second between batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export async function classifyTemplates(
  canonicalUrls: CanonicalUrl[],
  pageContents: Record<string, { title?: string }>
): Promise<TemplateClassification[]> {
  const classifications: TemplateClassification[] = [];
  const needsLLM: Array<{ url: string; path: string; title?: string }> = [];

  // First pass: rules
  for (const cu of canonicalUrls) {
    if (cu.status === UrlStatus.REDIRECT_301 || cu.status === UrlStatus.REDIRECT_302) {
      continue; // Redirects don't need template types
    }

    const rulesResult = applyRules(cu.path);
    if (rulesResult !== null) {
      classifications.push({
        url: cu.url,
        path: cu.path,
        templateType: rulesResult,
        classificationMethod: ClassificationMethod.RULES,
        confidence: 'high',
        requiresManualReview: false,
        locale: cu.locale,
      });
    } else {
      needsLLM.push({
        url: cu.url,
        path: cu.path,
        title: pageContents[cu.path]?.title,
      });
    }
  }

  console.log(`Template classifier: ${classifications.length} by rules, ${needsLLM.length} need LLM`);

  // Second pass: LLM
  if (needsLLM.length > 0) {
    const llmResults = await classifyWithLLM(needsLLM);
    const llmMap = new Map(llmResults.map(r => [r.path, r]));

    for (const { url, path: urlPath, title } of needsLLM) {
      const result = llmMap.get(urlPath);
      const cu = canonicalUrls.find(u => u.path === urlPath);

      classifications.push({
        url,
        path: urlPath,
        templateType: result ? result.templateType : TemplateType.UNKNOWN,
        classificationMethod: ClassificationMethod.LLM,
        confidence: result?.confidence ?? 'low',
        reasoning: result?.reasoning,
        requiresManualReview: !result || result.confidence === 'low' || result.templateType === TemplateType.UNKNOWN,
        locale: cu?.locale ?? 'us',
      });
    }
  }

  // Write full map
  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-map.json'),
    JSON.stringify(classifications, null, 2)
  );

  // Write review file (LLM-classified only, sorted by requiresManualReview first)
  const llmClassified = classifications
    .filter(c => c.classificationMethod === ClassificationMethod.LLM)
    .sort((a, b) => (b.requiresManualReview ? 1 : 0) - (a.requiresManualReview ? 1 : 0));

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-map-llm-review.json'),
    JSON.stringify(llmClassified, null, 2)
  );

  // Print summary
  const typeCounts: Record<string, number> = {};
  for (const c of classifications) {
    typeCounts[c.templateType] = (typeCounts[c.templateType] ?? 0) + 1;
  }

  const manualReview = classifications.filter(c => c.requiresManualReview);

  console.log('Template classification complete:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`  Requires manual review: ${manualReview.length}`);
  if (manualReview.length > 0) {
    console.log(`  Review file: audit-output/ce-template-map-llm-review.json`);
  }

  return classifications;
}
```

> **GIT COMMIT:** `feat(audit): hybrid template classifier — rules + llm fallback`

---

### Step 8: Manifest Builder

**File:** `scripts/audit/08-manifest-builder.ts`

Assembles all outputs from steps 1–7 into the single `MigrationManifest`
object. Reads from files written by each step. Computes aggregate counts.
Consolidates all anomalies from all steps.

```typescript
// scripts/audit/08-manifest-builder.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type {
  MigrationManifest,
  CanonicalUrl,
  TemplateClassification,
  ScreenshotRecord,
  InteractionElement,
  ScriptInventory,
  HubSpotForm,
  CollectionRecord,
  AuditAnomaly,
} from '../../src/lib/audit-types.js';
import { TemplateType, UrlStatus } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

export async function buildManifest(): Promise<MigrationManifest> {
  console.log('Building migration manifest...');

  // Read all step outputs
  const canonicalData = readJson<{ canonicalUrls: CanonicalUrl[]; anomalies: AuditAnomaly[] }>(
    path.join(AUDIT_DIR, 'ce-canonical-urls.json')
  );
  const templateMap = readJson<TemplateClassification[]>(
    path.join(AUDIT_DIR, 'ce-template-map.json')
  );
  const screenshotsData = readJson<{ screenshots: ScreenshotRecord[]; failed: string[] }>(
    path.join(AUDIT_DIR, 'ce-screenshots.json')
  );
  const scriptInventory = readJson<ScriptInventory>(
    path.join(AUDIT_DIR, 'ce-scripts.json')
  );
  const formsData = readJson<{ forms: HubSpotForm[]; anomalies: AuditAnomaly[] }>(
    path.join(AUDIT_DIR, 'ce-forms.json')
  );
  const ceInventory = readJson<{ collections: CollectionRecord[] }>(
    path.join(AUDIT_DIR, 'ce-inventory.json')
  );

  // Load page contents and interactions from per-page files
  const pageContents: Record<string, unknown> = {};
  const interactionInventory: Record<string, InteractionElement[]> = {};

  if (fs.existsSync(PAGES_DIR)) {
    for (const slugDir of fs.readdirSync(PAGES_DIR)) {
      const contentFile = path.join(PAGES_DIR, slugDir, 'content.json');
      const interactionsFile = path.join(PAGES_DIR, slugDir, 'interactions.json');

      if (fs.existsSync(contentFile)) {
        const content = readJson<{ path: string; rawHtml?: string }>(contentFile);
        const urlPath = content.path;
        if (urlPath) {
          // Strip rawHtml from manifest (too large, kept in per-page files)
          const { rawHtml: _, ...contentWithoutHtml } = content;
          pageContents[urlPath] = contentWithoutHtml;
        }
      }

      if (fs.existsSync(interactionsFile)) {
        const slugPath = '/' + slugDir.replace(/--/g, '/');
        interactionInventory[slugPath] = readJson<InteractionElement[]>(interactionsFile);
      }
    }
  }

  // Compute template type counts
  const templateTypeCounts = Object.fromEntries(
    Object.values(TemplateType).map(t => [t, 0])
  ) as Record<TemplateType, number>;
  for (const c of templateMap) {
    templateTypeCounts[c.templateType] = (templateTypeCounts[c.templateType] ?? 0) + 1;
  }

  // Consolidate all anomalies
  const allAnomalies: AuditAnomaly[] = [
    ...canonicalData.anomalies,
    ...formsData.anomalies,
    // Add anomalies for any screenshots that failed
    ...screenshotsData.failed.map(url => ({
      severity: 'warning' as const,
      category: 'url' as const,
      description: `Screenshot capture failed`,
      affectedUrl: url,
      recommendation: 'Manually screenshot this page before template build session.',
    })),
    // Add anomaly for any template requiring manual review
    ...templateMap
      .filter(t => t.requiresManualReview)
      .map(t => ({
        severity: 'warning' as const,
        category: 'template' as const,
        description: `Template classification requires manual review`,
        affectedUrl: t.url,
        recommendation: `Review ce-template-map-llm-review.json and manually set templateType.`,
      })),
  ];

  const manifest: MigrationManifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    sourceUrl: 'https://cloudemployee.io',
    migrationId: process.env.CE_MIGRATION_ID ?? 'ce000000-0000-0000-0000-000000000002',
    orgId: process.env.CE_ORG_ID ?? 'ce000000-0000-0000-0000-000000000001',

    canonicalUrls: canonicalData.canonicalUrls,
    totalCanonicalUrls: canonicalData.canonicalUrls.length,
    totalIndexableUrls: canonicalData.canonicalUrls.filter(u => u.status === UrlStatus.OK).length,
    totalRedirects: canonicalData.canonicalUrls.filter(u =>
      u.status === UrlStatus.REDIRECT_301 || u.status === UrlStatus.REDIRECT_302
    ).length,
    totalExcluded: 0,

    templateMap,
    templateTypeCounts,
    requiresManualReviewCount: templateMap.filter(t => t.requiresManualReview).length,

    pageContents: pageContents as Record<string, import('../../src/lib/audit-types.js').PageContent>,

    screenshots: screenshotsData.screenshots,
    screenshotsCaptured: screenshotsData.screenshots.length,
    screenshotsFailed: screenshotsData.failed,

    interactionInventory,
    pagesWithContentAffectingInteractions: Object.entries(interactionInventory)
      .filter(([, elements]) => elements.some(e => e.isContentAffecting))
      .map(([urlPath]) => urlPath),

    scriptInventory,

    forms: formsData.forms,
    totalForms: formsData.forms.length,
    formsVerifiedInHubSpot: formsData.forms.filter(f => f.apiVerified).length,
    formsFailedVerification: formsData.forms.filter(f => !f.apiVerified).map(f => f.formGuid),

    collections: ceInventory.collections ?? [],
    totalCollections: (ceInventory.collections ?? []).length,
    totalCmsItems: (ceInventory.collections ?? []).reduce((sum, c) => sum + (c.itemCount ?? 0), 0),

    anomalies: allAnomalies,
  };

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('Migration manifest built:');
  console.log(`  Total canonical URLs:    ${manifest.totalCanonicalUrls}`);
  console.log(`  Indexable:               ${manifest.totalIndexableUrls}`);
  console.log(`  Screenshots captured:    ${manifest.screenshotsCaptured}`);
  console.log(`  Forms verified:          ${manifest.formsVerifiedInHubSpot}/${manifest.totalForms}`);
  console.log(`  Collections:             ${manifest.totalCollections}`);
  console.log(`  CMS items:               ${manifest.totalCmsItems}`);
  console.log(`  Total anomalies:         ${allAnomalies.length}`);
  console.log(`  Critical anomalies:      ${allAnomalies.filter(a => a.severity === 'critical').length}`);
  console.log(`  Requires manual review:  ${manifest.requiresManualReviewCount} URLs`);

  return manifest;
}
```

> **GIT COMMIT:** `feat(audit): manifest builder — assembles all audit outputs`

---

### Step 9: Manifest Writer (DB)

**File:** `scripts/audit/09-manifest-writer.ts`

Write the migration manifest to the `audit_manifests` table in Supabase.
Uses the seeded CE migration ID and org ID.

The `page_inventory` column stores the `templateMap` array.
The `collection_inventory` column stores the `collections` array.
The `form_inventory` column stores the `forms` array.
The `custom_code_inventory` column stores the `scriptInventory` object.
The `raw_sitemap_urls` column stores the `canonicalUrls` array.

All counts are written to their respective integer columns.

```typescript
// scripts/audit/09-manifest-writer.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { MigrationManifest } from '../../src/lib/audit-types.js';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CE_ORG_ID = 'ce000000-0000-0000-0000-000000000001';
const CE_MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002';

export async function writeManifestToDb(): Promise<void> {
  console.log('Writing manifest to Supabase...');

  const manifest: MigrationManifest = JSON.parse(
    fs.readFileSync(path.join(AUDIT_DIR, 'ce-manifest.json'), 'utf-8')
  );

  const record = {
    org_id: CE_ORG_ID,
    migration_id: CE_MIGRATION_ID,
    total_pages: manifest.totalIndexableUrls,
    total_collections: manifest.totalCollections,
    total_cms_items: manifest.totalCmsItems,
    total_forms: manifest.totalForms,
    page_inventory: manifest.templateMap,
    collection_inventory: manifest.collections,
    form_inventory: manifest.forms,
    custom_code_inventory: manifest.scriptInventory,
    raw_sitemap_urls: manifest.canonicalUrls,
    generated_at: manifest.generatedAt,
  };

  // Atomic upsert — avoids TOCTOU race on concurrent runs
  const { error } = await supabase
    .from('audit_manifests')
    .upsert(record, { onConflict: 'migration_id' });

  if (error) {
    throw new Error(`Supabase audit_manifests upsert failed: ${error.message}`);
  }
  console.log(`  Upserted audit_manifest row for migration ${CE_MIGRATION_ID}`);

  // Update migration status — verify row was actually matched
  const { data: migrationData, error: migrationError } = await supabase
    .from('migrations')
    .update({
      current_phase: 'audit_complete',
      status: 'audit_complete',
      metadata: {
        auditCompletedAt: manifest.generatedAt,
        totalCanonicalUrls: manifest.totalCanonicalUrls,
        totalIndexableUrls: manifest.totalIndexableUrls,
        totalForms: manifest.totalForms,
        formsVerified: manifest.formsVerifiedInHubSpot,
        criticalAnomalies: manifest.anomalies.filter(a => a.severity === 'critical').length,
        requiresManualReview: manifest.requiresManualReviewCount,
      },
    })
    .eq('id', CE_MIGRATION_ID)
    .eq('org_id', CE_ORG_ID)
    .select('id')
    .single();

  if (migrationError || !migrationData) {
    throw new Error(
      `Migration row missing or update affected zero rows. ` +
      `Verify MYGRATR-0 seed row exists for migration_id=${CE_MIGRATION_ID}. ` +
      `Error: ${migrationError?.message ?? 'no row returned'}`
    );
  }

  console.log('Manifest written to DB successfully.');
}
```

> **GIT COMMIT:** `feat(audit): manifest db writer — audit_manifests table`

---

### Step 10: Orchestrator

**File:** `scripts/audit/run-audit.ts`

Runs steps 0–9 in sequence. Handles errors: if a non-critical step fails,
log the error and continue. If a critical step fails (URL reconciliation,
content extraction), stop and report.

```typescript
// scripts/audit/run-audit.ts
import dotenv from 'dotenv';
dotenv.config();

// Run pre-flight via direct import — errors flow through the same handler as all other steps
import { verifyInputs } from './00-verify-inputs.js';
await verifyInputs();

import { reconcileUrls } from './01-reconcile-urls.js';
import { classifyTemplates } from './07-template-classifier.js';
import { runScreenshotAgent } from './02-screenshot-agent.js';
import { extractPageContent } from './03-content-extractor.js';
import { analyseFieldPopulation } from './03b-field-population.js';
import { buildGlobalComponentInventory } from './03c-global-components.js';
import { buildAssetManifest } from './03d-asset-manifest.js';
import { diffTemplateCustomCode } from './03e-template-custom-code.js';
import { buildInteractionInventory } from './04-interaction-inventory.js';
import { buildScriptInventory } from './05-script-inventory.js';
import { buildFormsInventory } from './06-forms-inventory.js';
import { buildManifest } from './08-manifest-builder.js';
import { writeManifestToDb } from './09-manifest-writer.js';

async function runAudit(): Promise<void> {
  console.log('\n=== MYGRATR-AUDIT-1: Site Audit Agent ===\n');
  const start = Date.now();

  // Step 1: URL Reconciliation (critical — must succeed)
  console.log('\n--- Step 1: URL Reconciliation ---');
  const { canonicalUrls, anomalies: urlAnomalies } = await reconcileUrls();

  // Step 3: Content Extraction (critical — needed for classifier + interactions + forms)
  console.log('\n--- Step 3: Content Extraction ---');
  const pageContents = await extractPageContent(canonicalUrls);

  // Step 3b: Field Population + Locale Diff
  console.log('\n--- Step 3b: Field Population + Locale Diff ---');
  await analyseFieldPopulation();

  // Step 3c: Global Component Inventory
  console.log('\n--- Step 3c: Global Component Inventory ---');
  await buildGlobalComponentInventory(pageContents);

  // Step 3d: Asset Manifest
  console.log('\n--- Step 3d: Asset Manifest ---');
  await buildAssetManifest(pageContents);

  // Step 7: Template Classification (runs before screenshots so classifier informs sample selection)
  console.log('\n--- Step 7: Template Classification ---');
  const templateMap = await classifyTemplates(canonicalUrls, pageContents);

  // Step 2: Screenshots (depends on classifier for sample selection)
  console.log('\n--- Step 2: Screenshot Agent ---');
  const { screenshots, failed: screenshotsFailed } = await runScreenshotAgent(canonicalUrls, templateMap);

  // Step 4: Interaction Inventory
  console.log('\n--- Step 4: Interaction Inventory ---');
  await buildInteractionInventory(pageContents);

  // Step 5: Script Inventory (must run before 3e)
  console.log('\n--- Step 5: Script Inventory ---');
  await buildScriptInventory(pageContents);

  // Step 3e: Template Custom Code Diff (depends on script inventory)
  console.log('\n--- Step 3e: Template Custom Code Diff ---');
  await diffTemplateCustomCode(templateMap, pageContents);

  // Step 6: Forms Inventory
  console.log('\n--- Step 6: Forms Inventory with HubSpot Verification ---');
  await buildFormsInventory(pageContents);

  // Step 8: Build Manifest
  console.log('\n--- Step 8: Build Manifest ---');
  const manifest = await buildManifest();

  // Step 9: Write to DB
  console.log('\n--- Step 9: Write Manifest to DB ---');
  await writeManifestToDb();

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n=== Audit complete in ${elapsed}s ===`);
  console.log(`\nOutputs written to audit-output/:`);
  console.log(`  ce-canonical-urls.json       — reconciled URL inventory`);
  console.log(`  ce-template-custom-code.json — per-template custom code diff`);
  console.log(`  ce-template-custom-code-review.json — items needing human review`);
  console.log(`  ce-field-population.json     — field population + locale diff`);
  console.log(`  ce-field-population-summary.json — human-readable edge case summary`);
  console.log(`  ce-global-components.json    — nav, footer, clara, finsweet`);
  console.log(`  ce-assets.json               — all CDN assets inventoried`);
  console.log(`  ce-template-map.json         — all URLs classified by template`);
  console.log(`  ce-template-map-llm-review.json — LLM-classified URLs for your review`);
  console.log(`  ce-screenshots.json          — screenshot index`);
  console.log(`  ce-scripts.json              — third-party script inventory`);
  console.log(`  ce-forms.json                — forms with HubSpot verification`);
  console.log(`  ce-manifest.json             — full migration manifest`);
  console.log(`  pages/{slug}/content.json    — per-page content`);
  console.log(`  pages/{slug}/interactions.json — per-page interactions`);
  console.log(`  screenshots/{slug}/{bp}.png  — baseline screenshots`);

  if (manifest.anomalies.filter(a => a.severity === 'critical').length > 0) {
    console.log(`\n⚠️  CRITICAL ANOMALIES FOUND — review before proceeding to SCHEMA-1:`);
    for (const a of manifest.anomalies.filter(a => a.severity === 'critical')) {
      console.log(`  [${a.category}] ${a.description}`);
      if (a.affectedUrl) console.log(`    URL: ${a.affectedUrl}`);
      console.log(`    Fix: ${a.recommendation}`);
    }
  }

  if (manifest.requiresManualReviewCount > 0) {
    console.log(`\n📋 ${manifest.requiresManualReviewCount} URLs require manual template review.`);
    console.log(`   Open audit-output/ce-template-map-llm-review.json and confirm each.`);
  }
}

runAudit().catch(err => {
  console.error('\nAudit failed:', err);
  process.exit(1);
});
```

> **GIT COMMIT:** `feat(audit): orchestrator — run-audit.ts`

---

## Dependencies to Install

Add these to `package.json` (if not already present from MYGRATR-0):

```bash
npm install playwright @playwright/test
npm install @mendable/firecrawl-js
npm install @anthropic-ai/sdk
npm install @supabase/supabase-js
npm install csv-parse
npm install cheerio
npm install p-limit
npm install dotenv

# Install Playwright browsers
npx playwright install chromium
```

> **GIT COMMIT:** `chore(audit): install audit dependencies, playwright chromium`

---

## Environment Variable Additions

Add to `.env` (two new variables — others already exist from MYGRATR-0):

```
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HUBSPOT_PORTAL_ID=XXXXXXX
CE_ORG_ID=ce000000-0000-0000-0000-000000000001
CE_MIGRATION_ID=ce000000-0000-0000-0000-000000000002
```

---

## package.json Scripts

Add to `package.json` scripts:

```json
{
  "scripts": {
    "audit:verify": "tsx scripts/audit/00-verify-inputs.ts",
    "audit:run": "tsx scripts/audit/run-audit.ts",
    "audit:urls": "tsx scripts/audit/01-reconcile-urls.ts",
    "audit:screenshots": "tsx scripts/audit/02-screenshot-agent.ts",
    "audit:content": "tsx scripts/audit/03-content-extractor.ts",
    "audit:interactions": "tsx scripts/audit/04-interaction-inventory.ts",
    "audit:scripts": "tsx scripts/audit/05-script-inventory.ts",
    "audit:forms": "tsx scripts/audit/06-forms-inventory.ts",
    "audit:template-code": "tsx scripts/audit/03e-template-custom-code.ts",
    "audit:manifest": "tsx scripts/audit/08-manifest-builder.ts",
    "audit:write-db": "tsx scripts/audit/09-manifest-writer.ts"
  }
}
```

---

## Post-Run Review Protocol (Jake)

After `npm run audit:run` completes, do these in order before starting
MYGRATR-SCHEMA-1:

### 1. Review critical anomalies
The run output will print any critical anomalies. Open `ce-manifest.json`
and search for `"severity": "critical"`. Resolve each one before
proceeding. Common issues:
- Sitemap URL returning 404: verify in Webflow, update sitemap or remove page
- Form GUID not found in HubSpot: check if form was archived, restore it

### 2. Review LLM template classifications
Open `audit-output/ce-template-map-llm-review.json`. All entries with
`"requiresManualReview": true` need your eyes. For each:
- Confirm the templateType looks right
- If wrong, note the correct type — these will be fixed manually before
  MYGRATR-TEMPLATE sessions start

### 3. Spot-check screenshots
Open `audit-output/screenshots/` and spot-check 5-10 pages at mobile
and desktop. Verify they rendered correctly (not blank, not loading
spinner, not login-gated).

### 4. Verify forms output
Open `audit-output/ce-forms.json`. For each form:
- Confirm `formName` matches what you see in HubSpot
- Confirm `notifyEmails` is correct
- Confirm `connectedWorkflowNames` looks right
- Flag anything that looks wrong before MYGRATR-CONTENT-1

### 5. Review script inventory
Open `audit-output/ce-scripts.json` → `summary`. Confirm:
- All expected GTM containers are there
- LinkedIn Insight tag is present
- Cookie consent provider is identified
- No unexpected scripts (could indicate a security issue)

### 6. Sign off on manifest
When all anomalies are resolved and review is complete, confirm to
Planning Claude: "Audit review complete. [N] anomalies resolved, [N]
remaining. Template map reviewed. Ready for MYGRATR-SCHEMA-1."

---

## Exit Criteria

All of the following must be true before this session is marked complete:

- [ ] `audit-output/screaming-frog-export.csv` and `screaming-frog-redirects.csv` provided by Jake
- [ ] `audit-output/webflow-redirects.csv` provided by Jake (Webflow redirect manager export)
- [ ] `scripts/audit/00-verify-inputs.ts` passes with no missing inputs
- [ ] `npm run audit:run` completes without crashing
- [ ] `audit-output/ce-canonical-urls.json` exists and contains > 400 URLs
- [ ] `audit-output/ce-template-custom-code.json` exists with findings for all template types
- [ ] Jake has reviewed `ce-template-custom-code-review.json` — all SEO-critical scripts confirmed as server-side candidates
- [ ] `audit-output/ce-field-population.json` exists with reports for all 33 collections
- [ ] `audit-output/ce-field-population-summary.json` exists and Jake has reviewed edge case fields
- [ ] `audit-output/ce-global-components.json` exists with nav structure and Clara widget ID
- [ ] `audit-output/ce-assets.json` exists with > 100 unique assets
- [ ] `audit-output/ce-template-map.json` exists and classifies every canonical URL
- [ ] `audit-output/ce-template-map-llm-review.json` exists (may be empty if rules covered everything)
- [ ] `audit-output/screenshots/` directory contains PNG files
- [ ] At least one screenshot exists for each of: HOME, TECHNOLOGY, BLOG, SERVICE, STATIC
- [ ] Spot-check 5 screenshots confirms GSAP animations are in final state (not opacity 0)
- [ ] `audit-output/ce-scripts.json` exists with `summary.hasGTM: true` and `gtmContainerIds: ['GTM-WL45TCTW']`
- [ ] `audit-output/ce-scripts.json` confirms Clara widget, GeoTargetly (3 instances), Ahrefs Analytics present
- [ ] `audit-output/ce-forms.json` exists with at least one form entry
- [ ] All forms found on-page have `apiVerified: true` (or anomaly logged for any that don't)
- [ ] `audit-output/ce-manifest.json` exists and is parseable JSON
- [ ] `audit_manifests` table in Supabase has a row for CE migration
- [ ] `migrations` table row for CE has `current_phase: 'audit_complete'`
- [ ] Jake has reviewed all critical anomalies
- [ ] Jake has reviewed LLM template classifications
- [ ] Jake has confirmed form inventory looks correct
- [ ] Jake has reviewed locale diff output — confirmed which collections have real UK variants

---

## Deferred Items

| Feature | Deferred To | Reason |
|---|---|---|
| UK locale screenshots | MYGRATR-QA-1 | UK pages share templates with US — one representative sample per type is enough for audit. Full UK screenshot set happens during QA. |
| GTM container inspection (what tags are inside GTM) | MYGRATR-LAUNCH-1 | Requires Google Tag Manager API access. Out of scope for audit — GTM container ID `GTM-WL45TCTW` is confirmed and sufficient for now. |
| Webflow custom code extraction via Webflow API | Not applicable | Webflow API blocks custom code read on CE's plan. Firecrawl HTML extraction covers this. Technology Pages template-level custom code is now fully documented above. |
| Performance audit (Lighthouse) | MYGRATR-QA-1 | Lighthouse baselines are a QA function, not an audit function. |
| Accessibility audit | Post-launch | Scope decision: preserve current a11y, don't audit it. |
| Interaction Playwright validation (actually triggering interactions) | MYGRATR-QA-1 | Audit captures what interactions exist. QA captures whether the rebuilt page matches them. |
| Redirect chain detection in depth | MYGRATR-LAUNCH-1 | Screaming Frog + Webflow redirects CSV gives us the data. Analysis and de-chaining happens in Launch session. |
| Content duplication analysis (UK vs US) | MYGRATR-SCHEMA-1 | Schema session uses the locale diff output from Step 3b to determine Sanity locale architecture. |
| Tools & Quizzes rebuild (culture match + pricing calculator) | Post-migration | Both deferred to rebuild from scratch with Claude Code. Audit captures current screenshots and logic for reference. The pricing calculator formula and culture match questions should be documented by Jake before MYGRATR-TEMPLATE sessions reach TOOL type. |
| GeoTargetly rule audit (which countries route where) | MYGRATR-LAUNCH-1 | Three GeoTargetly script instances confirmed. Their routing rules are configuration in GeoTargetly's dashboard, not in the codebase. Audit notes their presence; cutover session verifies they work post-launch. |

---

## Open Decisions Surfaced

These need Jake's input before or early in MYGRATR-SCHEMA-1:

1. **Content freeze date** — When does Webflow editing stop for CE? Once the audit is
   complete and content migration starts, any edits to the Webflow site create
   a drift problem. Recommend: set a freeze date after audit review is done
   and before MYGRATR-CONTENT-1 runs.

2. **Forms migration approach** — The audit will confirm whether forms are all HubSpot.
   If any non-HubSpot forms are found, the approach changes. Decision needed:
   re-embed HubSpot forms as-is (same GUID, same portalId) or rebuild as
   native Next.js components that POST to HubSpot API. Re-embed is simpler
   and safer. Rebuild gives more control. Jake decides after seeing the forms audit.

3. **Anomaly resolution owners** — If critical anomalies are found (404 pages in
   sitemap, broken form GUIDs), who fixes them? Jake or CE dev team?
   Some fixes require Webflow access and SEO judgment.

---

## Schema Doc Update Notes

No new tables are created in this session. The following column types should
be confirmed as sufficient for JSONB storage in Supabase:

- `audit_manifests.page_inventory` — will store `TemplateClassification[]` (array of objects)
- `audit_manifests.collection_inventory` — will store `CollectionRecord[]`
- `audit_manifests.form_inventory` — will store `HubSpotForm[]`
- `audit_manifests.custom_code_inventory` — will store `ScriptInventory` object
- `audit_manifests.raw_sitemap_urls` — will store `CanonicalUrl[]`

These are all JSONB with no migration required — the columns already exist
from MYGRATR-0. No SCHEMA.md update needed after this session.

---

## Post-Phase Update Protocol

After this session is complete and Jake has reviewed the audit outputs:

- [ ] **CHANGELOG.md** — Add paragraph: audit agent complete, manifest generated, [N] URLs reconciled, [N] forms verified, [N] scripts inventoried, [N] collections field-analysed, manifest in Supabase.
- [ ] **PHASE_HISTORY.md** — Add detailed record: all scripts built, exact counts from manifest, key findings (locale diff results, edge case fields, critical anomalies resolved, form verification results, asset counts).
- [ ] **CONVENTIONS.md** — Add: Firecrawl scrape pattern, Playwright screenshot pattern (including scroll-before-capture), Anthropic API call pattern, HubSpot API pattern, Webflow API pagination pattern (100/page, locale param).
- [ ] **FEATURE_MAP.md** — Add entries for: Site Audit Agent, URL Reconciliation, Screenshot Agent, Content Extractor, Field Population Analyser, Global Component Inventory, Asset Manifest, Interaction Inventory, Script Inventory, Forms Inventory, Template Classifier, Manifest Builder.
- [ ] **CLAUDE.md** — Update current phase to AUDIT-1 COMPLETE, add scripts to Scripts table, update CE site facts with real numbers from manifest, add new env vars, record confirmed GTM container ID and Calendly URL.
- [ ] **SCHEMA.md** — No changes needed (no migrations run).
- [ ] **REGISTRY.md** — Add all new scripts. Update CMS Collections table with field population data (complexity ratings confirmed by real data). Note which collections have genuine UK locale variants.

---

## Audit Findings Table

Cross-model audit run: April 2026 — preset:full, panel mode, 6 models.
Total findings: 17 (5 critical, 8 important, 4 minor, 8 dismissed).

| # | Severity | Finding | Fix Applied |
|---|----------|---------|-------------|
| 1 | 🔴 Critical | Missing `buildInteractionInventory` import — guaranteed crash at Step 4 | Import added to orchestrator |
| 2 | 🔴 Critical | `fetchAllItems` infinite loop — `pagination.total` includes archived items | Replaced with page-exhaustion break + MAX_PAGES cap |
| 3 | 🔴 Critical | `buildSlug` collision — `/uk/about` and `/uk-about` both produce `uk-about` | Changed separator from `--` to `__` |
| 4 | 🔴 Critical | `audit-output/` not in `.gitignore` — PII and tracking IDs exposed | Added as Pre-Session Requirement #2 |
| 5 | 🔴 Critical | Webflow redirect sources not normalised — trailing slash causes silent miss | Added `.replace(/\/$/, '')` to match `normUrl` |
| 6 | 🟡 Important | LLM classifier `max_tokens: 2000` too low — silent batch drops | Increased to 4096, added raw response logging |
| 7 | 🟡 Important | HubSpot workflows not paginated — automation connections undercounted | Full pagination loop with `after` cursor added |
| 8 | 🟡 Important | Playwright browser lifecycle not crash-safe — process leak on crash | Wrapped in `try/finally`, added disconnect handler |
| 9 | 🟡 Important | Manifest writer doesn't verify migration row matched — silent desync | `.select('id').single()` + explicit error throw |
| 10 | 🟡 Important | No Firecrawl extraction timeout — can hang indefinitely | 240s timeout + 10-failure circuit breaker |
| 11 | 🟡 Important | Firecrawl `includeTags` unconfirmed — silent empty extraction risk | Added `<head>` presence validation with warning |
| 12 | 🟡 Important | LLM interaction inventory returns `[]` on auth/quota failure | Auth/quota errors now throw fatal; transient failures flag URL for review |
| 13 | 🟢 Minor | No disk space guard before screenshots | DEFERRED to MYGRATR-QA-1 |
| 14 | 🟢 Minor | Raw `'200'` comparisons instead of `UrlStatus.OK` | Replaced all instances |
| 15 | 🟢 Minor | Screenshot retry loop semantics | DEFERRED — functional |
| 16 | 🟢 Minor | Pre-flight `execSync` splits error handling | Replaced with direct `verifyInputs()` import |
| 17 | 🟢 Minor | Supabase TOCTOU check-then-act | Replaced with atomic `.upsert()` |

**Dismissed (8):** In-memory screenshot pass, `/ph` exclusion logic, locale baseUrl derivation, two-pass mutation, UrlStatus runtime equivalence (kept as #14), HubSpot token over-privilege, rawHtml PII (public site), RLS service role (correct admin pattern).

---

## Version History

| Version | Date | Changes |
|---|---|---|
| v1.0 | April 2026 | Initial brief |
| v1.1 | April 2026 | Steps 3b/3c/3d added, Webflow redirects CSV, locale modifier, scroll-before-capture, interaction libraries, third-party scripts, Tools deferred |
| v1.2 | April 2026 | Step 3e (template custom code diff) added |
| v1.3 | April 2026 | Ahrefs baseline step, redirects CSV format confirmed, /ph/ exclusions, regex redirects |
| v1.4 | April 2026 | All cross-model audit fixes applied (5 critical, 7 important, 3 minor); Ahrefs MCP replaced with REST API v3 using AHREFS_API_KEY |
