'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '../_utils/cn'

// C4b RadioGroup — Radix-wrap (autonomous batch).
//
// Probe finding: ZERO native CE radio inputs across probed pages. CE has
// no radio-button surface in active forms — the closest analogue is the
// /for-developers checkbox-list (which is Multiple-select, not Single).
//
// Without CE-source variants to verify, this primitive ships against
// modern accessible defaults: Radix RadioGroup for cross-browser custom
// rendering, keyboard arrow-key navigation, single-selection enforcement.
//
// Visual chassis matches Checkbox shape but circular instead of square,
// with a smaller filled dot when selected. Same focus-ring + error-state
// + disabled patterns locked across the C-category.

// =============================================================================
// RadioGroup root — passthrough
// =============================================================================

export const RadioGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...rest }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-2', className)}
    {...rest}
  />
))
RadioGroup.displayName = 'RadioGroup'

// =============================================================================
// RadioGroupItem — single radio button
// =============================================================================

export const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...rest }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      // Circular chassis — 20×20.
      'inline-flex h-5 w-5 shrink-0 items-center justify-center',
      'rounded-full border border-brand-tertiary/30 bg-surface-elevated',
      'transition duration-reveal ease-reveal',
      // Checked state — brand-teal fill on the inner indicator dot.
      'data-[state=checked]:border-brand-primary',
      // Focus ring.
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
      // Error styling.
      'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error aria-[invalid=true]:ring-offset-2',
      // Disabled.
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...rest}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="block h-2.5 w-2.5 rounded-full bg-brand-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = 'RadioGroupItem'

export default RadioGroup
