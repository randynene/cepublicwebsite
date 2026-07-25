'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '../_utils/cn'

// C4a Checkbox — Radix-wrap (autonomous batch).
//
// Probe-driven decisions (Hard Rule #2):
//
//   - CE has 9 native checkboxes on /for-developers wrapped in Webflow's
//     `.w-checkbox` label container. The native input is kept visible
//     (display=block, opacity=1, position=static — no aggressive
//     hide-and-replace pattern). Webflow's `.w-checkbox-input` styling is
//     light: relies on the browser's native checkbox rendering with minor
//     CSS additions. No custom checkmark glyph captured by probe (::before
//     content="none", bg-image="none").
//
//   - Migration improvement (per Decision D2): use Radix Checkbox for
//     cross-browser custom rendering + keyboard nav + indeterminate state
//     + a11y. CE's reliance on native browser rendering looks inconsistent
//     across Chrome/Safari/Firefox; Radix unifies. Same Radix-wrap pattern
//     locked at HALT 2 (A5 Accordion) and shipped in C3 Select.
//
//   - Square shape (8px radius), 20px size — modern accessible defaults.
//     Brand teal fill when checked. White checkmark glyph via Radix's
//     CheckboxPrimitive.Indicator slot.
//
//   - Register-based rhf integration: native pattern via spread of
//     register('field'). Checkbox's onChange/onCheckedChange API works
//     with rhf's register because Radix Checkbox renders a hidden native
//     input under the hood.

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...rest }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Square chassis — 20×20.
      'inline-flex h-5 w-5 shrink-0 items-center justify-center',
      'rounded-xs border border-brand-tertiary/30 bg-surface-elevated',
      'transition duration-reveal ease-reveal',
      // Checked state — lime fill, dark glyph (spec §6: never white on lime).
      'data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:text-text-dark',
      // Indeterminate state — same fill, different glyph.
      'data-[state=indeterminate]:bg-brand-primary data-[state=indeterminate]:border-brand-primary data-[state=indeterminate]:text-text-dark',
      // Focus ring — same as Button + Input + Tag.
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
      // Error styling.
      'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error aria-[invalid=true]:ring-offset-2',
      // Disabled.
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...rest}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      {/* Inline checkmark SVG — sized to fit 20×20 box with comfortable padding.
          Stroke uses currentColor so data-[state=checked]:text-text-on-dark
          drives the glyph color. */}
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 6L5 9L10 3" />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = 'Checkbox'

export default Checkbox
