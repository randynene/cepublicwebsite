# Cloud Employee — Visual Language Reference Spec

> Extracted verbatim from `design system.pdf` (Design System Foundations) and `how it works.pdf`.
> Values marked **[read]** are taken directly from the PDFs. Values marked **[inferred]** were measured/estimated from the rendered pages because no numeric token was published. Do not change the language — apply it.
>
> ✅ Home page now provided (`Home page.jpg`, 3872×25226) and folded in — see §8 for the reconciliation against the section inventory and the Home-specific patterns the DS descriptions missed.

---

## 1. COLOUR TOKENS

### 1a. Raw colour swatches **[read — Colours section]**
| Name | Hex | Role label in PDF |
|---|---|---|
| NAVY | `#060F1E` | bg |
| NAVY-DEEP | `#0A1628` | bg |
| YELLOW (primary lime) | `#D4FF3C` | brand |
| YELLOW-ALT | `#C8FB28` | brand |
| LIGHT | `#F7F9F0` | bg |
| WHITE | `#FFFFFF` | bg |
| MUTED | `#6B7589` | text |
| BORDER-LIGHT | `#E4E8EE` | ui |
| DARK | `#060F1E` | text |

### 1b. Semantic tokens — dual-mode **[read — token table]**
Every one of the 16 section frames carries an explicit mode (VariableCollectionId 17:2 → Dark = 17:0, Light = 17:1). The same token name resolves to a different value per mode.

| Token | Dark (17:0) | Light (17:1) | Used for |
|---|---|---|---|
| bg/primary | `#070D18` | `#F7F9F0` | Section background |
| surface/tertiary | `#1B2A45` | `#EDE8DF` | Card fills, placeholder blocks |
| border/subtle | `#22314D` | `#D4CDBF` | Dividers, card borders |
| border/default | `#32435F` | `#B8B0A0` | Strokes, input borders |
| text/primary | `#FFFFFF` | `#060F1E` | Headings, body |
| text/secondary | `#B8C2D1` | `#404B5A` | Body copy, captions |
| text/tertiary | `#7F8CA0` | `#6B7589` | Labels, metadata |
| accent/primary | `#D4FF3C` | `#5A7400` | CTAs, highlights, quote marks |
| section/bg-card | `#101B30` | `#FFFFFF` | Card backgrounds |
| section/accent | `#D4FF3C` (alias) | `#5A7400` (alias) | Accent within Section Theme |
| text/dark | `#060F1E` | `#060F1E` | Text on lime CTAs (always dark) |

> Note the two near-black navies coexist: swatch NAVY `#060F1E` vs token bg/primary `#070D18`. Both are used; treat `#070D18`/`#060F1E` as the dark-section ground.

### 1c. Lime opacity scale **[read]** — yellow-green `#D4FF3C` at alpha:
| Opacity | Use |
|---|---|
| 100% | CTA / accent |
| 82% | Body text (lime) |
| 72% | Social proof dark |
| 60% | Bullets (light) |
| 25% | Badge border |
| 15% | Quiz selected |
| 10% | Badge fill |
| 8% | Card overlay |
| 3% | Section wash |

### 1d. Light/Dark section rule **[read — "Section Theme"]**
Two modes only: **Dark** and **Light**. Assign the Section Theme collection to any section frame; one click switches bg, card bg, text primary/body/muted, border opacity, and bullet/accent colour. Light bg is `#F7F9F0`, a warm off-white **derived from the brand yellow-green**. Rule stated explicitly: **No teal. No external colours.**

---

## 2. TYPE SCALE  **[read]**

**Fonts:** Inter (UI/headings/body) + Source Serif 4 Italic (accent only). Canonical scale below is the "Updated type scale — across all pages" (Inter **Semi Bold** for headings). An earlier draft used Inter Extra Bold at smaller H2/H3 — superseded; listed at the end for reference.

| Role | Font / Weight | Size | Tracking | Line-height | Notes |
|---|---|---|---|---|---|
| Display / H1 | Inter Semi Bold | 67px | −2.52px | 70.56px | Hero headline |
| Display / H2 | Inter Semi Bold | 58px | −1.7px | 61px | Marquee / section headings |
| Display / H3 | Inter Semi Bold | 46px | −1.4px | 56px | Section H2 in body |
| Accent / Italic | Source Serif 4 **Italic** | 70px | −0.5px | — | lime `#D4FF3C`; heading accent ("actually works", "7 days.", "In 90 seconds") |
| Body / Large | Inter Regular | 19px | −0.08px | 28.5px | Lead paragraphs |
| Body / Default | Inter Regular | 14.5px | −0.08px | 22px | Body copy |
| Label / Eyebrow | Inter Semi Bold | 11.5–12px | +1.68px | — | UPPERCASE |
| UI / Button | Inter Bold | 15px | −0.08px | — | Button + inline link labels |
| Marquee / Scrolling | Inter Regular | 58px | −1.7px | — | De-risk banner |

**Superseded original scale [read, for reference]:** H1 67px / H2 48px / H3 26px — all Inter **Extra Bold**; Label/Eyebrow 11.5px Inter Bold +0.92px; Label/Tag 10.5px Inter Bold −0.08px.

### 2a. How "current vs superseded" was determined  **[read + corroborated]**
The Design System page prints **two** type-scale blocks:
1. A block headed exactly **`TYPE SCALE`** (no qualifier) — the Inter **Extra Bold** set, with H2 48 / H3 26.
2. A block headed exactly **`UPDATED TYPE SCALE — ACROSS ALL PAGES`** — the Inter **Semi Bold** set, with H2 58 / H3 46, line-heights, and the Source Serif italic accent row.

**The marker is the second block's own heading**, verbatim: **“UPDATED TYPE SCALE — ACROSS ALL PAGES.”** The words *UPDATED* and *ACROSS ALL PAGES* are what designate it as the live, site-wide scale.

This is **not label-only inference** — it is corroborated by the rendered pages: section headings (e.g. “How it works”, “What Our Clients Say”, “Staff augmentation, embedded”) render at roughly **H3 ≈ 46px**, which is the *updated* value. The original block's H3 of **26px** would render markedly smaller than what the live pages show, and headings read as Semi Bold rather than ultra-heavy Extra Bold. So both the explicit label **and** the built pages point to the same scale.

**Honesty caveat:** the DS page does **not** stamp the first block “deprecated” or “superseded” — that word is mine. My basis for calling it superseded is (a) the explicit “UPDATED … ACROSS ALL PAGES” heading on block 2, and (b) the rendered pages matching block 2. The only thing that would make this 100% unambiguous is an explicit deprecation note on block 1, which is absent. With (a)+(b) together I'm confident block 2 is live.

---

## 3. BUTTONS

Numeric heights/radii/padding are **[inferred]** — the PDFs publish button *labels, fonts and states by description* but no pixel tokens. Geometry below is measured from the rendered How It Works page; treat as close approximations, confirm against Figma if exact tokens exist.

| Variant | Fill | Text | Icon | Shape |
|---|---|---|---|---|
| **Primary — lime pill** | lime `#D4FF3C` | dark `#060F1E`, UI/Button 15px Inter Bold | leading **circular dark icon** (`#060F1E` circle, lime arrow `→`) | full-radius pill, soft **lime glow shadow** |
| **Inverted pill** (on lime banner) | dark `#060F1E` | lime/white | leading **circular lime icon** (lime circle, dark arrow) | full-radius pill |
| **Secondary / ghost pill** | transparent on dark | white | none | full-radius pill, 1px subtle border (border/default) |
| **Tertiary w/ icon** | dark, subtle border | white | leading line icon (chat, phone) | full-radius pill — e.g. "Ask our AI anything", "Book a call" |
| **Nav CTA** | lime pill + circular dark icon | dark | leading dark circular arrow | "Schedule a Call" |
| **Small lime pill** | lime | dark | leading dark circular icon | "Open chat" (inside FAQ card) |

- Geometry **[inferred]**: pill height ≈ 52–56px; radius = full (height/2); horizontal padding ≈ 24–28px; leading circular icon ≈ 38–42px.
- Hover/pressed/disabled states are not drawn in the PDFs **[not shown]**. Only a **disabled** colour rule is given: navy-40% on grey = 4.6:1 (AA, just passes).
- Pairing rule (from contrast table): lime fills always carry **dark** text; never lime text on white or on lime.

---

## 4. SECTION & LAYOUT PATTERNS  **[read — Page Section Inventory, 16 sections]**

**Container:** page/section width **1920px**; announcement & nav are 1920-wide with **320px** horizontal padding → content column ≈ **1280px** (matches the DS sheet width).

| Section | Mode | Spec (as published) |
|---|---|---|
| Announcement Bar | Dark + Light | 1920×44px, SPACE_BETWEEN, 320px padding |
| Nav Bar | Dark + Light | 1920×72px, SVG logo, Inter Bold 17px wordmark, 6 nav links Med 14.5px, lime pill CTA |
| HERO (Home) | Dark | Centered, 3 floating HeroCards (Reinaldo A., Ana M., Petar K.), CTA + trust strip |
| LP HERO | Dark | 2-col grid, heading "Hire engineers vetted by engineers", 3 rotated HeroCards |
| FOUR STAGES (How it works) | Dark | 4 alternating image/content rows, funnel table, stats bar, 1920px wide |
| DE-RISK BANNER | Dark + Light | 2-row marquee, 58px/61px Inter Regular, diamond dividers, tooltip "Replace at no cost" |
| TESTIMONIALS V1 | Dark | 4 large cards 520×540px, 2 photo + 2 text cards, horizontal scroll |
| TESTIMONIALS V2 | Dark | 6 smaller cards 400×280px, 3×2 grid, initials avatars |
| LP TESTIMONIALS V1 | Dark | same as V1, used on LP |
| LP TESTIMONIALS V2 | Dark | 6 cards 3×2, smaller quote 14px, coloured initial avatars per person |
| FIND V2 (Live Match Preview) | Dark | Interactive quiz flow, PhotoPlaceholder, role selector, match counter |
| FAQ | Dark | Accordion, eyebrow, italic heading treatment; numbered 01–08 in lime |
| MINI CTA V2 | **Lime** | Full-width lime bg, dark text, CTA row + trust strip |
| FOOTER | Dark | 4-col grid (logo + 3 link columns), legal, social, 1920px |

**Lime-on-dark usage rules (observed):**
- Lime appears as **small high-intent accents on a dark ground**: the primary CTA pill, eyebrow dots, bullet/check ticks, FAQ index numbers, key stat figures, the serif italic accent word in headings.
- Exactly **one** full-lime moment per page: the **MINI CTA banner** (full-bleed lime, dark text, inverted dark pill). It's the loudest element and is used sparingly.
- Lime never carries body text on light; lime pairs with dark (`#060F1E`) for any text/icon on top of it.
- Recurring rhythm: lime eyebrow (uppercase 11.5–12px, +1.68px tracking) → white Display heading → lime Source Serif italic accent line → secondary body → lime/dark CTA pill → muted trust strip with lime/dark dot separators.

---

## 5. SPACING / RADIUS / SHADOW

> The Design System PDF does **not** publish explicit spacing, radius, or shadow token scales **[not shown]**. The following is **[inferred]** from the rendered pages — use as guidance, replace with real tokens if/when supplied.

- **Spacing [inferred]:** large vertical section rhythm (~120–160px between sections); 320px gutter on full-width bars; ~24–32px internal card padding; 8-based feel.
- **Radius [inferred]:** pills = full; cards / panels ≈ 16–20px; hero photo card ≈ 24px with an inset 1px border; small tag chips ≈ 8–10px.
- **Shadow [inferred]:** primary lime pill carries a soft **lime-tinted glow**; cards on dark use very low-contrast elevation (mostly border `#22314D`/`#32435F` rather than drop shadow).

---

## 6. ACCESSIBILITY — CONTRAST RULES  **[read]**
- Navy `#060F1E` on Yellow `#D4FF3C` → 14.2:1 AAA
- Navy on Yellow-10% badge (white card) → 18.8:1 AAA
- White on Navy `#060F1E` → 18.7:1 AAA
- White-72% on Navy → 13.4:1 AAA
- White-55% on Navy → 10.2:1 AAA
- Muted `#6B7589` on White → 5.7:1 AA
- ⛔ Yellow on White → 1.16:1 FAIL — never use
- ⛔ Yellow on Yellow-10% → 1.13:1 FAIL — never use
- Disabled: navy-40% on grey → 4.6:1 AA (just passes)

---

## 8. HOME PAGE — reconciliation & Home-specific patterns  **[read — Home page.jpg]**

### 8a. Does rendered Home match the section inventory?
Partly. Sections that **match** the DS inventory as built: Announcement Bar, Nav Bar, HeroCards (the card component + people), Testimonials V1, FIND V2 (live match quiz), FAQ, Footer.

**Discrepancies vs inventory:**
- **Hero layout.** Inventory describes `HERO (Home)` as a **centered** layout with 3 floating HeroCards. The actual Home hero is the **2-col grid** the inventory called `LP HERO` (heading left, 3 rotated/overlapping HeroCards right). So Home ships the “LP HERO” arrangement, not the “centered” one.
- **Final CTA is the DARK variant, not the lime one.** Inventory only documents `MINI CTA V2 — LIME` (full-bleed lime bg). Home's closing CTA (“Ready to hire your *next engineer?*”) sits on a **dark** ground with a lime pill button. (The full-lime banner does appear — it's used on the How It Works page.) So the CTA banner has **two treatments**: lime-bg and dark-bg.

### 8b. Home sections / patterns the DS inventory does NOT describe  **[new]**
Home contains seven sections/patterns absent from the 16-item inventory:
1. **Logo / social-proof bar** — “TRUSTED BY 300+ ENGINEERING TEAMS” + ~7 monochrome client logos (Virgin Experience Days, Salmon, Hotelplan, willo, Travelex, Tidal, Scorpion).
2. **Client Story (large pull-quote)** — a single oversized quote (Display-scale) with avatar + name/role + company logo lockup. Distinct from the Testimonials V1/V2 *card grids*.
3. **“Staff augmentation, embedded” feature bento** — 1 large feature card + 3 stacked cards, each led by a **lime rounded-square icon tile**. New section + new component.
4. **Compact “How it works” 4-step row** — 4 columns with **large lime Source-Serif-Italic numerals** (01–04) + lime micro-links (“→ Quick form or talk to a CTO”). Different from the DS `FOUR STAGES` (the HIW-page alternating image rows).
5. **Video section** — large rounded video card with a floating label pill, name/title overlay, lime “▶ Watch the 90-second overview” pill, and a small caption pill (“one week and at *half the cost.*”).
6. **Pricing Calculator** — interactive: dark form panel (Role / Region / Seniority dropdowns) + **lime result panel** (“$5,400 /mo, all-in”, savings line, dark pill CTA) + a **white circular “SAVE …/YR” sticker badge** overlapping the corner. This is the “Price Comparison Calculator” teased in the announcement bar.
7. **“Built on the ground in 10 countries”** — horizontal office-photo gallery with bottom-left caption pills (Manila office, Bogotá team, Tidal summit, São Paulo…).

Also present but only loosely implied by the inventory: a **3-up static profile-card grid** (“Hired from top companies. *Vetted by us*”) reusing HeroCard styling, and a **YOU / US two-panel comparison** (“You get the engineer. *We handle everything else*”) with arrow-bullets vs check-bullets.

### 8c. New tokens/components surfaced by Home (extend the system)  **[new]**
- **Lime rounded-square icon tile** — lime fill, dark glyph, ~12px radius (feature bento).
- **Lime Source-Serif-Italic numerals** — the serif-italic accent is used for *numbers* (process steps), not only for accent words.
- **Lime micro-link** — small Inter lime “→ label” inline links.
- **Floating tooltip / label pills** — dark translucent pills (icon + label) overlapping imagery (“Live pair programming”, “7-day shortlist”, image captions, video label).
- **White circular “sticker” badge** — rotated, dark text, overlapping a panel corner.
- **Lime as a full content SURFACE** — not just buttons/banner: the pricing **result panel** is full-lime with dark text. Still obeys “lime + dark text”.
- **Form inputs** — dark fields (surface/tertiary) with border/default, chevron, Eyebrow-style label above.
- **Stat clusters** — lime figure + small secondary caption, separated by thin vertical dividers (testimonial + quiz cards).
- **Skill/tag chips** — pill chips; the first/primary chip often lime, the rest dark.

---

## 9. FLAGS — inferred / ambiguous / missing
- **Home now provided** and reconciled (§8). Home ships the 2-col “LP HERO” layout (not the inventory's “centered” hero) and a **dark** closing-CTA variant; it adds 7 sections the DS inventory never listed.
- **Inferred (not tokenised in PDFs):** all button pixel geometry; spacing scale; radius scale; shadow/elevation tiers.
- **Not shown:** button hover/pressed/focus states (only disabled contrast rule given).
- **Two navies** (`#060F1E` swatch vs `#070D18` bg/primary token) — both present; reconcile if a single ground is wanted.
- **Two type scales** — resolved (§2a): the block headed “UPDATED TYPE SCALE — ACROSS ALL PAGES” (Inter Semi Bold) is live; the unqualified “TYPE SCALE” block (Inter Extra Bold) is the older draft. Corroborated by rendered pages. Note: DS does not literally stamp the old one “deprecated.”
- **CTA banner has two treatments** — lime-bg (How It Works) and dark-bg (Home); inventory only documents the lime one.
- **Wordmark weight:** nav inventory says Inter Bold **17px**; type scale has no 17px entry — nav wordmark is its own one-off size.