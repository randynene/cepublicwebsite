# MYGRATR-GATEWAY-3 - Quick hiring form (Proxify-shaped)

> **Status:** UNPARKED 30 Jul 2026. Blocked only on a HubSpot form id (J-C).
> **Authored:** 30 Jul 2026, from `docs/HUBSPOT_FORMS_STRATEGY.md` decisions D1-D7.
> **Revised same day** for Jake's launch model. Changes from the first draft:
>
> - **`/start-hiring` is retired, not kept.** D1 is overtaken. The funnel now 301s
>   to `/book-a-call`; routes, template and query are deleted. Already shipped.
> - **The footer newsletter is removed.** Already shipped.
> - **Placement changed.** The form goes on **services and technology pages**, not
>   the three pages D5 named. Pricing is no longer contested, so the Ask Clara
>   collision (old J6) is moot.
> - **Launch is tomorrow.** Phase ordering below is now driven by that.
>
> **Strategy doc is the parent.** If this brief and that doc disagree, the doc wins
> and this file is stale.
> **Complexity:** HIGH. First server-side POST in this codebase, first custom
> HubSpot property creation, first Slack integration, touches live CRM data.
> **Audit:** cross-model audit via `.audit/` kit required before execution
> (30-safety: foundational + touches credentials-adjacent surface).

---

## 0. What this is, in one paragraph

Cloud Employee has four intentional ways a lead can enter the business. Three of
them exist. The third one - "I know roughly what I need, take my details" - is
currently a **demo**: a four-step quiz on the Hire Engineers page that looks like
a form, collects nothing, and dumps the visitor at `/book-a-call`. This brief
builds the real thing: one reusable multi-step component in CE's dark/lime design,
which submits to HubSpot and pings the AA leads Slack channel, and which replaces
the demo on three pages.

**Non-negotiable:** when this ships, no page on the site shows something that
looks like a lead form and captures nothing. Either it is real, or it is visibly a
CTA into a real gateway.

---

## 1. Step 0 - mandatory probes before any code

Step 0 is sacred. Every probe either confirms the design or changes it. **Jake runs
the ones marked [JAKE] and pastes results back. Never fabricate a result.**

| # | Probe | Why | Owner |
|---|---|---|---|
| P1 | `git log --oneline -3` on the branch base; confirm working tree clean | Branch-base sanity | Agent |
| P2 | List every form on portal `22809822` via `fetchHubSpotForms()`; dump id + name + redirectTo | We have 25 forms and stale names. This is the input to the D6 rename pass and proves the token works. | Agent, **needs J4 token** |
| P3 | List existing contact properties; confirm `ce_*` namespace is unused | Creating a property that already exists is a silent overwrite of Seb's data | Agent, **needs J4** |
| P4 | **[JAKE]** In HubSpot: does anything currently notify a human on form submit? Workflows, form notify-emails, Slack app | CONFIRM-3 - the April audit's "no workflows" was a missing token scope, not a fact. Building blind risks double-notifying. | Jake (J2) |
| P5 | **[JAKE]** Open the Contact form (`4b883c7d-…`) and Newsletter form (`b411a11f-…`) submission lists. Is anyone reading them? Any submissions since staging went up? | CONFIRM-1 - we substituted these GUIDs ourselves. If nobody watches them, gateways 2 and the newsletter are landing nowhere. | Jake (J1) |
| P6 | Confirm `hubspotutk` cookie is actually set on staging (DevTools > Application > Cookies) | Attribution depends on it. The tracking script is wired, but wired is not the same as working. | Jake or agent via staging fetch |
| P7 | Read `site/src/components/templates/hire-engineers/index.tsx` in full before editing; FIND the line numbers, do not trust the ones in this brief | Standing rule. This file has been edited since this brief was written. | Agent |
| P8 | File-path collision check for every new path in §4 | Standing rule | Agent |

**Halt condition:** if P2 or P3 fail on auth, stop. Do not proceed with a
read-only token and improvise. That is a J4 gate, not a workaround.

---

## 2. Architecture decisions (locked)

### D3-A. The submit path

The site has **no server-side POST capability today** - the only API routes are
draft-mode enable/disable. This is the first one.

```
  Visitor fills 4-step form (client component, CE dark/lime)
            |
            v
  POST /api/leads/quick-hiring          <- new Next.js route handler, server-side
            |
            +---> HubSpot Forms Submission API v3        (the lead)
            |       api.hsforms.com/submissions/v3/integration/submit/{portal}/{guid}
            |       carries context.hutk for attribution
            |
            +---> Slack Incoming Webhook                 (the shout)
                    fires INDEPENDENTLY of the HubSpot result
            |
            v
  Respond to client -> success state -> CTA to /book-a-call
```

**Why a server route and not a direct browser POST.** HubSpot's submission
endpoint is public and would work from the browser, but then Slack needs a HubSpot
workflow, there is nowhere to put spam protection, and we cannot log a failure.
One server handler owns both sides.

*Tradeoff:* a serverless function invocation per submit, and one more moving part
than an embed. Worth it - it is the only way to get Slack and HubSpot to fail
independently.

### D3-B. Failure behaviour (this is the important one)

| What fails | What the visitor sees | What we do |
|---|---|---|
| HubSpot 4xx/5xx | **Success.** | Slack still fires, tagged `HUBSPOT WRITE FAILED`, with the full payload in the message so the lead is recoverable by hand. Log the error. |
| Slack fails | **Success.** | HubSpot still has the lead. Log the error. |
| Both fail | Error state with a `mailto:` fallback and a link to `/book-a-call` | Log loudly. |
| No JavaScript | The form does not render; a plain "Talk to a human" link to `/book-a-call` renders in its place | Progressive fallback, per the locked lead-conversion plan |

**Never show a visitor an error because a vendor is down.** A lead that reached
our server is a lead we own.

### D3-C. Not a HubSpot embed

This is a CE React component posting to HubSpot's API, **not** a
`<HubSpotFormEmbed>`. The existing primitive stays exactly as it is and keeps
serving Contact, Newsletter, and start-hiring. Do not touch it.

---

## 3. The component - shape and states

Four steps. Steps 1-3 are zero-friction (no typing required except skill search).
Contact details are asked **last**, once the visitor has already invested.

```
+--------------------------------------------------------------+
|  (1)---(2)---(3)---(4)          <- stepper, current lit lime  |
|                                                              |
|  What skills do you need?                                    |
|  +--------------------------------------------------------+  |
|  | Search skills...                          [typeahead]  |  |
|  +--------------------------------------------------------+  |
|                                                              |
|  Popular:                                                    |
|  ( React )  ( Node.js )  ( Python )  ( .NET )  ( PHP )       |
|  ( Laravel )  ( AWS )  ( React Native )  ( QA )              |
|                                                              |
|  Selected:  [ React x ]  [ AWS x ]                           |
|                                                              |
|                                    [ Back ]   [ Next -> ]    |
+--------------------------------------------------------------+

step 2  How long do you need them?     6+ months / 3-6 / 1-3 / Not sure
step 3  What commitment?               Full-time / Part-time / Hourly
step 4  Your details                   first, last, work email, phone, company
                                       -> [ Get matched ]

success  "We've got it. Want to skip the wait?"  -> [ Book a call ]
```

**States to build:** empty, mid-step, validating, submitting, success,
error-with-fallback, no-JS. All seven. A missing error state is how "built != working"
happens.

**Accessibility contract** (inherited from the lead-conversion plan, non-optional):
focus moves to the new step heading on advance, 44px minimum touch targets, step
changes announced politely to screen readers, reduced-motion respected, mobile
keyboard does not cover the submit button.

**Design:** dark/lime D2 tokens, composed from existing primitives in
`site/src/components/ui/` (`input`, `button`, `tag`, `form-field`, `checkbox`).
Do **not** invent new primitives. react-hook-form + zod, per the frontend rules.

---

## 4. Numbered build steps with exact file paths

Every behaviour traces to a file. No orphans.

### Phase 1 - HubSpot side (needs J4 token; no site code)

| # | Step | File |
|---|---|---|
| 1.1 | Extend the HubSpot client with property + form creation | `src/lib/content/hubspot-forms.ts` (extend, do not fork) |
| 1.2 | Script: create the 5 custom contact properties (`ce_skills_requested`, `ce_engagement_length`, `ce_commitment`, `ce_lead_gateway`, `ce_source_page`). **Idempotent** - checks existence first, never overwrites | `scripts/hubspot/create-lead-properties.ts` (new dir) |
| 1.3 | Script: create the form `CE Web - Quick Hiring Form`; print the GUID | `scripts/hubspot/create-quick-hiring-form.ts` |
| 1.4 | Script: the D6 rename pass. **Dry-run by default**, `--apply` to execute. Prints a before/after table. | `scripts/hubspot/rename-forms.ts` |
| 1.5 | Add `npm run hubspot:*` entries | `package.json` |

**Gate:** 1.4 is the only step that changes anything Seb sees. Jake reviews the
dry-run output and tells Seb before `--apply`. Renames do not change GUIDs or lose
submissions, but they are still his workspace.

### Phase 2 - the submit route (needs J3 for Slack; HubSpot half testable alone)

| # | Step | File |
|---|---|---|
| 2.1 | Zod schema for the payload, shared client + server | `site/src/lib/leads/schema.ts` |
| 2.2 | HubSpot submission client (v3 submissions API, `context.hutk`, `pageUri`, `pageName`) | `site/src/lib/leads/hubspot.ts` |
| 2.3 | Slack webhook client. Reads `SLACK_LEADS_WEBHOOK_URL`. **No-ops with a warning if unset** so local dev works without the credential | `site/src/lib/leads/slack.ts` |
| 2.4 | The route handler. Validate -> HubSpot -> Slack -> respond. Both calls wrapped so neither can take the other down (D3-B) | `site/src/app/api/leads/quick-hiring/route.ts` |
| 2.5 | Env: add `SLACK_LEADS_WEBHOOK_URL` + `HUBSPOT_QUICK_HIRING_FORM_ID` to the server schema as **optional** | `site/src/lib/env.ts` |
| 2.6 | Basic abuse protection: honeypot field + per-IP rate limit | in 2.4 |

**Do not** put the Slack URL or any HubSpot token in a `NEXT_PUBLIC_` var. Server
only. The route is the boundary.

### Phase 3 - the component

| # | Step | File |
|---|---|---|
| 3.1 | The multi-step form component, all 7 states | `site/src/components/lead/quick-hiring-form/index.tsx` |
| 3.2 | Skill list + typeahead source. Static seeded list first; Sanity-backed later (deferred) | `site/src/components/lead/quick-hiring-form/skills.ts` |
| 3.3 | Server wrapper that renders the no-JS fallback link | `site/src/components/lead/quick-hiring-form/server.tsx` |
| 3.4 | Storybook story covering all 7 states | `site/src/components/lead/quick-hiring-form/stories.tsx` |
| 3.5 | Any new visible copy goes through UI_STRINGS | `tools/eslint/ui-strings.json` then `npm run generate-ui-strings` |

### Phase 4 - mount it, delete the fakes (REVISED for the launch model)

Placement changed. The form now lives on the **services and technology detail
pages**, which is a much wider footprint than the original three pages - the whole
point of building it as one reusable component.

| # | Step | File | Note |
|---|---|---|---|
| 4.1 | Replace `FindForm` with the real component | `site/src/components/templates/hire-engineers/index.tsx` | **CE-17 lands here.** Delete `sendLead`. **Delete the fabricated "matches" list regardless of whether the form is ready** - inventing engineers we have not matched is the one thing the locked lead-conversion plan explicitly forbids. |
| 4.2 | Embed on service detail | `site/src/components/templates/service/` (+ UK) | Highest-intent browse surface |
| 4.3 | Embed on technology detail | `site/src/components/templates/technology/` (+ UK) | **Pre-select the page's own technology** in step 1, so the visitor starts a question in |
| 4.4 | Embed below the calculator result | `site/src/app/price-comparison-calculator/page.tsx` + UK | Restores CONFIRM-2, the live regression |
| 4.5 | Point Fractional CTO's match quiz at the form | `site/src/components/templates/fractional-cto/index.tsx` | CTA, not embed |
| 4.6 | **Jake decision J-D:** `/for-developers` fake talent form | `site/src/components/templates/for-engineers/index.tsx` | Site's #6 page, 19,558 impressions, apply form is fake. Recommendation: link to `talent.cloudemployee.io`. **Not** the quick form - this is talent, not clients. |
| 4.7 | Stamp `ce_lead_gateway` on the surviving gateways | Contact: hidden field in HubSpot. Calendly: whatever its HubSpot sync supports. | HubSpot-side |

**Already shipped, do not redo:** `/start-hiring` retirement and the footer
newsletter removal both landed on 30 Jul. Old steps referencing them are void.

### Phase 5 - verify

| # | Step | File |
|---|---|---|
| 5.1 | Extend the staging verifier to assert the quick form renders and its API route 200s on a synthetic payload | `scripts/launch/verify-hubspot-forms-staging.ts` |
| 5.2 | Add a "no fake forms" gate: grep for submit buttons with no network call in `templates/` | `scripts/launch/verify-no-demo-forms.ts` (new) |
| 5.3 | Record the download-gating divergence | `data/webflow/parity-exceptions.json` (CONFIRM-6) |
| 5.4 | Tick 7.9; replace §7a's "Jake maps the funnel" with the locked map | `docs/ROADMAP_TO_COMPLETION.md` |

---

## 5. SEO + GEO contract

This is a conversion component, not a template, so most of the Tier-1 checklist
does not apply. What does:

- The form renders **inside** an existing page's content. It must not introduce a
  second `<h1>`. Step headings are `<h2>`/`<h3>` within the host page's cascade.
- No JSON-LD. A lead form is not a schema.org entity. Do not invent one.
- The no-JS fallback link must be **real HTML in the first response**, so crawlers
  and AI bots see a working path to `/book-a-call` even when the component does
  not hydrate.
- The three embed pages keep their existing canonical, hreflang, and meta.
  Adding the form changes none of it. Verify it stayed unchanged.
- Do not add a thank-you route. Success is an in-place state change, so there is
  no new URL to noindex.

---

## 6. Explicit non-goals

- **Not** rebuilding or retiring `/start-hiring` (D1). No new links to it either.
- **Not** touching `HubSpotFormEmbed` or the Contact / Newsletter / start-hiring
  forms' rendering.
- **Not** gating downloads (CONFIRM-6 - recorded as a deliberate divergence).
- **Not** building Ask Clara, or wiring this form into Clara. Separate track.
- **Not** adding a cookie consent banner. Flagged as J7, out of scope here.
- **Not** deleting any HubSpot form. Rename and archive only. Deletion loses
  submission history and is irreversible.
- **Not** touching `migrations.status`. It stays `content_complete`.
- **Not** a production cutover. Staging only.

---

## 7. Deferred

| Item | Why deferred | Revisit |
|---|---|---|
| Skills list in Sanity so Seb can edit it | Static list ships faster and the list barely changes | After first real submissions show what people type |
| `ce_skills_requested` as a checkbox property | Needs option maintenance in HubSpot; a forgotten skill is silently dropped | When we see the actual vocabulary |
| Home / Locations / How It Works embeds | Locked plan says do not put forms everywhere | After the three embeds prove out |
| Calendly context pass-through (prefill the booking from the brief) | Depends on Calendly plan features | Phase B of the lead-conversion plan |
| Retiring `/start-hiring` | Needs real volume data | Post-launch |
| HubSpot MCP | Ergonomics only, no new capability | Any time, optional |

---

## 8. Exit criteria

- [ ] All 8 Step 0 probes run; P4 and P5 answered by Jake in writing
- [ ] 5 custom properties exist on portal `22809822`; re-running the script is a no-op
- [ ] `CE Web - Quick Hiring Form` exists; GUID in `site/.env.local` and Vercel (Jake)
- [ ] Rename dry-run reviewed by Jake, Seb told, `--apply` run
- [ ] `POST /api/leads/quick-hiring` returns 200 on a valid payload, 400 on invalid
- [ ] Submitting with the Slack webhook unset still writes to HubSpot and does not 500
- [ ] Submitting with a deliberately wrong HubSpot GUID still fires Slack, tagged as failed
- [ ] `hubspotutk` arrives in the HubSpot submission (visible on the contact's activity)
- [ ] All 7 component states render in Storybook
- [ ] Keyboard-only run-through of all 4 steps; focus lands correctly on each advance
- [ ] JS disabled: `/services/software-engineers` still shows a working link to `/book-a-call`
- [ ] `grep -rn "sendLead" site/src/` returns nothing
- [ ] `npm run verify-no-demo-forms` PASS
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean
- [ ] `npm run launch:verify-hubspot-forms-staging` PASS
- [ ] `npm run launch:verify-parity` still PASS (6,937/6,937)
- [ ] **Jake submits one real test lead per gateway; it appears in HubSpot and Slack**
- [ ] Tier 1 context files updated (CHANGELOG, CLAUDE.md, PHASE_HISTORY)

Last item is the only one that proves the thing works. Everything above it proves
it is not obviously broken. Those are different.

---

## 9. Decisions needed from a human

Ideally this section is empty. It is not - three items:

| ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| **J5** | Notifications: split (our handler owns gateway 3, HubSpot workflows own 1/2/newsletter) or everything through HubSpot workflows? | **Split.** Better formatting, survives a HubSpot outage, changeable from Cursor. Cost: Seb cannot self-serve gateway 3's routing. | Phase 2.3 |
| **J6** | Pricing calculator surface: this form, or Ask Clara? The 26 Jul plan reserved it for Clara. | **This form now**, because it is buildable and real today. Revisit at Clara P3. | Step 4.3 only |
| **J7** | Consent wording next to the submit button. CE runs no consent banner today. | Needs Jake + legal. Cannot be an engineering guess. | Going live |

And four credential gates the agent will never cross (J1-J4 in the strategy doc):
the HubSpot write token, the Slack webhook URL, the check on what HubSpot already
notifies, and the check on whether anyone reads Contact/Newsletter submissions.

---

## 10. DEV log (fill during execution)

| # | Deviation from this brief | Why | Date |
|---|---|---|---|
| - | none yet - not started | | |

Log drift here. Do not silently deviate. If a build step needs an architecture
decision that is not in this brief, **stop and surface it**.
