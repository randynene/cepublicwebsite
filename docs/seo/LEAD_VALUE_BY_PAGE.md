# Lead value by page

Closes the gap FINDINGS.md section 7 item 1 calls "the single most valuable gap
on this list": until now every SEO priority was ranked by clicks, because we
could not see which pages produce actual customers.

Source: `scripts/seo/hubspot-leads-pull.ts`, run 10 Aug 2026 against HubSpot
portal 22809822. Raw outputs live under `audit-output/seo-intel/2026-08-06/hubspot/`
(gitignored, and they stay that way). Everything below is aggregate; no contact
appears in any committed file.

**Verdict up front: the joins resolved, and the answer is mostly "not enough
data at the page level".** The CRM read works, the numbers are real, and they do
change the picture for the site as a whole. They do not have the resolution to
re-rank the 15 hire pages, because 10 of those 15 pages produced zero
attributable leads in twelve months. That is itself a finding, and it is not the
same as the pages being worthless. Read the caveats before acting.

---

## 1. What was measured

| Figure | Value |
|---|---|
| Window | 12 months to 10 Aug 2026 |
| Form submissions in window | 302 |
| Distinct submitter emails | 129 |
| Matched to a CRM contact | 115 (89.1%) |
| Qualified submissions | 92 |
| Submissions from a contact with a deal | 69 |
| Distinct deals joined | 54 |
| Deals with a readable amount | 9 of 54 (17%) |
| Total readable deal value | 1,478,000 GBP |
| Largest single deal | 1,080,000 GBP (73% of the total) |
| Distinct attributed URLs | 33 |

**Qualified means** the contact's lifecycle stage is one of
`marketingqualifiedlead`, `salesqualifiedlead`, `opportunity`, `customer`,
`evangelist`. Those stages were read from
`/crm/v3/properties/contacts/lifecyclestage`, not assumed: the portal defines
HubSpot's stock eight and no custom stages. `subscriber`, `other`, and a missing
stage are excluded. **`lead` is excluded on purpose** - HubSpot stamps it on
anyone who submits any form, so it separates nothing. If you counted `lead` as
qualified, "qualified" would just be a synonym for "submitted".

**Currency is GBP.** Every joined deal carries `deal_currency_code: GBP`, so the
sum is meaningful rather than a mix. The script sets the total to null if it ever
sees more than one code, because it does not convert.

**Attribution:** per submission, the first candidate resolving to one of our own
hosts wins, and the choice is recorded on every row.

| Method | Submissions |
|---|---|
| `contact_first_url` (`hs_analytics_first_url`, first touch) | 159 |
| `ce_source_page` (custom contact property) | 0 |
| `form_page_url` (the page the form sat on) | 114 |
| none | 29 |

`ce_source_page` exists in HubSpot but is populated on zero contacts in this
window, so it never won. URLs on `talent.cloudemployee.io` and on third-party
hosts such as `meetings.hubspot.com` are rejected as first-touch candidates: they
are not pages of this site and cannot rank one.

---

## 2. Pages ranked by real leads and by deals

Full table in `by-attributed-page.csv`. Everything with at least one qualified
lead:

| Attributed page | Submissions | Qualified | Deals | Deal value (GBP) |
|---|---|---|---|---|
| `/contact` | 57 | 41 | 39 | 0 |
| `/` (home) | 46 | 23 | 14 | 54,000 |
| `/uk` | 31 | 4 | 2 | 1,134,000 |
| `/services/philippines-developers` | 3 | 3 | 3 | 0 |
| `/uk/start-hiring/get-started` | 3 | 3 | 1 | 162,000 |
| `/book-a-call/anto` | 3 | 3 | 0 | 0 |
| `/uk/pricing` | 7 | 2 | 2 | 0 |
| `/uk/technology/supabase-developers` | 2 | 2 | 0 | 0 |
| `/pricing` | 3 | 1 | 1 | 0 |
| `/ph/services/philippines-developers` | 1 | 1 | 1 | 54,000 |
| `/services/cloud-engineers` | 1 | 1 | 1 | 0 |
| `/services/latam-developers` | 1 | 1 | 1 | 0 |
| `/team/shawnee-malesich` | 1 | 1 | 1 | 20,000 |
| `/uk/how-it-works` | 1 | 1 | 1 | 54,000 |
| `/services` (hub) | 2 | 1 | 0 | 0 |
| `/start-hiring/get-started` | 3 | 1 | 0 | 0 |

The `/start-hiring/*` funnel steps (budget, how-long, how-many, when-needed,
contact-info, technology, final-details, 11 to 14 submissions each) are all
`form_page_url` rows, i.e. the same visitors stepping through a multi-part form.
They are conversion machinery, not content, and should not be read as fifteen
separate landing pages.

Two rows carry the entire value figure: `/uk` at 1,134,000 GBP and
`/uk/start-hiring/get-started` at 162,000 GBP. Of the 1,478,000 total, a single
deal is 1,080,000. **Rank on deal COUNT. Treat deal value as colour only.** With
9 priced deals out of 54, one contract decides the value ordering.

---

## 3. Does this agree with the click-based hire-page order?

`content.md` (roadmap W3-01) orders the hire fleet by clean striking-distance
impressions: **typescript, philippines, latam, aws, devops, openai, python,
no-code, then the rest** (nodejs, dotnet, filipino, front-end, full-stack,
back-end, cloud-engineers, java, kotlin, android, langchain).

Lead and deal counts against that list:

| W3-01 rank | Page | Submissions | Qualified | Deals |
|---|---|---|---|---|
| 1 | `/technology/typescript-developers` | 0 | 0 | 0 |
| 2 | `/services/philippines-developers` | 4 | 4 | 4 |
| 3 | `/services/latam-developers` | 1 | 1 | 1 |
| 4 | `/technology/aws-developers` | 0 | 0 | 0 |
| 5 | `/services/devops-engineers` | 0 | 0 | 0 |
| 6 | `/technology/openai-developers` | 0 | 0 | 0 |
| 7 | `/technology/python-developers` | 0 | 0 | 0 |
| 8 | `/services/no-code-developers` | 0 | 0 | 0 |
| rest | nodejs, dotnet, filipino, front-end, full-stack, back-end, java, kotlin, android, langchain | 0 | 0 | 0 |
| not on the list | `/services/cloud-engineers` | 1 | 1 | 1 |
| not on the list | `/uk/technology/supabase-developers` | 2 | 2 | 0 |

(`philippines` combines `/services/philippines-developers` and its `/ph/` twin.)

**The revenue data neither confirms nor contradicts the click-based order for 10
of the 15 pages, because those pages produced nothing measurable.** Where it does
speak, three things:

1. **It DISAGREES about typescript.** `/technology/typescript-developers` is
   ranked first for a 40-hour content programme on the strength of 17,716 clean
   striking-distance impressions and a flagship query at position 10.9. It has
   produced zero leads and zero deals in twelve months. That is not a reason to
   drop it: a page sitting at position 11 gets almost no clicks, so producing no
   leads is exactly what you would expect, and lifting it is the whole point of
   the upgrade. It IS a reason to stop describing it as proven. It is a bet on
   traffic, not an observed revenue source.
2. **It AGREES about philippines and latam.** `/services/philippines-developers`
   is the single best-converting content page on the site: 4 submissions, 4
   qualified, 4 deals, a 100% qualification rate. `/services/latam-developers`
   converts too. Both are already high in the click order (2nd and 3rd), so
   promoting philippines to first costs nothing and follows the only hard
   evidence we have.
3. **It surfaces two pages the click ordering never mentions.**
   `/services/cloud-engineers` (1 lead, 1 deal) and
   `/uk/technology/supabase-developers` (2 qualified leads) sit in the "rest"
   bucket or off the list entirely, yet both out-converted eight of the top
   eight. Single-digit counts, so this is a prompt to look, not a mandate to
   re-rank.

**The bigger disagreement is not within the hire fleet at all.** 71 of 92
qualified leads and 58 of 69 deal-linked submissions attribute to `/contact`,
`/`, `/uk`, `/pricing` and `/uk/pricing`. The hire fleet produced 8 qualified
leads across the entire year. Whatever the content programme achieves, the
conversion surface is the home, contact and pricing pages, and none of them are
in W3-01.

**Recommended change to the W3-01 order, and nothing more:** move philippines to
first, keep latam high, and demote typescript from "top priority" to "top
traffic bet" without changing its position. Do not reorder the other ten on lead
data - there is no lead data for them.

---

## 4. Caveats, stated plainly

- **Sample size is the headline caveat.** 302 submissions, 92 qualified, 54
  deals across a whole year. At page level that means single digits. A page with
  1 lead and a page with 0 leads are not meaningfully different, and no ranking
  below the top four rows should be treated as a signal.
- **Zero leads does not mean zero contribution.** Attribution here is
  first-touch, and only for contacts HubSpot cookied. A visitor who read
  `/technology/aws-developers`, left, came back on a brand search, and converted
  on `/contact` is counted entirely to `/contact`. 114 of 302 submissions had no
  first-touch URL at all and fell back to the page the form sat on, and 29 had
  nothing usable. The hire pages are systematically under-credited by this
  method; they are not exonerated by it either.
- **The 12-month window ends 10 Aug 2026 and starts 10 Aug 2025.** Deals are
  counted by association to a contact who submitted in the window, so the DEAL
  itself can predate it. A returning customer's older contract attaches to a
  recent enquiry. That is one reason the value figures skew.
- **Deal value is barely readable.** 9 of 54 deals carry an `amount`. The other
  45 are counted in `became_deal_*` and contribute nothing to `deal_value_12m`.
  Treat the value column as indicative at best.
- **The site migrated on 3 Aug 2026.** Ten of the twelve months in this window
  are Webflow. Attribution URLs from before the cutover are Webflow URLs. Paths
  are largely continuous, but a URL that was retired or redirected during the
  migration shows up under its old path, and one row
  (`cloudemployee.webflow.io/pricing`) is a staging host. The `/ph/` rows are
  from the discontinued PH locale.
- **Calendly is invisible.** `/book-a-call` bookings go to HubSpot as meetings,
  not form submissions, so they never appear as rows here even though the
  meetings API is now readable. `/book-a-call/anto` shows 3 qualified leads only
  because those people also filled a form. The real book-a-call volume is
  unmeasured in this table.
- **89.1% contact match rate.** 14 submitter emails resolved to no contact
  (deleted, merged, or never created). Those submissions count as not qualified,
  which biases qualified counts slightly low.

---

## 5. What would sharpen this

1. Populate `ce_source_page` on the forms. It is defined in HubSpot and used by
   nothing, so first-touch is the only page signal we have and it misses
   everyone who is not cookied. This is the single cheapest improvement.
2. Join HubSpot meetings to pages, so the `/book-a-call` path stops being a
   hole.
3. Re-run in six months. Post-migration data alone, on a site that is now
   indexed properly, will be worth more than this twelve-month blend.
