# ENGINEERING_POD_SCHEMA_DRAFT — `engineeringPod` rich content type

**Status:** LOCKED v1.0 (2026-07-01). Doc only, no code. Q1-Q3 (§4) locked to stated defaults. Follows the Location/Pricing SCHEMA_PROPOSAL precedent and `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` conventions.
**Supersedes:** SP-1's assumption that Pods runs on `marketingPage`. Reassessed after reviewing Seb's actual Figma frame — Pods is Service/Technology-tier structure, not folds-tier.
**Members today:** Standard Pod (1 record). Schema built to hold more — the frame's own footnote references "specialised pods (AI implementation, data engineering, mobile)" priced per engagement, which reads as future `engineeringPod` records, not a one-off page.
**Evidence base:** `managed_pods.png` (Seb's Figma frame, full page).

---

## 0. Design decisions this draft locks in

| Ref | Decision | Rationale |
|---|---|---|
| SP-1 (revised) | Pods is NOT `marketingPage`. New rich type `engineeringPod`. | Frame has 10 distinct structured sections, two of which (comparison table, pricing tiers) have no existing schema precedent anywhere in the repo — checked against `compareBlog` (article+competitor field, not a table) and the two Tier-3 calculator singletons (copy-only). Folding this into `marketingPage`'s fold library would either bloat that type for a one-off or force freeform rich text on structured data (bad for JSON-LD, bad Studio editing UX for Seb). |
| — | Type built as a real content type (many-instance-capable), not a singleton, even though only 1 record exists now | Frame's own pricing footnote implies specialised pod variants are coming. Same logic as `location`: 1 template, N records, cheaper to build once. |
| — | `podCompositionCard` modelled as a reusable inline object, used twice on the page (hero card + "sample pod" card) | DRY — identical shape, different heading/badge, appears twice in the same frame. |
| — | Comparison table and pricing tiers flagged as CANDIDATE reusable primitives for Mygratr (Customer-2), not CE-specific | Every staff-aug / dev-shop competitor runs a "us vs in-house vs agency" comparison and a tiered-pricing table. Worth generalising the object shape now rather than CE-coupling the field names. Non-blocking — doesn't change this draft, just don't name fields `ceRate` etc. |

**Tier:** Tier 1 (CMS document type), matching `location`'s classification. No Tier-3 interactive logic on this page — the pod card, comparison table, and pricing tiers are all static structured content, not calculators.

**Guiding-principle check:**
1. *Preserve live* — net-new page, no live equity. N/A.
2. *Seb editing ≥ Webflow* — typed role list, typed comparison columns, typed pricing tiers vs. hand-built cards in rich text. ✅
3. *Programmatic-friendly* — every field API-populatable; `source`/`generatedAt`/`needsReview` carried. ✅
4. *Reusable for Customer-2* — type name generic (`engineeringPod`, not `cePod`); comparison/pricing object shapes kept CE-copy-agnostic. ✅

---

## 1. Section-to-field map (frame → schema)

| # | Frame section | Schema field | Type | Req |
|---|---|---|---|---|
| 1 | Hero (headline, subcopy, 2 CTAs, feature bullets, example pod card) | `hero` | object | ✅ |
| 2 | Situations grid (5 cards: icon, title, body) | `situations` | array[object] | ✅ |
| 3 | "Team built for your project" (copy + checklist + sample pod card) | `teamIntro` | object | ✅ |
| 4 | Comparison ("in-house / agency / us", 3 columns, middle highlighted) | `comparison` | object | ✅ |
| 5 | Process (4 numbered steps) | `process` | array[object] | ✅ |
| 6 | Video section | `videoSection` | object | opt |
| 7 | Pricing tiers (4 tiers + shared footnote) | `pricing` | object | ✅ |
| 8 | Case studies (2 shown, image + stats row) | `caseStudies` | array[object] | opt |
| 9 | FAQ | `faqs` | array[object] | opt |
| — | Closing CTA band | shared chrome, not modelled | — | — |

---

## 2. Full field specification

### 2.1 Core
```
name            string   required   max 100   # e.g. "Standard Pod" — internal/Studio label, not page copy
slug            slug     required   source: name, maxLength 96
order           number   optional
locale          string   required   list: default (US) / uk   initialValue 'default'
```

### 2.2 `podCompositionCard` (reusable object — used in §2.3 and §2.4)
```
podCompositionCard   object
  └ heading       string   required     # "Example pod composition" / "Sample standard pod"
  └ badge         string   optional     # "Standard" / "Most common"
  └ roles         array[object]  required  min 1
      └ icon          string   optional   # icon key, matches locked icon set
      └ roleName      string   required   # "Fractional CTO", "Senior Engineers"
      └ roleNote      string   optional   # "US-based, runs the project", "Backend, frontend, full-stack"
      └ allocation    string   required   # "0.5 FTE", "Full-time", "2+ FTE" — display string, not numeric
  └ priceLabel    string   required     # "FIXED MONTHLY" / "ONE FIXED MONTHLY"
  └ priceValue    string   required     # "$12,000-25,000" / "$12-25K /avg. all-in" — display string
```

### 2.3 `hero` (object, required)
```
hero   object   required
  └ eyebrow        string   optional   # "MANAGED ENGINEERING PODS"
  └ headline        string   required   # "A senior engineering team. Run for you."
  └ headlineHighlight  string  optional  # the lime-highlighted clause, e.g. "Run for you."
  └ subcopy         text     required
  └ featureBullets  array[string]  required  min 1   # "US-based fractional CTO · Fixed monthly fee · We own the delivery"
  └ primaryCta      { label: string, link: url }
  └ secondaryCta    { label: string, link: url }   # "See pricing" — anchors to §2.7
  └ exampleCard     podCompositionCard   required   # reuse §2.2
```

### 2.4 `situations` (array[object], required, expect 5)
```
situations   array[object]  required   min 1
  └ icon    string   optional
  └ title   string   required     # "MVP development.", "Legacy platform modernisation."
  └ body    text     required
```
*Section heading/subcopy for this block live at top-level: `situationsHeading`, `situationsSubcopy` (string/text, required).*

### 2.5 `teamIntro` (object, required)
```
teamIntro   object   required
  └ heading        string   required   # "A team built for your project. Led from the US."
  └ body           text     optional
  └ checklistBullets  array[string]  required  min 1
  └ sampleCard      podCompositionCard   required   # reuse §2.2, second instance
```

### 2.6 `comparison` (object, required)
Flagged as a candidate reusable primitive (see §0) — keep field names generic.
```
comparison   object   required
  └ heading    string   required   # "How a pod compares to the alternatives."
  └ columns    array[object]  required   min 3, max 3
      └ label        string   required   # "HIRE IN-HOUSE" / "USE AN AGENCY" / "CLOUD EMPLOYEE PODS"
      └ title        string   required   # "Build the team yourself." / "A senior team, run for you."
      └ body         text     optional
      └ points       array[object]  required  min 1
          └ text        string   required
          └ sentiment   string   required   list: positive / negative   # drives check vs cross icon
      └ highlighted   boolean  optional  initialValue false   # true for the CE column
```

### 2.7 `process` (array[object], required, expect 4)
```
process   array[object]  required   min 1
  └ stepNumber   string   required   # "01".."04" — display string, template can also auto-index
  └ title        string   required   # "Free consultation.", "Pod assembled."
  └ body         text     required
  └ footnote     string   optional   # "+ We charge on this. No pressure."
```
*Section heading lives at top-level: `processHeading` (string, required).*

### 2.8 `videoSection` (object, optional)
```
videoSection   object   optional
  └ video     videoEmbed   required   # REUSE CONTENT-1E videoEmbed type
  └ caption   string   optional       # "Seb Hall, CEO · How Pods work"
```

### 2.9 `pricing` (object, required)
```
pricing   object   required
  └ heading      string   required   # "Public pricing. No surprises."
  └ subcopy      text     optional
  └ tiers        array[object]  required   min 1 (frame shows 4)
      └ tierLabel     string   required   # "TIER 1".."TIER 4"
      └ name          string   required   # "Consultation", "Standard pod"
      └ price         string   required   # "Free", "$5,000", "$35-50K" — display string
      └ billingNote   string   optional   # "60 minutes", "Fixed · 2 weeks", "/month, all-in"
      └ bullets       array[string]  required  min 1
      └ badge         string   optional   # "Most common"
      └ footnote      string   optional   # per-tier micro-copy under bullets
  └ sharedFootnote  text   optional   # "Specialised pods (AI implementation, data engineering,
                                       #  mobile) priced per engagement, typically from $18K/month.
                                       #  Minimum engagement 3 months on any pod tier..."
```

### 2.10 `caseStudies` (array[object], optional, expect 2)
```
caseStudies   array[object]  optional
  └ image        image    required   (+ alt)
  └ tag          string   optional   # "LEGACY MODERNISATION" / "MVP BUILD"
  └ title        string   required   # "Re-platforming a 12-year-old logistics system."
  └ body         text     required
  └ disclaimer   string   optional   # "Anonymised on request — full details on the call."
  └ stats        array[object]  required  min 1   # POD SIZE / TIMELINE / OUTCOME
      └ label   string   required
      └ value   string   required
```
*Section heading lives at top-level: `caseStudiesHeading` (string, required).*

### 2.11 `faqs` (array[object], optional)
```
faqs   array[object]  optional
  └ question   string   required
  └ answer     text     required
```
*Rendered by the locked accordion primitive. No new fold type. Section heading at top-level: `faqsHeading` (string, optional).*

### 2.12 SEO + provenance (standard, matches other rich types)
```
metaTitle       string   required   max 60
metaDescription text     required   140-160 chars
openGraphImage  image    optional   (+ alt)
source          string   required   list: manual / beem / claude_code / imported   initialValue 'manual'
generatedAt     datetime optional
needsReview     boolean  optional   initialValue false
```

### 2.13 Studio preview
```
preview: { title: name, subtitle: shortLabel-or-metaTitle, media: openGraphImage-or-hero.exampleCard-icon }
```

---

## 3. Flags carried from the frame (surfaced now, not silently absorbed)

- **Closing CTA band** ("Book a free consultation. 60 minutes.") — treated as shared chrome per the Location/Referral precedent, NOT a schema field. Flag for D5: confirm whether this is a true shared-chrome variant or page-specific override copy, same open question Referral already carries for its stripped chrome.
- **`comparison` and `pricing.tiers`** have zero precedent elsewhere in the schema (`compareBlog` is an article type with a `competitor` field, not a table; the two Tier-3 calculator singletons are copy-only around hardcoded logic). Recommend generalising both object shapes for Mygratr reuse — no CE-specific field names used above, on purpose.
- **`podCompositionCard`** appearing twice on one page (hero + teamIntro) is the strongest signal this page is closer to `service`-tier complexity than a folds page. If a third instance shows up in a future pod variant, promote it to a named object type at the schema level (already effectively is, per §2.2) rather than inlining twice more.

---

## 4. Open questions for Jake

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | `situations` grid is 5 items in a 2+2+1 layout in the frame — is 5 a hard count, or should the schema allow fewer/more (variable array) for future pod variants? | Variable array, no max (current default above) |
| Q2 | `comparison.columns` — locked at exactly 3 (in-house / agency / us), or should a future pod variant be allowed a 2-column or 4-column comparison? | Lock at exactly 3 for now (matches the frame); revisit if a future variant needs a different count |
| Q3 | Closing CTA band — shared chrome or page-specific? (see §3) | Shared chrome, pending D5 confirmation |

None of these block locking the type.

---

## 5. What locking this unblocks

1. `engineeringPod` schema authored in D5 (or a small standalone schema step), same as `location`.
2. Design brief fires for Pods reproduction (`DESIGN_BRIEF_PODS.md`, companion doc).
3. Referral proceeds unaffected on `marketingPage` — this only pulls Pods off it.
4. Fractional CTO stays parked (SP-6), no schema action from this doc.

No code, no commits, no files pushed.

---

*Draft ends. Awaiting lock (+ optional answers to Q1-Q3).*
