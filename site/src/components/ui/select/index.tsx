'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { Icon } from '../icon'
import { cn } from '../_utils/cn'

// C3 Select — Radix-wrap (autonomous batch — Radix-wrap pattern locked at HALT 2 Accordion).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-checkbox-radio-textarea.mjs):
//
//   - CE has 1 native <select> on /for-developers (years-of-experience)
//     with a chassis distinct from C1 inputs: 1px solid #dbdbdb@40% border,
//     10.4px radius, 16px font, 38px height, color #101828.
//
//   - Migration improvement (per Decision D2): standardize C3 Select to the
//     C1 Input chassis (no border, 40px radius, 14px font, 44px height,
//     text-default color) for form-visual consistency. Templates render
//     consistent input chassis instead of two parallel form styles.
//
//   - Built atop @radix-ui/react-select for cross-browser custom dropdown
//     rendering + keyboard nav + a11y. Native <select> can't be styled
//     consistently across browsers (especially the dropdown panel).
//
//   - Controller-based rhf integration (Radix Select is controlled, not
//     uncontrolled). Pattern documented in C5 FormField. C1 Input + C2
//     Textarea + C4 Checkbox use register-based; C3 Select uses Controller
//     because the underlying Radix element exposes onValueChange (not the
//     standard onChange Form-event signature register expects).

// =============================================================================
// Root + Group/Value passthroughs (no styling — Radix handles)
// =============================================================================

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

// =============================================================================
// SelectTrigger — visible chassis matching C1 Input
// =============================================================================

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...rest }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Chassis matches C1 Input.
      'flex w-full items-center justify-between gap-2',
      'rounded-full bg-surface-elevated',
      'h-11 px-4 py-2.5',
      'text-body-sm font-normal text-text-default',
      'transition duration-reveal ease-reveal',
      // Placeholder via data-placeholder (Radix sets this when no value).
      'data-[placeholder]:text-text-default/60',
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
    {children}
    <SelectPrimitive.Icon asChild>
      <Icon
        name="chevron-right"
        size="sm"
        className="shrink-0 transition-transform duration-reveal ease-reveal data-[state=open]:rotate-90"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

// =============================================================================
// SelectContent — dropdown panel (portal-rendered)
// =============================================================================

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...rest }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        'relative z-50 min-w-[var(--radix-select-trigger-width)]',
        'overflow-hidden rounded-md border border-brand-tertiary/10 bg-surface-elevated',
        'shadow-elevated',
        // Animation hooks if needed (Radix sets data-state for entry/exit).
        'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        'transition-opacity duration-reveal ease-reveal',
        className,
      )}
      {...rest}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

// =============================================================================
// SelectItem — selectable option
// =============================================================================

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...rest }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center',
      'rounded-sm px-2 py-1.5',
      'text-body-sm text-text-default',
      'outline-none',
      'data-[highlighted]:bg-surface-base data-[highlighted]:text-brand-primary',
      'data-[state=checked]:font-medium',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'

// =============================================================================
// SelectSeparator — divider between items / groups
// =============================================================================

export const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...rest }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-brand-tertiary/10', className)}
    {...rest}
  />
))
SelectSeparator.displayName = 'SelectSeparator'

export default Select
