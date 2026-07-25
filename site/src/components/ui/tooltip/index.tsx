'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '../_utils/cn'

// D2 Tooltip — Radix-wrap (Category D autonomous batch).
//
// Provider goes at the layout root once for the whole app. Export
// re-exposes Radix's Provider as `TooltipProvider` for layout-level wrap;
// individual <Tooltip> instances nest inside.
//
// delayDuration override: Radix default is 700ms (slow by modern UX
// standards). Setting 300ms via Provider's delayDuration prop at the
// app root gives tooltips a snappier feel. Individual Tooltip instances
// can override per-instance via Root's delayDuration prop.

// =============================================================================
// Direct passthroughs (no styling)
// =============================================================================

/**
 * Tooltip Provider — render once at the app/layout root.
 * `<TooltipProvider delayDuration={300}>{children}</TooltipProvider>`
 *
 * Defaulting to 300ms delay (Radix native default is 700ms which feels
 * sluggish in modern UI). Per-instance overrides via Root delayDuration.
 */
export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export const TooltipPortal = TooltipPrimitive.Portal

// =============================================================================
// TooltipContent — dark-on-light panel with fade animation
// =============================================================================

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...rest }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs rounded-md bg-surface-tertiary px-3 py-1.5',
        'text-body-sm leading-snug text-text-on-dark',
        'transition-opacity duration-reveal ease-reveal',
        'data-[state=delayed-open]:opacity-100 data-[state=closed]:opacity-0',
        className,
      )}
      {...rest}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = 'TooltipContent'

export default Tooltip
