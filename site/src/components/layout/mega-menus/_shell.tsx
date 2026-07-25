'use client'

import { FocusScope } from '@radix-ui/react-focus-scope'
import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'

import { cn } from '@/components/ui/_utils/cn'

// MYGRATR-STATIC-3 Step 1 — shared MegaMenu shell.
//
// NOT a primitive (layer = layout, per brief §2.2). Lives at
// site/src/components/layout/mega-menus/_shell.tsx so the three
// mega-menu variants (Services / How It Works / Resources) inherit a
// single focus-trap + dismiss + transition implementation.
//
// Behaviors locked at plan-approval (Step 1 verification gate):
//
//   1. Focus trap — Radix FocusScope traps the Tab cycle within the
//      menu while open; first Tab from trigger lands on first
//      interactive element. Same primitive Radix Dialog uses.
//
//   2. Escape — closes + onClose() returns focus to triggerRef.
//
//   3. Outside-click — clicks outside the menu (not on the trigger,
//      not on any child) call onClose().
//
//   4. SSR link presence — both mega-menu panels mount on first paint
//      (hidden via CSS until opened). Open/close is presentational only;
//      deep links are crawlable in the initial HTML.
//
//   5. Reduced-motion — CSS classes use motion-reduce: utilities so
//      transitions disable when prefers-reduced-motion: reduce.
//
// Z-index: z-40 — below mobile-drawer z-50, above main content z-30
// header. Pinned in the brief §2.1.6 z-index scale lock.

export interface MegaMenuShellProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
  labelledById: string
  // DOM id of the panel container — referenced by the trigger
  // button's `aria-controls` attribute. Optional; consumers that
  // don't render a trigger button can omit it.
  id?: string
  children: ReactNode
  className?: string
  onMouseEnterPanel?: () => void
  onMouseLeavePanel?: () => void
}

export function MegaMenuShell({
  isOpen,
  onClose,
  triggerRef,
  labelledById,
  id,
  children,
  className,
  onMouseEnterPanel,
  onMouseLeavePanel,
}: MegaMenuShellProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Escape closes + returns focus to trigger.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, triggerRef])

  // Outside-click closes. Click on the trigger button itself is
  // tolerated (the trigger toggles its own state via its own handler).
  useEffect(() => {
    if (!isOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen, onClose, triggerRef])

  return (
    <FocusScope
      asChild
      loop
      trapped={isOpen}
      onMountAutoFocus={(e) => {
        // Don't yank focus on the initial mount — the trigger button
        // retains focus until the user explicitly Tabs into the menu.
        e.preventDefault()
      }}
      onUnmountAutoFocus={(e) => {
        // Return focus to trigger via our own Escape handler; suppress
        // FocusScope's default behavior here so it doesn't double-fire.
        e.preventDefault()
      }}
    >
      <div
        ref={containerRef}
        id={id}
        role="region"
        aria-labelledby={labelledById}
        aria-hidden={!isOpen}
        onMouseEnter={onMouseEnterPanel}
        onMouseLeave={onMouseLeavePanel}
        className={cn(
          // Position absolutely below the header pill; container width
          // matches the header pill's content area — final positioning
          // is owned by the nav-client wrapper that mounts this shell.
          'absolute left-0 right-0 top-full mt-2 z-40',
          'rounded-[20px] border border-border-subtle bg-surface-elevated shadow-elevated',
          // Open / closed transitions — CSS-only fade + 4px slide.
          // ~200ms duration with reduced-motion override.
          'transition-[opacity,transform] duration-reveal ease-reveal',
          'motion-reduce:transition-none',
          isOpen
            ? 'opacity-100 translate-y-0 visible pointer-events-auto'
            : 'opacity-0 -translate-y-1 invisible pointer-events-none',
          className,
        )}
      >
        {children}
      </div>
    </FocusScope>
  )
}

export default MegaMenuShell
