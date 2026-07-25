# COMPONENTS.md — Mygratr Design System Primitive Inventory

> Single source of truth for Step 4 (TEMPLATE-*) authors. One entry per
> primitive with path, type, deps, variants, migration improvement, usage,
> notes. Front-matter sections cover layout-root requirements, form
> integration patterns, Sanity-data shapes, PortableText handoffs, icon
> sprite reference, and token quick-lookup.
>
> All 22 inventory primitives + Icon system, shipped at MYGRATR-DESIGN-1
> Step 2 close. 25 source files (C4 splits into Checkbox + RadioGroup).
>
> Per-primitive source comments document probe-driven decisions and
> capability-log items. This file is the index; consult `index.tsx`
> source for full rationale.

---

## Front-matter — required template-author setup

### 1. Layout-root providers

`TooltipProvider` (D2) and `ToastProvider` (D4) MUST wrap at the app
layout root for those primitives to function. Render once.

```tsx
// site/src/app/layout.tsx
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ToastProvider>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}
```

`delayDuration={300}` overrides Radix's 700ms default (sluggish for
modern UX). `ToastViewport` renders the actual toast stack at the
bottom-right (positioned absolutely; no layout impact).

### 2. Form integration — react-hook-form + zod

C1 / C2 / C4 use **register-based** rhf integration; C3 Select uses
**Controller-based** (Radix Select is controlled). C5 FormField is
the smart wrapper that auto-handles ids + aria + error reading.

**Single Input usage** (search bars, inline filters — no FormField):

```tsx
'use client'
const { register } = useForm()
return <Input type="email" {...register('email')} />
```

**Form composition** (typical case — use FormField):

```tsx
'use client'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
  experience: z.string().min(1),
})

export function ContactForm() {
  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <FormField name="email" label="Email" required>
          <Input type="email" />
        </FormField>
        <FormField name="message" label="Message" required>
          <Textarea />
        </FormField>
        {/* Select uses Controller via FormField passthrough */}
        <FormField name="experience" label="Experience">
          <Controller
            control={methods.control}
            name="experience"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2">0–2 years</SelectItem>
                  <SelectItem value="3-5">3–5 years</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  )
}
```

`FormField` reads errors from `useFormContext()` automatically and
wires `aria-invalid` + `aria-describedby` + `aria-required` on the
child input. ErrorMessage renders below input when field errors.

### 3. Sanity image source shape

E1 Image and E2 VideoEmbed (`poster` prop) accept the standard
Sanity image source object:

```ts
interface SanityImageSource {
  asset?: { _ref?: string; _type?: string } | null
  alt?: string | null
  hotspot?: { x: number; y: number; height?: number; width?: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}
```

GROQ projection example:

```groq
*[_type == "blogPost" && slug.current == $slug][0]{
  ...,
  thumbnailImage{
    asset->,
    alt,
    hotspot,
    crop,
  },
}
```

Hotspot/crop honored automatically by `@sanity/image-url`. Templates
pass `source={post.thumbnailImage}` to E1 Image; never construct URLs
manually.

### 4. PortableText handoff

B3 PortableText routes inline image blocks through E1 Image
(`types.image` renderer). Templates rendering Sanity body content
use B3 directly:

```tsx
<PortableText value={post.content} />
```

Override hatch — partial deep-merge for per-template renderer
overrides:

```tsx
<PortableText
  value={post.content}
  components={{
    block: {
      // override only the normal-paragraph renderer; defaults fill the rest
      normal: ({ children }) => <Text as="p" size="lead">{children}</Text>,
    },
  }}
/>
```

`<h3>` blocks render at `<Heading as="h3" size="h4">` (24px) per
HALT 4 Decision 6 — preserves editorial hierarchy that CE's flat
40px-or-40px treatment would collapse.

### 5. Icon sprite

9 CE-brand icons in `site/src/components/ui/_icons/sprite.svg`:

| Name | Use |
|---|---|
| `menu` | Mobile nav hamburger |
| `copy-link` | Share / copy link UI |
| `linkedin`, `linkedin-filled` | Social outlinks (filled variant for solid backgrounds) |
| `x-twitter` | Social outlink |
| `facebook` | Social outlink |
| `chevron-right` | Accordion open-state, Dropdown sub-trigger, Select trigger (rotates 90° on open) |
| `close` | Dialog/Toast close button |
| `more-vertical` | Action-menu trigger |

Adding a new icon:

1. Drop SVG into `audit-output/design-1/icon-classification.json` with classification
2. Run `node scripts/design/build-icon-sprite.mjs`
3. Auto-regenerates `_icons/sprite.svg` + `_icons/icon-names.ts`
4. Type-narrowed `IconName` union picks up the new name

### 6. Token quick-lookup

Common tokens used across primitives:

| Token | Value | Used by |
|---|---|---|
| `--font-poppins` | next/font Google import | base body font |
| `--text-body` | 16px | body, links |
| `--text-body-sm` | 14px | C1 Input, errors, captions |
| `--text-body-lead` | 18px | B2 Text `lead` size |
| `--text-body-large` | 20px | B2 Text `large` size (testimonials) |
| `--text-h1`/`-desktop` | 48px | B1 Heading `h1` |
| `--text-h2`/`-desktop` | 32 / 40px | B1 Heading `h2` cascade |
| `--text-h4` | 24px | B1 Heading `h4`, blockquote |
| `--text-h5` / `--text-eyebrow` | 18px | h5 / eyebrow alias |
| `--text-display`/`-tablet`/`-mobile` | 60 / 45 / 38px | B1 Heading `display` (CTA) |
| `--color-brand-primary` | `#1c787c` | Buttons, links, focus rings |
| `--color-brand-secondary` | `#dff46e` | Yellow CTAs, Tags default |
| `--color-brand-tertiary` | `#223c6c` | Navy text, borders @10% |
| `--color-text-default` | `#212121` | Body text |
| `--color-text-on-dark` | `#ffffff` | Text on dark surfaces |
| `--color-surface-base` | `#f9f9f9` | Muted card |
| `--color-surface-elevated` | `#ffffff` | Default card, inputs |
| `--color-error` | `#bd0000` | Form errors, error toast |
| `--color-success` | `#16a34a` | Success toast |
| `--color-warning` | `#d97706` | Warning toast |
| `--color-ring` | alias of brand-primary | Focus rings universal |
| `--radius-md` | 16px | Inputs, small cards |
| `--radius-lg` | 24px | Default card |
| `--radius-pill` / `--radius-button` | 9999px | Buttons, Inputs (`rounded-full`) |
| `--duration-reveal` / `--ease-reveal` | 500ms / power2.out | Hover transitions, animations |
| `--ease-accordion` | power3.inOut | Accordion content height |

Animations + keyframes — `--animate-accordion-down/-up` (Radix-driven),
`@keyframes marquee-x/-y` (top-level for A6 Marquee).

---

# Primitive inventory

## Category A — Foundation

### A1 Button (`button/`)

**Path:** `site/src/components/ui/button/index.tsx`
**Type:** server (no `'use client'`)
**External deps:** none (hand-built)
**Variants:** `variant` (4: primary-teal / primary-yellow / primary-navy / icon-only) × `size` (3: sm / md / lg) + `loading` (boolean)
**Migration improvement vs CE:** focus-visible ring (CE has none); type defaults to `'button'` (avoids submit-on-enter); discriminated-union enforces `aria-label` on icon-only

```tsx
<Button variant="primary-teal" size="md">Schedule a Call</Button>
<Button variant="icon-only" size="sm" aria-label="Share">
  <Icon name="copy-link" size="sm" />
</Button>
<Button loading>Submitting…</Button>
```

**Notes:** `icon-only` requires `aria-label` (TS-enforced). `loading` sets `aria-busy` + disables pointer events. Default `type="button"` (override to `"submit"` for form submit buttons).

### A2 Link (`link/`)

**Path:** `site/src/components/ui/link/index.tsx`
**Type:** server
**External deps:** `next/link`
**Variants:** `tone` (3: default / cc-blue / cc-white)
**Migration improvement vs CE:** focus ring; explicit `external` prop sets target+rel safely

```tsx
<Link href="/services">Our services</Link>
<Link href="https://anthropic.com" external>External</Link>
<Link href="/about" tone="cc-white">On dark surface</Link>
```

**Notes:** Always renders via `next/link` for client-side nav. Set `external` to opt into `target="_blank" rel="noopener noreferrer"` (no auto-detect — consumer knows context). `children` required (no icon-only — use Button + Icon for those).

### A3 Tag (`tag/`)

**Path:** `site/src/components/ui/tag/index.tsx`
**Type:** server
**External deps:** `next/link` (when routable)
**Variants:** `tone` (2: default yellow / cc-blue navy) × discriminated `href` (decorative `<span>` vs routable `<a>`)
**Migration improvement vs CE:** routable mode (CE renders decorative `<div>` — Tag with `href` becomes anchor for canonical IA + SEO + AEO; per Decision D2)

```tsx
<Tag>Hiring Tips</Tag>                                {/* span — decorative */}
<Tag href="/blog/category/hiring-tips">Hiring Tips</Tag>  {/* anchor — routable */}
<Tag tone="cc-blue" href="/scaling-teams">Scaling Teams</Tag>
```

**Notes:** Discriminated union: `href` presence narrows to anchor mode (auto-applies hover + focus ring). cc-yellow variant DROPPED — probe found 0 instances on CE.

### A4 Card (`card/`)

**Path:** `site/src/components/ui/card/index.tsx`
**Type:** server
**External deps:** none
**Variants:** `tone` (2: default white-bordered / muted gray-bordered) × polymorphic `as` (5: div/article/section/li/figure)
**Migration improvement vs CE:** padding-on-slots (not root) for cleaner composition; `overflow-hidden` defensive

```tsx
<Card tone="default" as="article">
  <CardHeader bleed>
    <Image source={post.thumbnailImage} alt="" fill sizes="(min-width:768px)400px,100vw" />
  </CardHeader>
  <CardContent>
    <Heading as="h3" size="h4">{post.title}</Heading>
    <Text>{post.excerpt}</Text>
  </CardContent>
  <CardFooter>
    <Link href={`/blog/${post.slug}`}>Read more</Link>
  </CardFooter>
</Card>
```

**Notes:** Single root CVA; per-slot CVA only when template work surfaces real divergence. Whole-card-clickability lives at template via `<Link><Card/></Link>`. CardHeader `bleed` prop opts into edge-to-edge media (default: padded).

### A5 Accordion (`accordion/`)

**Path:** `site/src/components/ui/accordion/index.tsx`
**Type:** client (`'use client'`)
**External deps:** `@radix-ui/react-accordion`
**Variants:** none (single visual variant — white + 16px radius + navy@10% top-border)
**Migration improvement vs CE:** semantic `<button>` trigger (CE uses `<div>`); chevron rotation (CE uses plus/minus toggle — Webflow component template artifact); modern accordion convention

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="q-1">
    <AccordionTrigger>How do you manage time zones?</AccordionTrigger>
    <AccordionContent>
      We align our working hours with your time zone…
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Notes:** `type="single" collapsible` for FAQ-style; `type="multiple"` for nested expansion. Default state: all collapsed (matches CE 0/10 open-on-load).

### A6 Marquee (`marquee/`)

**Path:** `site/src/components/ui/marquee/index.tsx`
**Type:** server (CSS-only animation; pause-on-hover via `:hover`)
**External deps:** none (CSS keyframes — NOT Swiper despite brief assumption; DEV-25 caught Swiper miss separately for E2)
**Variants:** `direction` (4: left/right/up/down) × `speed` (3: slow=120s / normal=60s / fast=30s) + `pauseOnHover` (boolean, default true)
**Migration improvement vs CE:** `pauseOnHover` default true (vestibular-disorder a11y; CE inconsistent 3/10)

```tsx
<Marquee direction="left" speed="normal" pauseOnHover>
  {customerLogos.map((logo) => (
    <img key={logo.id} src={logo.url} alt={logo.alt} className="h-12" />
  ))}
</Marquee>
```

**Notes:** Children rendered twice for seamless loop (second set `aria-hidden`). Pure CSS keyframes — zero JS bundle impact. `--marquee-duration` CSS var injected via inline style per `speed`.

---

## Category B — Typography

### B1 Heading (`heading/`)

**Path:** `site/src/components/ui/heading/index.tsx`
**Type:** server
**External deps:** none
**Variants:** `size` (5: display / h1 / h2 / h4 / eyebrow) × polymorphic `as` (8: h1-h6 / span / p)
**Migration improvement vs CE:** decoupled `as` (semantic) from `size` (visual) mirroring CE's `u-h*` utility-class pattern; encapsulated responsive cascade

```tsx
<Heading as="h1" size="display">Hero text</Heading>     {/* homepage hero */}
<Heading as="h1">Page title</Heading>                    {/* size defaults to 'h1' */}
<Heading as="h2">Section title</Heading>
<Heading as="h6" size="h4">Card title</Heading>          {/* semantic h6, visual h4 */}
<Heading as="span" size="eyebrow">CATEGORY</Heading>     {/* non-heading semantic */}
```

**Notes:** `as="h3"` defaults to `size="h2"` (closest visual neighbor — h3 30px outlier dropped per HALT 3 Q3). Cascade encapsulated in CVA — consumer doesn't write breakpoint prefixes.

### B2 Text (`text/`)

**Path:** `site/src/components/ui/text/index.tsx`
**Type:** server
**External deps:** none
**Variants:** `size` (4: small=14px / default=16px / lead=18px / large=20px) × polymorphic `as` (5: p / span / div / em / strong)
**Migration improvement vs CE:** none (visual match)

```tsx
<Text>Body copy.</Text>                              {/* size=default, as=p */}
<Text size="small">Caption text</Text>
<Text size="lead">Intro paragraph.</Text>
<Text size="large">Testimonial body.</Text>
<Text as="span">Inline body</Text>
```

**Notes:** `as` defaults to `'p'` (verbose `<Text as="p">` rejected). Color via className (no tone axis — surface tone is template-level).

### B3 PortableText (`portable-text/`)

**Path:** `site/src/components/ui/portable-text/index.tsx`
**Type:** server
**External deps:** `@portabletext/react`, `@sanity/image-url` (via E1)
**Variants:** none (Sanity-data renderer)
**Migration improvement vs CE:** h3 → size=h4 hard-override preserves editorial hierarchy that CE's flat 40-or-40 collapses; semantic `<button>` triggers in lists; LCP-correct images via E1

```tsx
<PortableText value={post.content} />
<PortableText
  value={post.content}
  components={{ block: { normal: ({ children }) => <Text as="p" size="lead">{children}</Text> } }}
/>
```

**Notes:** Block-style mapping: normal→Text/p, h2/h3/h4→Heading, blockquote→styled `<blockquote>`. Lists render as `<ul>`/`<ol>` with className-styled `<li>` (no Text wrapper). Marks: strong/em/code/underline/strike-through. Annotations: link → A2 Link. Image type → E1 Image (resolved at HALT 7). videoEmbed handler — wraps VideoEmbed primitive (E2) in `<figure>`, eager mode, supports caption from `<figcaption>` (CONTENT-1E). table handler — renders semantic HTML `<table>` with `bg-brand-tertiary` header (locked Option α), `boldFirstColumn` flag honors Webflow `.bold-col-one` class (86% of CE tables per CONTENT-1E sweep). Unknown handlers warn in dev + graceful fallback in prod.

---

## Category C — Forms

### C1 Input (`input/`)

**Path:** `site/src/components/ui/input/index.tsx`
**Type:** server
**External deps:** none
**Variants:** none (single chassis)
**Migration improvement vs CE:** focus ring (CE has none); aria-invalid attribute selector for error state; explicit `type='text'` default

```tsx
<Input type="email" placeholder="Your email…" />
<Input {...register('email')} aria-invalid={!!errors.email} />
```

**Notes:** Dumb primitive — pure styling + ref-forwarding. Error/aria wiring lives in C5 FormField. Use directly for inline filters / search bars without form-wrapper overhead.

### C2 Textarea (`textarea/`)

**Path:** `site/src/components/ui/textarea/index.tsx`
**Type:** server
**External deps:** none
**Variants:** none (single chassis matching C1's `.large` modifier)
**Migration improvement vs CE:** standardized to C1 chassis (CE has parallel chassis from different builders — visual consistency)

```tsx
<Textarea placeholder="Your message…" />
<Textarea {...register('message')} />
```

**Notes:** 100px min-height, `resize-y` (vertical only — horizontal resize creates layout chaos). 20px radius (C1's `.large` modifier value).

### C3 Select (`select/`)

**Path:** `site/src/components/ui/select/index.tsx`
**Type:** client (`'use client'`)
**External deps:** `@radix-ui/react-select`
**Variants:** none
**Migration improvement vs CE:** standardized to C1 chassis (CE select has distinct 1px border / 38px height / 16px font); cross-browser custom dropdown rendering

```tsx
<Select onValueChange={setValue}>
  <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectItem value="0-1">0–1 years</SelectItem>
      <SelectItem value="2-5">2–5 years</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectItem value="5+">5+ years</SelectItem>
  </SelectContent>
</Select>
```

**Notes:** Controller-based rhf integration (Radix Select is controlled). `Select` / `SelectGroup` / `SelectValue` are direct passthroughs (no styling wrapper).

### C4a Checkbox (`checkbox/`)

**Path:** `site/src/components/ui/checkbox/index.tsx`
**Type:** client
**External deps:** `@radix-ui/react-checkbox`
**Variants:** none (square 20×20, brand-teal fill on checked)
**Migration improvement vs CE:** cross-browser custom rendering + indeterminate state + a11y (CE uses native checkbox + light Webflow custom CSS — looks inconsistent across browsers)

```tsx
<Checkbox checked={agreed} onCheckedChange={setAgreed} aria-label="I agree" />
```

**Notes:** Inline 12×12 SVG checkmark glyph using `currentColor`. Supports `checked={true | false | 'indeterminate'}`.

### C4b RadioGroup (`radio-group/`)

**Path:** `site/src/components/ui/radio-group/index.tsx`
**Type:** client
**External deps:** `@radix-ui/react-radio-group`
**Variants:** none (circular 20×20)
**Migration improvement vs CE:** zero CE source data (CE has no radios); modern accessible defaults (DEV-21)

```tsx
<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="a" id="r-a" />
    <label htmlFor="r-a">Option A</label>
  </div>
</RadioGroup>
```

**Notes:** Controller-based rhf integration like C3 Select.

### C5 FormField (`form-field/`)

**Path:** `site/src/components/ui/form-field/index.tsx`
**Type:** client (`useFormContext` + `useId` are hooks)
**External deps:** `react-hook-form`
**Variants:** none
**Migration improvement vs CE:** per-field validation + visible asterisk + `aria-required="true"` (CE has form-level errors only + sighted-only asterisk)

```tsx
<FormProvider {...methods}>
  <FormField name="email" label="Email" required description="Work email">
    <Input type="email" />
  </FormField>
</FormProvider>
```

**Notes:** Smart wrapper. Single child enforced via `Children.only`. Auto-generates id, wires aria-invalid + aria-describedby + aria-required, reads errors from rhf context. Falls through gracefully when no `<FormProvider>` (manual mode). Error message renders below input when `formState.errors[name]` exists.

### C6 HubSpotFormEmbed (`hubspot-form-embed/`)

**Path:** `site/src/components/ui/hubspot-form-embed/index.tsx`
**Type:** client (`'use client'`)
**External deps:** `next/script` (loads `js.hsforms.net/forms/embed/v2.js`)
**Variants:** none — props are config (formId / portalId / region / fallbackEmail / callbacks)
**Migration improvement vs CE:** chassis match to C1 forms; visible required asterisk styled `text-error`; loading skeleton + 8s timeout + mailto fallback

```tsx
<HubSpotFormEmbed
  formId="1578f9b5-fb43-4772-83df-79c51c120a92"
  region="na1"
  onSubmit={($form) => trackConversion($form)}
/>
```

**Notes:** `portalId` defaults to `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` env. `region` discriminated union `'na1' | 'eu1' | 'ap1'`. Multi-instance safe (next/script dedup + per-mount window.hbspt check). Style overrides target `.hs-form-field` / `.hs-input` / `.hs-button` / `.hs-error-msgs` / `.hs-form-required` (HubSpot Forms v2 stable class names). **Step-4 visual verification required** — overrides not probe-confirmed against real CE-rendered form (CE's lazy-load blocked headless probes).

---

## Category D — Overlays

### D1 Dialog (`dialog/`)

**Path:** `site/src/components/ui/dialog/index.tsx`
**Type:** client
**External deps:** `@radix-ui/react-dialog`
**Variants:** none (single visual — centered, max-w-lg, shadow-elevated)
**Migration improvement vs CE:** N/A (CE has no dialogs — uses Webflow modal system)

```tsx
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogTitle>Confirm action</DialogTitle>
    <DialogDescription>Are you sure?</DialogDescription>
    <div className="flex justify-end gap-2">
      <DialogClose asChild><Button variant="primary-yellow">Cancel</Button></DialogClose>
      <Button>Confirm</Button>
    </div>
  </DialogContent>
</Dialog>
```

**Notes:** Built-in Close button uses Button `variant="icon-only"` + `Icon name="close"`. Overlay 50% black backdrop with fade animation. Focus-trap via Radix.

### D2 Tooltip (`tooltip/`)

**Path:** `site/src/components/ui/tooltip/index.tsx`
**Type:** client
**External deps:** `@radix-ui/react-tooltip`
**Variants:** none
**Migration improvement vs CE:** delayDuration=300ms via Provider override (Radix default 700ms is sluggish)

```tsx
<Tooltip>
  <TooltipTrigger asChild><Button variant="icon-only" aria-label="Info"><Icon name="more-vertical" /></Button></TooltipTrigger>
  <TooltipContent>Helpful hint</TooltipContent>
</Tooltip>
```

**Notes:** TooltipProvider must wrap at layout root (front-matter §1).

### D3 DropdownMenu (`dropdown-menu/`)

**Path:** `site/src/components/ui/dropdown-menu/index.tsx`
**Type:** client
**External deps:** `@radix-ui/react-dropdown-menu`
**Variants:** none
**Migration improvement vs CE:** N/A

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>Menu</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Filters</DropdownMenuLabel>
    <DropdownMenuItem onSelect={...}>Item 1</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={x}>Toggle</DropdownMenuCheckboxItem>
    <DropdownMenuRadioGroup value={x}>
      <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

**Notes:** Item highlight pattern matches C3 Select (`data-[highlighted]:bg-surface-base`). SubTrigger styled with trailing chevron-right.

### D4 Toast (`toast/`)

**Path:** `site/src/components/ui/toast/index.tsx`
**Type:** client
**External deps:** `@radix-ui/react-toast`
**Variants:** `tone` (4: default / success / warning / error — left-border accent)
**Migration improvement vs CE:** N/A (CE has no toasts)

```tsx
<Toast tone="success" open>
  <ToastTitle>Saved</ToastTitle>
  <ToastDescription>Your changes are live.</ToastDescription>
  <ToastAction altText="Undo">Undo</ToastAction>
  <ToastClose />
</Toast>
```

**Notes:** ToastProvider + ToastViewport must wrap at layout root (front-matter §1). DEV-24 added `--color-success` + `--color-warning` tokens for tone variants. ToastViewport renders fixed bottom-right; flex-col-reverse so newest at bottom.

---

## Category E — Media + Layout

### E1 Image (`image/`)

**Path:** `site/src/components/ui/image/index.tsx`
**Type:** server (next/image is server-component-safe)
**External deps:** `next/image`, `@sanity/image-url`
**Variants:** discriminated `source` XOR `src` × `width`+`height` XOR `fill` × `priority` (boolean) + `quality` (default 80) + `placeholder` (`'empty'` | `'blur'`)
**Migration improvement vs CE:** quality upgrade (CE q≈60-65 → our q=80); LCP optimization via `priority`+`sizes`+`fetchpriority` (CE has none); next/image AVIF/WebP delivery

```tsx
{/* Sanity source — common case */}
<Image source={post.thumbnailImage} alt={post.title} width={1200} height={800}
       sizes="(min-width: 1024px) 33vw, 100vw" />

{/* Hero — opt into priority for LCP */}
<Image source={hero} alt="..." fill sizes="100vw" priority />

{/* External / public URL */}
<Image src="/logo.png" alt="..." width={200} height={50} />
```

**Notes:** `alt` required at TS level (decorative = empty string). Strict discriminated unions: source/src exclusive, intrinsic/fill exclusive. `priority={true}` on hero/LCP images only — defaults `false`. Hotspot/crop honored via image-url builder. parseSanityImageRef helper extracts intrinsic dims from `_ref` for fill-mode fallback.

### E2 VideoEmbed (`video-embed/`)

**Path:** `site/src/components/ui/video-embed/index.tsx`
**Type:** client (lite-mode swap state)
**External deps:** none (native iframes)
**Variants:** discriminated `video` XOR `url` × `mode` (`'lite'` default | `'eager'`) + `aspectRatio` (default `'16/9'`)
**Migration improvement vs CE:** lite-embed pattern (poster + click-to-play) saves ~500KB per video page (CE renders all iframes eagerly); LCP win for content-video pages; LinkedIn iframe support (CONTENT-1E) — eager mode only, no autoplay query param (LinkedIn ignores it); `LINKEDIN_ALLOW = 'fullscreen; clipboard-write; encrypted-media'`

```tsx
{/* Lite mode (user-initiated playback) */}
<VideoEmbed url="https://youtu.be/abc123" poster={video.backupImage} title="Demo" />

{/* Eager mode (ambient autoplay loops, hero backgrounds) */}
<VideoEmbed
  url="https://youtu.be/abc123?autoplay=1&mute=1&loop=1&playlist=abc123&controls=0"
  mode="eager"
  title="Hero loop"
/>

{/* Sanity doc shorthand */}
<VideoEmbed video={videoDoc} poster={videoDoc.backupImage} title={videoDoc.name} />
```

**Notes:** Provider auto-detect (Vimeo / YouTube / LinkedIn — DEV-25 caught brief's Vimeo-only assumption; CONTENT-1E added LinkedIn as 3rd provider via `parseVideoUrl` extension). YouTube domain: `youtube-nocookie.com/embed/` (privacy-respecting). LinkedIn pattern: `linkedin.com/embed/feed/update/urn:li:share:{id}` — input URL passed through unchanged (no autoplay query). Lite mode REQUIRES poster + title; eager mode requires title only. Poster routes through E1 Image.

### E3 Container (`container/`)

**Path:** `site/src/components/ui/container/index.tsx`
**Type:** server
**External deps:** none
**Variants:** `width` (4: default 1384px / wide 1440px / narrow 1100px / full no-max) × polymorphic `as` (6: div / section / article / main / header / footer)
**Migration improvement vs CE:** none (visual match)

```tsx
<Container>...</Container>                            {/* default 1384px + responsive padding */}
<Container width="wide" as="section">...</Container>  {/* 1440px hero */}
<Container width="narrow" as="article">...</Container> {/* 1100px article */}
<Container width="full">...</Container>               {/* full-bleed decorative bg */}
```

**Notes:** Default variant has `px-6 sm:px-8` cascade; other widths have no padding (matches CE). Grids stay OUT — compose `<Container><div className="grid grid-cols-3 gap-4">…</div></Container>` per layout.

### E4 Divider (`divider/`)

**Path:** `site/src/components/ui/divider/index.tsx`
**Type:** server
**External deps:** none
**Variants:** `orientation` (`'horizontal'` default | `'vertical'`)
**Migration improvement vs CE:** zero CE source data (CE uses no dividers); visual coherence with Card/Accordion border (`brand-tertiary/10`)

```tsx
<Divider />                                          {/* horizontal <hr> */}
<Divider orientation="vertical" className="h-4" />  {/* vertical inline span */}
```

**Notes:** Horizontal renders `<hr>` (implicit role+orientation). Vertical renders `<span role="separator" aria-orientation="vertical">`. Default 1px brand-tertiary/10 — override via className for thickness/color.

---

## Icon (sub-task)

### Icon (`icon/`)

**Path:** `site/src/components/ui/icon/index.tsx`
**Type:** server
**External deps:** none — references `_icons/sprite.svg`
**Variants:** `size` (4: sm 16px / md 20px / lg 24px / xl 32px)

```tsx
<Icon name="chevron-right" size="md" />
<Icon name="close" ariaLabel="Close" />   {/* standalone — needs aria-label */}
<Icon name="linkedin" size="sm" />        {/* decorative inside Link — no ariaLabel */}
```

**Notes:** `IconName` union type-narrows to the 9 sprite icons (front-matter §5). Adding new icons regenerates the union via build script. `ariaLabel` for standalone icons; omit when icon is decorative inside a labeled parent (Button + Link).

---

# Composition guidelines

Common patterns Step-4 templates will reach for:

**Card with image + heading + body + CTA**
```tsx
<Card as="article">
  <CardHeader bleed>
    <Image source={post.thumbnailImage} alt="" fill sizes="(min-width:768px)50vw,100vw" />
  </CardHeader>
  <CardContent>
    <Heading as="h3" size="h4">{post.title}</Heading>
    <Text size="small">{format(post.publishedAt, 'MMM d, yyyy')}</Text>
    <Text>{post.excerpt}</Text>
  </CardContent>
  <CardFooter>
    <Link href={`/blog/${post.slug.current}`}>Read more</Link>
  </CardFooter>
</Card>
```

**Heading-with-eyebrow section header**
```tsx
<Container>
  <Heading as="span" size="eyebrow">Customer Stories</Heading>
  <Heading as="h2">How Salmon Software scaled their team</Heading>
  <Text size="lead">Intro paragraph…</Text>
</Container>
```

**Form with toast on success**
```tsx
'use client'
const onSubmit = handleSubmit(async (data) => {
  await submitForm(data)
  // ToastProvider already wraps at layout — fire toast directly
  setToastOpen(true)
})
```

**FAQ section using Accordion**
```tsx
<Container width="narrow">
  <Heading as="h2">FAQs</Heading>
  <Accordion type="single" collapsible>
    {faqs.map((faq) => (
      <AccordionItem key={faq._key} value={faq._key}>
        <AccordionTrigger>{faq.question}</AccordionTrigger>
        <AccordionContent>
          <PortableText value={faq.answer} />
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
</Container>
```

---

## Locked-not-shipped items

Step-1 TOKENS.md §9 entries that did NOT become primitives:
- **Banner / SectionCTA** — 5× CE pattern (`cta-wrapper`, 80×48px padding, teal@5% bg). Reclassified out of A4 Card at HALT 2; deferred to Step-4 templates as a layout pattern (not a primitive).
- **Hero one-off** — 68.8px h1 on homepage (1× CE usage). Per variant-inventory threshold rule, lives at template via `<Heading as="h1" size="display" className="lg:text-7xl">`.
- **Single-instance values** (Tag cc-yellow / Card accent / Button tertiary-ghost / Heading h3 30px) — all dropped from primitive inventory; templates apply via className override if needed.

---

# STATIC-1 chrome components (post-DESIGN-1)

Composition-level components built atop the DESIGN-1 primitive inventory. Not themselves primitives — they compose primitives plus app-specific data (Sanity globals / hub singletons / blog posts). Documented here so future template phases can audit the chrome surface in one place.

| Component | Type | File | Purpose |
|---|---|---|---|
| Nav (Header) | server shell | `layout/nav.tsx` | Sticky header. Skip-link + logo + Container shell. Fetches `navigation` Sanity global, passes data to NavClient. `role="banner"` landmark, brand wordmark links to /. |
| NavClient | client island | `layout/nav-client.tsx` | All interactive nav surface. Desktop: hand-built Disclosure-pattern dropdowns (NOT Radix DropdownMenu — wrong ARIA semantics for site nav), proper `<nav><ul><li><a>` markup, `aria-haspopup` + `aria-expanded` + `aria-controls`, ArrowDown opens, Escape closes + focus returns. Mobile: Radix Dialog drawer (slide-from-right, full focus trap + scroll lock + Escape) with accordion sections for the 2 dropdowns. Locale switcher pathname-aware via `usePathname()`. Calendly CTA wired to canonical CE intro popup URL. |
| Footer | server | `layout/footer.tsx` | Dark-navy brand-tertiary surface. Newsletter section (C6 HubSpotFormEmbed) + 4 columns (each in `<nav aria-labelledby>`) + legal links row + copyright with `{year}` token substituted via `resolveCopyright()`. `role="contentinfo"` landmark, 5 ARIA labels. |
| BlogCard | server | `cards/blog-card.tsx` | For blogHub + 6 category hubs + compareHub. Image + category Tag (decorative, no href) + h3-wrapped single Link title + excerpt + date + author byline. Title-as-link semantics. |
| ResourceCard | server | `cards/resource-card.tsx` | For videosHub + toolsHub + downloadsHub + eventsHub. Image + type label (Video / Tool / Download / Event) + h3-wrapped single Link title + excerpt + event date when applicable. |
| CollectionCard | server | `cards/collection-card.tsx` | For servicesHub + technologyHub + customerStoriesHub + reviewsHub. Image + subline (companyName / position) + h3-wrapped single Link title (with trailing chevron-right icon affordance) + excerpt. |

**Card link semantics (locked)**: `<h3><Link>title</Link></h3>` single anchor per card. Image and body decorative; Tags use the Tag primitive's decorative (`<span>`) discriminated-union variant; no nested anchors; no JS-driven whole-card click handler. Same rule applies to any future card surface in TEMPLATE-* phases.

**Heading-order rule on hubs (locked)**: Hub pages render `<h1>` for the hub title and `<h3>` for card titles. To avoid Lighthouse `heading-order` failures, every hub MUST render an `<h2>` somewhere between (visible on blog hubs via `topicsHeader`; sr-only on collection hubs via the `renderHub` bridge added in Step 6).

---

*Last updated: MYGRATR-STATIC-1 close (May 2026). 22 inventory primitives + Icon system + 6 STATIC-1 chrome components. 24 DEV-N findings logged. Probe-first discipline universal.*
