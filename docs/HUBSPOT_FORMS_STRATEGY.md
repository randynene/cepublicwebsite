# HubSpot + lead-gateway strategy

> **Status:** PARKED — circle back after the current Marker.io fix pass.
> **Owner:** Jake + agent.
> **Created:** 30 Jul 2026 (from Marker CE-17 discussion + forms audit).
> **Do not build from this doc until Jake unparks it.** Marker fixes come first.

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

### Downloads and other gates

- Downloads, gated assets, etc. can stay “take what you want.”
- Contact happens through gateways 1–4 when they want to talk.
- Do not invent a new HubSpot form per download unless Jake explicitly adds that gateway later.

---

## What exists on the site today (facts)

Portal: `22809822`.

### Actually creates HubSpot leads today

| Path | What | Notes |
|---|---|---|
| `/start-hiring/{step}` | Multi-step HubSpot embeds | Real funnel. HubSpot owns fields + step redirects. US entry = `contact-info`. |
| Contact page | HubSpot form `4b883c7d-…` | Real. |
| Footer newsletter | HubSpot form `b411a11f-…` | Real. |

### Looks like a form, does NOT create a HubSpot lead today

| Path | What happens |
|---|---|
| Hire Engineers “four quick questions” | Local React state → CTA to book-a-call. **CE-17 lives here.** |
| Fractional CTO match quiz | Local UI + CTAs. |
| Homepage “Ready to find” style steps | Local / static; not a HubSpot submit. |
| How It Works matcher | Stub / CTAs. |
| For Developers join form | Fake done-state. |
| Location quiz | Can deep-link toward start-hiring; not a full Proxify form. |

### Scheduling (not Forms)

| Path | Tool |
|---|---|
| `/book-a-call/[slug]` | Calendly or HubSpot Meetings iframe |

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

We do **not** currently have a HubSpot MCP installed in this Cursor project. Unpark session should add API token scopes + optional MCP before rebuilding forms.

---

## Decisions already taken in the Marker discussion

- **CE-17:** parked for this Marker pass. Do not build Proxify skills on the current Hire Engineers demo until this strategy session runs.
- **Do not** invent “Start process” CTAs (CE-12 closed: keep **Contact us today** sitewide).
- **Do not** rebuild `/start-hiring` mid-Marker. It stays the interim serious multi-step path until the Proxify-shaped component replaces or absorbs it.
- Marker visual/copy fixes land first. Forms rethink is next.

---

## Open decisions (answer when we unpark)

1. **Keep `/start-hiring` as gateway 3, or replace it** with the new Proxify-shaped component (and retire/redirect the old steps)?
2. **New HubSpot forms from scratch** vs reuse existing form GUIDs / contact properties (so Seb’s pipelines don’t break)?
3. **Slack path:** HubSpot workflow → Slack, or our submit handler → Slack webhook (Jake preference leans “from Cursor, no clicking”)?
4. Exact field list + HubSpot property names for skills / duration / commitment.
5. Which pages get the quick-form component embedded vs only a CTA into it?
6. Naming convention inside HubSpot for “main website forms” so the inbox is obvious.
7. Ask Clara HubSpot object mapping (when P1 is ready).

---

## Suggested unpark session order (after Marker)

1. Install / verify HubSpot API access from the repo (and MCP if we want chat-native control).
2. Inventory every form GUID on portal `22809822` that the site still references; label keep vs archive.
3. Lock the four-gateway map + field list for the quick hiring form.
4. Create (or remap) HubSpot forms/properties from Cursor; name them clearly.
5. Build the Proxify-shaped React component; submit → HubSpot → Slack.
6. Point marketing page demos at it (or embed it); remove fake submits.
7. Smoke-test one real lead per gateway into HubSpot + Slack.
8. Update `docs/ROADMAP_TO_COMPLETION.md` §7a with the final map.

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

---

*When Jake says “unpark forms,” open this file and resume from “Open decisions.”*
