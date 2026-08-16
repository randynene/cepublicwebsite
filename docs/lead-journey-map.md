# Lead journey map

> Written 16 Aug 2026, against `main` at `872c3a9`.
> Hand-written, not generated. Re-check it after any forms change.
>
> Companion docs: `hubspot-form-audit.md` (the forms), `hubspot-slack-notifications.md`
> (what HubSpot posts to Slack). Neither traces a lead end to end, which is why
> this file exists.

## The one-paragraph version

Every lead surface on the site funnels into HubSpot, and only into HubSpot. Our
code posts to the HubSpot Forms API and stops there. Slack messages do not come
from this repo: they come from HubSpot workflows, 14 of which are enabled across
6 channels. That is the correct architecture and it should stay that way, but it
has a consequence worth stating plainly: **a form with no workflow attached is a
lead that nobody is told about.** Two of our three live lead paths are in exactly
that state.

## The routing question, answered

There is no code change needed to send pricing unlocks to a Slack channel, and
we should not write one. The route already posts to HubSpot; the notification is
a workflow toggle. The only real decision is which channel, and that is a
routing decision about the whole system rather than about the pricing page.

Confirmed channel identity:

| Channel id | Channel | How we know |
|---|---|---|
| `C08NQQJPKU3` | `#marketingwins` | The "Notify Marketing - Leads Catch All" workflow posts "New potential lead created! Please review!!!" and that is what lands in `#marketingwins` |
| `C074USTDWTC` | probably `#aa-leads-channel` | Carries Start Hiring, book-a-call, Clara chatbot and the pricing-guide download. Unconfirmed - somebody with Slack access needs to say |
| `C074LRZCHLN` | unknown | Home form inquiry, meeting booked |
| `C08NS689LBE` | unknown | Deal stage changes, so a sales channel |
| `C01NF2CHRKQ` | unknown | Tier 1 MQLs |
| `C08LA1F61Q8` | unknown | Seb's LinkedIn posts |

**Somebody needs to confirm the `C074USTDWTC` mapping before any workflow is
pointed at it.** Everything below assumes it is the leads channel; if it is not,
the recommendations move but the shape does not.

One caution about `#aa-leads-channel` specifically: in Slack it sits under
External connections with a lock, which means it is a shared or Slack Connect
channel. The HubSpot app may need to be invited to it before a workflow can post
there, and shared channels sometimes cannot host app posts at all. Worth testing
with one message before wiring five workflows to it.

## The three code paths

Everything on the site is one of these.

### 1. `/api/lead` - the quick hiring funnel

- **Posts to** HubSpot form `8f974ef4-a3dd-4bba-ad3a-086054ac235b`
- **Surfaces**: the shared `QuickHiringForm` on `/`, `/how-it-works`, `/services`,
  `/technology`, `/services/software-engineers`, `/services/fractional-ctos`,
  and the three location pages, plus UK mirrors. Also the bespoke single-step
  intake on `/services/hire-us-engineers` and `/services/hire-uk-engineers`,
  which posts the same payload shape to the same endpoint.
- **After submit**: awaits the POST, then redirects to `/book-a-call`
  (locale-aware, so a `/uk/` funnel lands on `/uk/book-a-call`), carrying name
  and email in the query string so Calendly opens prefilled.
- **Slack**: nothing on success. `postToSlack` sits inside `if (!hubspot.ok)`,
  so it is a failure alarm, not a lead notification.
- **Email to the lead**: none from us.

### 2. `/api/pricing-unlock` - the pricing calculator gate

- **Posts to** HubSpot form `8f974ef4` - **the same GUID as the hiring funnel**,
  differentiated only by a `ce_lead_gateway: 'pricing_unlock'` field.
- **Surface**: `/pricing` and `/uk/pricing`.
- **After submit**: no redirect. The blur drops in place and the calculator
  unlocks. The unlock is remembered in `localStorage` under `ce_pricing_unlock`.
- **Slack**: nothing on success. Same failure-only alarm as above.
- **Email to the lead**: none, and **the page says otherwise**. See below.

### 3. HubSpot embedded forms - `/contact` and the static pages

- `/contact` embeds HubSpot form `4b883c7d-72c1-4f9c-8196-de68fce303d6`
  directly. No code of ours touches the submission.
- **Slack**: the workflow "HubSpot Form Fill > Slack channel" is **switched off**,
  so contact submissions are silent too. Three other enabled workflows are
  attached to this form.
- This form is HubSpot's, not ours. Changing its fields is a dashboard job.

## Where a lead lands

Seven thank-you routes exist, each with a UK mirror:

| Route | Reached from |
|---|---|
| `/book-a-call` | the quick hiring funnel, after submit |
| `/book-a-call-thank-you` | after booking a Calendly slot |
| `/thank-you` | generic |
| `/thank-you-for-your-message` | contact form |
| `/thank-you-now-book-a-call` | download and nurture paths |
| `/thank-you-culture-match` | culture match funnel |
| `/download-thank-you` | gated downloads |

The pricing unlock is the odd one out: it has **no thank-you page at all**,
deliberately, because the reward is the calculator itself unblurring in place.
That is the right behaviour for this surface, but it does mean the pricing lead
never passes through a page where a conversion pixel or a follow-up prompt could
fire.

## What is silent, and what is promised but not delivered

Three findings, worst first.

### The pricing gate promises an email that nothing sends

`content.ts` renders `"Unlocked for {email} - we've emailed this breakdown to
you."` at the moment of unlock. There is no autoresponder on form `8f974ef4` and
the route sends no email. **This is live in production now.** The decision taken
is to keep the copy and make it true with a HubSpot autoresponder rather than to
soften the copy.

Two things about that decision worth holding on to:

1. The tense is wrong even once the automation exists. "We've emailed" is a
   past-tense claim rendered synchronously; a HubSpot autoresponder fires
   asynchronously. "We're sending" would be honest in both worlds. One-line
   change in `content.ts`.
2. **This copy is not editable in Studio.** `calculator.gate` and
   `hero.seePricingLabel` are absent from the Sanity schema and the GROQ
   projection. So the one string on the site making a promise about email can
   only be changed by a developer. That was cosmetic while the page was
   unbuilt; it is now blocking.

### The pricing unlock shares the hiring funnel's form GUID

`8f974ef4` serves both `/api/lead` and `/api/pricing-unlock`. This is the single
biggest blocker to everything else, because HubSpot automation hangs off forms:

- An autoresponder on `8f974ef4` emails the pricing breakdown to **every hiring
  enquirer on the site**.
- A Slack workflow on `8f974ef4` cannot distinguish "someone wants pricing" from
  "someone wants to hire", which is the exact distinction the routing question is
  about.

**A dedicated pricing-unlock form has to exist before any automation is
switched on.** That is a dashboard action, followed by a one-line code change to
point the route at the new GUID.

### Successful leads are announced to nobody

Both of our code paths only speak to Slack when HubSpot rejects the write. On
the happy path, which is nearly all of them, nothing is posted. Add the contact
form's disabled workflow and the picture is that **the three main lead surfaces
on the site are all silent on success**, and the Slack traffic currently visible
is coming from older Webflow-era workflows and from Clara.

The fix is workflows, not code. Building a Slack post into the routes would
duplicate any workflow later switched on, and a channel that repeats itself is a
channel people stop reading.

## Known-bad data

`hubspot-form-audit.md` reports 0 submissions for all 37 forms, including the
contact form a previous run had at 110 all-time. The form count moved 36 to 37
and picked up the new "CE Web - Quick Hiring Form", so the API call itself
works; it looks like a permissions or endpoint change on the submission-counts
call. **Do not read those zeroes as evidence a form is dead, and do not archive
anything on the strength of them.**

## Not covered here

- **Clara chatbot.** It has an enabled workflow ("Notification of Clara chat
  book a call") posting to `C074USTDWTC`, so it is the one lead surface that is
  already wired end to end. What data it passes and whether the mapping is
  correct has not been audited.
- **`fix/forms-ce58`.** Four unmerged commits rework the quick hiring form, the
  contact page and the homepage. This map describes `main`. Anything in that
  branch changes the first path above.
- **The file upload on the market pages** accepts a file and never uploads it.
  The lead records the filename flagged as not-received. Pre-existing.

## What I would do, in order

1. Confirm which Slack channel `C074USTDWTC` is. Everything else depends on it.
2. Create a dedicated HubSpot form for the pricing unlock. Nothing can be
   automated cleanly until this exists.
3. Point `/api/pricing-unlock` at the new GUID. Code, one line.
4. Turn on the autoresponder for that form, and fix the tense in `content.ts`.
5. Wire `calculator.gate` into Sanity so that copy stops being developer-only.
6. Decide the routing rule for the whole system rather than per form. The
   natural split is: anything expressing buying intent goes to the leads
   channel; marketing-qualified noise goes to `#marketingwins`. Today the
   catch-all sends everything to `#marketingwins`, which is why it reads as the
   busy one.
7. Re-enable the contact form's Slack workflow, or delete it. An off workflow is
   worse than no workflow, because it looks like coverage.
