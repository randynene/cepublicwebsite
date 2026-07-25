import { forwardRef, type TextareaHTMLAttributes } from 'react'

import { cn } from '../_utils/cn'

// C2 Textarea — multi-line text-input primitive (autonomous batch).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-checkbox-radio-textarea.mjs):
//
//   - CE has 1 native <textarea> on /for-developers (skillsets field) with
//     a DIFFERENT chassis from C1 inputs: 1px border, 10.4px radius, 16px
//     font, color #101828, 8px uniform padding. This is Webflow's default
//     form-builder injected style — diverges from CE's main form pattern.
//
//   - CE's main "tall text input" pattern is /contact's Message field: a
//     <input type="text"> with the .large modifier (100px height, 20px
//     radius, otherwise C1 chassis). 5× higher visibility than the
//     /for-developers textarea.
//
//   - Migration choice: standardize C2 Textarea to the C1 chassis with the
//     .large modifier values (radius 20px, min-height 100px). Keeps form
//     visual consistency across templates. The /for-developers one-off
//     becomes className override at template level — same variant-inventory
//     threshold rule applied across Category B + C.
//
//   - Inherits all C1 conventions: dumb-primitive (no error prop), focus
//     ring as migration improvement, aria-invalid attribute selector for
//     error state, register-based rhf integration via forwardRef.

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        // Chassis matches C1 Input + .large modifier values.
        'block w-full rounded-[20px] bg-surface-elevated',
        'min-h-[100px] px-4 py-2.5',
        'text-body-sm font-normal text-text-default',
        'placeholder:text-text-default/60',
        'transition duration-reveal ease-reveal',
        // Focus ring (migration improvement — CE has none).
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        // Error styling — driven by aria-invalid attribute selector.
        'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error aria-[invalid=true]:ring-offset-2',
        // Disabled
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Allow vertical resize only (horizontal-resize creates layout chaos).
        'resize-y',
        className,
      )}
      {...rest}
    />
  ),
)
Textarea.displayName = 'Textarea'

export default Textarea
