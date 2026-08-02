# Forms launch plan - the simple version

> **This is the walkthrough doc. Follow it top to bottom.**
> Written for Jake. The detailed reasoning lives in `docs/HUBSPOT_FORMS_STRATEGY.md`;
> you should not need to open that unless something surprises us.
> Last updated: 2 Aug 2026.

---

## What we are building, in three lines

The website has one aim: **get the visitor to book a call.**

Three form-shaped things survive, and every one of them points at that aim.
Everything else has been removed or redirected.

| | Surface | Who builds it |
|---|---|---|
| 1 | **Book a call** (Calendly) - the main door | Exists already |
| 2 | **Contact page form** - "just message us" | Exists already |
| 3 | **Ask Clara** - the AI chat | You, in parallel |
| 4 | **Quick hiring form** - a few questions, then push to book a call | **Me, this plan** |

Already done and pushed: the start-hiring funnel is retired behind redirects, and
the footer newsletter is gone.

---

## The 8 steps

| Step | What | Who | Status |
|---|---|---|---|
| **1** | **Connect HubSpot + Calendly** | **You** | Done (token) |
| 2 | Prove bookings actually reach HubSpot | Me | **Done. Proven, by machine, both sides** |
| 3 | Audit the forms in HubSpot, propose keep vs archive | Me | Done - `docs/hubspot-form-audit.md` |
| 4 | Create the new form + 5 new fields | Me | Done |
| 5 | Rename the messy old forms (you approve first) | Me | Not started - needs your sign-off |
| 6 | Build the quick hiring form + its Slack safety net | Me | **Built. Launch webhooks, final consent wording, and a real test remain** |
| 7 | Put it on the services + technology pages, delete the fake forms | Me | **Code complete on 8 templates. `/for-developers` still waits on J-D** |
| 8 | Send one real test lead through each path | You + me | Not started |

**You are only hands-on in steps 1, 5 (approval) and 8.** The rest is me.

---

## Where we got to (2 Aug 2026)

Steps 2, 3 and 4 are closed. Steps 6 and 7 are built, with the launch inputs and
human test listed below still open. Nothing was renamed, archived or deleted in
HubSpot.

### Step 2 - CLOSED. The booking path works, and the check now proves it alone

**Verdict: connected, nothing being lost.** Every one of the **11** bookings
Calendly took in the last 30 days has a matching meeting record in HubSpot. Not
11 against 11 as a pair of totals, which two systems can reach by coincidence:
each individual booking was matched to its own CRM record, by meeting time and
event name. Six of the eleven were cancelled and all six cancellations came back
through, so the link is live and two-way rather than a stale one-off import.

**You do not have to supply a number any more.** `npm run launch:verify-booking-path`
now reads both sides itself and ends on a verdict. It exits non-zero and names the
specific booking if one ever goes missing.

**Why 11 and not the 13 from yesterday.** Nothing changed and nothing broke. The
window is rolling: "the last 30 days" on 1 Aug starts a day later than it did on
31 Jul, and two early-July bookings fell out of the back of it. New contacts moved
4 to 3 for the same reason. It is a reminder to read this check as a live gate,
not a fixed figure to quote later.

**Counted properly, which is the part that is easy to get wrong.** Both sides are
counted by when the booking was MADE, not when the meeting happens. Calendly's API
can only filter by meeting time, so the script pulls a deliberately wide range and
then filters on each event's own creation date. Comparing "booked in July" against
"meeting happens in July" would be two different sets of bookings and a meaningless
answer.

**One real loss, in June, outside the window.** Widening to `DAYS=120` finds a
single booking that never reached the CRM: kayla@technexus.com, booked 23 Jun with
Molly for 25 Jun. It is the only one in the three and a half months the check can
see back to, it is before the current window, and the cause is not visible from the
outside. Worth Seb knowing; not worth holding launch for. The check will catch it
immediately if it starts happening again.

**Six other apparent losses that are not losses.** In the same 120 days, six
bookings have no HubSpot record because the invitee RESCHEDULED. Calendly models a
reschedule as cancel-the-old plus create-the-new, and the integration only writes a
record for the survivor. The script now recognises those and does not count them
against the verdict. That mattered: without it the check cried wolf six times, and
a gate that cries wolf gets switched off.

**What the Calendly token can see, verified rather than assumed.** The token
belongs to **seb@cloudemployee.io**, who is the **owner** of the Calendly
organisation, and organisation-wide reads are permitted. So this covers the whole
team, not just one calendar: bookings by Seb, Molly, Steph and AJ all count. The
script attempts the organisation-wide read every time and falls back to
single-user if Calendly ever refuses, printing plainly which of the two it got, so
a future permissions change downgrades the verdict rather than silently narrowing
it. Bookings taken by someone who has since left the team stay visible: Shawnee is
no longer a member and her 28 bookings still read back, so leavers do not quietly
shrink the history. One note for later: the token is tied to Seb's login, so if he
revokes it or leaves, the check goes dark rather than wrong.

**The checker was reporting a false pass and has been fixed.** It said "LOOKS
CONNECTED, 49 contacts". Of those 49, **43 were Fireflies.ai call transcripts**
and 2 were the Clara chatbot. Four were Calendly. It was matching the word
"INTEGRATION" and calling any integration a booking. It also read HubSpot's
`appointments` object, found nothing, and printed that as evidence. Calendly does
not write appointments; it writes **meetings**, and there were 216 of those.
Reading the wrong object and reporting it empty is worse than not looking. Both
are corrected, so the numbers above are what the fixed checker reports.

### Slack is already wired, and step 3 got this wrong

**Correction, 1 Aug.** Step 3 reported that the Contact form's Slack notification is
off and the leads channel gets nothing from it. The channel plainly does get those
leads. The form's own Slack toggle was never the mechanism: **workflows are.**

Checked properly: **14 enabled workflows post into Slack**, across 6 channels. Full
map at **`docs/hubspot-slack-notifications.md`**, regenerate with
`npm run hubspot:audit-slack-notifications`.

Two consequences, and they change the build:

1. **Do not build a second notifier for anything HubSpot already announces.** The
   leads channel would get every message twice, and a channel that repeats itself
   is one people stop reading. Our own Slack post is the SAFETY NET only: if
   HubSpot ever rejects a submission, HubSpot cannot tell you, and our endpoint
   still can.
2. **7 of the 14 name a surface the new site retires** (Start Hiring x2, the home
   main form, the Webflow pricing-guide download, the website chatbot, and the two
   catch-alls that reference them). After cutover each either goes quiet, which
   nobody notices, or announces a page that no longer exists. Decide before the
   flip, not after.

**The spam problem is a filter, not a build.** The junk Jake sees (guest posts,
backlink pitches, agencies selling to CE) arrives through **Notify Sales - New Tier
1 or 2 MQLs**. Filter conditions on that workflow fix it, in the HubSpot UI, with
no code and no developer needed afterwards.

One principle for that filter, which matters more than the keyword list: **bias it
toward letting junk through, not toward hiding real leads.** A guest-post pitch in
the leads channel is mildly annoying. A real buyer routed into a channel nobody
reads costs a deal.

### Channel routing (Jake, 1 Aug)

| Channel | Gets |
|---|---|
| `#aa-leads-channel` | Every booking, and every genuine inquiry |
| `#leads-junk` | Guest posts, backlink pitches, anyone selling to CE |
| `#leads-test` | Temporary. Our webhook points here until it is proven, then one env var moves it |
| Top of funnel | **Not created.** No source exists yet. An empty channel becomes furniture. |

Marketing Wins collapses into the leads channel.

**No pricing download gate.** Jake's call: visitors who want pricing go to the AI
chat, talk it through, and give their details there. That closes the lead-magnet
question step 3 left open, and it means the seven orphaned lead-magnet forms need
no home on the new site.

**Both sites feed the same channel during the overlap.** Webflow and the new site
post into the same HubSpot portal, so a staging test lands in the real leads channel
looking exactly like a real lead. The new site's forms send `ce_lead_gateway` and
`ce_source_page`, so anything arriving WITHOUT those fields is Webflow. For testing,
use a recognisable address (`jake+test1@cloudemployee.io`); there is precedent in the
data already.

### Step 3 - 36 forms, not 25

Full audit at **`docs/hubspot-form-audit.md`**, regenerate with
`npm run hubspot:audit-forms`. Verdicts: **1 keep, 19 archive, 16 unknown.**

Four things came out of it that change what we do next:

1. **A human does read the Contact form.** It notifies **seb@cloudemployee.co.uk**
   on every submit, took 22 submissions in the last 90 days, and creates an MQL
   deal. That was the open question that could have invalidated surface 2. It is
   settled.
2. **The Contact form's Slack notification is switched OFF.** Seb gets the email;
   the leads channel gets nothing. Worth knowing before we decide step 6.
3. **Book-a-call already notifies Slack.** Two enabled workflows cover it. Do not
   build a second path for it.
4. **The real open question is the lead-magnet and pricing-download forms**, not
   the start-hiring ones. Seven forms with a live workflow each and no home on the
   new site, because downloads ship ungated by deliberate decision.

**Tech Debt #8 is closed.** The April audit reported "no connected workflows" for
every form. That was a missing token permission, not a fact. With it granted:
**120 workflows exist and 55 are enabled.**

### Step 4 - done, and nothing is wired to it yet

Five contact properties created in a new **`CE Website`** property group, so they
sit together rather than being lost among the ~200 in "Contact information":
`ce_skills_requested`, `ce_engagement_length`, `ce_commitment`,
`ce_lead_gateway`, `ce_source_page`.

The form:

| | |
|---|---|
| Name | **CE Web - Quick Hiring Form** |
| GUID | **`8f974ef4-a3dd-4bba-ad3a-086054ac235b`** |
| Fields | skills, length, commitment, first/last name, work email, phone, company, plus 2 hidden |
| After submit | redirects to `/book-a-call` |
| Consent wording | none, pending your legal call (J-E) |

At the close of step 4 nothing on the site rendered it. Steps 6 and 7 now provide
the real submission UI described below.

Both scripts check before they write and never overwrite. Running either a second
time changes nothing, which was tested rather than assumed.

### Steps 6 and 7 - built, fake capture flows removed

The quick hiring form, shared skills taxonomy, and `/api/lead` endpoint are built.
The real form now renders on eight templates: Home, How It Works, Hire Engineers,
Fractional CTO, service detail, technology detail, the services hub, and the
technology hub.

Every template importing `LeadFormSection` was checked for another form-shaped
surface. The service and technology directories keep their genuine search forms;
those filter page content and are not lead capture. Service and technology detail
had no collision.

Four collisions were removed:

- Hire Engineers no longer renders `FindForm`, its dead `sendLead` path, or its
  fabricated engineer results. The real form occupies the existing `#find`
  section, so the hero, calculator, and final CTAs still land in the right place.
- Fractional CTO no longer renders the local match stepper. Its useful heading,
  talk-first links, and trust copy remain around the real form.
- Home no longer shows the static role-picker and locked matching panel beside
  the real form.
- How It Works no longer shows the shared static matcher preview beside the real
  form. The unused preview component was deleted.

`/for-developers` was not touched. Its fake talent application remains open under
Jake decision J-D because it belongs to recruitment, not the client-lead form.

The code is type-clean. All changed files lint with zero errors. The full site
lint still fails on 32 older errors outside this forms work, so this is not a
sitewide clean-lint claim.

### Waiting on you

| # | Thing | Blocks |
|---|---|---|
| 1 | Final consent wording next to the submit button | Going live with the form |
| 2 | Add or confirm `SLACK_LEADS_WEBHOOK_URL` in the launch deployment | HubSpot-failure safety alert |
| 3 | Add or confirm `SLACK_JUNK_WEBHOOK_URL` in the launch deployment | Junk routing |
| 4 | Sign-off on the rename pass, and tell Seb first | Step 5 |
| 5 | `/for-developers` decision | J-D, separate talent path |
| 6 | Submit one real test lead through every surviving path | Step 8 launch proof |

The Calendly booking count came off this list on 1 Aug because the check now
fetches it. This cloud agent can see `SLACK_LEADS_WEBHOOK_URL`, but it cannot see
`SLACK_JUNK_WEBHOOK_URL`. The launch deployment needs both names confirmed
before step 8. This check reports only whether a variable exists and never prints
its secret value.

Environment variable changes do not take effect until the next deployment because
Vercel bakes them in at build time. A cloud agent also only receives secrets that
existed before it started.

### What `/api/lead` does today when Slack variables are absent

The endpoint always tries HubSpot first.

- If HubSpot accepts a genuine lead, the visitor continues and HubSpot's existing
  workflows remain the notification path. `SLACK_LEADS_WEBHOOK_URL` is not used
  on the successful path, so leaving it absent does not block the form.
- If HubSpot rejects a genuine lead, the endpoint tries
  `SLACK_LEADS_WEBHOOK_URL` as the safety net. When that variable is absent, no
  Slack alert is sent. The server logs the failure, but the visitor still sees
  success and continues to booking. That lead then exists only in the submitted
  request and server logs, so the safety net is not launch-ready without the URL.
- Suspected junk is still submitted to HubSpot, then routed to
  `SLACK_JUNK_WEBHOOK_URL`. When that variable is absent, it remains in HubSpot
  and no junk-channel message is sent.
- If both Slack variables are absent, HubSpot still receives every accepted
  submission. There is no Slack backup for a failed HubSpot write and no Slack
  notice for filtered junk.

---

## STEP 1 - what you do now

Two things. One credential total, plus one browser login.

### 1a. Create the HubSpot Service Key

> **Changed 31 Jul, mid-setup.** HubSpot has moved on from private apps twice over.
> They are now under "Legacy Apps", and HubSpot actively steers you to **Service
> Keys** instead (public beta since Feb 2026, and explicitly "the replacement for
> legacy private apps"). We took that path.
>
> **Why it is safe for us:** a Service Key is used exactly the same way - as a
> `Bearer` token against `api.hubapi.com` - and even carries the same `pat-na1-…`
> shape as the old tokens. The repo's existing HubSpot client
> (`src/lib/content/hubspot-forms.ts`) needs no change.
>
> **Its one limitation is webhooks**, which this plan does not use anywhere. Our
> Slack notification is sent by our own server, not by a HubSpot webhook, so the
> limitation never bites.

1. In HubSpot, go to **Development** -> **Keys** -> **Service Keys**.
   (Also reachable at Settings -> Integrations -> Service Keys.)
2. Create a key and name it **`CE Website`**.
3. Add the scopes listed in §"Service Key scopes" at the bottom of this file.
   (Originally six; widened on 31 Jul after seeing HubSpot's full catalogue -
   notably `automation`, which closes a gap open since the first audit.)

   The original minimum six were:

```
crm.objects.contacts.read
crm.objects.meetings.read
crm.schemas.contacts.read
forms
crm.schemas.contacts.write
crm.objects.contacts.write
```

4. Create it, then **copy the key** (click **Show**, then **Copy**).

The first three scopes only let me look. The last three let me create the form and
its fields. Nothing in this plan deletes anything in HubSpot.

If the key is ever exposed, HubSpot has a **Rotate** button on it - that is the
recovery path, no rebuild needed.

### 1b. Put the key in two places

Same token, pasted twice. Both are outside the codebase.

**Place 1 - your Cursor, so I can manage HubSpot in chat.**
Cursor -> Settings -> Tools & MCP -> Add MCP Server:

```json
{
  "hubspot": {
    "command": "npx",
    "args": ["-y", "@hubspot/mcp-server"],
    "env": { "PRIVATE_APP_ACCESS_TOKEN": "<paste the Service Key>" }
  }
}
```

Restart Cursor afterwards.

**Place 2 - Cursor Dashboard -> Cloud Agents -> Secrets.**
Add it as `HUBSPOT_ACCESS_TOKEN`, scoped to this repo. This is what lets me work
in the background without your laptop being open.

### 1c. Connect Calendly - DONE 1 Aug, and better than planned

> **The earlier warning here was wrong, and it is worth correcting.** It said
> Calendly has no read-only option and that connecting it would grant permission
> to schedule and cancel meetings. That is true of the Calendly MCP integration.
> It is not true of a **personal access token**, where you choose the scopes one
> by one. A read-only token was created instead, so nothing in this project can
> touch a real calendar.

What exists now: a Calendly personal access token on **seb@cloudemployee.io**,
who owns the Calendly organisation, stored as `CALENDLY_ACCESS_TOKEN` in Cursor
Dashboard -> Cloud Agents -> Secrets.

**Scopes granted. Every one of them is read. There are no write scopes at all.**

```
scheduled_events:read
event_types:read
availability:read
locations:read
routing_forms:read
users:read
organizations:read
groups:read
contacts:read
activity_log:read
webhooks:read
```

Only two of those are actually used: `scheduled_events:read` to count bookings and
`users:read` to work out whose bookings the token may see. The rest cost nothing
and save a round trip to you later.

**What it cannot do:** create, move, or cancel a booking; change an event type;
change availability; add or remove a webhook. Those are all separate `:write`
scopes and none were granted.

Because the token owner is the organisation owner, it reads the whole team's
bookings rather than one calendar. The check verifies that every run rather than
assuming it.

### Never paste that token into a chat message or a file in the repo.

Cursor's settings and the Secrets store are the only two places it belongs.

---

## Step 2, now that it runs itself

> Step 1 and step 2 are both done. This section is now the manual for the check
> rather than a thing waiting on you.

`npm run launch:verify-booking-path` reads Calendly and HubSpot for the same
period and matches each booking to its CRM record one by one.

| Result | Exit | What it means |
|---|---|---|
| Every booking matched | 0 | Bookings reach HubSpot. Carry on. |
| A booking has no record | **1** | That specific booking never reached the CRM. It is named in the output. |
| Nothing to judge | 0 | Nobody has booked recently. Book a test meeting and re-run. |
| No `CALENDLY_ACCESS_TOKEN` | 0 | HubSpot-only report, and it says plainly that this is not a pass. |

Two things it deliberately does NOT fail on: a booking made in the last half hour
(HubSpot may not have written it yet) and a booking the invitee rescheduled away
(Calendly writes no record for the stub, by design).

`DAYS=90 npm run launch:verify-booking-path` widens the window. Past roughly 100
days HubSpot's search hits its page cap; the script detects that, narrows the
window it is willing to judge, and says so rather than inventing a loss.

We did this before building anything because the whole site now points at booking
a call. If that path does not reach the CRM, nothing else matters.

---

## Three things still waiting on you (not blocking step 1)

> Superseded by §"Waiting on you" above, which is current. Kept for the reasoning.

| # | Thing | Why it is yours |
|---|---|---|
| 1 | **A Slack webhook URL** for the leads channel | I cannot create it. Only blocks the Slack half of step 6 - the HubSpot half proceeds without it. |
| 2 | **`/for-developers`** - its apply form is fake, on your #6 page by traffic (19,558 impressions) | I would point it at `talent.cloudemployee.io`. Want your nod before touching recruitment. |
| 3 | **Consent wording** next to the new form's submit button | Legal call. CE runs no cookie banner today. |

---

## What is already done

- `/start-hiring` retired: 17 URLs now redirect to `/book-a-call` rather than
  breaking. Routes and template deleted; Sanity data left in place so it is
  reversible.
- Footer newsletter removed. The footer keeps its book-a-call CTA.
- Both form-checking scripts rewritten to also prove the removed things stay
  removed.
- All of the above committed and pushed on `cursor/hubspot-gateway-lock-c05e`
  ([PR #61](https://github.com/galaxyfunk/mygratr/pull/61)).

---

## Service Key scopes (`CE Website`) - the final list

25 scopes. Broad on read, narrow on write, nothing that deletes.

### Write - only what we actually build with (3)

```
crm.objects.contacts.write
crm.schemas.contacts.write
forms
```

Contacts, contact properties, forms. That is the entire write surface. Nothing in
this plan writes to deals, pipelines, users or billing.

### Read - generous, so the agent never needs another round trip (22)

```
crm.objects.contacts.read
crm.schemas.contacts.read
crm.objects.companies.read
crm.objects.deals.read
crm.objects.leads.read
crm.objects.owners.read
crm.objects.appointments.read
crm.schemas.companies.read
crm.schemas.deals.read
crm.lists.read
timeline.read
business-intelligence
automation
automation.sequences.read
marketing.campaigns.read
communication_preferences.read
conversations.read
settings.users.read
forms-uploaded-files
external_integrations.forms.access
scheduler.meetings.meeting-link.read
mcp.users.read
```

**Why `automation` matters:** Tech Debt #8 has been open since AUDIT-1 because the
old token lacked it, which is why every form in the April audit reported
`connectedWorkflowIds: []` - an artifact, not a fact. This scope finally answers
"what does HubSpot notify today?" without Jake digging through the UI.

**Why `timeline.read` + `crm.objects.appointments.read`:** Service Keys do not
offer `crm.objects.meetings.read` (beta gap). These are the substitute for seeing
Calendly bookings land on a contact record - step 2.

### Deliberately NOT granted

| Group | Why |
|---|---|
| `*.sensitive.read`, `*.highly_sensitive.read` | Unlocks restricted personal-data fields. We capture names and work emails. |
| `crm.export`, `crm.import` | Bulk data movement. A mistake at that scale is not recoverable. |
| Any `.delete` scope | Nothing in this plan deletes. The form tidy-up **archives**, on purpose, so submission history survives. |
| `crm.objects.deals.write`, `crm.pipelines.*.write` | Seb's sales pipeline. Read is enough to understand the funnel. |
| `settings.billing.write`, `settings.users.write` | Billing and user accounts. Irreversible, and unrelated. |
| `oauth` | Not needed for a Service Key. |

Scopes can be added to a Service Key later, so this list is a starting point, not
a one-shot decision.

### Scopes HubSpot refused (subscription tier, not permissions)

Three scopes returned "Your account doesn't have access to this scope" on 31 Jul.
That is a **plan limit, not a misconfiguration**. Skipped; they block nothing in
this plan.

| Scope | Gated behind | Cost (annual billing, Jul 2026) |
|---|---|---|
| `automation.sequences.write` | Sales Hub **Professional** | $90 / seat / month + $1,500 one-time onboarding |
| `marketing-email` | Marketing Hub (Starter may suffice; Pro certain) | Starter ~$20 / seat / month · **Pro $800 / month + $3,000 mandatory onboarding** |
| `marketing.campaigns.read` | Marketing Hub **Professional** | as above |

**Do not assume Pro is required.** Marketing Hub *Starter* includes email
marketing at roughly $20/seat/month. If the goal is only "email the people who
enquired", Starter is very likely enough and the gap is ~$20/month rather than
~$800/month + $3k. Worth confirming with HubSpot before anyone signs anything.

**What is free and already covers launch:**

- **HubSpot form notification emails.** Every form has a setting to email named
  people on submit. No scope, no tier, no code.
- **Our Slack notification**, built at step 6.

So "we find out when a lead arrives" is fully solved at zero cost. Only *automated
multi-step nurture* needs an upgrade, and that decision is better made after
launch when real lead volume is known.

---

## Kickoff prompt for a fresh cloud agent (steps 2-4)

> **Spent. Steps 2, 3 and 4 are done.** Kept for the pattern, because the next
> phase needs a prompt just like it.

A cloud agent only receives secrets that existed **before it started**. The agent
that wrote this plan started before `HUBSPOT_ACCESS_TOKEN` was added, so it cannot
use it. Start a new one and paste this:

```
Continue the CE forms launch track. Read docs/FORMS_LAUNCH_PLAN.md first, then
docs/HUBSPOT_FORMS_STRATEGY.md for the reasoning.

Work on branch cursor/hubspot-gateway-lock-c05e (do not start a new branch).
HUBSPOT_ACCESS_TOKEN is available as an env var. Portal is 22809822.
There is no HubSpot MCP in a cloud agent - use the REST API with that token.

Do steps 2, 3 and the additive half of 4:

STEP 2 - run `npm run launch:verify-booking-path` and report the output verbatim.
Do not interpret it as a pass on its own; it only sees HubSpot's side. State
plainly what it does and does not prove, and what Calendly number Jake must
supply to conclude it.

STEP 3 - list every form on portal 22809822 (name, id, submission count if
available, and post-submit redirect). Label each keep / archive / unknown against
the four surviving surfaces in the plan doc. Write the audit to
docs/hubspot-form-audit.md and commit it. Read-only - change nothing in HubSpot.

STEP 4a - create the five custom contact properties from the plan doc
(ce_skills_requested, ce_engagement_length, ce_commitment, ce_lead_gateway,
ce_source_page) via a NEW idempotent script at
scripts/hubspot/create-lead-properties.ts. It must check existence first and
never overwrite. Run it, then re-run it to prove it is a no-op.

STEP 4b - create the HubSpot form "CE Web - Quick Hiring Form" and print its GUID.

STOP THERE. Do NOT rename any existing form (that needs Jake's sign-off and Seb
being told first). Do NOT delete anything in HubSpot. Do NOT build the React
component yet.

Rules: no em dashes. Commit each logical change separately. Push and update
PR #61. Typecheck before committing.
```

### What Jake does in DESKTOP Cursor in parallel

**Nothing, as it turns out.** This said the Calendly half could not be done by a
cloud agent because that MCP lives on the laptop. True of the MCP, false of the
problem: Calendly has a plain REST API and a read-only token works fine from
anywhere. The whole cross-check now runs unattended.

Worth remembering as a general point. "There is no MCP for it in this environment"
is a statement about tooling convenience, not about whether the thing can be done.

---

## What testing is actually required, by stage

Testing here is not one event. It is three, and only the last one proves anything.

| Stage | Test | Proves |
|---|---|---|
| **Now (steps 2-4)** | Read-only API calls + a property script that is a no-op on second run | Nothing is broken, and the script is safe to re-run |
| **After the form is built (step 6-7)** | tsc, lint, build; the exit-criteria list in the brief; deliberately break HubSpot and confirm Slack still fires | The failure modes behave as designed |
| **Before cutover (step 8)** | **Jake submits one real lead per surface and confirms it appears in HubSpot and Slack** | It actually works |

Everything above the last row proves the thing is not *obviously* broken.
Only the last row proves it works. They are different, and a wrong HubSpot form id
passes every test except the last one.
