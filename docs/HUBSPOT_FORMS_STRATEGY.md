# HubSpot + lead-gateway strategy

> **Status:** STRATEGY LOCKED, BUILD STILL PARKED.
> **Owner:** Jake + agent.
> **Created:** 30 Jul 2026 (from Marker CE-17 discussion + forms audit).
> **Updated:** 30 Jul 2026 - strategy session. Doc confirmed against the live
> codebase; every open decision in §"Open decisions" now carries a locked answer
> or a named Jake gate. Build brief: `docs/briefs/active/GATEWAY-3-QUICK-HIRING-FORM.md`.
> **Still do not build until Jake says "unpark and build".** Nothing in HubSpot
> has been created, renamed, or mutated by this session.

---

## Confirmation pass (30 Jul 2026) - what changed after reading the code

Every claim in the original draft was checked against the repo. The four-gateway
model survives intact. Seven things were wrong, missing, or stated more
confidently than the evidence supports. They are folded in below and each one is
marked **[CONFIRM-n]** where it appears.

| # | Finding | Impact |
|---|---|---|
| **CONFIRM-1** | The Contact and Newsletter form GUIDs are **our substitutions**, not live's. Live posts both through a `hubspotonwebflow.com` bridge whose GUIDs 404 on HubSpot. We picked real portal forms instead. They resolve - but **nobody has confirmed a human reads those two forms' submissions.** | Jake gate. Two of the four gateways may be landing in a form Seb never opens. |
| **CONFIRM-2** | `/price-comparison-calculator` **lost a real live form.** Live embeds "Start Hiring Request" (`24f5bd5f-…`) there; our rebuild has no form at all. | A live lead path that does not exist on the new site. Gateway-3 embed target. |
| **CONFIRM-3** | "Connected workflows: none" is an **artifact, not a fact.** The April audit's HubSpot token lacked the `automation` scope (Tech Debt #8), so `connectedWorkflowIds` came back empty for every form regardless of reality. | We do **not** know whether HubSpot already notifies Slack. Must check before building a second notification path. |
| **CONFIRM-4** | The site has **no server-side POST capability at all.** The only API routes are draft-mode enable/disable. | Gateway 3 needs the first real API route in this codebase. Architecture decision, now locked as D3 below. |
| **CONFIRM-5** | HubSpot API plumbing **already exists** (`src/lib/content/hubspot-forms.ts`, reads `marketing/v3/forms`). The gap is **scopes**, not wiring. | "Install HubSpot API access" is half done. Reframed as a scope request. |
| **CONFIRM-6** | `download.hubspotFormId` is in the Sanity schema **and populated by the migrator**, but no template renders it. | "Downloads stay ungated" is the right call, but it is a **deliberate divergence from live** and must be recorded as such, not left looking like an oversight. |
| **CONFIRM-7** | No HubSpot MCP exists in this project. A Slack MCP exists but is unauthenticated - and **even authenticated it would not help the production site**, because an MCP only lets the agent post during a chat session. The live site needs its own Slack Incoming Webhook. | Corrects a likely misreading of "manage HubSpot from Cursor". |

The rest of the original draft's factual claims (portal id, the three real form
paths, the demo list, the start-hiring funnel being real) all check out.

---

## Why this exists

The site has several things that *look* like lead forms. Only a few actually create HubSpot leads. Seb’s Marker ticket CE-17 (Proxify-style skills typeahead on Hire Engineers) exposed a bigger problem: we should not bolt a pretty skill picker onto a demo form that never submits.

Jake’s goal: one clear lead system, manageable from Cursor / Claude Code (HubSpot API or MCP), Slack-notified, no clicking around HubSpot to find which form is which.

---

## The four lead gateways (Jake’s model)

These are the intentional ways a lead should enter the business. Everything else is either a CTA into one of these, or content (downloads) with no forced contact.

### 1. Book a call (Calendly)

- User schedules directly with a human.
- Already connected through to HubSpot.
- Keep. Do not replace with a form.

### 2. Contact us

- Existing Contact HubSpot form (portal `22809822`, form `4b883c7d-72c1-4f9c-8196-de68fce303d6`).
- Can live as a simple Contact page + footer link. Does **not** need to be in the top nav.
- Keep as the “I just want to message you” path.
- **[CONFIRM-1]** That GUID is ours, not live's. Live's contact page markup carries
  `fb70845a-…`, a `hubspotonwebflow.com` bridge id that 404s on HubSpot. We
  substituted the real portal form "Contact Request (via cloudemployee.io/contact)".
  It renders and submits. What is unverified is whether anyone at CE watches it.
  Evidence: `site/src/components/templates/contact/content.ts:53-58`.
- The rendered id actually comes from Sanity (`contactPage.form.hubspotFormId`);
  the code constant is only a fallback. Two sources of truth - check both.

### 3. Quick hiring form (Proxify-shaped component) — TO BUILD

A reusable multi-step component that can sit on multiple pages (Hire Engineers, homepage, locations, etc.).

Proxify reference shape (screenshots captured in the Marker discussion):

1. **Skills** — search + popular pills; multi-select; typeahead.
2. **How long** — e.g. 6+ months / 3–6 / 1–3.
3. **Commitment** — full-time / part-time / hourly.
4. **Contact** — name, work email, phone → then push to **book a call**.

Requirements when we build it:

- Custom CE design (dark/lime). Not a raw HubSpot embed look.
- Submits into HubSpot (real lead — not a demo).
- Posts / notifies the existing **AA leads Slack** channel.
- One component, reused; not a different form inventing itself per page.
- Field list and HubSpot properties decided in the unpark session before coding.

### 4. Ask Our AI Anything (Ask Clara)

- Separate agent track: **Ask Clara P1** (in progress elsewhere).
- Highest-intent conversational path: extract context, then book a call.
- Wire HubSpot + Slack when that track lands. Do not duplicate it inside marketing quiz demos.

### Also: footer email / newsletter

- Footer newsletter already has a real HubSpot form (`b411a11f-1548-4cf7-887e-26fac7824006`).
- Optional later: plain `mailto:` / displayed email for “just email us.” Not a fifth funnel — a convenience.
- **[CONFIRM-1]** Same substitution story as Contact. Live posted the newsletter
  through the bridge GUID `deac2450-…`, which is not a HubSpot form id at all;
  every signup on the new site went nowhere silently until this was caught. We now
  point at the real portal form "NewsLetter Subscribe (via cloudemployee.io)"
  (104 submissions at the time it was found). Evidence:
  `site/src/components/layout/footer/subscribe.tsx:9-15`.

### Downloads and other gates

- Downloads, gated assets, etc. can stay “take what you want.”
- Contact happens through gateways 1–4 when they want to talk.
- Do not invent a new HubSpot form per download unless Jake explicitly adds that gateway later.
- **[CONFIRM-6]** This is a **deliberate divergence from live**, not a gap.
  `download.hubspotFormId` exists in the Sanity schema
  (`studio/schemas/documents/download.ts:112`) and the migrator populated it
  (`scripts/content/migrate-downloads.ts:85`), but no template renders it -
  `site/src/components/templates/download/index.tsx` ships plain link CTAs.
  Action when we unpark: record it in `data/webflow/parity-exceptions.json` with
  Jake named as the decider, so the parity gate stops looking like it is hiding
  something. Leave the Sanity field in place (harmless, and re-gating later is
  then a render change rather than a migration).

---

## What exists on the site today (facts)

Portal: `22809822`.

### Actually creates HubSpot leads today

Confirmed by reading every `HubSpotFormEmbed` call site. There are only four.

| Path | What | Form id source | Notes |
|---|---|---|---|
| `/start-hiring/{step}` (+ `/uk/`) | Multi-step HubSpot embeds, one form **per step** | Sanity `startHiringStep.hubspotFormId` | Real funnel. 8 US steps, 9 UK. **HubSpot owns the step order** - each form's post-submit redirect IS the chain. US entry = `contact-info`; `get-started` is UK-only. |
| Contact page (+ `/uk/`) | HubSpot form `4b883c7d-…` | Sanity `contactPage.form.hubspotFormId`, code fallback | Real. See CONFIRM-1. |
| Footer newsletter (sitewide) | HubSpot form `b411a11f-…` | Sanity `footer.subscribe.formId`, code fallback | Real. See CONFIRM-1. |
| Any static page carrying a `hubspotFormSection` | HubSpot embed | Sanity section `formId` | Wired in `static-page/index.tsx:39-44` but **no page currently uses it**. Available hook, unused. |

Everything real routes through one primitive:
`site/src/components/ui/hubspot-form-embed/index.tsx`. It needs
`NEXT_PUBLIC_HUBSPOT_PORTAL_ID`; if that is unset it renders an error box, not a
form.

### Looks like a form, does NOT create a HubSpot lead today

The original draft undercounted this list. Full version:

| Path | What happens |
|---|---|
| Hire Engineers “four quick questions” (`/services/software-engineers`) | Local React state; final CTA does `window.location.assign('/book-a-call')`. **CE-17 lives here.** `hire-engineers/index.tsx:341-356` |
| Fractional CTO match quiz (`/services/fractional-ctos`) | Local stepper + CTAs out. |
| Homepage “Ready to find” style steps | Local / static; not a HubSpot submit. |
| How It Works matcher | Stub / CTAs. |
| For Developers join form (`/for-developers`) | Fake done-state, by design. Talent, not client - separate system. |
| Location quiz | Deep-links to `/start-hiring?role=`; not a form. |
| **`/price-comparison-calculator`** | **[CONFIRM-2] Live has a real HubSpot form here (`24f5bd5f-…`, "Start Hiring Request"). Our rebuild dropped it. Local maths only.** |
| `/hiring-cost-calculator`, `/pricing` calculator | Local maths only. No live form on these two. |
| `/ask` (Ask Clara) | Send button has no handler yet. Gateway 4, P1 shell only - expected. |
| `/demo` kitchen sink | Toast only. Production-guarded, ignore. |

### Scheduling (not Forms)

| Path | Tool |
|---|---|
| `/book-a-call/[slug]` | Calendly inline or HubSpot Meetings iframe, per Sanity doc |
| `/contact` quick strip | Calendly popup (`calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee`) |
| Header “Talk to a human” | Link to `/book-a-call` |

### What the April audit found in the portal

25 forms exist on portal `22809822`; **only 3 were embedded on live pages**
(`docs/CE_SITE_TRUTH.md` §4). Those three, with their real field shapes, are the
best evidence we have of what CE actually asks people:

| Form | Where on live | Fields |
|---|---|---|
| Start Hiring Request (`24f5bd5f-…`) | `/price-comparison-calculator` | `firstname`, `lastname`, `email`, `cell_phone`, `company`, `information` (textarea) |
| New form Nov 2024 (`444bfbf1-…`) | one blog article | `firstname`, `lastname`, `email`, `country`, `ctomessage` |
| Start Hiring (Part 2/8) (`1578f9b5-…`) | `/start-hiring/contact-info` | `company`, `phone`, `firstname`, `email` |

Two things follow. First, **CE's existing contact-property vocabulary is plain
HubSpot standard fields** - there is nothing exotic to preserve. Second, the
HubSpot form **names are already stale and misleading** ("Part 2/8" sits on what
is now a different step number, because a step was removed and nothing was
renumbered). That is the junk drawer Jake wants tidied, evidenced.

---

## The dream state (Jake)

1. **Four clear gateways** (above) — named, labelled, verified.
2. **HubSpot is tidy** — forms named so it’s obvious these are the main website forms (not a junk drawer of legacy GUIDs).
3. **Slack** — every real website lead path notifies the AA leads channel.
4. **Cursor / Claude Code owns the plumbing** — create/update forms, properties, and wiring via HubSpot API (and/or a HubSpot MCP). Jake does not want to click around HubSpot to manage forms.
5. **Custom UI for the quick hiring form** — Proxify interaction, CE skin, HubSpot behind it.
6. **No silent demos** — if it looks like a lead form, it creates a lead (or clearly CTAs into a real gateway).

### What “manage HubSpot from Cursor” can and cannot do

| Can (API / MCP) | Still often needs HubSpot UI |
|---|---|
| Create/list/update forms | Fancy marketing email builders |
| Contact properties + contacts | Complex visual workflow canvas (unless we replace with our Slack webhook) |
| Submit leads from custom UI | Billing / some admin |
| Verify form IDs on staging | Sales pipeline cosmetics |

**[CONFIRM-5] The API wiring already exists.** `src/lib/content/hubspot-forms.ts`
already calls `api.hubapi.com/marketing/v3/forms` with `HUBSPOT_ACCESS_TOKEN`, and
`scripts/audit/06-forms-inventory.ts` uses it too. Nothing needs installing. What
is missing is **scopes on the token** - today it has `forms` (read) and is known to
be missing `automation` (Tech Debt #8, open since AUDIT-1).

**[CONFIRM-7] Two separate things get confused here, so stating both plainly:**

1. **Agent-side control (Jake's "no clicking around HubSpot" wish).** Needs a
   HubSpot token with write scopes. There is **no HubSpot MCP in this project**;
   the API is enough and we already speak it. An MCP would be nicer chat
   ergonomics, not new capability. Optional, not a blocker.
2. **Production-side notification (Jake's "Slack AA leads" wish).** An MCP does
   **nothing** for this. An MCP only lets *the agent* act during a chat session.
   The deployed site cannot use it. The live site needs its own Slack **Incoming
   Webhook URL** stored as an env var, or a HubSpot workflow. There is no way
   around that.

A Slack MCP *is* present in this Cursor project but is unauthenticated. Even
authenticated it only covers (1)-style convenience, never (2).

---

## Decisions already taken in the Marker discussion

- **CE-17:** parked for this Marker pass. Do not build Proxify skills on the current Hire Engineers demo until this strategy session runs.
- **Do not** invent “Start process” CTAs (CE-12 closed: keep **Contact us today** sitewide).
- **Do not** rebuild `/start-hiring` mid-Marker. It stays the interim serious multi-step path until the Proxify-shaped component replaces or absorbs it.
- Marker visual/copy fixes land first. Forms rethink is next.

---

## Open decisions - RESOLVED 30 Jul 2026

Each carries a recommendation, the one-line tradeoff, and whether it is locked or
waiting on Jake. Full build detail lives in
`docs/briefs/active/GATEWAY-3-QUICK-HIRING-FORM.md`.

### D1. Keep `/start-hiring`, or replace it with the Proxify form?

**LOCKED: keep it, unpromoted. The Proxify form does not replace it.**

`/start-hiring` is 17 URLs (8 US steps + 9 UK) driven by **nine separate HubSpot
forms whose post-submit redirects define the running order**. That order is not in
our code - it is HubSpot configuration. Retiring it means untangling nine forms
and 17 live URLs during a domain migration, to remove the one hiring funnel that
demonstrably works today. Not a trade worth making before cutover.

So: gateway 3 becomes the **promoted** hiring path. `/start-hiring` stays alive,
keeps parity, gets no new inbound links. This matches the already-locked
lead-conversion plan ("M3 keep alive only - do not promote", 26 Jul).

*Tradeoff:* two hiring funnels co-exist for a while, so leads arrive in HubSpot in
two shapes - mitigated by stamping `ce_lead_gateway` on every submission (D4) so
they stay tellable apart.

*Revisit:* post-launch, on real submission volume. Not now.

### D2. New HubSpot forms, or reuse existing GUIDs?

**LOCKED: one new form, existing properties.**

Create exactly one new HubSpot form for gateway 3. Do not reuse `24f5bd5f-…` -
mixing new quick-form leads into the calculator form's submission history makes
both unreadable, and it carries no fields for skills, duration, or commitment.

But **reuse HubSpot's standard contact properties** (`firstname`, `lastname`,
`email`, `phone`, `company`). The April audit proved CE's live forms use nothing
but standard fields, so there is no bespoke vocabulary to protect and every
existing HubSpot list, view, and pipeline keeps working untouched. New custom
properties get created **only** for the genuinely new things (D4).

*Tradeoff:* one more form in a portal that already has 25 - paid for by the
naming convention in D6 and the archive pass.

### D3. Slack path - HubSpot workflow, or our own handler?

**RECOMMENDED (Jake to confirm, not blocking the build): our handler posts to a
Slack Incoming Webhook, for gateway 3 only.**

Gateway 3 is the only gateway whose submission passes through our server, so it is
the only one where we have the choice. Our handler already holds the full
structured payload (skills array, duration, commitment, source page) and can
format a Slack message that is actually readable; a HubSpot workflow notification
renders custom properties poorly. It is also code - versioned, reviewable, and
changeable from Cursor, which is what Jake asked for.

Critically, the handler fires Slack **independently of the HubSpot result**. If
HubSpot errors, the lead still hits Slack. Never lose a lead to a vendor outage.

Gateways 1 (Calendly), 2 (Contact) and the newsletter never touch our server, so
they need a HubSpot workflow regardless. That is a HubSpot-side job, not code.

**This is the strategic bit for Jake:** splitting notification ownership means
Seb can change routing for gateways 1/2 in the HubSpot UI, but changing gateway 3's
routing needs a developer. The alternative - everything through HubSpot workflows -
is one place and self-service, but loses the independent-of-HubSpot safety net and
formats badly. **Recommendation stands at the split. Say if you want it all in
HubSpot instead.**

**[CONFIRM-3] Blocking prerequisite:** we do **not** know what HubSpot notifies
today. The April audit reported zero connected workflows for every form, but that
was a missing `automation` token scope, not reality. Check before building a
second notification path, or the AA leads channel gets doubles.

### D4. Field list + HubSpot property names

**LOCKED.** Four steps, matching the Proxify shape.

| Step | Asks | HubSpot property | Type | New? |
|---|---|---|---|---|
| 1. Skills | multi-select, typeahead + popular pills | `ce_skills_requested` | multi-line text, comma-joined | **new** |
| 2. How long | 6+ months / 3-6 / 1-3 / Not sure | `ce_engagement_length` | dropdown, 4 fixed options | **new** |
| 3. Commitment | Full-time / Part-time / Hourly | `ce_commitment` | dropdown, 3 fixed options | **new** |
| 4. Contact | first name | `firstname` | standard | existing |
| | last name | `lastname` | standard | existing |
| | work email | `email` | standard | existing |
| | phone | `phone` | standard | existing |
| | company | `company` | standard | existing |
| (hidden) | which gateway produced this lead | `ce_lead_gateway` | dropdown | **new** |
| (hidden) | page the form was submitted from | `ce_source_page` | single-line text | **new** |

Skills is deliberately **free text, not a checkbox property**. A checkbox property
needs its option list maintained inside HubSpot every time CE adds a skill, and a
skill we forget to add is silently dropped on submit. Text never breaks.
*Tradeoff:* less clean to filter on in HubSpot. Revisit once we see what people
actually type.

`ce_lead_gateway` is the highest-value item here and applies to **all** gateways,
not just this one: `book_a_call` / `contact_form` / `quick_hiring_form` /
`ask_clara` / `newsletter` / `start_hiring_legacy`. It makes "which gateway
produced this lead" answerable in HubSpot forever, which is the whole point of
naming four gateways.

Two technical requirements that are easy to miss and expensive to retrofit:

- **Pass the `hubspotutk` cookie** through the handler as `context.hutk`. The
  sitewide HubSpot tracking script already sets it. Without it every lead looks
  like a brand-new anonymous contact and all attribution (which page, which
  campaign, which visit) is lost.
- **Consent.** HubSpot's submission API takes `legalConsentOptions`, and CE
  currently runs **no cookie consent banner at all** (April audit:
  `hasCookieConsent: False`). What we must show next to the submit button is a
  Jake-and-legal question, not an engineering one. Flagged, not decided.

### D5. Which pages embed the form vs just link to it?

**LOCKED. Three embeds, everything else is a CTA.**

**Embed:**
1. `/services/software-engineers` - replaces the `FindForm` demo. This is where CE-17 lands.
2. `/price-comparison-calculator` - restores the live regression from CONFIRM-2.
3. `/pricing`, below the calculator result - the interest spike the lead-conversion plan already named priority #1.

**CTA only** (scroll or link to one of the above): Home, Locations ×3, Fractional
CTO, How It Works, service and technology detail pages.

**Nothing at all:** blog, hubs, downloads, customer stories, reviews (soft
book-a-call CTA only), For Developers (talent, separate system), `/ask` (gateway 4
owns that surface).

*Tradeoff:* three embeds is fewer conversion surfaces than we could have, but each
embed is a page we then have to keep visually consistent forever, and the locked
lead-conversion plan explicitly says do not put forms everywhere.

**Jake decision needed - gateways 3 and 4 collide on Pricing.** The 26 Jul
lead-conversion plan reserved the Pricing calculator surface for the AI chat +
living brief (what is now Ask Clara). This brief puts the quick hiring form there
instead. Both cannot be the primary CTA under the calculator. **Recommendation:
quick form now, because it is buildable and real today; revisit when Ask Clara
reaches P3 and can actually hold a conversation.** Say if you would rather keep
Pricing clear for Clara.

### D6. HubSpot naming convention

**LOCKED: `CE Web - <Gateway>`, legacy prefixed `zz Legacy - `.**

| Form | Rename to |
|---|---|
| new gateway-3 form | `CE Web - Quick Hiring Form` |
| `4b883c7d-…` | `CE Web - Contact` |
| `b411a11f-…` | `CE Web - Newsletter` |
| the 9 start-hiring step forms | `zz Legacy - Start Hiring (step N)` |
| everything else unused | `zz Legacy - <existing name>` |

`zz` sorts them to the bottom of every HubSpot picker, so the four that matter sit
at the top. **Renaming a HubSpot form does not change its GUID and does not touch
its submissions** - it is safe and reversible. But it changes Seb's workspace, so
Jake tells Seb before we run it.

### D7. Ask Clara HubSpot mapping

**DEFERRED to the Clara track, but the shape is reserved now.**

Clara writes the same contact properties and stamps `ce_lead_gateway = ask_clara`.
The instruction to that track is simply: use these property names, do not invent
your own. Otherwise gateway 3 and gateway 4 leads are not comparable and the whole
gateway model stops meaning anything. Clara already has a HubSpot upsert
(`LEAD_CONVERSION_AUDIT_2026-07-26.md`), so this is an alignment, not a build.

---

## Still on Jake (nothing below can be done by the agent)

| # | Item | Why it is yours | Blocks |
|---|---|---|---|
| J1 | Confirm a human at CE actually reads submissions to `4b883c7d-…` (Contact) and `b411a11f-…` (Newsletter) | CONFIRM-1. Requires looking in HubSpot. Two of four gateways may be landing nowhere anyone looks. | Cutover, not the build |
| J2 | Check what HubSpot notifies **today** - workflows, notify-emails, existing Slack app | CONFIRM-3. Requires HubSpot UI or an `automation`-scoped token. Building Slack blind risks double-notifying. | D3 build |
| J3 | Create the Slack Incoming Webhook for the AA leads channel; add `SLACK_LEADS_WEBHOOK_URL` to Vercel + `.env.local` | Credential. Hard stop per safety rules - the agent never touches env vars or tokens. | D3 build |
| J4 | Provide a HubSpot private-app token with `forms` (write), `crm.objects.contacts.write`, `crm.schemas.contacts.write`, `automation` | Credential, and it grants write access to live CRM data. | D2, D4, D6 |
| J5 | Decide D3: split notifications, or everything through HubSpot workflows | Affects whether Seb can change lead routing without a developer | D3 build |
| J6 | Decide D5 collision: quick form or Ask Clara under the Pricing calculator | Product direction | Pricing embed only |
| J7 | Consent / privacy wording next to the submit button | Legal. CE runs no consent banner today. | Going live with the form |
| J8 | Tell Seb before the HubSpot rename pass (D6) | It is his workspace | D6 |
| J9 | Say "unpark and build" | Nothing starts without it | Everything |

---

## Unpark session order (revised after the 30 Jul confirmation pass)

Steps 1 and 3 of the original list are now **done** (this session). Revised:

1. ~~Install / verify HubSpot API access~~ **Done** - it exists
   (`src/lib/content/hubspot-forms.ts`). What remains is J4, a token with write
   scopes. An MCP is optional ergonomics, not capability (CONFIRM-7).
2. Inventory every form GUID on portal `22809822`; label keep vs archive.
   **Needs J4.** Read-only, safe, and it is the input to the D6 rename pass.
3. ~~Lock the four-gateway map + field list~~ **Done** - see D1-D7 above and the
   build brief.
4. Create the new form + 5 custom properties from Cursor; run the D6 renames.
   **Needs J4 + J8.** Creating properties is additive and safe; the rename pass
   touches Seb's workspace.
5. Build the Proxify-shaped React component + the API route. **Needs J3 for the
   Slack half; the HubSpot half can be built and tested first.**
6. Point the three embed pages at it; delete the fake submits (CE-17 lands here).
7. Smoke-test one real lead per gateway into HubSpot + Slack. **Jake runs this** -
   it is the only proof that matters.
8. Update `docs/ROADMAP_TO_COMPLETION.md` §7a with the final map and tick 7.9.

---

## Related Marker tickets

| ID | Note |
|---|---|
| **CE-17** | Skills autocomplete / Proxify UI — parked here. Do not execute in the Marker visual batch. |
| Hire Engineers / FCTO / Home form demos | Treated as gateway-3 candidates when we unpark. |

---

## Related code (starting points)

- HubSpot embed primitive: `site/src/components/ui/hubspot-form-embed/index.tsx`
- Start Hiring: `site/src/components/templates/start-hiring/`
- Hire Engineers quiz (demo): `site/src/components/templates/hire-engineers/index.tsx` (`FindForm`)
- Contact: `site/src/components/templates/contact/`
- Footer subscribe: `site/src/components/layout/footer/subscribe.tsx`
- Roadmap cutover notes: `docs/ROADMAP_TO_COMPLETION.md` §7a
- Portal ID env: `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`
- HubSpot API client (already exists): `src/lib/content/hubspot-forms.ts`
- Live form field shapes captured in April: `docs/CE_SITE_TRUTH.md` §4
- Verifiers: `scripts/launch/verify-hubspot-forms.ts` (Sanity-sourced),
  `scripts/launch/verify-hubspot-forms-staging.ts` (HTML crawl)
- Locked lead-conversion model this sits inside:
  `docs/design/lead-conversion/LEAD_CONVERSION_EXECUTION_PLAN.md`
- **Build brief: `docs/briefs/active/GATEWAY-3-QUICK-HIRING-FORM.md`**

---

*Strategy is locked. When Jake says “unpark and build”, open the build brief.*
