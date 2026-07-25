'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '../_utils/cn'

// A5 Accordion — wraps @radix-ui/react-accordion (HALT 2 batch — autonomous).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-accordion-marquee-styles.mjs):
//
//   - 10 .faq-item instances on /technology + 4 on /services. ALL
//     collapsed-by-default (open-on-load: 0/10) → defaultValue undefined;
//     consumer opts in.
//
//   - Single visual variant: white bg, 16px radius, 24px h-padding,
//     1px navy@10% top-border per item. No tone axis (variant-naming
//     meta-rule: skip when no variation observed).
//
//   - CE renders triggers as <div> (semantic regression). Migration
//     upgrade per Decision D2 — Radix renders semantic <button>, ships
//     full keyboard navigation, and exposes data-state for styling.
//     CE's existing aria-expanded is preserved through Radix's automatic
//     ARIA management.
//
//   - Single-open behavior: brief-implied + matches typical CE FAQ pattern.
//     Default `type='single'` + `collapsible=true` (re-click to close).
//     `type='multiple'` available for templates that need it.
//
//   - Animation: tokens.css now defines --animate-accordion-down /
//     --animate-accordion-up using --duration-reveal (500ms) +
//     --ease-accordion (power3.inOut approx — matches CE GSAP source).
//
//   - Toggle icon (D2 shape-edit, per the new-design FAQ reference): a
//     small, thin `+` glyph (two 1px lines, 16px wide) in muted
//     text-tertiary, NO background circle. Rotates 45° on open to form `×`.
//     bg-current ties the line colour to the icon span (muted by default,
//     lime on hover). Replaces the old teal-era black-circle `.faq-btn`
//     (#0e100f) which read far too heavy on the new dark ground.
//     Item numbering (lime 01-08) is optional and composed at the
//     consumer/template level, not baked into the primitive.

// =============================================================================
// Accordion root — type-prop passthrough to Radix
// =============================================================================

export const Accordion = forwardRef<
  ElementRef<typeof AccordionPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
>(({ className, ...rest }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-0', className)}
    {...rest}
  />
)) as typeof AccordionPrimitive.Root
Accordion.displayName = 'Accordion'

// =============================================================================
// AccordionItem — chassis (white + navy@10% top-border + 16px radius)
// =============================================================================

export const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...rest }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      // Continuous dark ground with thin dividers (new-design FAQ). Top
      // border on every item + a closing bottom border on the last.
      'border-t border-border-default last:border-b',
      className,
    )}
    {...rest}
  />
))
AccordionItem.displayName = 'AccordionItem'

// =============================================================================
// AccordionTrigger — semantic <button>, chevron rotates on open
// =============================================================================

export const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...rest }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex flex-1 items-center justify-between gap-4',
        'px-6 py-4',
        'text-left text-body font-medium leading-default text-text-default',
        'transition-colors duration-reveal ease-reveal',
        'hover:text-brand-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        className,
      )}
      {...rest}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-4 w-4 shrink-0 items-center justify-center',
          'text-text-tertiary group-hover:text-accent-primary',
          'transition-transform duration-reveal',
          'group-data-[state=open]:rotate-45',
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(.165,.84,.44,1)' }}
      >
        <span className="absolute h-px w-4 bg-current" />
        <span className="absolute h-px w-4 rotate-90 bg-current" />
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

// =============================================================================
// AccordionContent — height-keyframe animation via Radix CSS var
// =============================================================================

export const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...rest }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-body text-text-default',
      'data-[state=open]:animate-accordion-down',
      'data-[state=closed]:animate-accordion-up',
    )}
    {...rest}
  >
    <div className={cn('px-6 pb-6 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

export default Accordion
