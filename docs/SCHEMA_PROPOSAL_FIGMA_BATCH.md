# SCHEMA_PROPOSAL — D3 Figma Batch (Location / Pods / Referral / Fractional CTO)

**Status:** DRAFT v2 — awaiting Jake lock on SP-2a and SP-6. All other decisions locked. Doc only, no code. Follows the Pricing SCHEMA_PROPOSAL precedent.
**Scope:** Resolve schema-vs-static and batch membership for the remaining D3 Figma-reproduction pages before any design brief fires.
**Phase context:** D3 (per-template design), Figma-reproduction sub-batch. D5 is where code lands; nothing here builds.
**Probe-grounded + Figma-grounded:** Findings trace to read-only probes (this session) and to Seb's exported Figma frames (Europe / LATAM / Philippines / Fractional CTO). Evidence cited inline.

**Correction notice (v1 → v2):** v1 concluded Location needed no schema work and Fractional CTO dropped from the batch. Reviewing Seb's actual Figma frames overturned both. v1 was correct about *what exists in the repo/live site today*; it was wrong about *what Seb has designed*. This version reconciles design intent, not just current state.

---

## 0. TL;DR (the whole decision on one screen)

| Page | Disposition | Schema action | Content source |
|---|---|---|---|
| **Location** (Europe, Philippines, LATAM) | **NEW rich content type** `location` (replace the thin stub) | **FULL schema draft** — see §2 | Net-new (Figma) — 3 records, 1 template |
| **Managed Engineering Pods** | `marketingPage` (Tier 2, folds) | 1 record | Net-new (Figma) |
| **Referral** | `marketingPage` (Tier 2, folds) | 1 record | **Migration** — pull from live `/referrals` |
| **Fractional CTO** | **Bespoke redesign — PARKED** | Deferred to a later bespoke phase | Figma (later) |

**Locked this session:** SP-1 (`marketingPage` type for Pods + Referral). SP-2b (profiles inline). SP-3, SP-4.
**Awaiting confirmation:** SP-2a (calculator reuse vs new logic), SP-6 (park Fractional CTO — recommended).

---

## 1. What changed once the Figma frames were reviewed

The handover framed this batch as "reproduce faithfully, lightweight, mostly no schema." That is wrong for two of the four pages.

- **Location is not the thin AI-search stub.** Seb's frames are a rich, repeating-component marketing template — stat cards, sample-engineer cards, sub-hub city cards, an embedded pricing calculator, pull-quote bands. Structurally this is Service/Technology-tier, not persona-stub-tier.
- **Fractional CTO is not the standard service page anymore.** The live migrated doc is a canonical 6-fold `staffAugmentation` service (probe-confirmed). But Seb's Figma is a bespoke layout the service template cannot render. The probe answered "today"; the Figma answers "intended." Both true.

Neither is a folds-in-a-generic-type job. Modelling them as freeform prose would lose the structured data (bad for JSON-LD/SEO) and force Seb to hand-build card layouts in rich text (bad editing UX).

---

## 2. Location — NEW rich content type (replaces the stub)

### 2.1 Finding
The existing `location` type is an 8-line factory stub (`defineLandingPageType()`), carrying only `name / slug / order / shortLabel / thumbnail / folds[] / meta / provenance / locale`. No typed structure for the content Seb designed.

All three frames (Europe / LATAM / Philippines) are **one template with per-page data** — the definition of a content type. Section structure is consistent across the three:

| Section | Structure | Cardinality |
|---|---|---|
| Hero | headline, highlighted region word, subcopy, feature-bullet row, floating engineer cards | 1 |
| Trust logo bar | client logos | optional (Philippines has it; Europe/LATAM may not) |
| Stat cards | label + value + supporting line | 4 (variable-count array) |
| Video section | eyebrow, heading, video embed, caption | 1 (optional) |
| "On the ground in N hubs" | image, heading, checklist bullets | 1 |
| Sample engineer profiles | image, name, role, location, tech tags, experience line, placement line | 3 (variable-count array) |
| Featured hub | big hero card: image, "heart in X" heading, body, label | 1 |
| Sub-hubs ("also present in") | image, city name, label | variable array (~3) |
| Pull-quote / stat band | highlighted quote + source line | 1 (optional) |
| FAQ | question + answer | variable array |
| Closing CTA band | shared chrome (NOT modelled) | template-level |

### 2.2 Locked fact — sample profiles are INLINE, not references
Per Jake: the engineer profile cards are placeholder images, **not real placed engineers.** There is no shared engineer pool and no `teamMember` linkage. Model as an **inline array of objects** Seb fills per page. This removes the reference-modelling question entirely.

### 2.3 Proposed field shape (for the schema step — doc only here)
`location` becomes a hand-written rich type (no longer a factory stub). Indicative shape, finalised in the schema draft that follows this proposal's lock:

- Core: `name`, `slug`, `regionHighlight` (the lime word), `order`, `locale`
- `hero`: { headline, subcopy, featureBullets[], floatingCards[] }
- `trustLogos[]` — optional
- `statCards[]` — { value, label, supportingLine }
- `videoSection` — optional { eyebrow, heading, videoEmbed, caption } (reuse CONTENT-1E VideoEmbed)
- `hubsIntro` — { image, heading, checklistBullets[] }
- `sampleProfiles[]` — INLINE { image, name, role, cityLabel, tags[], experienceLine, placementLine }
- `featuredHub` — { image, heading, body, label }
- `subHubs[]` — { image, cityName, label }
- `pullQuote` — optional { quote, sourceLine }
- `calculator` — see SP-2a
- `faqs[]` — { question, answer } (renders via locked accordion primitive)
- SEO: `metaTitle`, `metaDescription`, `openGraphImage`
- Provenance: `source`, `generatedAt`, `needsReview`

### 2.4 The calculator (SP-2a — awaiting confirmation)
Every Location frame embeds a pricing calculator (role / region / seniority → cost + savings). Tier-3 element by the D19/D20 precedent (hardcode logic, Sanity marketing copy).

**Open:** SAME engine as the existing Price Comparison / Hiring Cost calculators (re-skinned), or NEW logic?
- Same → render-reuse of the existing component; only marketing copy is a Sanity field. Low effort.
- New → new calculation needing its own scoping (inputs, rate table, savings formula), likely its own small step.

**Recommendation:** treat as reuse unless Jake confirms new logic. Flagged, not assumed.

### 2.5 Migration note
`location` currently has zero documents and zero front-end route. Building the type, the 3 records, and the route are all D5 work. This proposal only decides the type is rich, not a stub.

*Evidence: PROBE location-schema-stub (stub confirmed); Figma frames Europe/LATAM/Philippines (structure); Jake (profiles inline).*

---

## 3. Managed Engineering Pods — `marketingPage`, net-new

Zero docs, zero routes, all candidate URLs 404. Net-new, content from Figma. Tier 2, folds-based. First record of the `marketingPage` type (SP-1).

**Low-probability watch:** if the Figma shows interactive mechanics, it drifts to Tier 3. Eyeball on frame arrival.

*Evidence: PROBE pods-referral-preexistence — clean.*

---

## 4. Referral — `marketingPage`, MIGRATION not net-new

Live static Webflow page at `/referrals` (+ `/uk/referrals`, both 200), outside the CMS inventory — why it slipped `CE_SITE_TRUTH.md`. Zero page-specific interactivity (manual email intro, flat $1,000 reward as copy; all forms/Calendly are sitewide chrome). Body = 4 folds (headerIntro + itemList steps + FAQ + shared CTA band).

**Tier 2, folds-based. Second record of `marketingPage`.** Rules:
- Slug preserved as `/referrals` (D26, SEO equity).
- UK variant via existing `locale` field + post-launch LOCALE-1 diff.
- **Content pulled from live page, not authored.** Brief points at `/referrals` as truth.

*Evidence: PROBE referrals-live-disposition.*

---

## 5. Fractional CTO — bespoke redesign, PARKED (SP-6)

### 5.1 Finding
Live/migrated doc is a canonical 6-fold `staffAugmentation` service, byte-identical to the other 17 (probe-confirmed). **But Seb's Figma is a bespoke layout the service template cannot render:** "What a fractional CTO actually does" icon grid, "Matched in 7 days" numbered steps, "Six signs you need a Fractional CTO", an intake-question widget, a distinct FAQ set.

The v1 "drops from batch, covered by Service template" verdict described the current doc, not Seb's design. Letting it silently drop would be a fabrication trap — the doc would claim Service-template coverage for a page the Service template can't produce.

### 5.2 Recommendation — PARK, don't force into this batch
- It is **not blocking** — a working live page exists today.
- It is a **bespoke single page**, same craft tier as Home / How-It-Works — belongs with that group, not with the clean Location + marketingPage batch.
- Folding it in now forces a mid-batch reconciliation (stays a `service` doc with a variant template? becomes its own type?) that fragments focus.

**Disposition:** Parked. Pinned to a later bespoke phase (candidate: the Home / How-It-Works bespoke group). Reason recorded so it is never mistaken for "done via Service."

**Alternative if Jake wants it now:** scope it alongside Location as a second rich one-off. Not recommended — dilutes the batch.

*Evidence: PROBE fractional-ctos-disposition (current doc standard); Figma fractional_cto frame (bespoke redesign).*

---

## 6. Type architecture summary — THREE buckets, not one

Corrects the handover's "one decision" framing:

| Bucket | Type | Members | Nature |
|---|---|---|---|
| A | `location` (rich, rewritten) | Europe, LATAM, Philippines | 1 template, 3 records, typed structure |
| B | `marketingPage` (new, folds) | Pods, Referral | reusable folds landing type |
| C | (deferred) | Fractional CTO | bespoke one-off, parked |

`marketingPage` implemented as a fourth `defineLandingPageType()` call (SP-1: reusable landing factory, zero-schema-work for future one-offs, Mygratr-productisable).

---

## 7. Cross-cutting notes for the design briefs

1. **FAQ accordion is not a schema-novel problem.** question+answer array, rendered by the locked accordion primitive (thin lime plus/minus). No new fold type anywhere.
2. **Closing CTA band = shared chrome.** Never modelled as content (Location, Referral, Pods).
3. **Location richness is TYPED, not freeform.** Stat cards, profiles, sub-hubs are typed arrays, not prose in a rich-text fold.
4. **Referral content is migrated, not authored.**
5. **No landing-type routes exist yet.** Design is design-only; routing is D5.
6. **Reuse CONTENT-1E VideoEmbed** for Location video sections.

---

## 8. What locking this unblocks

On Jake's lock (SP-2a + SP-6):
1. I draft the full `location` content-type schema (doc only, Pricing precedent) — the real first deliverable.
2. Location design brief fires **first** (one design, three records — highest leverage).
3. Pods + Referral designed against `marketingPage`.
4. Fractional CTO deferred to the bespoke group.
5. Home / How It Works remain last. Engineering Sign-up + About stay blocked on Seb.

No schema code from this doc. The `location` rewrite and `marketingPage` call are authored in D5 (or a small standalone schema step if Jake wants them locked earlier).

---

## 9. Decisions for the human (explicit)

| # | Decision | Status | Recommendation |
|---|---|---|---|
| SP-1 | Pods/Referral: two singletons vs one `marketingPage` | **LOCKED** | `marketingPage` (chosen) |
| SP-2a | Location calculator: reuse existing engine vs new logic | **OPEN** | Reuse unless confirmed new |
| SP-2b | Location sample profiles: inline vs reference | **LOCKED** | Inline (placeholder images) |
| SP-3 | Referral treated as migration (pull live copy) | **LOCKED** | Yes |
| SP-4 | Location needs full schema (not stub) | **LOCKED** (this rewrite) | Rich type — yes |
| SP-5 | Routing B1 (top-level `/[slug]`) vs B2 (prefix) for `marketingPage` | Deferred to D5 | Pin to D5 route brief |
| SP-6 | Fractional CTO: park vs scope now | **OPEN** | Park (recommended) |

---

*Draft v2 ends. Awaiting SP-2a + SP-6. No code, no commits, no files pushed.*
