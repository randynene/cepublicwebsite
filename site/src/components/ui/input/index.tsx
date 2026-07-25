import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '../_utils/cn'

// C1 Input — text-input primitive (HALT 5 first-of-kind).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-input-styles.mjs):
//
//   - CE form architecture: Webflow + HubSpot hybrid. Native HTML
//     <input> elements styled by Webflow's `.w-input` / `.hs-form.hs-field`
//     classes that POST to HubSpot's API. NOT vendor-injected iframes
//     (those are C6 HubSpotFormEmbed scope at HALT 6).
//
//   - Universal CE input styling — verified across /contact, /book-a-call,
//     /for-developers, / (homepage footer):
//       padding:        10px 16px (vertical/horizontal)
//       border:         NONE (0px) — flat fill, no border
//       border-radius:  40px (= rounded-full at 44px height)
//       background:     #ffffff (text-default text)
//       font:           14px / weight 400 / line-height 20px (1.43)
//       height:         44px (matches WCAG 44×44 touch-target minimum)
//       placeholder:    #999999 (~text-text-default/60)
//
//   - Focus state: CE has ZERO focus styling — no outline, no border,
//     no shadow, no ring. Accessibility regression. Migration improvement
//     per Decision D2 — apply the locked focus-visible:ring pattern from
//     Button + Tag.
//
//   - Error state: CE shows form-level ("Oops! Something went wrong while
//     submitting") wrappers post-submission. NO per-field inline validation.
//     Migration improvement: aria-invalid + per-field error styling
//     (driven via attribute selector, no custom error prop).
//
//   - Variants observed (textarea, select, checkbox have distinct
//     chassis): C1 covers TEXT-LIKE inputs only (text/email/tel/password/
//     search/url/number). C2 Textarea / C3 Select / C4 Checkbox-Radio
//     have their own primitives.
//
//   - No CVA variant axis. Single styling chassis + state-attribute-driven
//     visual variation (focus-visible / aria-invalid / disabled).
//
// HALT 5 locked decisions (8 total):
//
//   1. react-hook-form integration: REGISTER-based. Native <input> is
//      uncontrolled; rhf's register('field') returns { ref, name,
//      onChange, onBlur } and forwardRef-spread is the canonical
//      integration. Controller-based pattern reserved for C3 Select
//      (Radix-controlled).
//
//   2. Error/aria wiring lives in C5 FormField, NOT C1 Input. Input is
//      intentionally dumb — pure styling + ref-forwarding. FormField is
//      the smart wrapper that composes Label + Input + ErrorMessage with
//      auto-generated ids and rhf integration.
//
//   3. Error message rendering: dedicated ErrorMessage primitive shipped
//      inline within c5/form-field/ — not a top-level UI inventory entry.
//
//   4. Label position: BLOCK above input (CE-matching, probe-verified).
//      Composed by C5 FormField, not Input itself.
//
//   5. Required indicator: visible <span aria-hidden> *</span> in label
//      (sighted users) + aria-required="true" on input (screen readers).
//      Migration improvement over CE's text-only `*` (sighted-only).
//      Composed by C5 FormField.
//
//   6. Focus ring: matches Button + Tag locked pattern. Migration
//      improvement over CE's zero focus styling.
//
//   7. Error state: triggered via aria-invalid="true" attribute selector.
//      Standard HTML attribute, no custom prop, works with rhf / manual /
//      any future form library.
//
//   8. Placeholder color: text-text-default/60 opacity-based approximation
//      of CE's #999. Acceptable token-coverage gap for this purely-visual
//      concern.

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        // Default chassis — probe-verified universal CE inputs.
        'block w-full rounded-full bg-surface-elevated',
        'h-11 px-4 py-2.5',                            // 44px height; 16px h-pad / 10px v-pad
        'text-body-sm font-normal text-text-default',
        'placeholder:text-text-default/60',
        // Transitions for state changes.
        'transition duration-reveal ease-reveal',
        // Focus ring (migration improvement — CE has none).
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        // Error styling — driven by aria-invalid attribute selector.
        // FormField sets aria-invalid from rhf error state; manual usage
        // sets it directly. No custom `error` prop.
        'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error aria-[invalid=true]:ring-offset-2',
        // Disabled
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    />
  ),
)
Input.displayName = 'Input'

export default Input
