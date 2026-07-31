# Forms launch plan - the simple version

> **This is the walkthrough doc. Follow it top to bottom.**
> Written for Jake. The detailed reasoning lives in `docs/HUBSPOT_FORMS_STRATEGY.md`;
> you should not need to open that unless something surprises us.
> Last updated: 31 Jul 2026.

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

| Step | What | Who |
|---|---|---|
| **1** | **Connect HubSpot + Calendly** | **You** |
| 2 | Prove bookings actually reach HubSpot | Me |
| 3 | Audit the 25 forms in HubSpot, propose keep vs archive | Me |
| 4 | Create the new form + 5 new fields | Me |
| 5 | Rename the messy old forms (you approve first) | Me |
| 6 | Build the quick hiring form + its Slack ping | Me |
| 7 | Put it on the services + technology pages, delete the fake forms | Me |
| 8 | Send one real test lead through each path | You + me |

**You are only hands-on in steps 1, 5 (approval) and 8.** The rest is me.

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

### 1c. Connect Calendly

Nothing to create. Its config is already committed to this repo.

Cursor -> Settings -> Tools & MCP -> find **`calendly`** -> connect -> approve in
the browser.

> **Heads up:** Calendly has no read-only option. Connecting it grants permission
> to schedule and cancel meetings. I only need to *count* bookings. If you would
> rather not, skip it entirely and just tell me how many bookings you have had in
> the last 30 days - step 2 works exactly the same.

### Never paste that token into a chat message or a file in the repo.

Cursor's settings and the Secrets store are the only two places it belongs.

---

## Then tell me "step 1 done"

I will run **step 2** immediately, because it is the one that can change the plan.

I compare how many bookings Calendly has taken against how many meetings HubSpot
has recorded for the same period.

| Result | What it means |
|---|---|
| Numbers match | Bookings reach HubSpot. Carry on. |
| Calendly has bookings, HubSpot has none | **Every booking is being lost.** This becomes the emergency, ahead of everything else. |
| Both zero | Nobody has booked recently. You book a test meeting, I re-check. |

We do this before building anything because the whole site now points at booking a
call. If that path does not reach your CRM, nothing else matters.

---

## Three things still waiting on you (not blocking step 1)

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

The Calendly half cannot be done by a cloud agent - that MCP lives on the laptop.
Ask desktop Cursor:

1. "How many Calendly bookings were there in the last 30 days?"
2. "How many HubSpot contacts were created in the last 30 days, and what is
   `hs_object_source_label` on each?"

Those two numbers are step 2's verdict. See the table in §"Then tell me step 1
done".

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
