'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { ChatLink } from '@/components/shared/chat-link'
import { HeroTrustBar } from '@/components/social-proof/hero-trust-bar'
import { CatalogueFaqPanel } from '@/components/templates/catalogue/faq-panel'
import { cn } from '@/components/ui/_utils/cn'
import { CHAT_HREF } from '@/lib/chat'
import { buildLocalePath, type Locale } from '@/lib/locale-path'

import type { MarketImageSlot, HireEngineersMarketContent } from './content-types'
import './hire-engineers-market.css'

// Hire Engineers MARKET landing page - one template, one design, two markets:
//
//   /services/us-hire-engineers        content.us.ts    (UHE, en-US)
//   /uk/services/uk-hire-engineers     content.uk.ts    (UKHE, en-GB)
//
// Port of docs/design/{us,uk}-hire-engineers.html. The two design exports are
// the SAME layout with different copy, so this is deliberately one component
// rather than two: a forked 700-line template drifts within a month, and the
// next market page would make it three. Everything visible comes from
// `content`; nothing in the JSX knows which market it is rendering, except the
// `hem--<market>` modifier class that carries the one real layout difference
// (see `content.market` and the hero note below).
//
// The design system lives in ./hire-engineers-market.css (every rule scoped
// under `.hem`); this component reproduces the design's absolute positions as
// flex/grid and re-implements its script behaviour with React state.
//
// The design file paints its own header and footer so the page reads in context.
// Both are dropped here: the real ones are mounted globally by app/layout.tsx
// (same convention as hire-engineers and /our-work). This <main> starts at the
// hero eyebrow and ends after the final CTA.

const SUCCESS_PATH = '/thank-you-for-your-message'
/** Same rule the lead endpoint applies, so nobody is told "invalid" twice. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 200 decorative tiles: 10 columns x 20 rows. */
const TILE_COUNT = 200
/** Error-message ids, hoisted so the UI_STRINGS rule sees values, not literals. */
const NAME_ERROR_ID = 'hem-name-error'
const EMAIL_ERROR_ID = 'hem-email-error'

/**
 * A bar's width comes from the content data, so it has to be an inline style.
 * `--pct` is a custom property and React's CSSProperties does not model those,
 * hence the single cast, kept in one place rather than at every call site.
 */
function barStyle(pct: number, delayMs: number): React.CSSProperties {
  return { '--pct': `${pct}%`, transitionDelay: `${delayMs}ms` } as React.CSSProperties
}

// ── Inline stroke icons (all styling comes from the scoped CSS) ─────────────

function TickIcon() {
  return (
    <svg className="tick" viewBox="0 0 15 15" aria-hidden="true">
      <path d="m2.5 7.81 3.13 2.81 6.25-6.87" pathLength={100} />
    </svg>
  )
}

function ArrowDisc() {
  return (
    <span className="arw" aria-hidden="true">
      <svg viewBox="0 0 13 13">
        <path className="icon-motion icon-motion--draw" d="M2.71 6.5h7.58M6.5 2.71 10.29 6.5 6.5 10.29" pathLength={100} />
      </svg>
    </span>
  )
}

// Differentiator icons, in section order: the code chevrons for "a senior
// engineer ran the interview", the document for "a written report".
const DIFF_ICONS = [
  <svg key="d0" viewBox="0 0 18 18" aria-hidden="true">
    <path d="m12 4.5 4.5 4.5-4.5 4.5M6 4.5 1.5 9 6 13.5" />
  </svg>,
  <svg key="d1" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M10.5 1.5H4.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V6l-4.5-4.5Z" />
    <path d="M10.5 1.5V6H15" />
  </svg>,
]

/**
 * A "REAL PHOTO" slot. The tag and the caption ARE the photography brief and
 * disappear the moment a real image exists; they must never end up sitting on
 * top of a finished photograph. Do not fill these with generated illustrations,
 * stock imagery or SVG people - they are a shoot list.
 */
function SlotImage({ slot, sizes }: { slot: MarketImageSlot; sizes: string }) {
  // next/image, not a bare <img>: the SEO checklist (G7) forbids the latter, and
  // these are six real photographs on a page whose Lighthouse score matters.
  // `fill` suits the slot exactly - every tile is a fixed shape the photo
  // cover-crops into, and `.imgslot` is already position:relative.
  //
  // `alt` is '' wherever content.ts omits it. That is the CORRECT value for a
  // decorative image, not a missing one: those avatars sit on illustrative
  // profiles whose role and location are already read out beside them.
  return <Image src={slot.image as string} alt={slot.alt ?? ''} fill sizes={sizes} className="slot-img" />
}

function ImgSlot({
  slot,
  className,
  sizes = '(max-width: 900px) 60px, 112px',
}: {
  slot: MarketImageSlot
  className?: string
  sizes?: string
}) {
  return (
    <div className={cn('imgslot', className)}>
      {slot.image ? <SlotImage slot={slot} sizes={sizes} /> : <span className="brief">{slot.brief}</span>}
    </div>
  )
}

/**
 * A monogram tile in place of a headshot.
 *
 * The shortlist profiles and the report card are ILLUSTRATIVE - invented role,
 * city and salary, which is what the amber badge on the card says. A real face
 * on one of those asserts that a real, identifiable person is job-hunting at
 * that rate, which is not something a marketing page gets to say about someone.
 * An initial reads as "a person" and claims nothing about who.
 *
 * `aria-hidden`: the role, location and experience sit right beside it, so
 * announcing a bare letter would add noise, not information.
 */
function Monogram({ initial, className }: { initial: string; className?: string }) {
  return (
    <span className={cn('monogram', className)} aria-hidden="true">
      {initial}
    </span>
  )
}

// ── Intake form ─────────────────────────────────────────────────────────────

/** Which input the visitor picked. `upload` is the design's default. */
type IntakeMode = 'upload' | 'guided' | 'type'

const ACCEPT = '.pdf,.docx'
const MAX_FILE_BYTES = 10 * 1024 * 1024

// TODO(intake-wizard): STEP 1 ONLY. This renders the first screen of the
// four-step brief builder from the Figma (drop a spec -> three follow-ups ->
// market read) and then hands off to the existing lead pipe. Steps 2-4 and the
// AI chat handoff are scheduled separately. Applies to both markets.
//
// ⚠️ THE FILE ITSELF IS NOT TRANSMITTED YET. `/api/lead` is a JSON endpoint with
// no storage behind it, so a dropped PDF is validated, named and reported to the
// team in the lead body - but its BYTES go nowhere. Until an upload target
// exists (Vercel Blob or a HubSpot file field), the copy must not promise that
// we have already read the document, and someone has to email the buyer for it.
// This is the single most important thing to close before this form carries real
// volume: the whole design invites a file as the primary action.
function IntakeForm({
  copy,
  sourcePage,
  locale,
}: {
  copy: HireEngineersMarketContent['intake']
  sourcePage: string
  locale: Locale
}) {
  const [mode, setMode] = useState<IntakeMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [job, setJob] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  /** Validate here rather than trusting `accept`, which a drop bypasses. */
  function takeFile(picked: File | undefined | null): void {
    if (!picked) return
    if (!/\.(pdf|docx)$/i.test(picked.name)) {
      setFile(null)
      setFileError(copy.fileTypeError)
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFile(null)
      setFileError(copy.fileSizeError)
      return
    }
    setFileError(null)
    setFile(picked)
  }

  // The shared QuickHiringForm could not carry this section: it is a six-step
  // wizard ending in a Calendly embed, and the design asks for one short form
  // with a free-text brief. So this posts DIRECTLY to the existing /api/lead
  // endpoint with the same payload shape the wizard sends, reusing its
  // validation, junk filter, HubSpot write and Slack safety net. No new
  // endpoint, no second pipeline.
  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const next: { name?: string; email?: string } = {}
    if (!name.trim()) next.name = copy.errorRequired
    if (!EMAIL_RE.test(email.trim())) next.email = copy.errorEmail
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    const [firstName, ...rest] = name.trim().split(/\s+/)
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'quick_hiring_form',
          sourcePage,
          skills: [],
          customSkills: [],
          firstName,
          lastName: rest.join(' ') || undefined,
          email: email.trim(),
          // The brief rides in the endpoint's existing `message` field (max
          // 4000). Nothing was added to the lead schema for this page.
          //
          // A chosen file contributes its NAME here, flagged as not-yet-received,
          // because the bytes are not uploaded anywhere (see the TODO above).
          // Announcing it is what stops the lead looking empty and lets whoever
          // picks it up ask for the document instead of silently losing it.
          message: buildMessage(mode, job, file),
          hutk: readHubSpotCookie(),
        }),
      })
    } catch {
      // Deliberately swallowed, matching the shared form's failure posture: a
      // CRM write failing is our problem, not the visitor's, and the endpoint
      // raises its own Slack alarm when it happens.
    } finally {
      window.location.assign(buildLocalePath(SUCCESS_PATH, locale))
    }
  }

  return (
    <form className="intake-card rvl" onSubmit={(e) => void onSubmit(e)} noValidate>
      {/* Progress rail. Decorative for sighted users; the step position is
          announced once, via the progressbar role, rather than by the segments. */}
      <div
        className="stepbar"
        role="progressbar"
        aria-valuenow={1}
        aria-valuemin={1}
        aria-valuemax={copy.stepCount}
        aria-label={copy.stepCounter}
      >
        {Array.from({ length: copy.stepCount }, (_, i) => (
          <span key={i} className={cn('seg', i === 0 && 'on')} />
        ))}
      </div>
      <div className="stephead">
        <span className="label">{copy.stepLabel}</span>
        <span className="stepcount">{copy.stepCounter}</span>
      </div>
      <h3>{copy.heading}</h3>

      {mode === 'upload' ? (
        file ? (
          <div className="dropzone dropzone--filled">
            <span className="fz-icon" aria-hidden="true">
              <FileGlyph />
            </span>
            <span className="fz-name">
              <strong>{copy.fileChosenLabel}</strong>
              {file.name}
            </span>
            <button type="button" className="fz-remove" onClick={() => setFile(null)}>
              {copy.fileRemoveLabel}
            </button>
          </div>
        ) : (
          // A real <label> wrapping a real <input type="file">, not a div with
          // an onClick: that gives keyboard focus, the native picker and the
          // accept filter for free, and it still works if the drag handlers
          // never fire.
          <label
            className={cn('dropzone', dragging && 'is-dragging')}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              takeFile(e.dataTransfer.files?.[0])
            }}
          >
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only-file"
              onChange={(e) => takeFile(e.target.files?.[0])}
            />
            <span className="dz-icon" aria-hidden="true">
              <UploadGlyph />
            </span>
            <span className="dz-title">{copy.dropTitle}</span>
            <span className="dz-hint">{copy.dropHint}</span>
          </label>
        )
      ) : null}

      {fileError ? <p className="intake-fileerror">{fileError}</p> : null}
      {/* Only once something is attached, and it states what actually happens:
          the file is not uploaded anywhere yet, so promising we have already
          read it would be a lie told at the exact moment of highest trust. */}
      {file ? <p className="intake-filenote">{copy.fileNote}</p> : null}

      <div className="intake-modes">
        <button
          type="button"
          className={cn('mode-pill', mode === 'guided' && 'on')}
          onClick={() => setMode('guided')}
        >
          {copy.pillGuided}
        </button>
        {/* Routed to the AI chat rather than faking a recorder: "say it" is a
            conversation, and the chat agent is the surface that already takes
            one. A mic button that opens nothing would be the dead control this
            replaces. */}
        <ChatLink href={CHAT_HREF} locale={locale} className="mode-pill">
          <MicGlyph />
          {copy.pillSay}
        </ChatLink>
        <button
          type="button"
          className={cn('mode-pill', mode === 'type' && 'on')}
          onClick={() => setMode('type')}
        >
          {copy.pillType}
        </button>
      </div>

      {mode === 'upload' ? null : (
        <div className="field">
          <label htmlFor="hem-job">{copy.jobLabel}</label>
          <textarea
            id="hem-job"
            name="job"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder={copy.jobPlaceholder}
            maxLength={4000}
            autoFocus
          />
        </div>
      )}
      <p className="intake-helper">{copy.helper}</p>

      <div className="field-row">
        <div className="field" data-invalid={String(Boolean(errors.name))}>
          <label htmlFor="hem-name">{copy.nameLabel}</label>
          <input
            id="hem-name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((c) => ({ ...c, name: undefined }))
            }}
            placeholder={copy.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? NAME_ERROR_ID : undefined}
          />
          {errors.name ? (
            <span className="err" id={NAME_ERROR_ID}>
              {errors.name}
            </span>
          ) : null}
        </div>
        <div className="field" data-invalid={String(Boolean(errors.email))}>
          <label htmlFor="hem-email">{copy.emailLabel}</label>
          <input
            id="hem-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((c) => ({ ...c, email: undefined }))
            }}
            placeholder={copy.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? EMAIL_ERROR_ID : undefined}
          />
          {errors.email ? (
            <span className="err" id={EMAIL_ERROR_ID}>
              {errors.email}
            </span>
          ) : null}
        </div>
      </div>
      <p className="intake-consent">{copy.consentNote}</p>

      <div className="intake-foot">
        <p>{copy.footNote}</p>
        <button type="submit" className="btn-primary intake-submit" disabled={submitting}>
          {submitting ? copy.submitting : copy.submit}
          <ArrowDisc />
        </button>
      </div>
    </form>
  )
}

/**
 * The lead body. Internal wording, never shown to the visitor, so it says
 * plainly what was and was not received rather than reading like copy.
 */
function buildMessage(mode: IntakeMode, job: string, file: File | null): string | undefined {
  const parts: string[] = []
  if (file) {
    parts.push(`[Job description attached on the form: "${file.name}". THE FILE WAS NOT UPLOADED - ask the sender to email it.]`)
  }
  if (mode === 'guided' && !job.trim()) {
    parts.push('[No spec. Asked us to build the brief with them.]')
  }
  if (job.trim()) parts.push(job.trim())
  return parts.length > 0 ? parts.join('\n\n') : undefined
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  )
}
function FileGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}
function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mic">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" />
    </svg>
  )
}

/** HubSpot's tracking cookie. Without it every lead looks like a new contact. */
function readHubSpotCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/)
  return match?.[1]
}

// ── FAQ ─────────────────────────────────────────────────────────────────────


/**
 * Renders one FAQ answer for the shared panel, turning `linkText` into a real
 * anchor in place.
 *
 * The answer string is the SAME string that goes into the FAQPage JSON-LD, so it
 * cannot be split into "before / link / after" fields in the content: the
 * structured answer and the visible answer have to match. Instead the content
 * names a substring and the split happens here, at render time. An absent or
 * stale `linkText` falls through to plain text rather than throwing, so a copy
 * edit that loses the substring degrades to a paragraph instead of a blank page.
 *
 * Returns a fragment, not a <p>: the shared panel supplies the paragraph.
 *
 * `linkHref` runs through buildLocalePath so the cross-market link keeps the
 * reader in their own locale instead of throwing them across the site.
 */
function FaqAnswer({
  item,
  locale,
}: {
  item: HireEngineersMarketContent['faq']['items'][number]
  locale: Locale
}) {
  const { a, linkText, linkHref } = item
  const at = linkText ? a.indexOf(linkText) : -1
  if (!linkText || !linkHref || at === -1) return <>{a}</>
  return (
    <>
      {a.slice(0, at)}
      <a className="faq-xlink" href={buildLocalePath(linkHref, locale)}>
        {linkText}
      </a>
      {a.slice(at + linkText.length)}
    </>
  )
}

// ── Template ────────────────────────────────────────────────────────────────

export function HireEngineersMarketTemplate({
  content,
  locale,
  path,
}: {
  content: HireEngineersMarketContent
  locale: Locale
  /**
   * The page's own US-form path (`/services/us-hire-engineers`,
   * `/services/uk-hire-engineers`). Only used to stamp `sourcePage` on the lead,
   * so a sales rep can tell which market page the brief came from. Required
   * rather than derived from `market`, because the route owns its own URL.
   */
  path: string
}) {
  const rootRef = useRef<HTMLElement>(null)

  // Reveal-on-scroll. Same observer as hire-engineers (threshold .12, add `.in`,
  // unobserve), extended to the two other motion classes this page uses: the
  // tile grid's clip-path wipe and the bar tracks that grow their fill.
  // Reduced motion is handled entirely in CSS.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      // threshold 0, not 0.12, with a small bottom inset instead.
      //
      // A ratio threshold is a trap for anything tall: an element only just in
      // view is BELOW the threshold, so it never receives `.in` and stays at
      // opacity 0 until the visitor scrolls - and if it is already as far down
      // the first screen as it will ever be, that is never. The 392px hero
      // shortlist card hit exactly this on a short window.
      //
      // Any intersection now reveals, and the -48px inset keeps the effect
      // ("it arrives as you reach it") without letting the maths strand
      // anything invisible.
      { threshold: 0, rootMargin: '0px 0px -48px 0px' },
    )
    root.querySelectorAll('.rvl, .grow, .gridrvl').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const sourcePage = buildLocalePath(path, locale)
  const [stage1, stage2, stage3] = content.process.stages

  return (
    <main id="main" className={cn('hem', `hem--${content.market}`)} ref={rootRef}>
      {/* HERO + client logos claim the FIRST SCREEN together (globals.css
          `.hero-screen`), so landing on the page shows the promise and the proof
          and nothing else - the problem section starts off-frame and is what you
          get when you scroll. Same treatment as Hire Engineers and the location
          pages, so all the marketing pages open the same way. */}
      <div className="hero-screen">
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">{content.hero.eyebrow}</span>
            {/* A newline in `h1Lead` is a deliberate line break in the headline:
                the break belongs to the copy, not to the column width. */}
            <h1>
              {content.hero.h1Lead.split('\n').map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}{' '}
              <em className="em">{content.hero.h1Em}</em>
            </h1>
            <p className="hero-sub">{content.hero.sub}</p>
            <div className="hero-ctas">
              <a href="#intake" className="btn-primary">
                {content.hero.ctaPrimary}
                <ArrowDisc />
              </a>
              <a href="#process" className="btn-ghost">
                {content.hero.ctaGhost}
              </a>
            </div>
            <ul className="hero-ticks">
              {content.hero.ticks.map((t) => (
                <li key={t}>
                  <TickIcon />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="shortlist rvl">
            <div className="shortlist-head">
              <span className="label">{content.hero.card.label}</span>
              <span className="badge rvl" style={{ transitionDelay: '400ms' }}>
                {content.hero.card.badge}
              </span>
            </div>
            {content.hero.card.profiles.map((p, i) => (
              <div key={p.role} className="profile rvl" style={{ transitionDelay: `${160 + i * 120}ms` }}>
                <Monogram initial={p.initial} className="avatar" />
                <div>
                  <div className="role">{p.role}</div>
                  <div className="meta">{p.meta}</div>
                  <ul className="chips">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="salary">
                  {p.salary}
                  <span>{p.salaryNote}</span>
                </div>
              </div>
            ))}
            <div className="shortlist-foot rvl" style={{ transitionDelay: '500ms' }}>
              <p>{content.hero.card.foot}</p>
              {/* These are not real placements, and the badge is what says so. */}
              <span className="badge-illustrative">{content.hero.card.illustrative}</span>
            </div>
          </div>
        </div>
      </section>

      {/* The standard band that closes every marketing hero. It styles itself
          through globals.css two-class selectors, so unlike the FAQ panel it
          needs no `.shared-ui` exemption from this page's reset. */}
      <section className="hem-trusted">
        <div className="wrap">
          <HeroTrustBar locale={locale} />
        </div>
      </section>
      </div>

      {/* ── PROBLEM ── */}
      <section className="problem">
        <div className="wrap prob-grid">
          <div>
            <span className="eyebrow">{content.problem.eyebrow}</span>
            <h2 className="st st--big">
              {content.problem.h2.split('\n').map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <p className="prob-stat">{content.problem.stat}</p>
            <p className="prob-body">{content.problem.body}</p>
          </div>

          {/* `gridrvl` sits on the WRAPPER, not on the grid itself. The grid's
              reveal is a clip-path wipe, and a clip-path that hides an element
              also clips it out of the rect IntersectionObserver measures - so
              observing the grid directly made it report zero intersection, never
              receive `.in`, and stay invisible permanently. Verified in Chromium:
              fully in viewport, intersectionRatio 0. The wrapper is always
              measurable, so it is the thing that gets observed. */}
          <div className="prob-art gridrvl">
            <span className="cap eyebrow-dim">{content.problem.gridCaption}</span>
            {/* Decoration, not content: 200 identical tiles standing in for a
                flood of applications. Hidden from assistive technology. */}
            <div className="tilegrid" aria-hidden="true">
              {Array.from({ length: TILE_COUNT }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <div className="floatcards">
              {content.problem.floatCards.map((c, i) => (
                <div key={c.role} className="floatcard rvl" style={{ transitionDelay: `${420 + i * 140}ms` }}>
                  <span className="dot" aria-hidden="true" />
                  <div>
                    <div className="role">{c.role}</div>
                    <div className="note">{c.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <span className="cap cap-lime eyebrow-dim rvl" style={{ transitionDelay: '700ms' }}>
              {content.problem.floatCaption}
            </span>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="process" id="process">
        <div className="wrap">
          <span className="eyebrow">{content.process.eyebrow}</span>
          <h2 className="st">
            {content.process.h2Lead}
            <em>{content.process.h2Em}</em>
          </h2>

          <div className="stages">
            {/* Stage 01: the brief panel, with the intake-call photo card
                overhanging its top-right corner. */}
            <div className="stage rvl">
              <div>
                <span className="stage-n">{stage1.n}</span>
                <span className="eyebrow">{stage1.eyebrow}</span>
                <h3>{stage1.h3}</h3>
                <p className="body">{stage1.body}</p>
                <p className="emph">{stage1.emphasis}</p>
                {stage1.pill ? <span className="stage-pill">{stage1.pill}</span> : null}
              </div>
              <div className="briefpanel rvl" style={{ transitionDelay: '140ms' }}>
                <span className="label">{content.process.brief.label}</span>
                <div className="role">{content.process.brief.role}</div>
                <ul className="reqs">
                  {content.process.brief.requirements.map((r) => (
                    <li key={r.text} className={cn(r.met && 'met')}>
                      <span className="mark" aria-hidden="true">
                        {r.met ? (
                          <svg viewBox="0 0 9 9">
                            <path d="m1.5 4.65 1.88 1.7 3.75-4.1" pathLength={100} />
                          </svg>
                        ) : null}
                      </span>
                      {r.text}
                    </li>
                  ))}
                </ul>
                <p className="note">{content.process.brief.note}</p>
                <div className="briefphoto">
                  <ImgSlot slot={content.process.brief.photo} />
                  {content.process.brief.photo.label ? (
                    <div className="cap">{content.process.brief.photo.label}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Stage 02: the live pair-session code panel. */}
            <div className="stage rvl">
              <div>
                <span className="stage-n">{stage2.n}</span>
                <span className="eyebrow">{stage2.eyebrow}</span>
                <h3>{stage2.h3}</h3>
                <p className="body">{stage2.body}</p>
                <p className="emph">{stage2.emphasis}</p>
                {stage2.arrow ? <span className="stage-arrow">{stage2.arrow}</span> : null}
              </div>
              <div className="codepanel rvl" style={{ transitionDelay: '140ms' }}>
                <div className="codebar">
                  <span className="dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="title">{content.process.code.title}</span>
                  <span className="live">
                    <i aria-hidden="true" />
                    {content.process.code.live}
                  </span>
                </div>
                <div className="codebody">
                  {/* The session transcript is illustrative, so it is one
                      aria-hidden block rather than nine announced lines. */}
                  <div className="codelines" aria-hidden="true">
                    {content.process.code.lines.map((line, i) => (
                      <code
                        key={line.text}
                        className={cn('rvl', line.comment && 'cmt')}
                        style={{ transitionDelay: `${i * 180}ms`, paddingLeft: `${line.indent * 13}px` }}
                      >
                        {line.text}
                        {i === content.process.code.lines.length - 1 ? <span className="caret" /> : null}
                      </code>
                    ))}
                  </div>
                  <div className="coderail">
                    {content.process.code.rail.map((slot) => (
                      <div key={slot.brief} className="imgslot">
                        {slot.image ? (
                          <SlotImage slot={slot} sizes="(max-width: 900px) 50vw, 168px" />
                        ) : (
                          <span className="brief">{slot.brief}</span>
                        )}
                        {slot.label ? <span className="name">{slot.label}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 03: the written report, the one light object on the page. */}
            <div className="stage rvl">
              <div>
                <span className="stage-n">{stage3.n}</span>
                <span className="eyebrow">{stage3.eyebrow}</span>
                <h3>{stage3.h3}</h3>
                <p className="body">{stage3.body}</p>
                <p className="emph">{stage3.emphasis}</p>
                {stage3.arrow ? <span className="stage-arrow">{stage3.arrow}</span> : null}
              </div>
              <div className="report rvl" style={{ transitionDelay: '140ms' }}>
                <div className="report-head">
                  <Monogram initial={content.process.report.initial} className="report-mono" />
                  <div>
                    <div className="role">{content.process.report.role}</div>
                    <div className="meta">{content.process.report.meta}</div>
                  </div>
                  <span className="open">{content.process.report.open}</span>
                </div>
                <div className="report-tabs" aria-hidden="true">
                  {content.process.report.tabs.map((t, i) => (
                    <span key={t} className={cn(i === 0 && 'on')}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="scores">
                  {content.process.report.scores.map((s, i) => (
                    <div key={s.label} className="score">
                      <span className="lbl">{s.label}</span>
                      <span className="track grow" style={{ transitionDelay: `${i * 120}ms` }}>
                        <span
                          className={cn('bar', s.tone === 'amber' && 'amber')}
                          style={barStyle(s.pct, i * 120)}
                        />
                      </span>
                      <span className={cn('val', s.tone === 'amber' && 'amber')}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <p className="note">{content.process.report.note}</p>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="funnel rvl">
            <span className="label">{content.process.funnel.label}</span>
            <div className="funnel-rows">
              {content.process.funnel.rows.map((row, i) => {
                const isLast = i === content.process.funnel.rows.length - 1
                return (
                  <div key={row.label} className="funnel-row">
                    <span className="lbl">{row.label}</span>
                    <span className="track grow" style={{ transitionDelay: `${i * 120}ms` }}>
                      <span
                        className={cn('bar', isLast && 'lime', !isLast && 'teal')}
                        style={barStyle(row.pct, i * 120)}
                      />
                    </span>
                    <span className="val">{row.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── DE-RISK BAND ── */}
      <section className="derisk">
        <ul>
          {content.derisk.claims.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      {/* ── DIFFERENTIATORS ── */}
      <section className="diffs">
        <div className="wrap">
          <span className="eyebrow">{content.differentiators.eyebrow}</span>
          <h2 className="st">
            {content.differentiators.h2Lead}
            <em>{content.differentiators.h2Em}</em>
            {content.differentiators.h2Tail}
          </h2>
          <p className="lead">{content.differentiators.lead}</p>
          <div className="diff-grid">
            {content.differentiators.cards.map((c, i) => (
              <div key={c.h3} className="diff rvl" style={{ transitionDelay: `${i * 120}ms` }}>
                <span className="ic">{DIFF_ICONS[i]}</span>
                <h3>{c.h3}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTAKE ── */}
      <section className="intake" id="intake">
        <div className="wrap">
          <div className="intake-head">
            <span className="eyebrow">{content.intake.eyebrow}</span>
            <h2 className="st">
              {content.intake.h2Lead}
              <em>{content.intake.h2Em}</em>
            </h2>
            <p className="lead">{content.intake.lead}</p>
          </div>
          <IntakeForm copy={content.intake} sourcePage={sourcePage} locale={locale} />
          <span className="intake-cap">{content.intake.caption}</span>
        </div>
      </section>

      {/* ── FAQ ──
          The SITEWIDE FAQ section (components/templates/catalogue/faq-panel),
          not a bespoke one. Home, How It Works, Pricing, Location and the
          Service/Technology detail pages all render this component; the six
          hand-rolled copies that preceded it all looked slightly different,
          which is exactly why it exists. This page supplies its own headline and
          its own answer renderer and takes the shared structure, spacing,
          numbering, dividers and rotating-plus accordion as they are.

          `renderAnswer` is what lets the last answer carry a link to the other
          market without splitting the copy into fields: the FAQPage JSON-LD and
          the visible answer have to be the same string. */}
      {/* `shared-ui` exempts this subtree from the page's wildcard margin and
          padding reset - without it the shared panel renders unstyled. See the
          note in hire-engineers-market.css. */}
      <div className="shared-ui">
      <CatalogueFaqPanel
        id="faq"
        locale={locale}
        items={content.faq.items}
        copy={{
          eyebrow: content.faq.eyebrow,
          titleLead: content.faq.titleLead,
          titleAccent: content.faq.titleAccent,
          cardLabel: content.faq.card.h3,
          cardBody: content.faq.card.p,
          cardCta: content.faq.card.cta,
        }}
        renderAnswer={(item) => <FaqAnswer item={item} locale={locale} />}
      />
      </div>

      {/* ── FINAL CTA ──
          REMOVED (Jake, 15 Aug), the same call and the same reason as
          hire-engineers on 3 Aug: the sitewide footer opens with FooterTopCta
          ("Ready to hire your next engineer?"), so a band here asked the reader
          the same question twice, in two different colours, about 200px apart.
          The footer band stays; this one added nothing.

          `content.finalCta` is deliberately LEFT IN the content files rather
          than deleted - it is inert where it sits, and restoring the band is one
          JSX block away if the footer CTA is ever suppressed on these routes
          instead. */}
    </main>
  )
}
