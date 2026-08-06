# Data source enablement - click-by-click

Authored 6 Aug 2026. Implements `docs/seo/SEO_PROGRAMME.md` §9 items 1, 2, 3, 4
and §5.2, plus the Screaming Frog config from `docs/seo/POST_LAUNCH_AUDIT.md`.

Written for a non-developer. Every step says what you should SEE, so you can
tell a success from a silent failure. Do them in order; item 3 gates item 5.

Status legend: `[ ]` not done, `[x]` done and verified.

---

## A. Vercel Speed Insights

**Why first.** It collects nothing retroactively. Every day it is off is a day
of real-visitor Core Web Vitals we can never get back. It is also the only
field data we have; everything else in the programme is lab data.

### A.1 The code side - DONE, no action needed

Answering the question directly: **dashboard-only is NOT enough for this
project.** Vercel auto-injects the Speed Insights beacon for static and
no-framework sites. A Next.js App Router app must mount the `<SpeedInsights />`
component or the dashboard shows "no data" forever, with no warning that
anything is wrong.

So this was needed and is done:

- `@vercel/speed-insights` v2 added to `site/package.json`
- `<SpeedInsights />` mounted at the end of `<body>` in `site/src/app/layout.tsx`
- Verified: `tsc` clean, `eslint` clean, `next build` clean

Branch `seo/speed-insights-setup`. It must be merged and deployed to production
before any data appears.

### A.2 The dashboard side - YOURS

1. Go to https://vercel.com and sign in
2. Select the **cloud-employee** team, then the **mygratr** project
3. Top nav of the project, click **Speed Insights**
4. Click **Enable Speed Insights**
   - If it offers a plan choice, the Pro allowance is included; you are not
     adding a new subscription
5. **You should see:** the tab switches from a marketing splash to an empty
   dashboard reading something like "Waiting for first data point"

### A.3 Verify it is actually working

Data needs the branch merged AND real traffic. So:

1. Merge the `seo/speed-insights-setup` PR to `main` (this deploys to
   production - the site is live, see CLAUDE.md)
2. Wait for the Vercel deployment to go green
3. Open https://www.cloudemployee.io in a normal browser window, click through
   three or four pages
4. Open DevTools (F12) > **Network** tab, filter for `vitals`
   - **You should see:** a request to `/_vercel/speed-insights/vitals`
     returning **204**. That is the beacon firing. If you see 404, the
     component did not deploy. If you see nothing at all, an ad blocker is
     eating it - try a private window with extensions off.
5. Back in the Vercel Speed Insights tab, wait ~30 minutes
   - **You should see:** a Real Experience Score and at least one page listed

**Do not expect useful numbers for about a week.** Percentile Core Web Vitals
need volume. The first day is a sanity check that the pipe works, not a result.

**Note for later:** SEO_PROGRAMME.md §2.1 documents a 7.3 second render delay
caused by the GeoTargetly body-hide. Speed Insights will report this honestly
and the first numbers will look bad. That is correct and it is the point -
it gives us the before half of the before/after.

- [ ] A.2 enabled in dashboard
- [ ] A.3 beacon returns 204
- [ ] A.3 first data point visible

---

## B. Bing Webmaster Tools

**Why.** ChatGPT's web search runs on Bing's index. The "be recommended in
ChatGPT" goal is not reachable while we have zero visibility into how Bing sees
the site. Free, and the Search Console import makes it about five minutes.

### B.1 Set up and import

1. Go to https://www.bing.com/webmasters
2. Sign in. **Use a Microsoft account you control long-term**, not a personal
   one you might lose access to
3. On the "Add your site" screen choose **Import** (the Google Search Console
   option), not "Add site manually"
4. Click **Continue**, then sign in with the Google account that owns the
   cloudemployee.io Search Console property, and grant read access
5. **You should see:** a list of your Search Console properties. Pick
   **`cloudemployee.io`** (the domain property - see SEO_PROGRAMME.md §10, we
   deliberately have one domain property, not separate www/non-www)
6. Click **Import**

**What the import does:** it verifies ownership automatically (no DNS record or
meta tag needed) and pulls in your verified site list. **It does NOT import
historical performance data** - Bing starts collecting from today. That is
expected, not a failure.

### B.2 If the import fails

Fall back to manual verification. Add `https://www.cloudemployee.io`, choose
the **DNS** method, and add the TXT record at Cloudflare (DNS is where the
domain is managed - CLAUDE.md notes the proxy is grey-clouded for Vercel, which
does not affect TXT records). The HTML-file method will not work cleanly here
because the site is Next.js, not static files.

### B.3 Submit the sitemap

1. Left sidebar > **Sitemaps**
2. Submit `https://www.cloudemployee.io/sitemap.xml`
3. **You should see:** status **Success** and a discovered-URL count. It should
   land near **653** (the live sitemap size per CLAUDE.md). A number wildly
   below that means Bing fetched a stale or partial sitemap - re-submit

**Do not submit the 8 dead RSS feeds.** They are 404s and are the exact problem
being cleaned up in Search Console (Tech Debt #64).

### B.4 Verify the import actually landed

1. Left sidebar > **Site Explorer** - should list real URLs from the site
2. Left sidebar > **URL Inspection**, inspect
   `https://www.cloudemployee.io/` - should report the URL as known to Bing
3. Left sidebar > **Search Performance** - **will be empty on day one.** Check
   again in 3-5 days. Empty after a week means the import did not really take

**The real verification is B.3's URL count plus B.4.1 showing URLs.** If Site
Explorer is empty 48 hours after setup, the property is not properly verified
regardless of what the setup screen said.

- [ ] B.1 imported from Search Console
- [ ] B.3 sitemap submitted, ~653 URLs discovered
- [ ] B.4 Site Explorer shows URLs

---

## C. PageSpeed Insights API key

**Why, and why it must be before Screaming Frog.** Screaming Frog's PageSpeed
integration fails *silently* on quota errors - it returns empty Core Web Vitals
columns and gives no error dialogue. SEO_PROGRAMME.md §5.1 records that the
anonymous shared quota is already exhausted for us. Crawl without a key and you
get a clean-looking crawl with a hole in it.

Use the **existing** project. Do not create a new one - `cloud-employee-seo`
already holds the Search Console service account (`GSC_SERVICE_ACCOUNT_KEY_PATH`
in `.env`), and keeping SEO API access in one project keeps quota and billing
legible.

### C.1 Enable the API

1. Go to https://console.cloud.google.com
2. **Project picker in the top bar** - select **`cloud-employee-seo`**.
   Getting this wrong is the most common mistake here; check it before
   continuing
3. Search bar at the top, type `PageSpeed Insights API`, open the result
4. Click **Enable**
5. **You should see:** the button change to a management screen with
   "API enabled" and Metrics/Quotas tabs

### C.2 Create the key

1. Left sidebar > **APIs & Services** > **Credentials**
2. **+ Create Credentials** > **API key**
3. **You should see:** a dialogue with a key starting `AIza...`
4. Click **Edit API key** (do not just close it):
   - **Name:** `pagespeed-insights-screaming-frog`
   - **API restrictions:** select **Restrict key**, tick **PageSpeed Insights
     API** only
   - **Application restrictions:** leave as **None**. Screaming Frog calls from
     your laptop's IP and an IP restriction will break it the first time your
     home IP changes
   - **Save**

An unrestricted key is a live liability if it leaks. Restricting it to one
free API makes a leak boring.

### C.3 Store it

This is a secret. Do not paste it into chat.

Add to `.env` at the repo root (same file as the other keys):

```
PAGESPEED_API_KEY=AIza...your-key-here
```

Nothing in the repo reads it yet - it is for Screaming Frog and for any future
at-scale PSI sweep. Storing it here means it is in the one place we already
look for credentials.

### C.4 Verify the key works

Paste this in a browser, replacing `YOUR_KEY`:

```
https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.cloudemployee.io/&key=YOUR_KEY&strategy=mobile
```

- **You should see:** a large wall of JSON. Search it for `"lighthouseResult"`
- **If you see** `"error"` with `"API key not valid"` - wait 2 minutes, new
  keys take a moment to propagate, then retry
- **If you see** `"quotaExceeded"` - you are still on the anonymous pool,
  meaning the `key=` parameter did not take. Check for a typo or a stray space

Also worth checking: the response includes a `loadingExperience` block. If it
is **present**, that is Chrome UX Report field data - real-world Core Web
Vitals from Chrome users. If it is **absent**, the URL has too little Chrome
traffic to have a CrUX record, which is itself a finding.

- [ ] C.1 API enabled in `cloud-employee-seo`
- [ ] C.2 key created and restricted
- [ ] C.3 in `.env` as `PAGESPEED_API_KEY`
- [ ] C.4 test URL returns `lighthouseResult`

---

## D. DataForSEO

**Why.** Search Console tells us where we rank. Ahrefs tells us who links to
us. Neither tells us what the result page around us looks like - whether an AI
Overview is sitting above our position-4 ranking and eating the click. That
gap is the whole reason for this one.

### D.1 Get the right credentials

The critical detail: **DataForSEO API credentials are not your dashboard login.**
The API password is a separate generated string. Using the dashboard password
gives a 401 that looks like a typo.

1. Go to https://app.dataforseo.com/api-access
2. **You should see:** an **API login** (your email) and an **API password**
   (a generated string, reveal or regenerate it)

### D.2 Put them in `.env`

Do this yourself. Do not paste them into chat.

Open `.env` at the repo root and add two lines:

```
DATAFORSEO_LOGIN=your-api-login
DATAFORSEO_PASSWORD=your-api-password
```

These are the same two variable names used by the working integration in
`ce-sales-brain/apps/enrichment`, so if you already have them there you can
copy those exact values across.

`.env` is gitignored. Confirm with `git status` - it must not appear.

### D.3 Verify - free, nothing billed

```
npx tsx scripts/seo/dataforseo-pull.ts
```

- **You should see:** `Credentials OK.` and your account balance
- **If you see** the "must be set in .env" message - the variables did not
  load; check for typos in the names and no spaces around the `=`
- **If you see** `task status 40100` - wrong credentials, you likely used the
  dashboard password rather than the API password from D.1

A bare run does a credential check ONLY and bills nothing. That is deliberate.

### D.4 Then pull real data

```
npx tsx scripts/seo/dataforseo-pull.ts --serp            # ~25 keywords, ~$0.08
npx tsx scripts/seo/dataforseo-pull.ts --gap             # competitor gap, ~$0.08
npx tsx scripts/seo/dataforseo-pull.ts --serp --gap --limit 100
```

Output lands in `audit-output/seo-intel/<date>/`.

What each covers:

- **`--serp`** - SERP features and AI Overview presence for the keywords we
  already rank for. Seeded automatically from the existing Ahrefs and Search
  Console pulls, brand terms excluded, highest volume first. Reports whether an
  AI Overview fires, and separately whether **we are cited inside it** - those
  are very different situations
- **`--gap`** - keywords toptal.com, turing.com and andela.com rank top-20 for
  and we do not, sorted by how many of the three rank (a term all three hold is
  a proven category term, not a fluke)

**Cost control:** nothing bills without `--serp` or `--gap`. The script prints
an estimate before spending and a total after.

- [ ] D.2 credentials in `.env`
- [ ] D.3 `Credentials OK.`
- [ ] D.4 first real pull

---

## E. Screaming Frog crawl - configuration checklist

**Do C first.** Without the PageSpeed key the Core Web Vitals columns come back
empty and give no error.

### E.1 Licence and basics

- [ ] Screaming Frog SEO Spider licensed (the free tier caps at 500 URLs; we
      have ~653, so an unlicensed crawl truncates and looks complete)
- [ ] **Mode > Spider** (not List mode)

### E.2 Spider configuration

`Configuration > Spider > Crawl`:
- [ ] **Crawl subdomains: OFF.** Non-negotiable. `talent.cloudemployee.io` is a
      separate live Webflow site that is not ours (CLAUDE.md); leaving this on
      pollutes every count in the crawl
- [ ] Crawl depth: **unlimited** (`Configuration > Spider > Limits` >
      untick Limit Crawl Depth)
- [ ] Untick Limit Crawl Total, or set it above 1,000

`Configuration > Spider > Rendering`:
- [ ] **JavaScript** rendering (default is Text Only). Some sections hydrate
      client-side and text-only under-reports
- [ ] AJAX timeout: raise from 5s to **20s**. The site currently has a ~7.3s
      render delay from the GeoTargetly body-hide (SEO_PROGRAMME.md §2.1); at
      the default timeout Frog may capture pages while still invisible and
      report empty content sitewide

`Configuration > robots.txt`:
- [ ] **Respect robots.txt: yes**

### E.3 Connect the APIs - the part that makes this crawl worth running

`Configuration > API Access`:

- [ ] **Google Search Console** - OAuth sign-in, then select the
      `cloudemployee.io` **domain** property. Joins real clicks and impressions
      onto every crawled URL so issues sort by what they actually cost
- [ ] **Ahrefs** - OAuth or the API key from `.env` (`AHREFS_API_KEY`). Joins
      referring domains per URL so we can see which pages are worth protecting
- [ ] **PageSpeed Insights** - paste the key from **C.2**. Set Device to
      **Mobile**. Core Web Vitals per URL, which we have no other way to get at
      scale
- [ ] After connecting each, click **Connect / Test** and confirm a green tick.
      A silent amber state is the failure mode to watch for

### E.4 Run

- [ ] Crawl `https://www.cloudemployee.io` (www, https - all four entry points
      308 to this, per CLAUDE.md, so starting elsewhere just adds a redirect hop)
- [ ] Let it finish completely - **100%**, not "enough"
- [ ] Sanity check before exporting: total URLs should be in the ballpark of
      **653**. Drastically fewer means the crawl hit a limit or was truncated;
      drastically more means subdomains crept in

### E.5 Exports

All into `screaming-frog/pass5-production/`:

- [ ] Internal > All (`internal_all.csv`) - the master file
- [ ] Response Codes > All
- [ ] Page Titles > All
- [ ] Meta Description > All
- [ ] H1 > All
- [ ] Canonicals > All
- [ ] Directives > All
- [ ] Images > Missing Alt Text
- [ ] Structured Data > Validation Errors and Warnings
- [ ] Hreflang > All
- [ ] Reports > Redirects > All Redirects
- [ ] Reports > Redirects > Redirect Chains
- [ ] Reports > Crawl Overview

**Before sending, spot-check `internal_all.csv`:** open it and confirm the
PageSpeed columns (LCP, CLS, FCP) contain numbers. If they are blank, the
PageSpeed API did not connect and the crawl needs re-running with C fixed.
This is exactly the silent failure C exists to prevent.
