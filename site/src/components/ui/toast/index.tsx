'use client'

import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { Icon } from '../icon'
import { cn } from '../_utils/cn'

// D4 Toast — Radix-wrap (Category D autonomous batch).
//
// Tone variant axis (default / success / warning / error) — first primitive
// in Step 2 to use all four semantic colours. DEV-24 added --color-success
// + --color-warning to tokens.css alongside the existing --color-error.
// No CE source data (CE has no toasts); modern accessible defaults applied.
//
// ToastProvider goes at the layout root once. Viewport renders toasts at
// fixed bottom-right with z-50 stacking. Each toast Root is dismissed on
// timeout or via Close action (Esc / click).

// =============================================================================
// Direct passthroughs
// =============================================================================

/**
 * Toast Provider — render once at the app/layout root.
 * `<ToastProvider><App /><ToastViewport /></ToastProvider>`
 */
export const ToastProvider = ToastPrimitive.Provider

// =============================================================================
// ToastViewport — fixed-position container for the toast stack
// =============================================================================

export const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...rest }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-50 flex max-h-screen w-full max-w-md flex-col-reverse',
      'gap-2 p-4',
      'sm:bottom-4 sm:right-4',
      className,
    )}
    {...rest}
  />
))
ToastViewport.displayName = 'ToastViewport'

// =============================================================================
// Toast Root — tone-driven left-border accent
// =============================================================================

const toastVariants = cva(
  [
    'pointer-events-auto relative flex w-full items-start gap-3',
    'rounded-lg border-l-4 bg-surface-elevated p-4 shadow-elevated',
    'transition-opacity duration-reveal ease-reveal',
    'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
  ],
  {
    variants: {
      tone: {
        default: 'border-l-brand-tertiary/40',
        success: 'border-l-success',
        warning: 'border-l-warning',
        error: 'border-l-error',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

export type ToastVariants = VariantProps<typeof toastVariants>

export const Toast = forwardRef<
  ElementRef<typeof ToastPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & ToastVariants
>(({ className, tone, ...rest }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ tone }), className)}
    {...rest}
  />
))
Toast.displayName = 'Toast'

// =============================================================================
// ToastTitle / ToastDescription
// =============================================================================

export const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...rest }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-body font-medium leading-snug text-text-default', className)}
    {...rest}
  />
))
ToastTitle.displayName = 'ToastTitle'

export const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...rest }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-body-sm leading-default text-text-default/80', className)}
    {...rest}
  />
))
ToastDescription.displayName = 'ToastDescription'

// =============================================================================
// ToastAction / ToastClose
// =============================================================================

export const ToastAction = forwardRef<
  ElementRef<typeof ToastPrimitive.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...rest }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center justify-center',
      'rounded-button bg-transparent px-3 py-1',
      'text-body-sm font-medium text-brand-primary',
      'transition duration-reveal ease-reveal hover:bg-brand-primary/10',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
      className,
    )}
    {...rest}
  />
))
ToastAction.displayName = 'ToastAction'

export const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...rest }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="Close"
    className={cn(
      'absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center',
      'rounded-button text-text-default/60',
      'transition-colors duration-reveal ease-reveal hover:text-text-default',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
      className,
    )}
    {...rest}
  >
    <Icon name="close" size="sm" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = 'ToastClose'

export default Toast
