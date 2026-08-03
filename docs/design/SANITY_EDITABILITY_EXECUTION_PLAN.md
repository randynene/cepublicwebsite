# Sanity editability — consolidated execution plan

**Status:** Executing — WP-01/02 (#22), WP-03 (#23), WP-04 (#24), WP-05 (#25), WP-06 (#27) all merged to `main`. Next: WP-07.
**Date:** 2026-07-26  
**Goal:** Seb can edit *everything meaningful* on the main marketing pages via Sanity Studio → Publish → staging updates.  
**Source of truth site:** https://staging.jakevibes.dev  
**Studio:** https://mygratr-cloudemployee.sanity.studio/

This document consolidates two fan-out audits into **one ordered fix backlog**. Execute in the work packages below (not random drive-bys).

---

## Standing rules for this track (read before any WP)

1. **Seeds are destructive, so snapshot first.** Every `scripts/static/seed-*.ts`
   ends in `createOrReplace` on a hardcoded singleton `_id`, which silently wipes
   anything Seb edited in Studio. **`npm run static:backup-singletons`** (added
   26 Jul) snapshots every singleton to `audit-output/sanity-backups/<timestamp>/`
   and restores from the same script with `--restore <dir> --apply`. Run the
   backup before any seed. Restore is dry-run by default.
2. **Chat CTAs use the `#chat` token** introduced in WP-06. Reuse
   `site/src/lib/chat.ts` and `ChatLink` / `ChatPill` from
   `site/src/components/shared/chat-link/`. Never ship a CTA whose `href` is `#`
   or an anchor to the section it already sits in.
3. **Every CTA is locale-aware** via `toInternalHref` from `site/src/lib/url.ts`.
   UK pages keep the visitor inside `/uk`.
4. **Studio deploys are Jake's manual gate** (`cd studio && npx sanity deploy`),
   as are all env-var changes and Vercel dashboard work.
5. **`npm run lint` has 30 pre-existing errors** (Tech Debt #36). Do not fix them.
   Confirm you added none.
6. **Add a `defineLocations` entry** in `studio/sanity.config.ts` for every
   singleton you touch. Without it the doc opens in Presentation with no idea
   which URL to preview, so "editable in Sanity" is not "editable in
   Presentation". WP-05 established the pattern; see the backlog item in WP-15.

---

## How to use this doc

1. Work **package by package** (P0 → P1 → P2…).
2. For each package: schema (if needed) → seed/query → template render → Studio smoke → Presentation smoke.
3. Check off items as Done.
4. Do **not** “fix everything in one PR” — one package (or one page) per PR unless items are tiny cross-cuts.

**Status labels (from audit)**
- HARDCODED — visible, not Studio-editable  
- MISSING SCHEMA — no field for something that should be editable  
- PARTIAL — field exists but unused / ignored / empty / wrong consumer  
- DATA — code wired; content/assets missing in Sanity  

---

## Pages in scope (audited)

| # | Page | Route(s) | Overall |
|---|---|---|---|
| 1 | Home | `/` | Mostly wired; hero slideshow + Where We Work hardcoded |
| 2 | How It Works | `/how-it-works` | Mostly wired; matcher stub; CTA destinations |
| 3 | Fractional CTO | `/services/fractional-ctos` | Mostly wired; form demo; dead chat link |
| 4 | Hire Engineers | `/services/software-engineers` | Mostly wired; calc maths locked; lead submit noop |
| 5 | Our Work | `/our-work` | Mostly wired; Glassdoor 4.8; CTA hrefs |
| 6 | For Developers (“For Engineers”) | `/for-developers` | Mixed; join form hardcoded; video URL missing |
| 7 | Locations ×3 | `/services/latam-developers`, `philippines-developers`, `eastern-europe-developers` | Mostly wired; calculator rates code-owned |
| 8 | Pricing | `/pricing` | Mostly wired; images as string paths; no video URL |
| 9 | About Us | `/about-us` | **Weak** — static shell; team grid / values / reviews not properly mounted |
| 10 | Contact | `/contact` | **Weak** — contact form not seeded; Calendly/phones gaps |
| 11 | Services hub | `/services` | Mixed — cards from Sanity; headings/stories/quotes hardcoded |
| 12 | Customer Stories hub | `/customer-stories` | Mostly wired; chrome strings; unused hub fields |
| 12b | Customer Story detail | `/customer-story/[slug]` | Mostly wired; labels hardcoded; `videoIntroContent` unused |
| 13 | Book a Call hub + slugs | `/book-a-call`, `/book-a-call/[slug]` | Mostly wired; H1 prefix hardcoded; OG missing |

**Intentionally out of this plan (next wave after this backlog):** Blog, Technology hub/pages, Reviews listing/detail, Alternatives, Staff Augmentation landing (if distinct), Start Hiring multi-step, Downloads/Tools/Videos/Events, Referrals, legal pages, calculators beyond Pricing, UK locale override system.

---

## Decision gate (answer before coding)

Jake to confirm once; defaults in **bold**:

| ID | Question | Default |
|---|---|---|
| D1 | Location / Hire Engineers / Pricing **calculator maths** (rates, multipliers) — keep in code or move to Sanity? | **Keep maths in code**; wire editable *labels* + optional override tables only if Seb needs them |
| D2 | Interactive stubs (Home ready-to-find, HIW matcher, FCTO/HE “find/match” forms) — make real HubSpot/Calendly flows, or keep as visual demos with editable copy only? | **Editable copy + real CTA destinations**; full multi-step CRM later unless Jake says otherwise |
| D3 | About Us — rebuild to match live Webflow fidelity (team grid, values, reviews), or new simplified design? | **Match live structure** (team grid + values + reviews) using existing `teamMember` / `benefitValue` / `review` docs |
| D4 | Contact form — resolve real HubSpot form GUID + seed, or temporary Calendly-only CTA? | **Resolve real form GUID + seed.** RESOLVED in WP-05: `4b883c7d-72c1-4f9c-8196-de68fce303d6`, seeded on the bespoke `contactPage` rather than a generic `hubspotFormSection` |
| D5 | Decorative icons / glyphs / stega-safe layout offsets — leave hardcoded? | **Yes, leave hardcoded** unless Jake wants icon pickers |

---

# Execution backlog

## P0 — Highest “Seb can’t edit what he sees”

### WP-01 · Home hero slideshow
**Page:** Home `/`  
**Problem:** Kyla / Marcello / Petra / Gabriel slideshow + “HOW THEY WORK” / “✓ MATCHED” / card stats are hardcoded (`HERO_PROFILE_CARD_PEOPLE`, `profile-card.tsx`). Old `hero.profiles` schema is orphaned.

**Do**
- [x] Add schema for slideshow people (photo, name, role, chips, optional stats) OR repurpose `hero.profiles` to match live `ProfileCard` shape
- [x] Wire `ProfileCard` to Sanity (remove `HERO_PROFILE_CARD_PEOPLE` dependency)
- [x] Make labels editable: MATCHED, HOW THEY WORK, stat labels (or confirm D5 leave as chrome) — **D5: chrome stays hardcoded**
- [x] Seed from current hardcoded assets under `public/design/home/engineers/hero-card/`
- [x] Remove/stop seeding unused floating-pill stack if superseded — floating pills kept in schema (still on content); slideshow uses `hero.profiles`
- [ ] Presentation smoke: edit a person name → publish → staging updates — **needs re-seed + Studio deploy after merge**

**Files (start):** `studio/schemas/singletons/home-page.ts`, `site/src/lib/sanity/queries/home-page.ts`, `site/src/components/templates/home/profile-card.tsx`, `site/src/components/templates/home/content.ts`, `site/src/components/templates/home/index.tsx`

---

### WP-02 · Home “Where we work”
**Page:** Home `/`  
**Problem:** Entire hub strip hardcoded (`WHERE_WE_WORK`); schema `locations` orphaned.

**Do**
- [x] Schema for hubs (name, href, image, optional eyebrow) on `homePage` — prefer replacing orphan `locations` with fields that match live UI — added `whereWeWork` (kept orphan `locations` for now)
- [x] Wire `where-we-work.tsx` to Sanity (drop Picsum/hardcoded hubs)
- [x] Seed from current intended hubs
- [ ] Presentation smoke — **needs re-seed + Studio deploy after merge**

---

### WP-03 · For Developers join form + video
**Page:** `/for-developers`  
**Problem:** Entire “Build your profile” join form is code-owned; testimonial video has play UI but no `videoUrl`.

**Do**
- [x] Decide D2: real HubSpot form vs editable demo — **editable demo** (copy in Sanity; submit stays done-state)
- [x] If demo: move all join-form copy into `forDevelopersPage` schema + render from Sanity
- [ ] If real: add HubSpot form id / portal wiring + submit — deferred (full CRM later)
- [x] Add `tests.videoUrl` (or equivalent) + wire player
- [x] Wire ghost hero CTA href (or remove inert CTA) — `ctaGhostHref` default `/how-it-works`; primary/final `#join`
- [ ] Presentation smoke — **needs re-seed + Studio deploy after merge**

---

### WP-04 · About Us — real page, not shell
**Page:** `/about-us`  
**Problem:** Provisional `StaticPageTemplate` only renders rich text + HubSpot form. Live needs team grid, values, reviews, trusted-by, stats, founder image, mid CTA. `teamMember` / `benefitValue` / `review` docs exist but aren’t mounted.

**Do**
- [x] Confirm D3 — **match live structure** with Our Work–style bespoke template
- [x] Extend `aboutUsPage` schema (or bespoke template) for: trusted-by, stats, founder image, team grid source, values grid, reviews, mid CTA
- [x] Mount `teamMember` (respect `hideFromTeamAboutPage`), `benefitValue` (values), `review` docs
- [x] Extend static/bespoke renderer so structured sections actually render (today non-richText types return null) — replaced routes with bespoke template
- [x] Add About Us to primary nav if missing — `npm run static:patch-nav-restore-about-us`
- [x] Capture/seed missing content from live where needed — `npm run static:seed-about-us-page` (chrome copy; grids from docs)
- [ ] Full page Presentation smoke — **needs Studio deploy + seed after merge**

---

### WP-05 · Contact — form + booking + offices
**Page:** `/contact`  
**Problem:** No `hubspotFormSection` seeded; live form is Webflow→HubSpot bridge (GUID not native). Calendly URL null; phones/emails/chat hours missing; offices flattened.

**Do**
- [x] Confirm D4 — **real form**, resolved and wired
- [x] Resolve real HubSpot form GUID for contact — `4b883c7d-72c1-4f9c-8196-de68fce303d6` ("Contact Request (via cloudemployee.io/contact)"). The GUID in the live markup (`fb70845a-…`) is the hubspotonwebflow.com **bridge** id and 404s against HubSpot, exactly like the footer newsletter did. Found by listing the portal's forms over the HubSpot API; its field set (message1 / firstname / lastname / email / how_did_you_hear_about_us_) matches the live form one-for-one.
- [x] Seed the form id on `contactPage` — `form.hubspotFormId` on the new bespoke singleton (not a generic `hubspotFormSection`, since Contact is now bespoke like About Us)
- [x] `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` present in `site/.env.local`. **Vercel not verifiable from here** (repo is not `vercel link`ed) — Jake to confirm on Production + Preview
- [x] Seed `calendlyUrl` + decide popup vs inline — **popup**, matching live. New `CalendlyPopupButton`; falls back to a real link if `widget.js` never loads
- [x] Schema/fields for phones, emails, chat hours, structured offices — `contactStrip.links[]` (kind/label/value) + `contactStrip.note` + `offices.items[]` (name/address/phone/email)
- [x] Extend `launch:verify-hubspot-forms` to include contact
- [x] Smoke: local prod build, `/contact` 200, HubSpot form mounts, Calendly overlay opens on click
- [ ] Seed + Studio deploy + Presentation smoke — **Jake runs after merge** (see commands below)

**Files:** `studio/schemas/singletons/contact-page.ts`, `studio/sanity.config.ts` (Presentation location), `src/types/sanity/singletons/contact-page.ts`, `site/src/lib/sanity/queries/contact-page.ts`, `site/src/components/templates/contact/{content.ts,index.tsx,calendly-popup-button.tsx}`, `site/src/app/{contact,uk/contact}/page.tsx`, `scripts/static/seed-contact-page.ts`, `scripts/launch/verify-hubspot-forms.ts`, `scripts/content/capture-marketing-pages.ts` (contact target removed)

**After merge, run:**
```
npm run static:seed-contact-page
cd studio && npx sanity deploy
npm run launch:verify-hubspot-forms
```

**Finding — the HubSpot form is an IFRAME, so C6's CSS chassis never applies.**
`HubSpotFormEmbed` carries a full visual override targeting `.hs-input` / `.hs-form-label` etc. Those selectors never match: HubSpot mounts this form inside `<iframe class="hs-form-iframe">`, and inside that frame it applies its own ink-on-white theme (label `#212D3A`, input `#F5F8FA`). Confirmed in the browser — the host document contains no `.hs-input` at all. On the dark card the labels were invisible, so the enquiry panel is **light** by design; the page stays dark. Making it dark instead means switching the form to a raw/unstyled form inside CE's HubSpot account so it mounts inline, which is an external-system change and Jake's or Seb's call, not the agent's. **This applies to the footer newsletter too** — its `FOOTER_SUBSCRIBE_FORM_CLASS` is also dead CSS. Logged for the chrome fidelity pass.

**Note — HubSpot redirects this form to `https://www.cloudemployee.io/thank-you` (absolute, live domain).** Correct after cutover; on staging a real submit leaves for the live site. Changing it is a HubSpot-side edit.

---

## P1 — Broken / inert interactions

### WP-06 · How It Works matcher + CTA destinations
**Page:** `/how-it-works`

**Do**
- [x] Confirm D2 for matcher steps 2–4 — **applied the locked default**: the matcher stays a visual demo, every CTA leaving it is real. Same call as WP-03.
- [x] Wire talk CTA hrefs (AI chat / book-a-call) — stop non-clickable `<span>`s
- [x] FAQ fallback CTA: real chat URL field (stop `href="#faq"`)
- [x] Optional: schema for matcher steps 2–4 if making interactive — **not done, deliberately** (D2 defers the multi-step flow)
- [x] Smoke — both locales, all four CTA branches verified in-browser
- [x] Merged as #27 (26 Jul), rebased onto main after #25/#26 landed
- [x] **Seed RUN 26 Jul** — `npm run static:seed-how-it-works-page`, verified in the dataset: `matcher.talkCtas` now holds `{label,href}` pairs (`#chat`, `/book-a-call`) and `faq.fallbackCtaHref` = `#chat`. Backup taken first (see below).
- [ ] Presentation smoke — **Jake, in the browser.** Blocked on the `defineLocations` gap: `howItWorksPage` has no Presentation location entry yet, so the doc opens with no preview URL. See WP-15.

**Shipped**

`matcher.talkCtas` changed from a bare string array to `{ label, href }`, so the two
pills under the matcher card are real links instead of decorative `<span>`s. `faq`
gained `fallbackCtaHref`. Both are Studio-editable, and the whole page is now
locale-aware: every CTA on `/uk/how-it-works` keeps the visitor in `/uk`.

**The `#chat` convention (new, and it matters beyond this page)**

Several templates point a "talk to our AI" CTA at `#chat` or `#faq`, which does
nothing when clicked — Clara has no URL, it opens via `window.ClaraWidget.open()`.
Now: Sanity stores the token `#chat`, and `ChatLink` / `ChatPill`
(`site/src/components/shared/chat-link/`) render a real link to `/book-a-call`
while intercepting the click to open the widget.

The interception is gated on the widget having actually **mounted**, not on the
API existing. `window.ClaraWidget` is defined the moment the script parses, but
its `open()` is a silent no-op until it has fetched its workspace settings — and
that fetch is CORS-blocked on origins Clara does not allow, local dev included.
Trusting `typeof open === 'function'` would have produced a CTA that swallows the
click and does nothing, which is worse than the bug being fixed. Verified all four
branches in-browser: widget mounted → chat opens, no navigation; widget absent →
navigates to `/book-a-call`; non-chat href → never intercepted; UK → `/uk/book-a-call`.

**Migration safety.** The Zod boundary accepts both the new `{ label, href }`
members and the plain strings already in the dataset, and legacy strings inherit
the static content's destination by position. So the page keeps working — with
live CTAs — between the Studio deploy and the reseed, in either order.

**Status 26 Jul:** merged (#27) and **seeded**. The Studio schema was deployed during
the WP-06 build session, so the seed had a schema to land against. Remaining for Jake:
the Presentation click-to-edit smoke, which needs the `defineLocations` entry (WP-15).

**Filed, not fixed (out of WP-06 scope):**
- Home's "Ready to find your engineer" section has the same dead-`<span>` talk CTAs
 on its own `readyToFind` content shape. Home is a different work package; the fix
 is the same pattern. → WP-15.
- `#chat` also appears on Pricing, the Location pages, and the catalogue FAQ panels
 with no handler at all. They can adopt `ChatLink`/`ChatPill` as-is. → WP-15.

---

### WP-07 · Hire Engineers — lead submit + dead links
**Page:** `/services/software-engineers`

**Do**
- [ ] Wire `sendLead` to HubSpot (or remove fake form and link to Book a Call / Start Hiring)
- [ ] Replace `href="#"` on How “More”, Talk/Book pills with Sanity URL fields or real routes
- [ ] Role cards: add hrefs or make non-links
- [ ] Confirm D1 for calculator maths (leave locked unless overruled)
- [ ] Smoke

---

### WP-08 · Fractional CTO — lead submit + FAQ chat
**Page:** `/services/fractional-ctos`

**Do**
- [ ] Same decision as HE for match form (real submit vs CTA out)
- [ ] FAQ side CTA: add `ctaHref` (chat/book) — stop `href="#"`
- [ ] Hero CTA href fields if Seb needs non-anchor targets
- [ ] Smoke

---

### WP-09 · Services hub furniture
**Page:** `/services`

**Do**
- [ ] Wire hero H1 from Sanity (stop ignoring `title` / hardcoded split)
- [ ] Wire section headings (specialists / AI / builds / tech) to schema
- [ ] Replace hardcoded stories + quotes with `customerStory` / `review` queries (or hub refs)
- [ ] Wire `service.thumbnail` / `technology.techLogo` onto cards/chips
- [ ] Fix search box (wire filter or remove fake search)
- [ ] Smoke

---

## P2 — Editability polish

### WP-10 · Our Work polish
**Page:** `/our-work`

**Do**
- [ ] Glassdoor rating number → Sanity field (or siteSettings)
- [ ] Hero / Impact / Mid CTA hrefs → schema fields (stop forced splices)
- [ ] Fix story card links to `/customer-story/{slug}` (not plural)
- [ ] Smoke

---

### WP-11 · Pricing media + video
**Page:** `/pricing`

**Do**
- [ ] Upgrade string image paths to Sanity image assets (candidate, logos, video still)
- [ ] Add testimonial `videoUrl` + wire player
- [ ] Emit OG image from schema in `generateMetadata`
- [ ] Clean orphans (`fixedFee.statement`, unused fields) or wire them
- [ ] Smoke

---

### WP-12 · Location pages polish
**Pages:** LATAM / PH / EE

> **Note (26 Jul):** the three stranded location PRs landed as #29 / #30 / #36
> (see Appendix C). Those were fidelity and media fixes, not editability work, so
> this package is still open. One gap they surfaced: the PH start-quiz copy is
> code-owned, only its `cards | quiz` toggle is in Sanity.

**Do**
- [ ] Confirm D1 (rates stay in code by default)
- [x] Start-quiz copy - **RETIRED (forms launch).** Quiz UI deleted; `variant` `quiz`/`none` skips Start. Lead form is the conversion path.
- [ ] Hero CTA href fields + FAQ help href field
- [ ] Make “VETTED BY SENIOR ENG” editable or UI_STRINGS
- [ ] Ensure location docs seeded; video URLs filled in Studio
- [ ] OG image field if needed
- [ ] Smoke all three slugs

---

### WP-13 · Customer Stories polish
**Pages:** `/customer-stories`, `/customer-story/[slug]`

**Do**
- [ ] Hub card links → `/customer-story/{slug}` directly
- [ ] Decide: use hub `featuredItems` OR keep boolean flags (document one)
- [ ] Move “Trusted by 300+” / section titles to Sanity or siteSettings
- [ ] Render or drop `videoIntroContent` on detail
- [ ] Smoke

---

### WP-14 · Book a Call polish
**Pages:** `/book-a-call`, `/book-a-call/[slug]`

**Do**
- [ ] Optional: make H1 prefix editable
- [ ] Show `lastName` in H1 or JSON-LD-only (document choice)
- [ ] Add OG image on `bookACall` docs if needed
- [ ] Hub: support HubSpot Meetings URLs if used (slug template already does)
- [ ] Smoke

---

## P3 — Cross-cutting (do once, helps all pages)

### WP-15 · Cross-cutting
**Do**
- [ ] OG image: for every in-scope page with `og: false` or unused OG — enable + query + `generateMetadata`
- [ ] CTA href pattern: labels without hrefs get schema `*Href` or become non-links
- [ ] Adopt `ChatLink`/`ChatPill` (built in WP-06) everywhere `#chat` or `#faq` is
 currently used as a chat CTA: Home `readyToFind` talk pills, Pricing, the three
 Location pages, catalogue FAQ panels. All are dead clicks today.
- [ ] Orphan schema cleanup pass (seeded-but-never-rendered fields) — document or delete
- [ ] `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` verified on Vercel Production + Preview
- [x] **Presentation locations map — DONE 26 Jul.** Was gating the whole track:
  `studio/sanity.config.ts` declared `defineLocations` for `homePage` and
  `contactPage` only, so every other singleton opened in Presentation with an empty
  preview pane and Seb would have concluded the work was never done. Now **31 page
  singletons × US + UK = 61 preview URLs**, driven off a single `PAGE_LOCATIONS`
  map rather than 31 copy-pasted blocks. Every URL verified 200 against a
  production build before shipping (a preview URL that 404s is worse than none).
  Home stays hand-written because it is the only page whose US path is `/`, where
  the generic `/uk${path}` join would emit `/uk/`.

  **Deliberately excluded, with reasons** (an entry for these would be a lie):
  `notFoundPage` (renders on any bad URL), `sharedServiceFaqs` (appears on all ~124
  service + technology pages), `navigation` / `footer` / `siteSettings` (sitewide
  chrome), `compareHub` (hub root retired via 301 to `/alternatives`),
  `startHiringPage` (drives `/start-hiring/[step]`, a noindex funnel with no single
  page).

  **Surfaced by this work, then RESOLVED 26 Jul — 4 singletons with no route:**
  `retentionPage`, `sourcingPage`, `embeddingPage`, `scaleThisWeekPage`. Removed:
  schema types deleted, documents deleted from the dataset, Studio structure and
  generated types updated.

  Correcting the first draft of this note, which called them orphans and framed the
  choice as build-the-routes-or-delete. That was wrong in a way that mattered. All
  four are live 200 pages on cloudemployee.io, present in the live sitemap in both
  locales, and the live homepage and How It Works page link to them repeatedly.
  They were never dead URLs — they are a real content funnel we chose not to
  rebuild. The routing decision had in fact already been made by Jake on 13 Jul and
  shipped: all eight paths (US + UK) 301, recorded in `parity-exceptions.json` and
  in the deliberate-divergence block in `site/next.config.ts`. What was genuinely
  orphaned was only the Sanity documents, which is what got deleted.

  **Destination change, 26 Jul (Jake, overriding the 13 Jul decision):**
  `/scale-this-week` and `/uk/scale-this-week` now go to the homepage rather than
  `/start-hiring/contact-info`. Recorded against the recommendation, which was to
  keep the funnel destination: the page is a booking CTA, so the funnel matches its
  intent, and pointing a specific page at a generic homepage is the pattern Google
  can read as a soft 404 and discount. Low stakes (321 impressions, position 19, no
  backlinks). If those impressions decay post-launch, this redirect is the first
  place to look.

  **Guarded deletion script:** `npm run static:delete-retired-singletons` (dry run
  by default, `--apply` to write). Refuses to run if any document holds fields
  beyond `title`/`locale`, i.e. if someone edited them since seeding, and refuses if
  anything still references them. Deletes published and draft forms in one
  transaction. All four were untouched title-only stubs from 24 Apr 2026.
- [ ] Sanity CORS already includes `https://staging.jakevibes.dev` (done)
- [x] **Singleton backup/restore script** — `npm run static:backup-singletons`
  (added 26 Jul). Was a genuine hole: every seed does `createOrReplace` on a fixed
  `_id` and there was no way back. First full snapshot taken 26 Jul (49 docs).

---

## Suggested execution sequence (one go, ordered)

| Order | Package | Est. invasiveness |
|---|---|---|
| 1 | WP-01 Home slideshow | Medium — schema + template |
| 2 | WP-02 Home Where we work | Medium |
| 3 | WP-04 About Us rebuild | **Large** |
| 4 | WP-05 Contact form | **Large** (external HubSpot GUID) |
| 5 | WP-03 For Developers join + video | Large |
| 6 | WP-06 HIW matcher/CTAs | Medium |
| 7 | WP-07 + WP-08 HE / FCTO forms | Medium |
| 8 | WP-09 Services hub | Medium |
| 9 | WP-10 → WP-14 polish pack | Small–medium each |
| 10 | WP-15 Cross-cutting | Small–medium |

---

## Definition of Done (per page)

A page is Done when:

1. Every user-facing marketing string/image/video Seb would change is editable in Studio (except D5 icons / D1 maths if locked).
2. Publish → staging reflects change within ~5–10s (Presentation or hard refresh).
3. No dead `href="#"` primary CTAs.
4. Forms that look real either submit to HubSpot/Calendly **or** are clearly demo with working outbound CTAs.
5. Meta title/description editable; OG image either wired or explicitly deferred in this doc.

---

## Appendix A — Priority gap cheat sheet (by page)

### Home
- HARDCODED: hero slideshow people + card chrome; Where We Work hubs; some CTA hrefs  
- PARTIAL: orphan `hero.profiles` / `locations`; process video URL fallback; OG unused  

### How It Works
- MISSING/HARDCODED: matcher steps 2–4; talk/FAQ destinations  
- PARTIAL: OG  

### Fractional CTO
- HARDCODED/MISSING: match form submit; FAQ chat href; icons; OG  
- DATA: empty images  

### Hire Engineers
- HARDCODED: calc maths (D1); lead submit noop; `#` links; icons  
- DATA: tour URL / images often empty  

### Our Work
- HARDCODED: Glassdoor 4.8; CTA href splices  
- PARTIAL: plural story URLs; empty photo tiles  

### For Developers
- HARDCODED: join form entire; Go code block (ok by design)  
- MISSING: testimonial videoUrl; join submit  
- PARTIAL: ghost CTA; empty photos  

### Locations ×3
- HARDCODED: calculator rates (D1); hero/FAQ hrefs; vetted badge  
- DATA: video URLs often empty  

### Pricing
- PARTIAL: string paths not Sanity assets; missing public files; OG unused; orphans  
- MISSING: testimonial videoUrl  

### About Us
- MISSING: team grid section; trusted-by; structured stats; values/reviews refs  
- PARTIAL: static template won’t render structured sections; founder image; mid CTA; nav link  

### Contact
- PARTIAL/MISSING: HubSpot form not seeded; Calendly null; phones/emails/hours; structured offices  
- ENV: portal ID may be unset on Vercel  

### Services hub
- HARDCODED: H1 split; section headings; stories; quotes; tech “see all” copy  
- PARTIAL: thumbnails/logos unused; search noop; unused hub fields  

### Customer Stories
- HARDCODED: Trusted-by 300+; section titles; Read more strings  
- PARTIAL: unused hub fields; plural card hrefs; detail `videoIntroContent` unused  

### Book a Call
- HARDCODED: H1 prefix  
- PARTIAL: `lastName` unused in H1  
- MISSING: OG on slug docs  

---

## Appendix B — Related docs

- Earlier pass detail: `docs/design/SANITY_WIRING_AUDIT.md` (batch 1 deep tables)  
- Visual editing ops: `docs/design/VISUAL_EDITING.md`  

---

## Appendix C — Branch state finding (26 Jul), needs a call from Jake

Surfaced while clearing the PR backlog. **Not acted on**, because it is a design
direction question, not a routine technical one.

**`feat/design-1` holds design work that never reached `main`.** `main` was cut
from `feat/design-1` at #20 on 25 Jul 13:28, but `feat/design-1` kept receiving
commits, one of them *after* the cut:

| Commit | Date | What |
|---|---|---|
| `7ea6e85` | 25 Jul 15:45 (after the cut) | Fix decrypt scramble glyph overlap on hero + home headings |
| `c4a8fc8` | 24 Jul | Site-wide sweep-fill CTA hover restyle across primitives, chrome, templates |
| `3e03b0b` | 24 Jul | Point hero "See how it works" CTA at `/how-it-works` |
| `777de38` | 24 Jul | Decrypt scramble freeze fix; faster Where We Work panel expansion |
| `9ce3da0` | 24 Jul | Where We Work home section; hero card + process video redesign |

`git diff main feat/design-1` is 41 files. Most of it is `main` being correctly
*ahead* (WP-01 to WP-05). The genuinely at-risk items are the CTA hover restyle
and the decrypt-text fixes, which are visual polish `main` does not have. The
Where We Work commit overlaps WP-02, which built its own Sanity-wired version, so
those two need reconciling rather than merging.

**Open question for Jake:** cherry-pick the hover restyle + decrypt fixes onto
`main`, or treat them as superseded? Until this is answered, `feat/design-1`
must not be deleted.

**Related: PRs #5, #6, #7 — RESOLVED 26 Jul. All three landed.** They were based on
`feat/design-1`, not `main`, and were real unlanded work: image optimisation
(2.1MB → 158KB on several photos), a video component rewrite, calculator changes,
a new `start-quiz.tsx`, and `location-page` schema additions. Because all three
touched the same four files they conflicted with each other as well as with `main`,
so each was cherry-picked onto `main` separately, re-verified, and landed on its
own PR. The originals were closed as superseded, not merged.

| Original | Replaced by | Landed |
|---|---|---|
| #7 Philippines | #29 | `d8f816f` |
| #5 LATAM | #30 | `44a1da2` |
| #6 Eastern Europe | #36 | `2c8b1c9` |

Two things were changed during the rebase rather than carried across verbatim:

1. **Dropped a `live.ts` hunk from the Philippines branch.** It added a
   `SANITY_PUBLIC_READ=1` escape hatch that set `serverToken` / `browserToken` to
   `false`. Nothing in the repo sets that variable, it was read raw via
   `process.env` (bypassing the strict zod env schema), and it sat in the Visual
   Editing file that CLAUDE.md explicitly lists as do-not-touch. It was local
   verify scaffolding with no product benefit, so it did not ship. Note it failed
   *closed* (no token = no draft access), so this was hygiene, not a security fix.
2. **Threaded two hardcoded strings out of `start-quiz.tsx` into props**
   (`selectedPrefix`, `emptyStatus`). They tripped the UI_STRINGS lint rule, which
   is the exact rule this track exists to satisfy. Every other string in that
   component was already a prop; these two had been missed. The quiz config stays
   code-driven by design (`queries/location-page.ts` falls back to the registry
   when Sanity has no quiz), so the copy lives in `location/content.ts`.

**Still open from this appendix:** the `feat/design-1` question above (CTA hover
restyle + decrypt-text fixes). Unresolved. Do not delete that branch.

**Known gap surfaced while landing these:** the location start-quiz copy is not
Sanity-editable. Only the `variant` toggle (`cards` | `quiz`) is in the schema; the
quiz's own strings are code-owned. Consistent with how the feature was designed,
but it is a real editability hole for a customer-facing block. Candidate for the
WP-12 Location polish package.

---

## Sign-off

| Role | Action |
|---|---|
| Jake | Confirm D1–D5; then say “execute from WP-01” (or pick a package) |
| Agent | Implement packages in order; commit after each working package; Presentation smoke before next |
