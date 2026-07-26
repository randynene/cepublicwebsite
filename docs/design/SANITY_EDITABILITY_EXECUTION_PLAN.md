# Sanity editability — consolidated execution plan

**Status:** Executing — WP-01/02 (#22), WP-03 (#23), WP-04 (#24) merged; WP-05 (this PR)
**Date:** 2026-07-25  
**Goal:** Seb can edit *everything meaningful* on the main marketing pages via Sanity Studio → Publish → staging updates.  
**Source of truth site:** https://staging.jakevibes.dev  
**Studio:** https://mygratr-cloudemployee.sanity.studio/

This document consolidates two fan-out audits into **one ordered fix backlog**. Execute in the work packages below (not random drive-bys).

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
- [ ] Confirm D2 for matcher steps 2–4
- [ ] Wire talk CTA hrefs (AI chat / book-a-call) — stop non-clickable `<span>`s
- [ ] FAQ fallback CTA: real chat URL field (stop `href="#faq"`)
- [ ] Optional: schema for matcher steps 2–4 if making interactive
- [ ] Smoke

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

**Do**
- [ ] Confirm D1 (rates stay in code by default)
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
- [ ] Orphan schema cleanup pass (seeded-but-never-rendered fields) — document or delete
- [ ] `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` verified on Vercel Production + Preview
- [ ] Presentation locations map expanded beyond `homePage` for key singletons (optional UX win)
- [ ] Sanity CORS already includes `https://staging.jakevibes.dev` (done)

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

## Sign-off

| Role | Action |
|---|---|
| Jake | Confirm D1–D5; then say “execute from WP-01” (or pick a package) |
| Agent | Implement packages in order; commit after each working package; Presentation smoke before next |
