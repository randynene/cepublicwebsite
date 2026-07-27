# DESIGN BRIEF — Managed Engineering Pods

**For:** Fresh Claude Design session.
**Type:** Figma-batch, REPRODUCE-FAITHFULLY (not redesign).
**Status:** LOCKED — ready to fire.
**Attach to the Claude Design session:** `VISUAL_LANGUAGE_SPEC.md` + the Pods Figma export (`managed_pods.png` / source Figma frame).
**Schema reference:** `ENGINEERING_POD_SCHEMA_DRAFT.md` (draft, awaiting lock). Every section here maps to a field there.
**Output path (housekeeping):** save the Claude Design output screenshots into `docs/re-design/claude-design-output/` at batch close.

---

## 0. What this brief is asking for

Reproduce Seb's Managed Engineering Pods frame **faithfully** in the CE dark/lime design language, as a clean HTML scaffold. Same workflow as Location and Pricing: scaffold goes to Figma (Path B, html.to.design import) for Seb's stakeholder review, then to Claude Code in D5 for the Next.js build. **Do not redesign, reinterpret, or "improve" the layout.** Match Seb's structure, section order, and content hierarchy exactly. Design language (colour, type, spacing, primitives) is ours; layout is Seb's.

**Deliverables:**
- One page, one record (Standard Pod). Desktop AND mobile.
- Images (case-study photos) are net-new — harvest from the Figma export; use clearly-marked placeholders where an asset isn't extractable.

---

## 1. Design language (non-negotiable, from VISUAL_LANGUAGE_SPEC.md)

- Dark ground `#070D18`, lime accent `#D4FF3C`.
- Inter Semi Bold (headings/UI) + Source Serif 4 Italic (editorial emphasis where the spec uses it).
- Lime highlights the emphasised clause in headlines, stat values, ticks, and CTAs — match how the frame uses it (e.g. "Run for you.", the standout comparison column, the "Most common" pricing badge).
- Locked primitives: buttons, tags/chips, cards, accordion (thin lime plus/minus — no chevron variant).
- The frame uses a teal/mint secondary accent on some headings ("but you", "the alternatives.") distinct from lime — reproduce this as a secondary highlight colour if one exists in the token set; flag if it doesn't and lime is the only highlight token available.
- No em-dashes in any copy you render.

---

## 2. Section-by-section (in order, top to bottom)

Field names in `code` map to `ENGINEERING_POD_SCHEMA_DRAFT.md`.

1. **Hero** (`hero`) — eyebrow ("MANAGED ENGINEERING PODS"), headline with highlighted clause ("A senior engineering team. Run for you."), subcopy, feature-bullet row (`featureBullets`), two CTAs (primary lime "Book a free consultation", secondary "See pricing" anchoring to §8), and the example pod composition card on the right (`hero.exampleCard`, reuse the `podCompositionCard` shape — badge "Standard", role rows with icon/name/note/allocation, fixed-monthly price block). Dark hero ground.

2. **Situations grid** (`situations`) — heading + subcopy ("For when you need to ship, but you can't manage engineers." / "Five situations where a pod fits better than hiring engineers directly."), then 5 cards in the frame's asymmetric layout (2 + 2 + 1, last one full-width or centred): icon, title, body. Light band.

3. **Team intro** (`teamIntro`) — two-column: heading + body + checklist bullets on the left ("A team built for your project. Led from the US."), sample pod card on the right (reuse `podCompositionCard` again — badge "Most common", label "Sample standard pod", price block "ONE FIXED MONTHLY $12-25K /avg. all-in"). Same card component as the hero card, different data.

4. **Comparison** (`comparison`) — heading ("How a pod compares to the alternatives."), 3 columns: "Hire in-house" (build the team yourself, con-heavy), "Use an agency" (mixed), "Cloud Employee Pods" (pro-heavy, visually highlighted — border/background treatment distinct from the other two). Each column: label, title, body, bulleted points with check/cross icons per point.

5. **Process** (`process`) — heading ("From consultation to shipped."), 4 numbered steps (01-04) on dark ground: title, body, small footnote line under each ("+ We charge on this.", "+ Yours either way you go.", etc).

6. **Video section** (`videoSection`) — image/video with lime play button, caption below ("Seb Hall, CEO · How Pods work"). Reuse the VideoEmbed primitive, same as Location.

7. **Pricing** (`pricing`) — heading ("Public pricing. No surprises."), subcopy, 4-tier row: Tier 1 Consultation (Free), Tier 2 Scoping engagement ($5,000), Tier 3 Standard pod ($35-50K, badged "Most common", visually emphasised), Tier 4 Lean pod ($18-25K). Each tier: label, price, billing note, bullet list, optional footnote. Shared footnote line below all four tiers re: specialised pods.

8. **Case studies** (`caseStudies`) — heading ("Real pods we've delivered. Real projects."), subcopy ("Two recent engagements... Anonymised on request"), 2 side-by-side cards: image, small tag/eyebrow ("LEGACY MODERNISATION" / "MVP BUILD"), title, body, disclaimer line, and a 3-stat row (POD SIZE / TIMELINE / OUTCOME).

9. **FAQ** (`faqs`) — heading ("The questions buyers ask."), accordion list, thin lime plus/minus, closed by default.

10. **Closing CTA band** — shared chrome. "Book a free consultation. 60 minutes." heading, subcopy, CTA, trust bullets. **Render it, but flag whether this matches the standard shared closing band or needs its own variant** (same open question already logged for Referral's stripped chrome) — do not silently assume it's identical to the standard band without checking.

Footer + header are existing chrome; render the standard CE header/footer.

---

## 3. What to flag back (do not silently absorb)

- Any section with **no matching field** in `ENGINEERING_POD_SCHEMA_DRAFT.md` — flag it, the schema may need an addition.
- The secondary teal/mint highlight colour noted in §1 — confirm token exists or flag as a gap.
- Whether the closing CTA band needs its own chrome variant (§2.10).
- Any image/asset you couldn't extract from the Figma export — mark placeholders clearly.

---

## 4. Out of scope (do NOT do)

- No Next.js, no Sanity wiring, no GROQ (D5).
- No redesign or layout reinterpretation.
- No content invention beyond what the frame shows.
- No interactive logic anywhere on this page — everything on it (comparison table, pricing tiers, pod cards) is static structured content, not a calculator. Reproduce as static.

---

*Brief draft ends. Lock (alongside ENGINEERING_POD_SCHEMA_DRAFT.md) before firing the Claude Design session.*
