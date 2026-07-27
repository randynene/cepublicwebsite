# LAUNCH_ROADMAP.md — Cloud Employee: the final push to launch

**Purpose:** The single, final roadmap from where we are today to a live, fully
CMS-editable, SEO-strong cloudemployee.io on the Next.js + Sanity stack. This is
the "to completion" doc. It consolidates and supersedes the launch-facing parts
of `DESIGN_EXECUTION_ROADMAP.md` (that doc's design-track thinking still stands;
this one is the running order to the finish line).

**Owner:** Jake Hall (non-developer, directs the build).
**Status:** v1.0 — grounded against the code on `feat/design-1`, Jul 2026.
**Governing rule (unchanged):** Nothing goes to production until the design
matches the live site. Production is design-gated, and design is Jake's to supply.

---

## 0. What "done" means (the finish line)

Three things must all be true before we cut over:

1. **Wired.** Every page pulls its content from Sanity, so Seb can edit copy and
   images in Studio with no developer. No page renders content baked into code.
2. **SEO-ready.** Rankings transfer instead of evaporating: redirects hold, meta
   and structured data are correct on every template, the sitemap is right, and
   staging never gets indexed.
3. **Design-matched.** Each page looks like the intended live design (Jake's hard
   gate).

Wiring and SEO are ours to grind through. Design is Jake's track, running in
parallel.

---

## 1. Where we actually are (grounded snapshot, Jul 2026)

- **Parity is closed at 6,937 / 6,937.** Every known live URL has a home on the
  new site. This is the big one and it is already done.
- **Nearly every page exists and renders.** The gap is not "missing pages."
- **Two real gaps remain:** (A) a batch of pages render content from code, not
  Sanity, so the CMS cannot edit them; (B) the SEO surface + launch mechanics
  need a final, deliberate pass.
- **The backend survives untouched:** ~388 Sanity docs across 21 types, the
  redirect layer, locale-awareness, every HubSpot form, the calculators, hub body
  copy + FAQs. `migrations.status = content_complete` and stays there until
  launch.

### 1a. The wiring truth (read directly from the code, not the status docs)

| Page / group | Renders content from | CMS-editable today? |
|---|---|---|
| Blog articles + 7 blog hubs | Sanity | Yes |
| Customer story detail | Sanity | Yes |
| Reviews, videos, tools, downloads, book-a-call, compare, team, download-thank-you (detail) | Sanity | Yes |
| Resource/catalogue hubs (reviews, customer-stories, videos, tools, downloads, events, compare, alternatives) | Sanity | Yes |
| Marketing on shared static-page template (about-us, contact, referrals, work-with-shawnee, thank-you/book-a-call pages) | Sanity | Yes |
| Legal pages, start-hiring funnel, price-comparison calculator | Sanity | Yes |
| Home, How It Works, Pricing | Sanity **with a code fallback** | Yes IF the Sanity record is filled (must verify) |
| **Services hub + every service detail** | **code file `data/services.ts`** | **No** |
| **Technology hub + every technology detail** | **code file `data/technologies.ts`** | **No** |
| **Our Work** | code file (`our-work/content.ts`) | No |
| **For Developers** | code file (`for-engineers/content.ts`) | No |
| **Location pages** (LATAM, Eastern Europe, Philippines) | code file (`location/content.ts`) | No |
| **Hiring-cost calculator** | rate card hardcoded in code | No (price-comparison one IS in Sanity) |

Important nuance found in the code: Sanity schemas and query functions already
EXIST for Service, Technology, Our Work and For Developers, but the pages ignore
them and read from code. So Studio currently shows editable fields on those pages
that do nothing. Wiring = making both sides agree, not building from scratch.

---

## 2. The four tracks

- **Track W — Wiring.** Make every page CMS-editable. (Ours.)
- **Track S — SEO readiness.** Make rankings transfer. (Ours, rides inside W.)
- **Track L — Launch mechanics.** The cutover itself. (Jake by hand at the gates.)
- **Track D — Design fidelity.** Each page matches the live design. (Jake-owned,
  parallel, and the thing that actually unblocks production.)

---

## 3. Track W — Sanity wiring (the ordered work)

**Decided (Jul 2026): Services + Technology use Option A.** Reshape the Sanity
fields to match the LIVE services/technology pages exactly, migrate that content
into Sanity once, then point the page at Sanity. Goal is an exact match to the
current live site content, in clean editable fields, images included.

Each phase runs the same loop: **probe → lock a brief → build → verify Seb can
edit it in Studio (copy + images) → commit.**

### W0 — Verify + seed Home / How It Works / Pricing (quick win, do first)
These three already fetch from Sanity but silently fall back to code if the
record is empty. Confirm each singleton is actually filled; fill any that are
empty. Low risk, high clarity, might be near-done. Clears the "wired with
fallback" ambiguity before we touch anything hard.

### W1 — Services (hub + all detail pages) — the pattern-setter
The biggest and hardest, done first so it defines the Option-A pattern.
- Probe: compare the LIVE services hub + a live service detail page against the
  current Sanity `service` schema. Identify every field the live page needs that
  the schema does not yet carry (skill badges, feature grids, why-us bullets,
  FAQs, images, etc.).
- Extend the `service` schema to hold that shape (schema is a HIGH-stakes change
  and gets a cross-model audit before it is locked).
- Write a migration script that loads the live content into Sanity (Jake reviews
  and runs it; agent never mutates production directly).
- Point `/services` and `/services/[slug]` (+ UK) at Sanity; delete the
  `data/services.ts` dependency.
- Verify: exact content match to live, Seb can edit every field + image.

### W2 — Technology (hub + all detail pages)
Same shape as Services (~96 technology pages), so much faster once W1 sets the
pattern. Reuses the schema/migration/wiring approach from W1.

### W3 — Our Work + For Developers
Bespoke marketing pages. Their Sanity singletons already exist; wire the pages to
read them and migrate the current on-page content in. Verify editability.

### W4 — Location pages (LATAM, Eastern Europe, Philippines)
The `location` content type already exists in Studio (decided long ago as a full
content type). Migrate the three location pages' content into `location` docs and
wire `/services/[slug]` to read them instead of the code registry. Future regions
then become new Studio docs, no code.

### W5 — Hiring-cost calculator rate card into Sanity
Move the hardcoded rate numbers into Sanity so Seb can maintain them (the
price-comparison calculator already works this way; mirror it). Arithmetic stays
in code; only the editable rate card moves.

---

## 4. Track S — SEO readiness (rides inside every W phase, plus a final sweep)

Per-template SEO is not bolted on at the end. Every W phase must keep meta,
canonical + UK hreflang, one clean H1 (keep the LIVE H1 wording per Jake's
standing rule), and the correct JSON-LD type. Then one consolidated sweep:

- **S1 — Per-template checklist pass** on every newly-wired template, against
  `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md` (Tier 1 items are launch-blocking).
- **S2 — Sitewide gap fixes** (from the SEO audit already on file):
  - nav JSON-LD through the XSS-safe `serializeJsonLd` helper (Tech Debt #49).
  - `llms.txt`, `dateModified` freshness, robots AI stance (needs a Jake
    decision), `sameAs` social URLs, `siteSettings.socialProof.logo` upload.
- **S3 — Sitemap + redirect freshness (a real launch requirement).** Today,
  content edits go live instantly but the sitemap and redirects only refresh on a
  deploy. We must confirm whether a Sanity-to-Vercel deploy hook exists; if not,
  a scheduled rebuild is required so new content reaches the sitemap. **Open
  unknown — dashboard-side, must be checked.**
- **S4 — Content gaps that hurt SEO:** privacy-policy body is empty and 404s
  (Tech Debt #46); backfill missing image alt text (#50, #54); confirm meta
  descriptions everywhere (they are hard-required 140-160 chars in Studio).

---

## 5. Track L — Launch mechanics (hard gates, Jake runs these by hand)

- **L1 — Redirect final verification.** Re-verify the generated redirect tables +
  the locked hand-written rules against the live site (a wrong redirect is
  invisible on Webflow and fatal on Next).
- **L2 — Lighthouse / Core Web Vitals cleanup batch** (Tech Debt #21-#33:
  third-party script budget, cookie hygiene, ClaraChatBot contrast,
  hero aspect-ratio).
- **L3 — Set `NEXT_PUBLIC_CANONICAL_HOST` on the cutover deployment ONLY.** This
  is the single switch that lets Google index the site. Never set it on staging.
  `npm run launch:verify-noindex` polices it.
- **L4 — DNS cutover:** lower TTL, point cloudemployee.io at Vercel, verify
  redirects on the real domain, activate.
- **L5 — State transition:** advance `migrations.status` off `content_complete`
  through the launch states (resumes at QA-1 / LAUNCH, never before).
- **L6 — MONITOR-1 (post-launch):** Google Search Console coverage, rank-
  retention tracking, confirm redirects held.

---

## 6. Track D — Design fidelity (Jake-owned, parallel, the true production gate)

Wiring and SEO can be complete and production still waits on this. Current design
state (verify against latest before each build; the status docs lag):

- **Designed AND built:** chrome, Home, How It Works, and the blog / review /
  video / tool / download / book-a-call / compare / team detail pages. Our Work,
  For Developers and Location are built as bespoke pages too (from `docs/raw-html`).
- **Design exists, not yet built to it:** Service, Technology, Customer Story,
  Download Thank You, 404, the 5 hub index pages, and the net-new pages
  (Fractional CTO, Managed Pods, Referral).
- **No design yet:** About Us, Contact, Pricing, Our Work, For Developers, both
  calculators, the remaining hubs, thank-you pages, Event detail.

Wherever a W phase touches a page that also needs design, we build to the current
content shape now (so it is editable) and restyle when the design lands. That
restyle is a template change, not another content migration.

---

## 7. How we run it (operating discipline)

- One phase per work session. Lock a tight brief before building. Files are the
  memory; the chat is disposable.
- Two-Brain model: planning decides architecture; the build executes only. If a
  build hits an architecture decision not in the brief, stop and surface it.
- HIGH-stakes briefs (any schema change: W1, W2, possibly W4) get a cross-model
  audit before they are locked.
- Commits only at named halts, single-line messages, explicit path staging.
  Push always waits for Jake's explicit approval.
- The agent writes migration scripts; Jake reviews and runs anything that mutates
  the live Sanity dataset. No env-var or production changes without Jake by hand.

---

## 8. Open decisions + unknowns to resolve

1. **Sanity-to-Vercel deploy hook (S3).** Does publishing trigger a rebuild so the
   sitemap updates? Dashboard-side, currently unknown, and it is a launch
   requirement. Resolve early.
2. **Home / How It Works / Pricing seeded?** (W0 probe answers this.)
3. **Fractional CTO / Managed Pods / Referral:** full Sanity schemas or near-static
   with light Sanity backing? (Carried over from the design roadmap; decide before
   building those.)
4. **robots AI stance** (allow/deny AI crawlers) — Jake decision for S2.

---

## 9. The one-line running order

**W0 (verify Home/HIW/Pricing) → W1 Services → W2 Technology → W3 Our Work +
For Developers → W4 Location → W5 hiring-cost rate card → S1-S4 SEO sweep →
L1-L5 launch → L6 monitor.** Track D (design) runs in parallel and is the final
gate on production.

---

## 10. Immediate next action

Run the **W0 verification probe** (are Home / How It Works / Pricing actually
filled in Sanity, or falling back to code?), then write the **W1 Services brief**
(the schema-shape probe against the live services pages). Everything else follows.

---

*v1.0 — grounded against `feat/design-1`, Jul 2026. Supersedes the launch-facing
portions of DESIGN_EXECUTION_ROADMAP.md.*
