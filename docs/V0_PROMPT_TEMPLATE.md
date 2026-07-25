# V0.dev Prompt Template — Mygratr CE Migration

> Standardised prompt structure for every simple TEMPLATE-* phase
> (BLOG, TEAM_MEMBER, REVIEW, VIDEO, BOOK_A_CALL, DOWNLOAD, …).
>
> **DO NOT use v0.dev for Tier-1 complex components.** Those go through
> hand-coded specs in `docs/design/components/{slug}.md` and are
> implemented at the relevant TEMPLATE-* phase, not generated.
>
> Locked at MYGRATR-DESIGN-1 Brief A §5.1. Worked examples for the
> simpler templates live in `docs/templates/_examples/`.

---

## How to use this template

1. Copy this file into a working scratchpad for the template you're
   building (do NOT modify the canonical template here).
2. Sections 1, 2, 5, and 6 are pasted as-is — they describe constraints
   and primitives that apply to every template.
3. Sections 3 and 4 are filled in per template — visual reference (live
   URL + screenshots + field-to-UI map) and Sanity data shape (Zod
   schema for the document type).
4. Paste the completed prompt into v0.dev and review the output against
   Section 5's constraints before pasting into the codebase.

---

## Section 1 — Design system constraints

> Source of truth: `docs/design/TOKENS.md`. Tailwind v4 namespace-driven
> utility generation; Tailwind classes ONLY — no inline styles, no
> arbitrary values for tokens already in scale.

### Colors

- Brand: `bg-brand-primary` (#1c787c teal), `bg-brand-secondary`
  (#dff46e lime), `bg-brand-tertiary` (#223c6c navy)
- Text: `text-text-default` (#212121), `text-text-on-dark` (#ffffff),
  `text-text-link` (alias of brand-primary)
- Surfaces: `bg-surface-base` (#f9f9f9), `bg-surface-elevated`
  (#ffffff), `bg-surface-overlay` (rgba white 0.1),
  `bg-surface-tint-brand` (rgba teal 0.05)
- Semantic: `text-error` / `bg-error` (#bd0000), `text-success` /
  `bg-success` (#16a34a), `text-warning` / `bg-warning` (#d97706)
- Focus ring: `ring-ring` (alias of brand-primary, paired with
  `ring-2 ring-offset-2`)

### Typography

- Font: `font-base` (Poppins via `next/font/google`, configured at
  `site/src/app/layout.tsx`)
- Weights: `font-normal` (400), `font-medium` (500), `font-semibold`
  (600). No other weights used.
- Type scale (mobile-first; lg: prefix at ≥992px):
  - `text-h1` 48px (lg: same)
  - `text-h2` 32px → `lg:text-h2-desktop` 40px
  - `text-h4` 24px (single size)
  - `text-h5` / `text-eyebrow` 18px (alias)
  - `text-display-mobile` 38px → `md:text-display-tablet` 45px →
    `lg:text-display` 60px (CTA-only)
  - `text-body` 16px (default)
  - `text-body-sm` 14px (captions, helper text)
  - `text-body-lead` 18px
  - `text-body-large` 20px (testimonial body)
- Line heights: `leading-tight` (1.07 — h1), `leading-snug` (1.16 —
  h2), `leading-relaxed` (1.20 — h4), `leading-default` (1.50 —
  body, links). **Prefer `leading-default` over Tailwind's
  `leading-normal` for source-attribution clarity.**

### Spacing

`--spacing` is `0.5rem` (8px). Tailwind utilities resolve as
`calc(var(--spacing) * N)`. Common values: `p-1` (8), `p-2` (16),
`p-3` (24), `p-5` (40), `p-10` (80). Do NOT use arbitrary spacing
values (`p-[12px]`) — surface to Jake if a real need arises.

### Radii

`rounded-xs` (4) / `rounded-sm` (12) / `rounded-md` (16) /
`rounded-lg` (24) / `rounded-xl` (40) / `rounded-2xl` (80) /
`rounded-3xl` (160) / `rounded-pill` (9999px) /
`rounded-button` (alias of pill) / `rounded-circle` (50%).

### Shadows

`shadow-elevated` is the only shadow CE uses. No tier-2/3/4 shadows
defined — surface to Jake if needed (Hard Rule #2 gate).

### Motion

- `duration-reveal` (500ms), `duration-hero` (1500ms)
- `ease-reveal` (cubic-bezier 0.165, 0.84, 0.44, 1 — power2.out
  approximation), `ease-accordion` (cubic-bezier 0.645, 0.045, 0.355, 1
  — power3.inOut approximation)
- For GSAP-driven animations (Tier-1 components, NOT v0.dev scope),
  read `--motion-*` source-of-truth tokens via `getComputedStyle`.

### Breakpoints

Mobile-first `min-width` queries: `sm:` ≥480px, `md:` ≥768px, `lg:`
≥992px, `xl:` ≥1280px. **Note:** `sm` and `lg` are CE-tuned overrides
of Tailwind v4 defaults (640 / 1024).

---

## Section 2 — Primitive components available

> You MUST use these primitives, imported from `@/components/ui/`.
> Source of truth: `docs/design/COMPONENTS.md`. Storybook visual
> reference: <https://mygratr-cloud-employee-storybook.vercel.app>
> (Vercel Standard Deployment Protection — sign in to view).

**DO NOT invent new primitives.** If a UI need isn't covered by the
available primitives below, halt and surface to Jake.

### Foundation

```tsx
import { Button } from '@/components/ui/button'
// variant: 'primary-teal' | 'primary-yellow' | 'primary-navy' | 'icon-only'
// size: 'sm' | 'md' | 'lg'  ·  loading?: boolean
// 'icon-only' REQUIRES aria-label (TS-enforced)

import { Link } from '@/components/ui/link'
// tone: 'default' | 'cc-blue' | 'cc-white'  ·  external?: boolean
// Renders via next/link

import { Tag } from '@/components/ui/tag'
// tone: 'default' (yellow) | 'cc-blue' (navy)
// href absent → renders <span>; href present → renders <a> via next/link

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
// tone: 'default' | 'muted'  ·  as: 'div' | 'article' | 'section' | 'li' | 'figure'
// CardHeader bleed?: boolean — opt-in for edge-to-edge media

import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion'
// type: 'single' | 'multiple'  ·  collapsible?: boolean
// Built on @radix-ui/react-accordion

import { Marquee } from '@/components/ui/marquee'
// direction: 'left' | 'right' | 'up' | 'down'
// speed: 'slow' | 'normal' | 'fast'  ·  pauseOnHover?: boolean (default true)
```

### Typography

```tsx
import { Heading } from '@/components/ui/heading'
// as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p' (required)
// size: 'display' | 'h1' | 'h2' | 'h4' | 'eyebrow' (defaults via as)
// h3 size variant intentionally absent — `as="h3"` defaults to size="h2"

import { Text } from '@/components/ui/text'
// as: 'p' | 'span' | 'div' | 'em' | 'strong' (default 'p')
// size: 'small' | 'default' | 'lead' | 'large' (default 'default')

import { PortableText } from '@/components/ui/portable-text'
// value: PortableTextBlock[] — Sanity body content
// Default renderers cover normal/h2/h3/h4/blockquote/lists/marks/link/image
// h3 hard-overridden to size="h4" visual to preserve editorial hierarchy
```

### Forms

```tsx
import { Input } from '@/components/ui/input'
// Passthrough InputHTMLAttributes; aria-invalid drives error styling
// 44px height, rounded-full, no border (focus-visible ring)

import { Textarea } from '@/components/ui/textarea'
// Passthrough TextareaHTMLAttributes; resize-y; 100px min-height

import {
  Select, SelectTrigger, SelectValue, SelectContent,
  SelectItem, SelectGroup, SelectSeparator,
} from '@/components/ui/select'
// Built on @radix-ui/react-select; Controller-based rhf integration
// Chassis matches Input

import { Checkbox } from '@/components/ui/checkbox'
// Built on @radix-ui/react-checkbox; supports checked: true | false | 'indeterminate'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
// Built on @radix-ui/react-radio-group; Controller-based rhf

import { FormField } from '@/components/ui/form-field'
// name + label + required + description + (single child input)
// Smart wrapper — auto id + aria + rhf error reading via FormProvider
// Use directly inside <FormProvider {...methods}>; falls through gracefully outside

import { HubSpotFormEmbed } from '@/components/ui/hubspot-form-embed'
// formId + portalId? + region? + fallbackEmail? + onSubmit?/onReady?/onError?
// Loading skeleton + 8s timeout + mailto fallback
```

### Overlays

```tsx
import {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay,
  DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'
// Built on @radix-ui/react-dialog; built-in close (×) at top-right

import {
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip'
// TooltipProvider wraps at layout root (delayDuration={300})

import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'

import {
  Toast, ToastProvider, ToastViewport,
  ToastTitle, ToastDescription, ToastAction, ToastClose,
} from '@/components/ui/toast'
// tone: 'default' | 'success' | 'warning' | 'error'
// ToastProvider + ToastViewport wrap at layout root
```

### Media + Layout

```tsx
import { Image } from '@/components/ui/image'
// Discriminated: source (Sanity) XOR src (plain) ; width+height XOR fill
// alt REQUIRED at TS level (decorative = empty string)
// quality default 80; priority default false (opt-in for LCP)

import { VideoEmbed, parseVideoUrl } from '@/components/ui/video-embed'
// Discriminated: video (Sanity doc) XOR url (direct)
// mode: 'lite' (default — poster + click-to-play) | 'eager' (autoplay loops)
// Auto-detects YouTube vs Vimeo

import { Container } from '@/components/ui/container'
// width: 'narrow' (1100) | 'default' (1384 + responsive padding) | 'wide' (1440) | 'full'
// as: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer'

import { Divider } from '@/components/ui/divider'
// orientation: 'horizontal' (default — <hr>) | 'vertical' (<span role="separator">)

import { Icon } from '@/components/ui/icon'
// name: 'menu' | 'copy-link' | 'linkedin' | 'linkedin-filled' | 'x-twitter'
//     | 'facebook' | 'chevron-right' | 'close' | 'more-vertical'
// size: 'sm' (16) | 'md' (20) | 'lg' (24) | 'xl' (32)
// ariaLabel?: string — required for standalone icons; omit when decorative inside labelled parent
```

---

## Section 3 — Visual reference

> **Per-template fill-in.** Replace this section with the live URL,
> screenshots, and field-to-UI map for the specific template you're
> building.
>
> Each template has a REFERENCE doc at
> `docs/templates/{template-slug}/REFERENCE.md` containing the
> screenshot set + field-to-UI map. If the REFERENCE doc doesn't
> exist yet, capture screenshots first (conventions: 1440×900
> desktop, 768×1024 tablet, 375×667 mobile, 4–6 captures per
> template).

---

## Section 4 — Sanity data shape

> **Per-template fill-in.** Paste the Zod schema from
> `src/types/sanity/documents/{kebab-case}.ts` inline so v0.dev sees the
> actual field shape. See worked examples in `docs/templates/_examples/`.

```ts
// REPLACE this entire block with the real schema for your template,
// pasted from src/types/sanity/documents/{kebab-case}.ts.
//
// Example shape:
import { z } from 'zod'
import { SanityBaseDocumentSchema, /* …other shared imports */ } from '../shared'

export const PLACEHOLDER_REPLACE_ME_Schema = SanityBaseDocumentSchema.extend({
  _type: z.literal('replaceWithRealType'),
  // ... real fields go here
})
```

---

## Section 5 — Constraints

- **Tailwind classes only.** No inline `style={{...}}`. No CSS modules.
  No styled-components.
- **No third-party UI libraries.** No `lucide-react`, no `react-bootstrap`,
  no `chakra-ui`, no `MUI`, no `shadcn/ui` direct imports. Use the local
  primitives at `@/components/ui/` only — these are hand-built atop
  Radix where applicable, exposed via typed CVA props (no
  className-only variants).
- **No icon libraries.** Use `<Icon name="…">` from `@/components/ui/icon`.
  The 9 sprite icons are the inventory; surface to Jake if a new icon
  is needed.
- **Accessibility:**
  - Focus-visible rings on every interactive element (use the
    primitives — they ship the ring).
  - `aria-label` on icon-only buttons (Button TS-enforces this).
  - Semantic landmarks: `<main>`, `<article>`, `<nav>`, `<header>`,
    `<footer>` where appropriate. Use Container's `as` prop, Card's
    `as` prop.
  - Heading hierarchy: page-level `<h1>` exactly once; descend through
    h2/h3/h4 as content nests. Use Heading's `as` (semantic) decoupled
    from `size` (visual).
- **No hardcoded English marketing strings.** Page copy comes from
  Sanity. UI chrome strings (button labels, error messages, "Loading")
  must come from the `UI_STRINGS` enum (Step 6 ESLint rule will fail
  otherwise — v0.dev outputs must comply preemptively).
- **Locale-aware URL prefixing.** Render the URL prefix correctly per
  `data.locale` (`'default'` → root, `'uk'` → `/uk/` prefix). Use the
  locale helper from `@/lib/locale` rather than ad-hoc string concat.
- **SEO via `data.metaTitle` / `data.metaDescription` / `data.openGraphImage`** —
  never hardcoded. Render through Next.js `generateMetadata()` (App
  Router) or page-level `<Head>`. Source: `MetaFieldsSchema` /
  `MetaFieldsNoOgSchema` from `src/types/sanity/shared`.
- **Image discipline.** Use `<Image>` from `@/components/ui/image`,
  not raw `<img>` or `next/image` directly. Pass `source={...}` for
  Sanity assets; `priority` opt-in only for LCP candidates (typically
  the first above-the-fold image).
- **Reduced motion.** If the template includes animation, gate via
  `useReducedMotion()` or `prefers-reduced-motion: reduce` media query.
  Mandatory per Step-3 brief §3 Hard Rules.

---

## Section 6 — Output format

Produce a **single TSX file** ready to paste into:

```
site/src/components/templates/{template-slug}/index.tsx
```

(kebab-case slug; matches `TIER_1_INVENTORY.md` and
`docs/templates/{template-slug}/REFERENCE.md` conventions.)

### File structure

```tsx
// 1. Imports — order: next/* first, then react, then @/components/ui,
//    then @/lib/sanity, then types from @/types/sanity, then local utils.
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
// …other primitives
import type { /* DocType */ } from '@/types/sanity/documents/{kebab-case}'

// 2. GROQ query — co-located with the component that consumes it.
const TEMPLATE_QUERY = /* groq */ `*[_type == "{type}" && slug.current == $slug][0]{
  // projection
}`

// 3. generateMetadata — reads metaTitle / metaDescription from Sanity.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await sanityFetch({ query: TEMPLATE_QUERY, params: { slug: params.slug } })
  if (!data) return {}
  return {
    title: data.metaTitle ?? data.title,
    description: data.metaDescription,
    // openGraph, alternates, etc.
  }
}

// 4. Async server component — renders the template.
export default async function Template({ params }: { params: { slug: string } }) {
  const data = await sanityFetch({ query: TEMPLATE_QUERY, params: { slug: params.slug } })
  if (!data) notFound()

  return (
    <Container as="main" width="default">
      {/* …render */}
    </Container>
  )
}
```

### Conventions

- **Async server component by default.** Mark `'use client'` only when
  the file uses hooks, event handlers, or browser APIs. Most simple
  templates render server-side.
- **`sanityFetch` from `@/lib/sanity/live`** — one canonical client per
  the SCAFFOLD-1 / DESIGN-1 §8 collapsed-client architecture. Do NOT
  import `createClient` directly. Visual Editing wires through this
  fetch helper at Step 8.
- **`notFound()` for missing slugs.** Renders Next.js's 404; do not
  fall through to an empty page.
- **No top-level data parsing.** If you need to validate Sanity data
  with Zod, do it inside the component or in a helper. Do not put
  `Schema.parse()` at module top level (it throws at module load and
  breaks Storybook bundles per BvR #8).
- **No hand-written CSS.** Only Tailwind classes from Section 1.

---

*End of V0_PROMPT_TEMPLATE.md v1.0 (locked at MYGRATR-DESIGN-1 Brief A §5.1).*
