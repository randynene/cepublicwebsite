'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { Button } from '../button'
import { Icon } from '../icon'
import { cn } from '../_utils/cn'

// D1 Dialog — Radix-wrap (Category D autonomous batch).
//
// Pattern locked at HALT 2 (A5 Accordion) + reused at C3 Select:
//   - 'use client' at top
//   - ElementRef + ComponentPropsWithoutRef typing
//   - forwardRef + displayName for OUR styled exports only
//   - Direct passthroughs (Root / Trigger / Portal) reuse Radix native typing
//
// Probe skipped per HALT 6 capability-log entry: "Probe-first applies to
// primitives whose brief inventory references CE source patterns. For
// primitives with no CE source patterns (D1 Dialog, D2 Tooltip, D3 Dropdown,
// D4 Toast — pure Radix wrappers; CE has no native dialogs/tooltips), build
// straight from Radix conventions." CE uses Webflow's modal system without
// inline native dialog markup.

// =============================================================================
// Direct passthroughs (no styling)
// =============================================================================

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

// =============================================================================
// DialogOverlay — backdrop with fade animation
// =============================================================================

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...rest }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-40 bg-bg-primary/70',
      'transition-opacity duration-reveal ease-reveal',
      'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
      className,
    )}
    {...rest}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

// =============================================================================
// DialogContent — centered panel with built-in Close button
// =============================================================================

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...rest }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-lg rounded-lg border border-brand-tertiary/10 bg-surface-elevated p-6 shadow-elevated',
        'flex flex-col gap-4',
        'transition-opacity duration-reveal ease-reveal',
        'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        // Focus ring (Radix manages focus-trap; this styles the panel
        // outline if anyone tabs the panel itself).
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        className,
      )}
      {...rest}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <Button
          variant="icon-only"
          size="sm"
          aria-label="Close"
          className="absolute right-4 top-4"
        >
          <Icon name="close" size="sm" />
        </Button>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

// =============================================================================
// DialogTitle / DialogDescription — semantic heading + supporting text
// =============================================================================

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...rest }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-h2 font-medium leading-snug text-text-default', className)}
    {...rest}
  />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...rest }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-body leading-default text-text-default/80', className)}
    {...rest}
  />
))
DialogDescription.displayName = 'DialogDescription'

export default Dialog
