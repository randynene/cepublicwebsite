# Cutover runbook — cloudemployee.io

Written for Jake. Plain English. Do the steps in order; do not skip the checks
between them. Anything marked **JAKE** is a human-only gate and the agent will not
do it for you.

The domain is NOT changing. `cloudemployee.io` stays exactly as it is. The only
thing changing is what answers the phone: Webflow today, Vercel afterwards. That
removes the single biggest source of migration traffic loss, because Google does
not have to relearn a new address. There is **no Change of Address** to file in
Search Console.

---

## Step 1 — Fix the page titles (the one real blocker)

### What is wrong

The titles and descriptions in Sanity are a snapshot taken in **April**. Your
content team kept improving them in Webflow afterwards, and those improvements
never came across. So today the new site would go live with **264 pages carrying
worse titles than the ones currently ranking** — including the homepage, pricing,
services, and most of the blog. Titles are one of the strongest ranking signals
there is. Replacing good ones with old ones at the same moment you change platforms
is how migrations lose traffic.

### What the fix does

One command reads every page on the live site, reads the same page on the new site,
and where they differ, writes **the live version** into Sanity. It never invents
anything. The worst possible outcome is that your new site says exactly what your
current site says, which is the whole point.

**226 documents** will be updated.

### How to run it

Open Terminal, then:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr"
```

**1a. Look before you leap.** This shows you every single change it wants to make
and writes nothing:

```bash
npm run launch:backfill-meta
```

It prints `DRY RUN. Nothing was written.` at the end. Read a few lines. Each entry
shows the document and the new title. Takes about 90 seconds.

**1b. Backup — ALREADY DONE, 3 Aug 2026.** 448 documents and 531 assets exported to
`audit-output/pre-title-backfill.tar.gz` (156 MB). To retake it:

```bash
cd studio && npx sanity dataset export production ../audit-output/pre-title-backfill.tar.gz --overwrite
```

**1c. Apply it:**

```bash
npm run launch:backfill-meta -- --apply
```

**1d. Deploy.** Merge the branch to `main`. **`staging.jakevibes.dev` is the Vercel
PRODUCTION deployment of this project, so it only updates from `main` — pushing a
feature branch gives you a preview URL, not staging.** This is what activates the
code half of the fix.

> **The order matters.** Data first, code second. The code change makes the title
> in Sanity the *whole* title instead of having the site bolt " | Cloud Employee"
> onto the end. If the code went out before the data, a few hundred pages would
> temporarily lose the brand from their title. Not fatal, and staging is invisible
> to Google, but there is no reason to go through it.

**1e. Prove it worked:**

```bash
npm run launch:compare-meta
```

You want `Title matches live` to be at or near the comparable total. If it is not,
**stop and do not cut over** — that is the gate doing its job.

---

## Step 2 — The checks that must be green before DNS changes

Run all three. All three must pass.

```bash
npm run launch:verify-parity -- --target https://staging.jakevibes.dev
npm run launch:verify-noindex
npm run launch:compare-meta
```

- **Parity** replays all 6,937 known URLs against the new site and fails on any
  behavioural difference from live. This has been passing.
- **Noindex** confirms staging is still telling Google to stay away.
- **Compare-meta** is Step 1e above.

**JAKE — manual, and nobody else can do it:** submit one real test lead through a
HubSpot form on staging and confirm it lands in HubSpot, and book one real slot
through Calendly on `/book-a-call`. Forms are the money path. An automated check
can confirm a form *renders*; only a human submission confirms it *arrives*.

---

## Step 3 — Cutover

**JAKE — every item here. The agent does not touch DNS, env vars, or production.**

**3a. Set the two environment variables in Vercel**, Production scope, on the
project that will serve the domain:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.cloudemployee.io` |
| `NEXT_PUBLIC_CANONICAL_HOST` | `www.cloudemployee.io` |

`NEXT_PUBLIC_CANONICAL_HOST` is the switch that turns indexing ON. Until it is set,
the site serves `Disallow: /` to Google. That is deliberate: it means staging can
never accidentally get indexed. **Never set it on staging.**

**3b. Redeploy.** These variables are baked in at build time, not read live. Setting
them without redeploying changes nothing at all. This is the single most common way
this step gets botched.

**3c. Point the domain.** Add `www.cloudemployee.io` to the Vercel project and
update the DNS record.

Two things specific to your setup:

- **Cloudflare is currently in front of the live site** (the response headers show
  `server: cloudflare`). When you repoint at Vercel, put the record in **DNS-only
  mode (grey cloud), not proxied (orange cloud).** Vercel issues its own
  certificate and runs its own CDN; leaving Cloudflare proxying on top invites
  certificate errors and redirect loops on cutover day, which is the worst possible
  day for them.
- **The apex must keep redirecting to www.** Today `cloudemployee.io` 301s to
  `www.cloudemployee.io`. Add the apex to Vercel as well and set it to redirect to
  the `www` domain, so that behaviour survives. If it does not, you end up with two
  versions of every page.

**3d. Lower the DNS TTL to 300 seconds a few hours beforehand** if you can. It
shortens the window in which some visitors see the old site and others see the new
one, and it means a rollback takes minutes rather than hours.

---

## Step 4 — Immediately after the switch

Within the first ten minutes:

```bash
curl -s https://www.cloudemployee.io/robots.txt
```

You must see `Allow: /` and a sitemap line. If you see `Disallow: /`, Step 3a or 3b
did not take — fix it now, before Google recrawls.

Then:

1. Load the homepage, `/pricing`, one blog post and one service page. Check the
   browser tab title looks right on each.
2. Submit one real form on production.
3. In Search Console, submit `https://www.cloudemployee.io/sitemap.xml`.
4. Use the URL Inspection tool on the homepage and request indexing.

**There is one stale Vercel deployment** at
`mygratr-c3utcgloa-cloud-employee.vercel.app` that is serving `Allow: /`. It is not
on your domain so it cannot outrank you, but it can get itself indexed as a
duplicate. Delete it or add password protection.

---

## Rollback

Change the DNS record back to Webflow. That is the whole procedure. Webflow keeps
serving the old site untouched throughout — nothing in this process deletes or
modifies it. With a 300-second TTL you are back within about five minutes.

The Sanity title patch is the only step that changes data, and Step 1b takes a full
export before it runs.

---

## Known, accepted, not blocking

- **No CDN caching.** Every page is rendered on demand, so time-to-first-byte is
  about 1.0s against Webflow's 0.75s. Slower, but comfortably inside what Google
  tolerates, and it will not affect rankings. The real consequence is that the site
  now depends on Sanity being up, where Webflow's static pages depended on nothing.
  First job after launch, not before.
- **Meta descriptions** are restored from live along with the titles. Descriptions
  barely affect ranking — Google rewrites most of them anyway — but matching live
  keeps click-through rates where they are.
- **`/customer-story/virgin`** now redirects to the customer-stories hub. Live
  serves an empty "story in progress" placeholder there, so nothing of value is
  lost.
