# DESIGN BRIEF — Location template (Europe / LATAM / Philippines)

**For:** Fresh Claude Design session.
**Type:** Figma-batch, REPRODUCE-FAITHFULLY (not redesign).
**Status:** DRAFT — awaiting Jake lock before firing.
**Attach to the Claude Design session:** `VISUAL_LANGUAGE_SPEC.md` + the three Figma exports (`europe.pdf/png`, `latam.pdf/png`, `philippines.pdf/png`).
**Schema reference:** `LOCATION_SCHEMA_DRAFT.md` (locked). Every section here maps to a field there.
**Output path (housekeeping):** save the Claude Design output screenshots into `docs/re-design/claude-design-output/` at batch close.

---

## 0. What this brief is asking for

Reproduce Seb's three Location frames **faithfully** in the CE dark/lime design language, as a clean HTML scaffold. This is the same workflow as the Pricing page: the scaffold goes to Figma (Path B, html.to.design import) for Seb's stakeholder review, then to Claude Code in D5 for the Next.js build. **Do not redesign, reinterpret, or "improve" the layout.** Match Seb's structure, section order, and content hierarchy exactly. The design language (colour, type, spacing, primitives) is ours; the layout is Seb's.

**Deliverables:**
- **All three variants** (Europe, Latin America, Philippines) — they are one template with different data. Produce the template such that the three are visibly the same structure with per-variant content.
- **Desktop AND mobile** for each.
- Images are net-new (these pages were not in the migration). Harvest from the Figma exports; use placeholders where an asset is not extractable, clearly marked.

---

## 1. Design language (non-negotiable, from VISUAL_LANGUAGE_SPEC.md)

- Dark ground `#070D18`, lime accent `#D4FF3C`.
- Inter Semi Bold (headings/UI) + Source Serif 4 Italic (editorial emphasis where the spec uses it).
- Lime is the highlight colour for the emphasised word in headlines (e.g. "Europe.", "Latin America.", "the Philippines.") and for stat values, ticks, and CTAs — match how the frames use it.
- Use the locked primitives: buttons, tags/chips, cards, and the **accordion** (thin lime plus/minus — do NOT invent a chevron variant).
- No em-dashes in any copy you render.

---

## 2. Section-by-section (in order, top to bottom)

Reproduce these in this order. Field names in `code` map to `LOCATION_SCHEMA_DRAFT.md` so the scaffold and schema stay aligned.

1. **Hero** (`hero`) — headline with the lime region word (`hero.headline` + `regionHighlight`), subcopy (`hero.subcopy`), a feature-bullet row (`hero.featureBullets`, the small "Full UK day overlap · 3-hr US East overlap · GDPR-ready" line), two CTAs ("Meet your engineer in 7 days" primary lime, "See the cost calculator" secondary), and the tilted floating engineer preview cards on the right (`hero.floatingCards` — image, name, role, a "VETTED BY SENIOR ENG" / "7-day shortlist" badge, skill chips). Dark hero ground.

2. **Trust logo bar** (`trustLogos`) — **Philippines only.** Client-logo row ("TRUSTED BY 300+ ENGINEERING TEAMS" + logos). Omit entirely on Europe/LATAM (their frames have no logo bar). Render only when populated.

3. **Stat cards** (`statCards`) — a row of four cards on a light band, each: large lime/teal value (`value`: "#2", "30%", "Daily", "$90k vs $180k+"), label (`label`), small supporting line (`supporting`). Match the frame's card styling.

4. **Video section** (`videoSection`) — eyebrow ("WATCH SEB · 90 SEC"), heading, video embed with lime play button, optional overlay caption. Europe shows a building/field-trip video; LATAM/PH show a talking-head. Reuse the VideoEmbed primitive.

5. **"On the ground in N hubs"** (`hubsIntro`) — two-column: image one side, eyebrow ("WHERE WE ARE") + heading + lime-tick checklist (`bullets`) the other.

6. **Sample engineer profiles** (`sampleProfiles`) — eyebrow ("SAMPLE PROFILES"), heading ("Engineers we've placed from Europe."), subcopy ("Three real engineers currently embedded... Anonymised"), then **three** profile cards: image, city pill (`cityLabel`), name, role, skill-chip row (`tags`), experience line, placement line. These are placeholder people — treat images as placeholders.

7. **Featured hub** (`featuredHub`) — large hero-style card: full-width image, eyebrow ("OUR BIGGEST HUB · ZAGREB"), big heading ("Croatia is our heart in Europe."), body paragraph, a lime-emphasised stat line ("30-40 engineers and growing. Heavy in AI and data.").

8. **Sub-hubs** (`subHubs`) — "Also present in" row of smaller city cards: image, city name, country label. Europe: Belgrade / Bucharest / Warsaw. LATAM: São Paulo / Buenos Aires / Bogotá. Optional row.

9. **Pull-quote / stat band** (`pullQuote`) — centred editorial quote on a pale-mint band with a lime-emphasised clause ("Croatia is the 2nd most English-proficient country in the world..." / "Mexico City is the same time as Dallas..."), small source line beneath.

10. **Pricing calculator** (`calculator`) — eyebrow ("PRICING CALCULATOR"), heading ("What would a European engineer cost?"), the calculator card: role select, region select, seniority select on the left; a dark result panel on the right showing "YOUR MATCH WOULD COST £5,800/mo" + lime "Save £75,600" line; range note beneath; "Get matched at this rate" CTA. **Reproduce the calculator UI faithfully as a static scaffold — the interactive logic is D5 build work, not this scaffold.** Show the frame's default/populated state.

11. **FAQ** (`faqs`) — eyebrow ("EUROPE · FAQ"), heading ("Questions CTOs ask about hiring in Europe."), accordion list (thin lime plus/minus). Closed state by default.

12. **Closing CTA band** — shared chrome. LATAM/PH show the "Three ways to start" variant (three columns: free/no-commitment, talk to a CTO, chat with AI). Reproduce the frame's version. **This is template chrome, not location content — render it but do not treat it as a schema field.**

Footer + header are existing chrome; render the standard CE header/footer.

---

## 3. Per-variant differences to honour (do not homogenise)

The three are one template, but the frames differ in ways to preserve:
- **Europe** — 4 European hubs (Croatia/Serbia/Romania/Bosnia), "Seb visits Zagreb" field-trip video, £ currency, no trust-logo bar.
- **LATAM** — "They work when you work" time-zone framing, US-timezone emphasis, $ currency, "Three ways to start" CTA, no trust-logo bar.
- **Philippines** — UK/Australia audience framing, "Built for UK and Australian teams", trust-logo bar present, £ currency, retention emphasis ("97% stay 2+ yrs"), a fuller "how we keep your engineer" compliance section.

If a variant's frame shows a section the others don't (e.g. Philippines' compliance/retention block), reproduce it faithfully for that variant. Flag any such variant-only section in your output notes so it can be reconciled against the schema (it may need an optional field the draft didn't capture).

---

## 4. What to flag back (do not silently absorb)

Reproduce-faithfully means surface mismatches, don't paper over them:
- Any section in a frame that has **no matching field** in `LOCATION_SCHEMA_DRAFT.md` — flag it. The schema may need an optional field.
- Any place the three frames diverge structurally enough that "one template" is strained — flag it.
- Any image/asset you could not extract from the Figma export — mark the placeholder clearly.

---

## 5. Out of scope (do NOT do)
- No interactive calculator logic (D5).
- No Next.js, no Sanity wiring, no GROQ (D5).
- No redesign or layout reinterpretation.
- No content invention beyond what the frames show (placeholder text only where a frame is illegible, marked as such).

---

*Brief draft ends. Lock before firing the Claude Design session.*
