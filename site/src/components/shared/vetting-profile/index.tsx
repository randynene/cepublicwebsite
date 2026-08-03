'use client'

// Vetting Profile - the "You see two people, not 200 CVs" proof section.
//
// One component, mounted by every page that needs it. Port of
// docs/design/Vetting Profile.html; the copy lives in ./content.ts and the
// styling in ./vetting-profile.css (both carry their own deviation notes).
//
// AUTOPLAY, and why there is no setInterval here
// ----------------------------------------------
// The card cycles its six tabs, with a 6s lime sweep filling across the active
// pill. The reference ran a 6s interval AND a 6s CSS animation side by side and
// skipped interval ticks while the pointer was over the card, so the two drifted
// apart the first time anyone hovered.
//
// Instead the sweep IS the clock: when its animation ends, the tab advances.
// That gives us the rest of the behaviour for free, because a CSS animation can
// be paused:
//   - off-screen or keyboard-focused    -> animation-play-state: paused, so the
//     sweep freezes where it is and the tab does not advance. Resuming picks up
//     the remaining time rather than restarting it.
//   - backgrounded browser tab          -> the browser pauses it for us.
//   - clicked, or reduced motion        -> the sweep is not rendered at all, so
//     nothing ever advances again.
//
// prefers-reduced-motion stops autoplay outright rather than merely dropping the
// sweep graphic: content that changes itself on a timer is the thing the setting
// is asking us not to do, and the tabs stay fully usable by hand.

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'

import { ChatLink } from '@/components/shared/chat-link'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale-path'

import {
  VETTING_PROFILE,
  type VettingBar,
  type VettingFact,
  type VettingProfileContent,
  type VettingRating,
  type VettingTabId,
} from './content'
import './vetting-profile.css'

const DIFF_LINE_CLASS: Record<'add' | 'remove', string> = {
  add: 'is-add',
  remove: 'is-remove',
}

function ratingText(template: string, score: number, max: number): string {
  return template.replace('{score}', String(score)).replace('{max}', String(max))
}

function Bars({
  bars,
  variant,
}: {
  bars: VettingBar[]
  variant?: 'traits'
}) {
  return (
    <div className={cn('vp-bars', variant === 'traits' && 'is-traits')}>
      {bars.map((bar) => (
        <div className="vp-bar" key={bar.label}>
          <span className="vp-bar-label">{bar.label}</span>
          <span className="vp-bar-track">
            <span className={cn('vp-bar-fill', bar.muted && 'is-muted')} style={{ width: `${bar.width}%` }} />
          </span>
          <span className="vp-bar-value">{bar.value}</span>
        </div>
      ))}
    </div>
  )
}

function Tiles({
  items,
  columns,
}: {
  items: (VettingFact & { accent?: boolean })[]
  columns: 2 | 3 | 4
}) {
  return (
    <div className={`vp-tiles vp-tiles-${columns}`}>
      {items.map((item) => (
        <div className="vp-tile" key={item.label}>
          <div className="vp-tile-label">{item.label}</div>
          <div className={cn('vp-tile-value', item.accent && 'is-accent')}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function Ratings({
  ratings,
  max,
  template,
  tight,
}: {
  ratings: VettingRating[]
  max: number
  template: string
  tight?: boolean
}) {
  return (
    <div className={cn('vp-ratings', tight && 'is-tight')}>
      {ratings.map((rating) => (
        <div className="vp-rating" key={rating.label}>
          <span className="vp-rating-label">{rating.label}</span>
          {/* The dots are a picture of the score; the score itself is read out. */}
          <span className="vp-dots" aria-hidden="true">
            {Array.from({ length: max }, (_, i) => (
              <i className={cn('vp-dot', i < rating.score && 'is-on')} key={i} />
            ))}
          </span>
          <span className="vp-sr">{ratingText(template, rating.score, max)}</span>
        </div>
      ))}
    </div>
  )
}

export interface VettingProfileProps {
  content?: VettingProfileContent
  locale?: Locale
  /** Anchor target, when a page wants to link at the section. */
  id?: string
  className?: string
}

export function VettingProfile({
  content = VETTING_PROFILE,
  locale = 'en-US',
  id,
  className,
}: VettingProfileProps) {
  const { candidate, panels, footer } = content
  const tabs = content.tabs

  const [activeTab, setActiveTab] = useState<VettingTabId>(tabs[0].id)
  /** Latches on the first time the section comes into view. */
  const [seen, setSeen] = useState(false)
  /** Tracks whether it is still in view, so autoplay does not run off-screen. */
  const [onScreen, setOnScreen] = useState(false)
  /** Keyboard focus is inside the card. */
  const [engaged, setEngaged] = useState(false)
  /** The visitor took control, or asked for reduced motion. Never comes back. */
  const [stopped, setStopped] = useState(false)

  const sectionRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (query.matches) setStopped(true)
    }
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.isIntersecting)
        if (entry.isIntersecting) setSeen(true)
      },
      { rootMargin: '0px 0px -20%' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const autoplaying = seen && !stopped
  const paused = !onScreen || engaged

  const advance = useCallback(() => {
    setActiveTab((current) => {
      const next = tabs.findIndex((tab) => tab.id === current) + 1
      return tabs[next % tabs.length].id
    })
  }, [tabs])

  /** Any deliberate tab selection ends autoplay for the rest of the page's life. */
  const selectTab = useCallback((tabId: VettingTabId) => {
    setActiveTab(tabId)
    setStopped(true)
  }, [])

  const onTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = tabs.length - 1
      let target: number | null = null
      if (event.key === 'ArrowRight') target = index === last ? 0 : index + 1
      else if (event.key === 'ArrowLeft') target = index === 0 ? last : index - 1
      else if (event.key === 'Home') target = 0
      else if (event.key === 'End') target = last
      if (target === null) return
      event.preventDefault()
      selectTab(tabs[target].id)
      tabRefs.current[target]?.focus()
    },
    [selectTab, tabs],
  )

  const panelProps = (tabId: VettingTabId) => ({
    className: cn('vp-panel', tabId === activeTab && 'is-active'),
    id: `vp-panel-${tabId}`,
    role: 'tabpanel' as const,
    'aria-labelledby': `vp-tab-${tabId}`,
    tabIndex: tabId === activeTab ? 0 : -1,
  })

  return (
    <section className={cn('vp', className)} id={id} ref={sectionRef}>
      <div className="vp-band">
        <div className="vp-grid">
          {/* ── Left: the claim ──
              The heading lives inside the column rather than above the grid so
              the card's top edge starts level with the eyebrow. */}
          <div className="vp-col">
            <p className="vp-eyebrow">{content.eyebrow}</p>
            <h2 className="vp-heading">
              {content.headingLead} <em>{content.headingAccent}</em>
            </h2>

            <div className="vp-points">
              {content.points.map((point) => (
                <div className="vp-point" key={point.title}>
                  <span className="vp-point-mark" aria-hidden="true">
                    {content.checkGlyph}
                  </span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.body}</p>
                  </div>
                </div>
              ))}

              <div className="vp-explainer">
                <p className="vp-explainer-body">{content.explainer.body}</p>
                <ul className="vp-stages">
                  {content.explainer.stages.map((stage) => (
                    <li key={stage}>{stage}</li>
                  ))}
                </ul>
                <p className="vp-explainer-note">{content.explainer.note}</p>
              </div>
            </div>
          </div>

          {/* ── Right: the evidence ── */}
          {/* Pauses on keyboard focus but NOT on hover. Hover-pause was the
              original behaviour and it made the section look broken: a reader's
              cursor naturally comes to rest over the card, the cycle froze, and
              the card read as static. Keyboard focus still pauses, because a
              keyboard user stepping through the tabs does need them to hold
              still under them.

              React's onFocus/onBlur are focusin/focusout, so they cover focus
              anywhere inside the card. The relatedTarget check keeps arrowing
              between two tabs from reading as "left the card". */}
          <div
            className="vp-card"
            onFocus={() => setEngaged(true)}
            onBlur={(event: FocusEvent<HTMLDivElement>) => {
              if (event.currentTarget.contains(event.relatedTarget)) return
              setEngaged(false)
            }}
          >
            <div className="vp-card-head">
              <div className="vp-photo-wrap">
                <Image
                  className="vp-photo"
                  src={candidate.photo}
                  alt={candidate.photoAlt}
                  width={candidate.photoWidth}
                  height={candidate.photoHeight}
                  loading="lazy"
                  quality={80}
                />
                <span className="vp-photo-check" role="img" aria-label={candidate.verifiedLabel}>
                  {candidate.verifiedGlyph}
                </span>
              </div>
              <div className="vp-identity">
                <div className="vp-name-row">
                  <p className="vp-name">{candidate.name}</p>
                  <span className="vp-badge">{candidate.badge}</span>
                </div>
                <p className="vp-role">{candidate.roleLine}</p>
                <p className="vp-meta">
                  <span>
                    <span className="vp-rate">{candidate.rate}</span>
                    {candidate.ratePer}
                  </span>
                  <span className="vp-meta-sep" aria-hidden="true">
                    {candidate.separator}
                  </span>
                  <span>{candidate.availability}</span>
                </p>
              </div>
            </div>

            <div className="vp-tabs" role="tablist" aria-label={content.eyebrow}>
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`vp-tab-${tab.id}`}
                  className="vp-tab"
                  aria-selected={tab.id === activeTab}
                  aria-controls={`vp-panel-${tab.id}`}
                  tabIndex={tab.id === activeTab ? 0 : -1}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  onClick={() => selectTab(tab.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {tab.label}
                  {autoplaying && tab.id === activeTab ? (
                    <span
                      className="vp-sweep"
                      style={{ animationPlayState: paused ? 'paused' : 'running' }}
                      onAnimationEnd={advance}
                    />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="vp-panels">
              {/* Overview */}
              <div {...panelProps('overview')}>
                <p className="vp-label">{panels.overview.label}</p>
                <p className="vp-summary">{panels.overview.summary}</p>
                <Bars bars={panels.overview.scores} />
                <Tiles items={panels.overview.facts} columns={4} />
                <p className="vp-note-row">
                  <span className="vp-pill">{panels.overview.aiBadge}</span>
                  <span>{panels.overview.aiBody}</span>
                </p>
              </div>

              {/* CV */}
              <div {...panelProps('cv')}>
                <p className="vp-label">{panels.cv.label}</p>
                <div className="vp-history">
                  {panels.cv.roles.map((role) => (
                    <div className="vp-role-row" key={role.period}>
                      <div className="vp-role-period">{role.period}</div>
                      <div>
                        <p className="vp-role-title">{role.title}</p>
                        <p className="vp-role-org">{role.org}</p>
                        {role.body ? <p className="vp-role-body">{role.body}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="vp-chips">
                  {panels.cv.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>

              {/* Tech interview */}
              <div {...panelProps('interview')}>
                <div className="vp-panel-head is-centred">
                  <div>
                    <p className="vp-label">{panels.interview.label}</p>
                    <p className="vp-assessor">
                      {panels.interview.assessedByLead}
                      <strong>{panels.interview.assessorName}</strong>
                      {panels.interview.assessedByTail}
                    </p>
                  </div>
                  <p className="vp-stamp">
                    {panels.interview.date}
                    <br />
                    {panels.interview.duration}
                  </p>
                </div>
                <Ratings
                  ratings={panels.interview.ratings}
                  max={content.ratingMax}
                  template={content.ratingTemplate}
                />
                <blockquote className="vp-quote">
                  <p>{panels.interview.quote}</p>
                </blockquote>
              </div>

              {/* Coding test */}
              <div {...panelProps('coding')}>
                <div className="vp-panel-head">
                  <div>
                    <p className="vp-label">{panels.coding.label}</p>
                    <p className="vp-task-title">{panels.coding.title}</p>
                    <p className="vp-task-meta">{panels.coding.meta}</p>
                  </div>
                  <p className="vp-score">
                    <span className="vp-score-value">{panels.coding.score}</span>
                    <br />
                    <span className="vp-score-label">{panels.coding.scoreLabel}</span>
                  </p>
                </div>
                <Tiles items={panels.coding.stats} columns={3} />
                <div className="vp-code">
                  <p className="vp-code-head">{panels.coding.diffFile}</p>
                  <pre className="vp-code-body">
                    {panels.coding.diffLines.map((line) => (
                      <span key={line.text} className={DIFF_LINE_CLASS[line.kind]}>
                        {line.text}
                      </span>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Psychometrics */}
              <div {...panelProps('psych')}>
                <div className="vp-panel-head">
                  <div>
                    <p className="vp-label">{panels.psych.label}</p>
                    <p className="vp-lead">{panels.psych.lead}</p>
                  </div>
                  <p className="vp-percentile">
                    <span className="vp-percentile-value">{panels.psych.percentile}</span>
                    <span className="vp-percentile-sub">
                      {panels.psych.percentileSubTop}
                      <br />
                      {panels.psych.percentileSubBottom}
                    </span>
                  </p>
                </div>
                <Bars bars={panels.psych.traits} variant="traits" />
                <ul className="vp-tags">
                  {panels.psych.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <p className="vp-panel-note">{panels.psych.note}</p>
              </div>

              {/* Soft skills */}
              <div {...panelProps('soft')}>
                <p className="vp-label">{panels.soft.label}</p>
                <Ratings
                  ratings={panels.soft.ratings}
                  max={content.ratingMax}
                  template={content.ratingTemplate}
                  tight
                />
                <Tiles items={panels.soft.facts} columns={2} />
                <blockquote className="vp-quote is-tight">
                  <p>{panels.soft.quote}</p>
                  <footer>{panels.soft.quoteSource}</footer>
                </blockquote>
              </div>
            </div>

            <div className="vp-card-foot">
              <p className="vp-card-foot-title">{footer.title}</p>
              <ChatLink href={footer.ctaHref} locale={locale} className="vp-card-cta">
                {footer.ctaLabel}
                <span aria-hidden="true">{footer.ctaArrow}</span>
              </ChatLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VettingProfile
