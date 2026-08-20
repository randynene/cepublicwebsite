---
name: Cloud Employee
description: Dark-default, lime-accented design system for cloudemployee.io
colors:
  bg-primary: "#070D18"
  section-bg-card: "#101B30"
  surface-tertiary: "#1B2A45"
  surface-sweep-dark: "#0B1424"
  border-subtle: "#22314D"
  border-default: "#32435F"
  text-primary: "#FFFFFF"
  text-secondary: "#B8C2D1"
  text-tertiary: "#7F8CA0"
  text-dark: "#060F1E"
  accent-primary: "#D4FF3C"
  accent-alt: "#C8FB28"
  accent-deep: "#B7EC25"
  error: "#bd0000"
  success: "#16a34a"
  warning: "#d97706"
typography:
  display-h1:
    fontFamily: "Inter, sans-serif"
    fontSize: "4.1875rem"
    fontWeight: 600
    lineHeight: "4.41rem"
    letterSpacing: "-2.52px"
  h2:
    fontFamily: "Inter, sans-serif"
    fontSize: "3.625rem"
    fontWeight: 600
    lineHeight: "3.8125rem"
    letterSpacing: "-1.7px"
  h3:
    fontFamily: "Inter, sans-serif"
    fontSize: "2.875rem"
    fontWeight: 600
    lineHeight: "3.5rem"
    letterSpacing: "-1.4px"
  accent-italic:
    fontFamily: "Source Serif 4, serif"
    fontSize: "4.375rem"
    fontWeight: 400
    lineHeight: "1.05"
    letterSpacing: "-0.5px"
  body-lead:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: "1.78125rem"
    letterSpacing: "-0.08px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.90625rem"
    fontWeight: 400
    lineHeight: "1.375rem"
    letterSpacing: "-0.08px"
  eyebrow:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "1.68px"
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    letterSpacing: "-0.08px"
rounded:
  xs: "4px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  card: "24px"
  xl: "40px"
  pill: "9999px"
spacing:
  step: "8px"
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.text-dark}"
    textColor: "{colors.accent-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-sweep-dark}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent-primary}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  card-default:
    backgroundColor: "{colors.section-bg-card}"
    rounded: "{rounded.lg}"
    padding: "48px"
  input-default:
    backgroundColor: "{colors.section-bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "20px 32px"
---

# Design System: Cloud Employee

## Overview

**Creative North Star: "The Signal Flare"**

A dark operational ground with one bright signal color used sparingly to mean "look here" — the system's own locked spec states the rule directly: "exactly one full-lime moment per page." Everywhere else, lime appears only as small high-intent accents (a CTA pill, an eyebrow dot, a bullet tick, a stat figure, the italic accent word in a headline) on top of a near-black navy field. The voice is confident and precise rather than playful: Inter Semi Bold carries every heading, and the one ornamental flourish permitted is a Source Serif 4 italic accent word or numeral, always in lime, never anywhere else.

This is a dark-default system, not a dark mode bolted onto a light one — `#070D18` is the canonical ground, and a light variant exists only as an explicit per-section opt-in (`data-theme="light"`), deriving its own off-white background from the brand lime rather than reverting to a generic white-and-black palette.

**Key Characteristics:**
- Dark-default, not dark-mode-as-afterthought; light is the opt-in exception.
- Lime is rationed: one full-lime surface moment per page, everywhere else a small accent.
- Lime fills always carry dark text — never lime text on white, never lime text on lime.
- Flat, shadowless cards; depth comes from border and tonal layering, not drop shadow.
- Inter Semi Bold for structure; Source Serif 4 Italic reserved for exactly one accent role (the emphasis word/numeral).
- No teal, no colors outside the locked palette ("No teal. No external colours" — spec §1d).

## Colors

The palette is deliberately narrow: one dark ground, one signal accent, and a small set of supporting neutrals — no secondary or tertiary brand hue.

### Primary
- **Signal Lime** (`#D4FF3C`, `accent-primary`): the one accent color in the system. CTAs, highlights, quote marks, eyebrow dots, bullet ticks, stat figures, the italic accent word. Always paired with dark text/icon on top of it — never white or light text on lime, and never lime text on lime or on white (fails contrast: 1.16:1).
- **Signal Lime — Alt** (`#C8FB28`, `accent-alt`) and **Signal Lime — Deep** (`#B7EC25`, `accent-deep`): tonal siblings of the primary accent, used for sweep-fill hover states and secondary emphasis rather than as independent brand colors.

### Neutral
- **Void Navy** (`#070D18`, `bg-primary`): the canonical dark ground. Nearly every section sits on this.
- **Card Navy** (`#101B30`, `section-bg-card`): card and dialog backgrounds — one step lighter than the page ground so cards read as raised without a shadow.
- **Slate Fill** (`#1B2A45`, `surface-tertiary`): input fills, hover surfaces, placeholder blocks.
- **Sweep Dark** (`#0B1424`, `surface-sweep-dark`): the base fill for secondary/ghost CTAs — deliberately distinct from the page ground so a "dark" button still reads as a raised control rather than melting into the page.
- **Border Subtle** (`#22314D`) / **Border Default** (`#32435F`): dividers and card borders / input and control strokes, respectively.
- **White** (`#FFFFFF`, `text-primary`): headings and primary body text.
- **Fog** (`#B8C2D1`, `text-secondary`): body copy and captions.
- **Steel** (`#7F8CA0`, `text-tertiary`): labels and metadata.
- **Ink** (`#060F1E`, `text-dark`): the mandatory text/icon color on any lime fill.

### Named Rules
**The One Flare Rule.** Exactly one full-lime surface moment per page (the closing CTA banner). Everywhere else lime is a small accent, never a field.

**The Dark-Text-on-Lime Rule.** Any element filled with lime carries dark (`#060F1E`) text or icon glyphs. Never white-on-lime, never lime-on-lime, never lime-on-white.

**The No-Teal Rule.** No colors exist in this system outside the documented palette. The prior teal-era brand is fully retired; nothing is reintroduced ad hoc.

## Typography

**Display/Heading Font:** Inter, Semi Bold (600) throughout the hierarchy — no separate "display" weight.
**Body Font:** Inter, Regular (400).
**Accent Font:** Source Serif 4, Italic — reserved for exactly one role (see below), never used for a whole heading or paragraph.

**Character:** Structural and precise — one weight (Semi Bold) carries every heading size, so hierarchy comes from scale and tight negative tracking, not weight variation. The single serif-italic accent is the system's only ornamental gesture, and it is rationed as tightly as the lime color: one accent word or a numeral, in lime, per moment.

### Hierarchy
- **H1** (600, 67px / 70.56px line-height, −2.52px tracking): hero headline, one per page.
- **H2** (600, 58px / 61px, −1.7px): section headings, marquee text.
- **H3** (600, 46px / 56px, −1.4px): sub-section headings within body content.
- **Accent Italic** (Source Serif 4 Italic, 70px, 1.05 line-height, −0.5px, always lime): the emphasis word or process numeral inside a heading — never a full heading, never any color but lime.
- **Body / Lead** (400, 19px / 28.5px, −0.08px): lead paragraphs.
- **Body / Default** (400, 14.5px / 22px, −0.08px): standard copy.
- **Eyebrow** (600, 12px, +1.68px tracking, UPPERCASE): the small label above a heading, always uppercase, frequently paired with a lime dot.
- **Button / UI Label** (700, 15px, −0.08px): button and inline-CTA text only.

### Named Rules
**The One Accent Rule.** Source Serif 4 Italic renders exactly one word or numeral per instance, always in lime. It is never used for a full sentence, a full heading, or in any other color.

## Layout

Content sits on a 1280px column derived from a 1920px full-bleed section with 320px horizontal gutters at desktop; sections stack with a large vertical rhythm (roughly 120-160px between major sections). Internal component spacing runs on an 8px-step scale (`--spacing: 0.5rem`, so `p-1` = 8px, `p-6` = 48px) — every padding/gap value in the system is a multiple of 8px. Breakpoints are CE-tuned, not Tailwind defaults: 480px (mobile), 768px (tablet), 992px (desktop — where H1/H2 make their one size jump), 1280px (large desktop).

## Elevation & Depth

**Flat and precise.** Cards carry zero `box-shadow` site-wide (verified against 167 probed card-shaped containers) — depth is implied by a one-step lighter card background (`#101B30` on `#070D18`) plus a subtle border, never a drop shadow. The single deliberate exception is the primary lime CTA pill, which carries a soft lime-tinted glow (`0px 6px 24px -6px rgba(212,255,60,0.45)`) — glow is reserved for the one accent color, never applied to a neutral surface.

### Shadow Vocabulary
- **Elevated** (`0px 2px 14px -5px rgba(0,0,0,0.35)`): reserved for floating chrome (mobile drawer) rather than ordinary cards.
- **Lime Glow** (`0px 6px 24px -6px rgba(212,255,60,0.45)`): the primary lime CTA pill only.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. The only shadow in the system that exists at rest (not as a hover response) is the lime CTA's own glow — every other surface relies on tonal layering and border, never a cast shadow.

## Shapes

Two form languages only: **full pills** for every interactive control (buttons, inputs, tags/chips — `9999px` radius), and **soft rectangles** for content containers, stepping from 4px (tag chips) through 16-20px (inputs, cards, panels) up to 24px (hero photo cards). Nothing in the system uses a sharp (0px) corner or an asymmetric/cut corner.

## Components

### Buttons
Every filled button uses the "sweep-fill" mechanic: a full-color rest state that sweeps to an inverted fill on hover/focus via a `::before` overlay, with the label/icon flipping color in sync (never a plain background-color transition).
- **Shape:** full pill (`9999px`), no exceptions.
- **Primary:** lime fill (`#D4FF3C`), dark text (`#060F1E`), sweeps to dark-fill/lime-text on hover or focus-visible; carries a soft lime glow shadow.
- **Secondary:** dark fill (`#0B1424`, deliberately lighter than the page ground so it still reads as a control), white text, subtle border that lights up lime on hover; sweeps to lime-fill/dark-text.
- **Ghost:** transparent fill, lime text, 1.5px lime border; sweeps to a full lime fill with dark text.
- **Icon-only:** square (not a pill), transparent, simple hover-tint — the one button archetype that is not a CTA and does not use the sweep mechanic. Requires an explicit `aria-label` (TypeScript-enforced).
- **Hover / Focus:** the sweep triggers on both `:hover` and `:focus-visible` identically, so keyboard users get the same feedback as pointer users; the focus ring still renders on top.
- **Disabled:** 50% opacity, pointer-events removed.

### Chips / Tags
- **Default:** lime fill, dark text, 4px radius (sharp relative to everything else in the system — deliberately the one non-pill, non-16px+ shape).
- **Dark variant ("cc-blue"):** dark-ground fill, white text, same 4px radius.
- **Ghost-lime pill:** lime-tinted border and 10%-opacity lime fill, full pill radius, lime text — used for skill/tech tags rather than category labels.

### Cards / Containers
- **Corner style:** 20px radius (`rounded-lg`), overflow-hidden.
- **Background:** card navy (`#101B30`) by default; a muted variant uses the slate-fill neutral with a faint lime-tinted border for testimonial-style chassis.
- **Shadow strategy:** none — see Elevation & Depth. Depth comes entirely from the one-step-lighter background plus border.
- **Border:** 10%-opacity dark-navy border on the default tone; 5%-opacity lime border on the muted tone.
- **Internal padding:** slot-owned, not root-owned (the card root has no padding of its own); header/content/footer slots each carry 48px (`p-6` at this system's 8px step) except where a template opts a header into `bleed` (0px, for edge-to-edge imagery).

### Inputs / Fields
- **Style:** full pill radius, flat fill (card-navy background), no border at rest.
- **Focus:** a lime focus-visible ring with offset — a deliberate accessibility improvement over the pre-migration site, which shipped with zero focus styling on any input.
- **Error:** a red ring driven by the `aria-invalid` attribute, not a custom prop, so it composes with any form library.
- **Disabled:** 50% opacity, not-allowed cursor.

### Navigation
Fixed/sticky header on the dark ground color, with a mobile drawer (full-height panel sliding from the right) that uses the same subtle-border dividers as cards to separate its stacked link groups. Mega-menus and the mobile drawer both sit on the dark ground rather than switching to a light surface.

## Do's and Don'ts

### Do:
- **Do** treat lime as a rationed signal: one full-lime surface per page, small accents everywhere else.
- **Do** pair every lime fill with dark (`#060F1E`) text or icon glyphs, no exceptions.
- **Do** keep cards and containers shadowless; convey depth with a one-step-lighter background and a subtle border instead.
- **Do** restrict Source Serif 4 Italic to a single accent word or numeral, always lime, never a full line.
- **Do** trigger every hover treatment on both `:hover` and `:focus-visible` so keyboard users get parity with pointer users.
- **Do** keep every spacing and sizing value a multiple of the system's 8px step.

### Don't:
- **Don't** put lime text on a white or light background (1.16:1 contrast — fails outright).
- **Don't** put lime text on a lime background.
- **Don't** add a drop shadow to an ordinary card or surface; the lime CTA's glow is the one deliberate exception.
- **Don't** introduce teal or any hue outside the documented palette — the prior teal-era brand is fully retired.
- **Don't** use Source Serif 4 Italic for more than one word/numeral, or in any color but lime.
