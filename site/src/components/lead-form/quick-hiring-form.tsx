'use client'

// The quick hiring form. One component, roughly 250 placements.
//
// SHAPE. Role, then stack, then length, then commitment, then details, then the
// Calendly booking, all in place on the page. It never navigates until the booking
// is confirmed, because sending someone to a separate funnel page is where a
// conversion flow leaks.
//
// PREFILL IS THE POINT. On /technology/react-developers the stack is already
// answered; on /services/ai-engineers so is the role. The page already told us why
// they are here, so asking again is the site not paying attention. A prefilled step
// is skipped, not shown empty, which is what turns four questions into two on the
// pages that carry the most intent.
//
// FAILURE POSTURE. The submit posts to /api/lead and then advances to booking
// REGARDLESS of the result. A CRM write failing is our problem, not the visitor's,
// and the endpoint raises its own alarm in Slack when that happens. Blocking a
// buyer at the last step because HubSpot 500'd would be the most expensive
// possible way to handle it.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CalendlyInlineEmbed } from '@/components/templates/book-a-call/calendly-inline-embed'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/components/ui/_utils/cn'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { searchSkills, toSelection, type SkillMatch } from '@/lib/skills/search'
import { defaultSkills, type SkillCategory } from '@/lib/skills/taxonomy'

import {
  BOOKING_THANK_YOU_PATH,
  COMMITMENT_OPTIONS,
  DEFAULT_CALENDLY_URL,
  LEAD_FORM_COPY as C,
  LENGTH_OPTIONS,
  ROLE_OPTIONS,
  type RoleOption,
} from './content'

type StepId = 'role' | 'skills' | 'length' | 'commitment' | 'details' | 'booking'

export interface QuickHiringFormProps {
  /** Page path the form sits on. Stored on the lead as `ce_source_page`. */
  sourcePage: string
  /** Skips the role step. Use the role id, e.g. `ai-engineer`. */
  prefillRole?: string
  /** Preselects a stack pill, e.g. "React" on the React Developers page. */
  prefillSkill?: string
  calendlyUrl?: string
  className?: string
}

interface Details {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  consent: boolean
}

const EMPTY_DETAILS: Details = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  consent: false,
}

/** Same rule the endpoint applies, so the visitor is not told "invalid" twice. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Glyphs, not copy. They live out here because the UI_STRINGS rule bans literals
// inside JSX, and a multiplication sign is not a string a translator should see.
const REMOVE_GLYPH = '\u00D7'
const ADD_GLYPH = '+'

/**
 * Validation messages are red, not lime.
 *
 * The first build used the accent, which meant "please use a valid work email"
 * arrived in the same colour as every success and CTA on the site. An error that
 * looks like a confirmation is worse than no colour at all.
 *
 * It is NOT `--color-error` (#bd0000) either. That token was specified for light
 * surfaces: against this card (#101B30) it measures 2.6:1, well under the 4.5:1
 * AA floor, so it would be an unreadable error message. This lighter red measures
 * about 6.2:1 on the same ground.
 *
 * TOKEN GAP, flagged rather than fixed here: the palette has no dark-surface
 * variant of error / success / warning, and every dark form will hit this. Belongs
 * in tokens.css as a proper semantic pair, not inline in one component.
 */
const ERROR_TEXT_CLASS = 'text-[#FF6B6B]'

/**
 * Per-step question, read by the left rail. Kept as a lookup rather than passed
 * down with each control block, because in the landscape layout the question and
 * the controls it belongs to are rendered in two different columns.
 */
const STEP_COPY: Record<StepId, { heading: string; sub: string }> = {
  role: C.role,
  skills: C.skills,
  length: C.length,
  commitment: C.commitment,
  details: C.details,
  booking: C.booking,
}

function useSteps(hasPrefilledRole: boolean): StepId[] {
  return useMemo(
    () =>
      (hasPrefilledRole
        ? ['skills', 'length', 'commitment', 'details', 'booking']
        : ['role', 'skills', 'length', 'commitment', 'details', 'booking']) as StepId[],
    [hasPrefilledRole],
  )
}

export function QuickHiringForm({
  sourcePage,
  prefillRole,
  prefillSkill,
  calendlyUrl = DEFAULT_CALENDLY_URL,
  className,
}: QuickHiringFormProps) {
  const prefilledRole = ROLE_OPTIONS.find((r) => r.id === prefillRole)
  const steps = useSteps(Boolean(prefilledRole))

  const [stepIndex, setStepIndex] = useState(0)
  const [role, setRole] = useState<RoleOption | undefined>(prefilledRole)
  const [skills, setSkills] = useState<SkillMatch[]>(() => {
    const seed = prefillSkill ? toSelection(prefillSkill) : null
    return seed ? [seed] : []
  })
  const [query, setQuery] = useState('')
  const [length, setLength] = useState('')
  const [commitment, setCommitment] = useState('')
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS)
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const step = steps[stepIndex] ?? 'role'
  const headingRef = useRef<HTMLDivElement>(null)

  // Move focus to the new step's heading. Without this a keyboard or screen-reader
  // user presses Continue and focus stays on a button that no longer exists.
  useEffect(() => {
    if (stepIndex > 0) headingRef.current?.focus()
  }, [stepIndex])

  const category: SkillCategory | undefined = role?.category
  const suggestions = useMemo(
    () => (query.trim() ? searchSkills(query, { category, limit: 6 }) : []),
    [query, category],
  )
  const pills = useMemo(() => defaultSkills(category, 12), [category])

  const selectedIds = new Set(skills.map((s) => s.id))

  const addSkill = useCallback((raw: string) => {
    const match = toSelection(raw)
    if (!match) return
    setSkills((current) =>
      current.some((s) => s.id === match.id) || current.length >= 20 ? current : [...current, match],
    )
    setQuery('')
  }, [])

  const removeSkill = useCallback((id: string) => {
    setSkills((current) => current.filter((s) => s.id !== id))
  }, [])

  const canContinue = (): boolean => {
    if (step === 'role') return Boolean(role)
    if (step === 'length') return length.length > 0
    if (step === 'commitment') return commitment.length > 0
    return true // skills is optional by design
  }

  const goNext = (): void => setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const goBack = (): void => setStepIndex((i) => Math.max(i - 1, 0))

  /**
   * Set a field AND clear its error.
   *
   * Without the second half, validation messages persist after the visitor has
   * fixed the thing they complain about: the screenshots showed "Please use a
   * valid work email" sitting under a valid email address, and "Please tick the
   * box" under a ticked box. Errors are only recomputed on submit, so the state
   * has to be cleared where the correction happens.
   */
  function updateDetail<K extends keyof Details>(key: K, value: Details[K]): void {
    setDetails((d) => ({ ...d, [key]: value }))
    setErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validateDetails(): boolean {
    const next: Partial<Record<keyof Details, string>> = {}
    if (!details.firstName.trim()) next.firstName = C.error.required
    if (!EMAIL_RE.test(details.email)) next.email = C.error.email
    if (!details.consent) next.consent = C.error.consent
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(): Promise<void> {
    if (!validateDetails()) return
    setSubmitting(true)
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'quick_hiring_form',
          sourcePage,
          role: role?.label,
          skills: skills.filter((s) => !s.custom).map((s) => s.label),
          customSkills: skills.filter((s) => s.custom).map((s) => s.label),
          engagementLength: length || undefined,
          commitment: commitment || undefined,
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim() || undefined,
          email: details.email.trim(),
          phone: details.phone.trim() || undefined,
          company: details.company.trim() || undefined,
          hutk: readHubSpotCookie(),
        }),
      })
    } catch {
      // Deliberately swallowed. See the failure-posture note at the top: the
      // visitor continues to booking whatever happened to the CRM write.
    } finally {
      setSubmitting(false)
      goNext()
    }
  }

  // Calendly announces a confirmed booking by postMessage. Same listener shape as
  // the Ask Clara booking canvas, kept local so the two cannot break each other.
  useEffect(() => {
    if (step !== 'booking') return
    const onMessage = (event: MessageEvent): void => {
      if (typeof event.origin !== 'string' || !event.origin.includes('calendly.com')) return
      const data = event.data as { event?: string } | undefined
      if (data?.event === 'calendly.event_scheduled') {
        window.location.assign(BOOKING_THANK_YOU_PATH)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [step])

  const stepNumber = stepIndex + 1
  const stepCount = steps.length
  const { heading, sub } = STEP_COPY[step]

  // The booking step takes the full width. A Calendly month view squeezed into a
  // 60% column is unusable, and by then there is no question left to ask, so the
  // left rail has nothing to hold.
  const fullWidth = step === 'booking'

  return (
    <section
      className={cn(
        'rounded-[20px] border border-border-subtle bg-section-bg-card p-6 sm:p-10 lg:p-12',
        className,
      )}
      aria-labelledby="quick-hiring-form-heading"
    >
      <div
        className={cn(
          'gap-10 lg:gap-16',
          fullWidth ? 'block' : 'lg:grid lg:grid-cols-[minmax(0,360px)_1fr]',
        )}
      >
        {/* Left rail: what is being asked. Landscape, because this block sits at
            the bottom of a long page and a tall portrait card there reads as a
            second page rather than as the last section of this one. */}
        <div className="mb-8 lg:mb-0">
          {/* Both halves are nowrap. At 390px the eyebrow was breaking after
              "FIND YOUR" and the counter after "Step 1 of", which turned a
              one-line header into a ragged four-line block. */}
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <p className="whitespace-nowrap text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-accent-primary">
              {C.eyebrow}
            </p>
            <p className="whitespace-nowrap text-[13px] leading-none text-text-tertiary lg:hidden">
              {C.progress.step}
              {' '}
              {stepNumber}
              {' '}
              {C.progress.of}
              {' '}
              {stepCount}
            </p>
          </div>

          <Heading
            as="h2"
            size="h4"
            id="quick-hiring-form-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-[26px] font-semibold leading-[32px] tracking-[-0.6px] text-text-primary outline-none lg:text-[34px] lg:leading-[40px] lg:tracking-[-0.9px]"
          >
            {heading}
          </Heading>
          <Text className="mt-3 text-text-secondary">{sub}</Text>

          <div className="mt-7 flex items-center gap-4">
            <div
              className="h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-surface-tertiary"
              role="progressbar"
              aria-valuenow={stepNumber}
              aria-valuemin={1}
              aria-valuemax={stepCount}
            >
              <div
                className="h-full rounded-full bg-accent-primary transition-[width] duration-300"
                style={{ width: `${(stepNumber / stepCount) * 100}%` }}
              />
            </div>
            <p className="hidden whitespace-nowrap text-[13px] leading-none text-text-tertiary lg:block">
              {C.progress.step}
              {' '}
              {stepNumber}
              {' '}
              {C.progress.of}
              {' '}
              {stepCount}
            </p>
          </div>
        </div>

        {/* Right column: the controls. */}
        <div className="min-w-0">
        {step === 'role' && (
          <StepShell>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option)}
                  aria-pressed={role?.id === option.id}
                  className={cn(
                    'rounded-xl border px-5 py-[14px] text-left text-[15px] transition-colors',
                    role?.id === option.id
                      ? 'border-accent-primary bg-accent-primary/15 text-text-primary'
                      : 'border-border-default text-text-primary hover:border-accent-primary/50 hover:bg-surface-tertiary/40',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 'skills' && (
          <StepShell>
            <label htmlFor="quick-hiring-skill-search" className="sr-only">
              {C.skills.searchLabel}
            </label>
            <input
              id="quick-hiring-skill-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill(suggestions[0]?.label ?? query)
                }
              }}
              placeholder={C.skills.searchPlaceholder}
              autoComplete="off"
              className="w-full rounded-full border border-border-default bg-surface-tertiary px-5 py-3 text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {query.trim().length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <SkillPill
                      label={s.label}
                      onClick={() => addSkill(s.label)}
                      selected={selectedIds.has(s.id)}
                    />
                  </li>
                ))}
                {suggestions.length === 0 && (
                  <li>
                    <SkillPill label={query.trim()} onClick={() => addSkill(query)} addLabel />
                  </li>
                )}
              </ul>
            )}

            {skills.length > 0 && (
              <div className="mt-6">
                <Text size="small" className="mb-2 text-text-tertiary">
                  {C.skills.selectedLabel}
                </Text>
                <ul className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => removeSkill(s.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-text-dark"
                      >
                        <span>{s.label}</span>
                        <span aria-hidden="true">{REMOVE_GLYPH}</span>
                        <span className="sr-only">{C.skills.removeLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <Text size="small" className="mb-2 text-text-tertiary">
                {C.skills.popularLabel}
              </Text>
              <ul className="flex flex-wrap gap-2">
                {pills
                  .filter((s) => !selectedIds.has(s.id))
                  .map((s) => (
                    <li key={s.id}>
                      <SkillPill label={s.label} onClick={() => addSkill(s.label)} />
                    </li>
                  ))}
              </ul>
            </div>
          </StepShell>
        )}

        {step === 'length' && (
          <StepShell>
            <ChoiceList
              name="quick-hiring-length"
              options={LENGTH_OPTIONS}
              value={length}
              onChange={setLength}
            />
          </StepShell>
        )}

        {step === 'commitment' && (
          <StepShell>
            <ChoiceList
              name="quick-hiring-commitment"
              options={COMMITMENT_OPTIONS}
              value={commitment}
              onChange={setCommitment}
            />
          </StepShell>
        )}

        {step === 'details' && (
          <StepShell>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="qh-first-name"
                label={C.details.firstName}
                value={details.firstName}
                onChange={(v) => updateDetail('firstName', v)}
                error={errors.firstName}
                required
              />
              <Field
                id="qh-last-name"
                label={C.details.lastName}
                value={details.lastName}
                onChange={(v) => updateDetail('lastName', v)}
              />
              {/* Full width. A work email is the longest thing anyone types
                  here, and in a half-width field it was being clipped to
                  "jake@cloudemployee." with no way to read back what was
                  entered. The two optional short fields share the row instead. */}
              <div className="sm:col-span-2">
                <Field
                  id="qh-email"
                  label={C.details.email}
                  placeholder={C.details.emailPlaceholder}
                  type="email"
                  value={details.email}
                  onChange={(v) => updateDetail('email', v)}
                  error={errors.email}
                  required
                />
              </div>
              <Field
                id="qh-phone"
                label={C.details.phone}
                hint={C.details.optional}
                type="tel"
                value={details.phone}
                onChange={(v) => updateDetail('phone', v)}
              />
              <Field
                id="qh-company"
                label={C.details.company}
                hint={C.details.optional}
                value={details.company}
                onChange={(v) => updateDetail('company', v)}
              />
            </div>

            <label className="mt-6 flex items-start gap-3 text-text-secondary">
              <Checkbox
                checked={details.consent}
                onCheckedChange={(checked) => updateDetail('consent', checked === true)}
                aria-invalid={Boolean(errors.consent)}
                className="mt-[2px] shrink-0"
              />
              <span className="text-sm">
                {C.details.consent}
                {' '}
                <Link href={C.details.consentLinkHref} className="underline">
                  {C.details.consentLinkLabel}
                </Link>
              </span>
            </label>
            {errors.consent && (
              <Text size="small" className={cn('mt-2', ERROR_TEXT_CLASS)}>
                {errors.consent}
              </Text>
            )}
          </StepShell>
        )}

        {step === 'booking' && (
          <StepShell>
            <CalendlyInlineEmbed url={calendlyUrl} className="mt-2 rounded-2xl" />
          </StepShell>
        )}

        {step !== 'booking' && (
          <div className="mt-8 flex items-center gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-border-default px-6 py-3 text-text-secondary transition-colors hover:border-accent-primary/60"
            >
              {C.actions.back}
            </button>
          )}

          {role?.handoffToClara && step === 'role' ? (
            <Link
              href="/ask"
              className="rounded-full bg-accent-primary px-7 py-3 font-medium text-text-dark"
            >
              {C.actions.askClara}
            </Link>
          ) : (
            <button
              type="button"
              disabled={!canContinue() || submitting}
              onClick={() => (step === 'details' ? void submit() : goNext())}
              // Disabled is a different FILL, not lime at 40%. Lime dimmed over a
              // dark card renders as a muddy olive that reads as a rendering bug
              // rather than as "not yet". A flat dark surface reads as inactive.
              className={cn(
                'rounded-full px-7 py-3 font-medium transition-colors',
                !canContinue() || submitting
                  ? 'cursor-not-allowed border border-border-subtle bg-surface-tertiary text-text-tertiary'
                  : 'bg-accent-primary text-text-dark hover:bg-accent-deep',
              )}
            >
              {step === 'details'
                ? submitting
                  ? C.actions.submitting
                  : C.actions.submit
                : C.actions.continue}
            </button>
          )}
          </div>
        )}
        </div>
      </div>
    </section>
  )
}

/**
 * The control column. It carries no heading: in the landscape layout the question
 * lives in the left rail, so a heading here would repeat it.
 */
function StepShell({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

function SkillPill({
  label,
  onClick,
  selected,
  addLabel,
}: {
  label: string
  onClick: () => void
  selected?: boolean
  addLabel?: boolean
}) {
  // Built outside JSX so the lint rule sees a value, not a literal, and so the
  // spacing is decided once rather than by a scattering of {' '} expressions.
  const text = addLabel ? `${C.skills.addPrefix} ${label}` : label
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={selected}
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-colors',
        selected
          ? 'border-accent-primary/40 text-text-tertiary'
          : 'border-border-default text-text-secondary hover:border-accent-primary hover:text-text-primary',
      )}
    >
      <span aria-hidden="true" className="mr-1">
        {ADD_GLYPH}
      </span>
      {text}
    </button>
  )
}

function ChoiceList({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div role="radiogroup" className="grid gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-2xl border px-5 py-4 transition-colors',
            value === option.value
              ? 'border-accent-primary bg-accent-primary/15 text-text-primary'
              : 'border-border-default text-text-secondary hover:border-accent-primary/50',
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="size-4 accent-[#D4FF3C]"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  error,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
}) {
  const labelText = hint ? `${label} (${hint})` : label
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-text-secondary">
        {labelText}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-xl border bg-surface-tertiary px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-ring',
          error ? 'border-[#FF6B6B]' : 'border-border-default focus:border-accent-primary',
        )}
      />
      {error && (
        <p id={errorId} className={cn('mt-1 text-sm', ERROR_TEXT_CLASS)}>
          {error}
        </p>
      )}
    </div>
  )
}

/** HubSpot's tracking cookie. Without it every lead looks like a new anonymous contact. */
function readHubSpotCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/)
  return match?.[1]
}
