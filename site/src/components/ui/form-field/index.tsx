'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type HTMLAttributes,
  type ReactElement,
} from 'react'
import { useFormContext } from 'react-hook-form'

import { cn } from '../_utils/cn'

// C5 FormField — composition wrapper (autonomous batch).
//
// HALT-5-locked role: FormField is the SMART wrapper. Composes
// Label + child input + ErrorMessage with auto-generated ids and
// react-hook-form integration. Single-Input usage doesn't pay this
// overhead — consumers use C1 Input directly with manual aria attrs.
//
// API:
//   <FormField name="email" label="Email" required description="Work email">
//     <Input type="email" />
//   </FormField>
//
// Behaviour:
//   - useId() generates a stable input id; htmlFor on the label points to it.
//   - useFormContext() reads errors from rhf's FormProvider. If consumer
//     hasn't wrapped in FormProvider (e.g. uncontrolled standalone usage),
//     ctx is null and error display falls through gracefully.
//   - Clones the single child input via Children.only + cloneElement to
//     inject id + aria-invalid + aria-describedby + aria-required.
//   - Required: visible <span aria-hidden> *</span> (sighted users) +
//     aria-required="true" on input (screen readers). Migration improvement
//     over CE's text-only `*` (sighted-only).
//   - Description: optional helper text below input. ErrorMessage replaces
//     it visually when an error is present (described-by switches).
//
// Server vs client component: 'use client' required because useFormContext
// + useId are both hooks. The C1 Input itself remains server-component-safe
// — only this wrapper requires client boundary. Templates render FormField
// inside a client component (typically a <form> + FormProvider).

// =============================================================================
// ErrorMessage — inline primitive (NOT top-level UI inventory entry)
// =============================================================================

interface ErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  message: string
}

function ErrorMessage({ message, className, ...rest }: ErrorMessageProps) {
  return (
    <p
      role="alert"
      className={cn('text-body-sm text-error', className)}
      {...rest}
    >
      {message}
    </p>
  )
}

// =============================================================================
// FormField — composition wrapper
// =============================================================================

export interface FormFieldProps {
  /** Form field name — must match the rhf schema field. */
  name: string
  /** Visible label text. */
  label: string
  /** Renders the visible asterisk + sets aria-required on the input. */
  required?: boolean
  /** Optional helper text rendered below the input. */
  description?: string
  /** Additional className on the field wrapper. */
  className?: string
  /** Single child — the input primitive (Input / Textarea / Select / etc.). */
  children: ReactElement
}

export function FormField({
  name,
  label,
  required,
  description,
  className,
  children,
}: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const descId = `${id}-desc`

  // useFormContext returns null when not wrapped in <FormProvider>.
  // Cast to allow optional access — rhf's types make this strict by
  // default since v7.
  const ctx = useFormContext()
  const error = ctx?.formState?.errors?.[name]
  const errorMessage =
    typeof error?.message === 'string' && error.message.length > 0
      ? error.message
      : undefined

  // aria-describedby — concatenate present ids.
  const describedBy = [
    errorMessage ? errorId : null,
    description ? descId : null,
  ]
    .filter(Boolean)
    .join(' ')

  // Clone the child input + inject id + aria props. Children.only enforces
  // single-child API; cloneElement preserves consumer's props.
  const child = Children.only(children)
  if (!isValidElement(child)) return null

  // Spread of register('name') — only attach if rhf context exists. Manual
  // mode (no FormProvider) leaves the consumer responsible for wiring
  // value/onChange themselves.
  const registered = ctx ? ctx.register(name) : null

  // Cast the cloned element to a permissive record shape: the actual child
  // could be Input / Textarea / Select / Checkbox / etc., each with
  // different prop signatures. cloneElement's strict type inference can't
  // know which — pragmatic cast is the canonical pattern here. Aria attrs
  // pass through standard React element typing; rhf register() return
  // shape (ChangeHandler / RefCallBack / etc.) doesn't fit any single
  // primitive's strict prop type.
  const enhanced = cloneElement(
    child as ReactElement<Record<string, unknown>>,
    {
      id,
      'aria-invalid': errorMessage ? true : undefined,
      'aria-describedby': describedBy || undefined,
      'aria-required': required ? true : undefined,
      ...(registered ?? {}),
    } as Record<string, unknown>,
  )

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={id}
        className="block text-body font-medium text-text-default"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5">
            *
          </span>
        )}
      </label>
      {enhanced}
      {description && !errorMessage && (
        <p id={descId} className="text-body-sm text-text-default/70">
          {description}
        </p>
      )}
      {errorMessage && (
        <ErrorMessage id={errorId} message={errorMessage} />
      )}
    </div>
  )
}

export default FormField
