# Storybook Vercel Deploy Runbook

> Customer-2-reusable runbook for deploying the design system's Storybook
> sandbox to Vercel as a separate project, with deployment protection.
>
> First written at MYGRATR-DESIGN-1 Brief A §4.4 (Cloud Employee migration).
> Brief reference: `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-A_v1.2.md` §4.4
> + Locked Decision D4.

---

## Purpose

Deploy the Storybook sandbox built at DESIGN-1 Step 4 to a deployment-protected
Vercel preview URL. Storybook is a dev sandbox (not stakeholder-facing) — the
goal is a stable URL Jake (or future reviewers) can hit when reviewing
primitives or Tier-1 component scaffolds.

Storybook ships from the same repo as the customer site, but as a **separate
Vercel project** so:

- Build commands don't conflict with the main Next.js build
- Deployment protection can be configured independently of the production site
- Build failures on Storybook don't block production deploys (and vice versa)

---

## Audience

Person executing the Vercel-side setup (Jake for customer 1; whoever owns
infra for customer 2+). Claude Code prepares the local repo state; the
person here completes the Vercel side.

---

## Prerequisites

Before starting, confirm in the repo:

1. `site/package.json` has `"build-storybook": "storybook build"` script.
2. `site/.storybook/main.ts` and `site/.storybook/preview.tsx` exist.
3. `site/storybook-static/` is gitignored (default; check `site/.gitignore`).
4. `npm run build-storybook` exits 0 locally — output written to `site/storybook-static/`.
5. `.env.local` has the two required Sanity env vars (see §Environment variables).

If (4) fails locally, fix before touching Vercel — Vercel will fail the same way.

---

## Vercel project setup (dashboard)

1. **New Project** → import the same Git repo as the main customer site.
2. Project name: `mygratr-{customer-slug}-storybook` recommended (e.g.,
   `mygratr-cloud-employee-storybook`). Naming is opaque — record actual.
3. **Framework Preset**: `Other`. (NOT Next.js — Storybook outputs static
   HTML, not a Next.js app. Picking Next.js makes Vercel try to run
   `next build` which is the wrong build for this project.)
4. **Root Directory**: `site`
5. **Build Command** (override): `npm run build-storybook`
6. **Output Directory** (override): `storybook-static`
7. **Install Command**: leave default (`npm install`).
8. **Production Branch** override to `feat/design-1` (or whichever branch
   carries the in-progress design-system work). **Do NOT point at `main`** —
   the main branch should never carry Storybook scaffold artifacts.
9. **Environment Variables** — see next section.
10. Click **Deploy**.

### Vercel CLI alternative

```bash
cd site
vercel link                       # create new project; pick "Other" preset
vercel project ls                 # confirm the new project name
# Settings (root dir, build command, output dir, branch) editable via
# `vercel project --help` or via the dashboard. Branch + env vars are
# easier in the dashboard.
```

---

## Environment variables — critical

`site/src/lib/env.ts` parses `process.env` at module-import time via Zod.
Two vars are **required at runtime** (Zod throws if missing); without them,
stories that transitively import the Image / HubSpotFormEmbed / Sanity-aware
primitives will fail at render time even though the Webpack build itself
succeeds (Zod runs at runtime, not build time).

| Variable | Required? | Source |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | **YES** — Zod throws if missing | Same value as the main customer-site Vercel project |
| `NEXT_PUBLIC_SANITY_DATASET` | **YES** — Zod throws if missing | Same value (typically `production`) |
| `NEXT_PUBLIC_SITE_URL` | No — Zod falls back to `VERCEL_URL` then `localhost:3000` | Optional; only relevant if a story renders canonical/hreflang URLs (none currently do) |
| `SANITY_API_READ_TOKEN` | No — defaults to `''` | Optional; not needed for offline-mock Stories |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | No — defaults to `''` (HubSpot story renders error fallback) | Optional |
| `NEXT_PUBLIC_FALLBACK_EMAIL` | No — defaults to `hello@cloudemployee.io` | Optional |

**Set the two `NEXT_PUBLIC_SANITY_*` vars in Vercel project Settings →
Environment Variables for `Production`, `Preview`, AND `Development`
scopes** (or at least `Production` + `Preview`).

---

## Deployment Protection

DESIGN-1 Brief A locks **Standard Deployment Protection** for the customer-1
Storybook deploy. Rationale: only the project owner walks Storybook at
HALT 1; no bypass tokens needed; no public stakeholder access required.

Vercel Dashboard → Project → Settings → Deployment Protection → enable
**Standard Protection**.

For customer-2: choose Standard unless a public stakeholder review
explicitly needs a bypass token (Advanced protection's purpose). Default
to Standard.

---

## First deploy + verification

After **Deploy** triggers:

1. Watch the build log; should complete in ~60–120s (depends on Vercel
   plan + cold cache).
2. Asset-size warnings for `iframe.bundle.js` chunks > 244 KiB are
   **expected and non-blocking** — Storybook's webpack bundles include all
   stories' dependencies, and chunks at ~1 MiB are normal for a 30-story
   sandbox with Radix + Sanity-image-url + portable-text. Warnings only,
   not errors. Do NOT chase down with code-splitting; this is a dev
   sandbox, not a user-facing site.
3. Once deployed, the auto-generated subdomain looks like
   `mygratr-{slug}-storybook-{hash}-{team}.vercel.app` (Vercel's actual
   format is opaque and may differ — record the real one).
4. Sign in via Standard Deployment Protection (Vercel SSO / email / etc.)
   to view.
5. Verify:
   - All 30 stories listed in left-rail (25 under `Primitives/*` + 5 under
     `Tier-1/*`)
   - Stories render with CE colors (brand teal `#1c787c`, brand secondary
     yellow `#dff46e`, brand tertiary navy `#223c6c`)
   - Stories use Poppins font (next/font/google import in layout takes
     effect — though preview.tsx doesn't render the layout, the body's
     `--font-poppins` token is wired via `globals.css` import)
   - No console errors related to missing env vars (if you see a Zod
     parse error stack trace, the Sanity env vars aren't set on this
     Vercel project — see §Environment variables)

---

## Recording the URL

Once verified, share the URL with the team and append to the running
capability log draft (and ultimately to `docs/CAPABILITY_LOG.md` at
Brief A close consolidation).

---

## Customer-2 notes

- **Project naming pattern**: settle on `mygratr-{customer-slug}-storybook`
  early. Customer-1 uses `cloud-employee`; customer-2 onboarding should
  pick its slug at SCHEMA-1 (where the Sanity dataset is named) and reuse
  here.
- **Env-var requirement is the #1 source of customer-onboarding friction.**
  Document the two required `NEXT_PUBLIC_SANITY_*` vars upfront in
  customer-2's onboarding checklist; do not assume they'll be set "because
  the main site has them" — separate Vercel project = separate env-var
  scope.
- **Framework Preset gotcha**: Vercel auto-detects Next.js when it sees
  `next` in `package.json`, even though Storybook is what we're building.
  Manually override Framework Preset to `Other`. If left as Next.js, the
  build runs `next build` instead of `storybook build` and fails with
  unrelated errors.
- **Branch targeting**: Storybook deploys live on the design-system
  branch (e.g., `feat/design-1`). When that branch merges to `main`,
  decide whether to keep Storybook deploys in sync with `main` or freeze
  them at the post-DESIGN-1 commit. Customer-1 case: TBD at Step 11
  close.
- **Deployment Protection mode**: Standard for owner-only review; Advanced
  if external reviewers need bypass tokens. Customer-1 lock: Standard.

---

## Cross-references

- DESIGN-1 Brief A v1.2 §4.4 — primary specification for this runbook
- DESIGN-1 Brief A v1.2 D4 — locked decision (separate project, deployment
  protected)
- `docs/CAPABILITY_LOG.md` — final consolidation entry at Brief A close
  (records the actual URL + customer-2 take-aways)
- `audit-output/design-1/capability-log-draft.md` — running draft for
  Brief A entries (gitignored)
- `site/.storybook/main.ts` + `preview.tsx` — Storybook config consumed
  by `npm run build-storybook`

---

*Last updated: MYGRATR-DESIGN-1 Brief A §4.4 (customer 1: Cloud Employee).*
