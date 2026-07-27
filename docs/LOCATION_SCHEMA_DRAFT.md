# LOCATION_SCHEMA_DRAFT — `location` rich content type

**Status:** DRAFT v1.1 — awaiting Jake re-lock. Doc only, no code. Follows the Pricing SCHEMA_PROPOSAL precedent and the conventions in `MYGRATR_SCHEMA_DESIGN_DECISIONS.md`.
**v1.1 change:** added §2.11b (three optional Philippines-only sections: `complianceSection`, `operationalStack`, plus confirmation that the regions row reuses `subHubs`) — surfaced by the Location Claude Design reproduction flags. No changes to the core fields.
**Supersedes:** the thin `location` factory stub (`defineLandingPageType()`), per SCHEMA_PROPOSAL v2 §2 (SP-4 locked).
**Members:** Europe, Latin America, Philippines (1 template, 3 records).
**Evidence base:** Figma frames (Europe / LATAM / Philippines), PROBE location-schema-stub, PROBE location-calculator-reuse, Jake confirmations (SP-2a new-logic + rates-in-Sanity, SP-2b profiles-inline).

---

## 0. Design decisions locked into this draft

| Ref | Decision | Source |
|---|---|---|
| SP-4 | `location` is a rich hand-written type, not a factory stub | SCHEMA_PROPOSAL v2 |
| SP-2b | Sample engineer profiles are INLINE objects (placeholder images), not `teamMember` references | Jake |
| SP-2a | Calculator logic is NEW (talent-source-region axis), built in D5; **rate data lives in Sanity on the location doc** so Seb owns rates without a deploy; logic hardcoded per D19/D20 | Jake + probe |
| — | FAQ = question/answer array, rendered by the locked accordion primitive. No new fold type | SCHEMA_PROPOSAL v2 §7 |
| — | Closing CTA band = shared chrome, NOT modelled as content | SCHEMA_PROPOSAL v2 §7 |
| — | Video sections reuse the CONTENT-1E VideoEmbed type | SCHEMA_PROPOSAL v2 §7 |

**Tier:** Tier 1 (CMS document type, many-instances-over-time) with a Tier-3 element embedded (the calculator: logic hardcoded, copy+rates in Sanity). Consistent with the three-tier model (§2 of SCHEMA_DESIGN_DECISIONS).

**Guiding-principle check (§1 of SCHEMA_DESIGN_DECISIONS):**
1. *Preserve live* — Location pages are net-new; no live equity to preserve. N/A.
2. *Seb editing ≥ Webflow* — typed fields + arrays give Seb structured editing, not raw rich-text card-building. ✅
3. *Programmatic-friendly* — every field API-populatable; `source`/`generatedAt`/`needsReview` carried. ✅
4. *Reusable for customer 2* — type name `location` is generic; no CE-specific field names. Rate model is generic (region → tier rates). ✅

---

## 1. Section-to-field map (Figma → schema)

Derived from the three frames. Each frame is the same template; content varies. "Opt" = optional (present on some frames, not all).

| # | Figma section | Schema field | Type | Req |
|---|---|---|---|---|
| 1 | Hero (headline, lime region word, subcopy, feature bullets, floating cards) | `hero` | object | ✅ |
| 2 | Trust logo bar (Philippines only) | `trustLogos` | array[image] | opt |
| 3 | Four stat cards | `statCards` | array[object] | ✅ |
| 4 | Video section ("Seb visits Zagreb" / "Why LATAM" / PH customer story) | `videoSection` | object | opt |
| 5 | "On the ground in N hubs" (image + heading + checklist) | `hubsIntro` | object | ✅ |
| 6 | Sample engineer profiles (3 cards) | `sampleProfiles` | array[object] INLINE | ✅ |
| 7 | Featured hub ("X is our heart" big card) | `featuredHub` | object | ✅ |
| 8 | Sub-hubs ("also present in" city cards) | `subHubs` | array[object] | opt |
| 9 | Pull-quote / stat band | `pullQuote` | object | opt |
| 10 | Pricing calculator | `calculator` | object (copy + rates) | ✅ |
| 11 | FAQ accordion | `faqs` | array[object] | opt |
| — | Closing CTA band | — (shared chrome, not modelled) | — | — |

---

## 2. Full field specification

### 2.1 Core
```
name            string   required   max 100   # e.g. "Europe", "Latin America", "Philippines"
slug            slug     required   source: name, maxLength 96
regionHighlight string   optional   max 60    # the lime-highlighted word in the hero headline
                                              # (e.g. "Europe.", "Latin America.", "the Philippines.")
                                              # separate from name so the display word can differ
order           number   optional
locale          string   required   list: default (US) / uk   initialValue 'default'
```

### 2.2 `hero` (object, required)
```
headline        string   required   max 120   # "Hire senior engineers in {regionHighlight}"
subcopy         text     required             # the paragraph under the headline
featureBullets  array[string]  required  min 1  # "Full UK day overlap", "3-hr US East overlap", "GDPR-ready"
floatingCards   array[object]  optional        # the tilted engineer preview cards in the hero
  └ image       image    required   (+ alt)
  └ name        string   optional             # "Nikola V.", "Stefan L."
  └ role        string   optional             # "Senior Dev-Eng · 9 yrs · Belgrade"
  └ badge       string   optional             # "VETTED BY SENIOR ENG", "7-day shortlist"
  └ tags        array[string]  optional        # skill chips shown on the card
```

### 2.3 `trustLogos` (array[image], optional)
```
trustLogos      array[image]   optional   (+ alt each)
                # Philippines shows a client-logo bar (Virgin Ed, Salmon, Hotelplan...).
                # Europe/LATAM frames omit it. Optional so the template renders the bar
                # only when populated.
```

### 2.4 `statCards` (array[object], required, expect 4)
```
statCards       array[object]  required   min 1 (frames show 4)
  └ value       string   required   max 40   # "#2", "30%", "Daily", "$90k vs $180k+", "97% stay 2+ yrs"
  └ label       string   required   max 60   # "English proficiency", "STEM density", "Time zone & easy access"
  └ supporting  text     optional            # the small print under the stat
```
*Note: `value` is a string, not a number — the frames mix "#2", "30%", "Daily", "$90k vs $180k+". Do not over-type this into a numeric field; it is display copy.*

### 2.5 `videoSection` (object, optional)
```
videoSection    object   optional
  └ eyebrow     string   optional            # "WATCH SEB · 90 SEC", "CUSTOMER STORY · 90 SEC"
  └ heading     string   required            # "Seb visits our Zagreb hub."
  └ subcopy     text     optional
  └ video       videoEmbed   required        # REUSE CONTENT-1E videoEmbed type
  └ caption     string   optional            # overlay caption e.g. "A founder's field trip to Croatia"
```

### 2.6 `hubsIntro` (object, required)
```
hubsIntro       object   required
  └ eyebrow     string   optional            # "WHERE WE ARE"
  └ heading     string   required            # "On the ground in four European hubs."
  └ image       image    required   (+ alt)
  └ bullets     array[string]  required  min 1  # checklist items with the lime ticks
```

### 2.7 `sampleProfiles` (array[object], INLINE, required, expect 3)
Per SP-2b: inline objects, placeholder images, NOT `teamMember` references.
```
sampleProfiles  array[object]  required   min 1 (frames show 3)
  └ image           image    required   (+ alt)
  └ name            string   required            # "Petar K.", "Reinaldo A.", "Mark Anthony L."
  └ role            string   required            # "Senior Backend Engineer · Zagreb"
  └ cityLabel       string   optional            # the pill over the card ("Croatia", "Bogotá", "Makati")
  └ tags            array[string]  required  min 1  # ".NET", "C#", "Azure", "SQL", "Kafka"
  └ experienceLine  string   optional            # "8 years experience"
  └ placementLine   text     optional            # "Previously at a major European bank. Placed with a UK fintech for 2.5 years."
```

### 2.8 `featuredHub` (object, required)
```
featuredHub     object   required
  └ eyebrow     string   optional            # "OUR BIGGEST HUB · ZAGREB", "OUR BIGGEST HUB · MEXICO CITY"
  └ image       image    required   (+ alt)
  └ heading     string   required            # "Croatia is our heart in Europe."
  └ body        text     optional            # the paragraph over the image
  └ statLine    string   optional            # "30-40 engineers and growing. Heavy in AI and data."
```

### 2.9 `subHubs` (array[object], optional, expect ~3)
```
subHubs         array[object]  optional
  └ image       image    required   (+ alt)
  └ cityName    string   required            # "Belgrade", "Bucharest", "Warsaw", "São Paulo"
  └ countryLabel string  optional            # "Serbia", "Poland", "Brazil"
  └ note        string   optional            # small descriptor line
```

### 2.10 `pullQuote` (object, optional)
```
pullQuote       object   optional
  └ quote       text     required            # "Croatia is the 2nd most English-proficient country in the world..."
                                             # (rich-string with a highlightable clause — store as text,
                                             #  template handles the lime emphasis span, OR use a light
                                             #  portable-text if inline highlight must be author-controlled — see Open Q3)
  └ sourceLine  string   optional            # "Source: EF English Proficiency Index 2024 · Eurostat STEM graduate data"
```

### 2.11 `calculator` (object, required) — copy + rates; logic is D5
Per SP-2a: logic hardcoded in D5 (D19/D20 pattern), but the **rate table lives here** so Seb edits rates without a deploy. The talent-source-region axis is new (probe-confirmed); the rate model below is generic.
```
calculator      object   required
  └ eyebrow     string   optional            # "PRICING CALCULATOR"
  └ heading     string   required            # "What would a European engineer cost?"
  └ subcopy     text     optional
  └ rangeNote   string   optional            # "Ranges based on actual placements. Final price confirmed after discovery call."
  └ ctaLabel    string   optional            # "Get matched at this rate"
  └ rates       array[object]  required      # per-seniority CE delivery rate FOR THIS location
      └ seniority   string  required  list: junior / mid / senior
      └ ceRate      number  required          # CE monthly delivery rate for this location + seniority
      └ inHouseUS   number  optional          # comparison in-house US cost (for the savings figure)
      └ inHouseUK   number  optional          # comparison in-house UK cost
      └ currency    string  optional  list: USD / GBP / EUR   # frames show €/$/£ per location
```
*D5 build note (NOT this schema): the calculator component reads `calculator.rates` for the selected seniority, computes savings vs the chosen in-house market, and renders. Logic greenfield — no repo engine exists yet (D19/D20 un-built, probe-confirmed).*

### 2.11b Philippines-only sections (optional — surfaced by Location design flags)
The Claude Design reproduction flagged three sections present on the Philippines frame but absent from Europe/LATAM. Added as OPTIONAL so Europe/LATAM leave them empty and only Philippines (or future locations) populate them. This is the design-then-reconcile loop closing correctly.

```
complianceSection   object   optional          # "HOW WE KEEP YOUR ENGINEER" / "Compliantly employed"
  └ eyebrow     string   optional
  └ heading     string   required (if section present)
  └ image       image    optional   (+ alt)
  └ bullets     array[object]  required (if present)   # { title, body } compliance points
                                                       # (EOR, L&D, health cover, 24/7 access, local support)

operationalStack    object   optional          # the You/Us two-panel "We handle everything else"
  └ heading         string   optional           # "You get the engineer. We handle everything else."
  └ youPanel        object                       # { title: "Run your team...", bullets[] }
      └ title   string
      └ bullets array[string]
  └ usPanel         object                       # { title: "The full operational stack.", bullets[] }
      └ title   string
      └ bullets array[string]
  └ footnote        string   optional            # "One monthly fee. 30 days notice on a rolling contract."
```

**On the "Built on the ground in N regions" card row (Philippines):** this maps to the existing `subHubs` field (§2.9) — it is the same shape (image, city, label), reused. Confirmed one field, not a new one, per the design flag. No new field needed.

### 2.12 `faqs` (array[object], optional)
```
faqs            array[object]  optional
  └ question    string   required            # "What's the time zone overlap with US East Coast and West Coast?"
  └ answer      text     required
```
*Rendered by the locked accordion primitive. No new fold type.*

### 2.13 SEO + provenance (standard, matches other rich types)
```
metaTitle       string   required   max 60
metaDescription text     required   140-160 chars
openGraphImage  image    optional   (+ alt)
source          string   required   list: manual / beem / claude_code / imported   initialValue 'manual'
generatedAt     datetime optional
needsReview     boolean  optional   initialValue false
```

### 2.14 Studio preview
```
preview: { title: name, subtitle: shortLabel-or-metaTitle, media: openGraphImage-or-hero.floatingCards[0].image }
```

---

## 3. JSON-LD (D5 template concern, noted here for continuity)
Per SCHEMA_DESIGN_DECISIONS §7.6, `location` → WebPage + CollectionPage; FAQPage if `faqs` present. Server-side generated in D5. No schema field required.

---

## 4. Open questions for Jake (small, non-blocking to lock)

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | Is `regionHighlight` worth a separate field, or derive the lime word from `name`? Frames show "the Philippines." vs name "Philippines" — they differ, so I kept it separate. | Keep separate (safer) |
| Q2 | `subHubs` — do sub-hub cities ever need their own pages later? If yes, consider references to a future `hub` type. For now inline is right (no such pages exist). | Inline |
| Q3 | `pullQuote.quote` — plain text (template controls the lime emphasis) or light portable-text (author controls which words highlight)? Plain text is simpler; portable-text gives Seb control. | Plain text |
| Q4 | Calculator `currency` per-rate vs per-location — frames suggest one currency per location (€ Europe, $ LATAM, £ PH). Move `currency` up to the `calculator` object level? | Move to calculator-level (cleaner) |

None of these block locking the type; they are refinements.

---

## 5. What locking this unblocks
1. `location` schema is authored in D5 (or a small standalone schema step) from this spec.
2. The **Location design brief fires** — one design, three records, highest leverage in the batch.
3. Pods + Referral proceed against `marketingPage` (SCHEMA_PROPOSAL v2 §3-4).

No code, no commits from this doc.

---

*Draft ends. Awaiting lock (+ optional answers to Q1-Q4). No code, no commits, no files pushed.*
