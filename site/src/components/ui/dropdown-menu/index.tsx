'use client'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { Icon } from '../icon'
import { cn } from '../_utils/cn'

// D3 Dropdown — Radix-wrap (Category D autonomous batch).
//
// Most surface-area-heavy of Category D — covers Root, Trigger, Portal,
// Content, Item, Group, Label, Separator, CheckboxItem, RadioGroup,
// RadioItem. Highlight pattern matches C3 Select for cross-primitive
// consistency (data-[highlighted]:bg-surface-base data-[highlighted]:
// text-brand-primary).

// =============================================================================
// Direct passthroughs
// =============================================================================

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup
export const DropdownMenuSub = DropdownMenuPrimitive.Sub

// =============================================================================
// DropdownMenuSubTrigger — styled like Item with trailing chevron indicator
// =============================================================================

export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...rest }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2',
      'rounded-sm px-2 py-1.5',
      'text-body-sm text-text-default',
      'outline-none',
      'data-[highlighted]:bg-surface-base data-[highlighted]:text-brand-primary',
      'data-[state=open]:bg-surface-base data-[state=open]:text-brand-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  >
    {children}
    <Icon
      name="chevron-right"
      size="sm"
      className="ml-auto shrink-0"
    />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

// =============================================================================
// DropdownMenuContent — popover panel
// =============================================================================

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...rest }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden',
        'rounded-md border border-brand-tertiary/10 bg-surface-elevated p-1',
        'shadow-elevated',
        'transition-opacity duration-reveal ease-reveal',
        'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        className,
      )}
      {...rest}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

// =============================================================================
// DropdownMenuItem — selectable item (matches Select highlight pattern)
// =============================================================================

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...rest }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2',
      'rounded-sm px-2 py-1.5',
      'text-body-sm text-text-default',
      'outline-none',
      'data-[highlighted]:bg-surface-base data-[highlighted]:text-brand-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

// =============================================================================
// DropdownMenuCheckboxItem — checkable variant (with check indicator)
// =============================================================================

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, ...rest }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2',
      'rounded-sm py-1.5 pl-8 pr-2',
      'text-body-sm text-text-default',
      'outline-none',
      'data-[highlighted]:bg-surface-base data-[highlighted]:text-brand-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
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
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

// =============================================================================
// DropdownMenuRadioItem — radio variant (with dot indicator)
// =============================================================================

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...rest }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2',
      'rounded-sm py-1.5 pl-8 pr-2',
      'text-body-sm text-text-default',
      'outline-none',
      'data-[highlighted]:bg-surface-base data-[highlighted]:text-brand-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...rest}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span className="h-2 w-2 rounded-full bg-brand-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

// =============================================================================
// DropdownMenuLabel — section label
// =============================================================================

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...rest }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5',
      'text-body-sm font-medium text-text-default/70',
      className,
    )}
    {...rest}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// =============================================================================
// DropdownMenuSeparator
// =============================================================================

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...rest }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-brand-tertiary/10', className)}
    {...rest}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

// =============================================================================
// DropdownMenuSubContent — nested submenu panel
// =============================================================================

export const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...rest }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden',
      'rounded-md border border-brand-tertiary/10 bg-surface-elevated p-1',
      'shadow-elevated',
      'transition-opacity duration-reveal ease-reveal',
      'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
      className,
    )}
    {...rest}
  />
))
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

// Helper — chevron icon used in sub-trigger composition (consumer-side).
export { Icon as DropdownMenuChevron }

export default DropdownMenu
