'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { parseVideoUrl } from '@/components/ui/video-embed'
import { FCTO, type FctoContent } from './content'
import './fractional-cto.css'

// Fractional CTO landing page (/services/fractional-ctos).
// 1:1 port of docs/raw-html/Fractional CTO Page (offline).html. The design
// system lives in ./fractional-cto.css (scoped under .fcto); this component
// reproduces the source markup and re-implements the source <script> behaviour
// with React state. The source's own chrome placeholders are intentionally
// dropped - the shared global header + footer render those (same as
// hire-engineers). Candidate/video/step imagery uses the styled placeholder
// containers from the source (gradient/solid fills); real assets drop into the
// same slots later without layout change.

// ── Inline stroke icons (styling comes from the scoped CSS) ──
function Arrow() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
function Check() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}
function PlayTri() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

const STATUS_ICONS: Record<string, ReactNode> = {
  clock: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  shieldCheck: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
}

// "What they do" card icons, in section order.
const DOES_ICONS: ReactNode[] = [
  <svg key="d0" viewBox="0 0 24 24">
    <path d="M9 6l-6 3v9l6-3 6 3 6-3V6l-6 3z" />
    <path d="M9 6v9M15 9v9" />
  </svg>,
  <svg key="d1" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>,
  <svg key="d2" viewBox="0 0 24 24">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    <path d="M16 4.5a3.2 3.2 0 0 1 0 7M18 20c0-3-1-4.5-3-5.2" />
  </svg>,
  <svg key="d3" viewBox="0 0 24 24">
    <path d="M4 19V5M4 19h16" />
    <path d="M7 15l4-4 3 3 5-6" />
  </svg>,
  <svg key="d4" viewBox="0 0 24 24">
    <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
  </svg>,
  <svg key="d5" viewBox="0 0 24 24">
    <path d="M8 11l3 3 5-6" />
    <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
  </svg>,
]

// "Matched in 7 days" step-row icons, in order.
const MATCHED_STEP_ICONS: ReactNode[] = [
  <svg key="m0" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r=".5" />
  </svg>,
  <svg key="m1" viewBox="0 0 24 24">
    <path d="M17 11V7a5 5 0 0 0-10 0v4" />
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M12 15v2" />
  </svg>,
  <svg key="m2" viewBox="0 0 24 24">
    <path d="M5 15c-1.5 2-2 5-2 5s3-.5 5-2M6.5 13.5C8 8 12 4 20 4c0 8-4 12-9.5 13.5z" />
  </svg>,
]

// Match-form option icons, in order (5th option is .wide).
const MF_OPTION_ICONS: ReactNode[] = [
  <svg key="o0" viewBox="0 0 24 24">
    <path d="M12 21c-4-3-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7-7 10z" />
    <path d="M12 8v5M9 11c1.5 0 3-1 3-3M15 11c-1.5 0-3-1-3-3" />
  </svg>,
  <svg key="o1" viewBox="0 0 24 24">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6L5 20l6-6a4 4 0 0 0 5.4-5.4l-2 2-2-2z" />
  </svg>,
  <svg key="o2" viewBox="0 0 24 24">
    <path d="M4 18l5-5 3 3 8-8" />
    <path d="M16 8h4v4" />
  </svg>,
  <svg key="o3" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>,
  <svg key="o4" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>,
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Hero candidate cluster: staggered entrance then slow float ──
function HeroCluster({ hero }: { hero: FctoContent['hero'] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.cc'))
    const pills = Array.from(root.querySelectorAll<HTMLElement>('.cc-status'))

    if (prefersReducedMotion()) {
      cards.forEach((c) => c.classList.add('in'))
      pills.forEach((p) => p.classList.add('in'))
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    cards.forEach((c, i) => {
      timers.push(
        setTimeout(() => {
          c.classList.add('in')
          timers.push(setTimeout(() => c.classList.add('f'), 740))
        }, 120 + i * 180),
      )
    })
    pills.forEach((p, i) => {
      timers.push(setTimeout(() => p.classList.add('in'), 700 + i * 260))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="cluster" id="cluster" ref={ref}>
      {hero.cards.map((c) => (
        <div
          key={c.name}
          className="cc"
          style={{ left: c.left, top: c.top, ['--rot']: c.rot } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="ava">{c.image ? <img src={c.image} alt={c.name} /> : null}</div>
          <div className="body">
            <div className="rolerow">
              <span className="role">{c.role}</span>
              <span className="days">{c.days}</span>
            </div>
            <div className="name">{c.name}</div>
            <div className="cred">{c.cred}</div>
            <div className="tags">
              {c.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
      {hero.statusPills.map((p) => (
        <div key={p.label} className="cc-status" style={{ left: p.left, top: p.top }}>
          <span className="r">{STATUS_ICONS[p.icon]}</span>
          {p.label}
        </div>
      ))}
    </div>
  )
}

// ── Logo marquee: content rendered twice for the seamless -50% CSS loop ──
function LogoMarquee({ logos: names }: { logos: string[] }) {
  const logos = [...names, ...names]
  return (
    <div className="marquee">
      <div className="marquee-track" id="logoTrack">
        {logos.map((name, i) => (
          <span key={`${name}-${i}`} className="logo-name">
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

// Build a provider embed URL (autoplay) from a parsed YouTube/Vimeo/Loom link.
function fctoEmbedSrc(parsed: NonNullable<ReturnType<typeof parseVideoUrl>>): string {
  if (parsed.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0`
  }
  if (parsed.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${parsed.id}?autoplay=1`
  }
  if (parsed.provider === 'linkedin') {
    return `https://www.linkedin.com/embed/feed/update/urn:li:share:${parsed.id}`
  }
  return `https://www.loom.com/embed/${parsed.id}?autoplay=1`
}

// ── Video tile: when a real videoUrl is set, play toggles a provider iframe.
// Otherwise it falls back to the source's stylised placeholder (progress bar). ──
function VideoTile({ video }: { video: FctoContent['video'] }) {
  const [playing, setPlaying] = useState(false)
  const barRef = useRef<HTMLElement>(null)

  const parsed = video.videoUrl ? parseVideoUrl(video.videoUrl) : null
  // Thumbnail: explicit poster wins; otherwise auto-use the YouTube still.
  const poster =
    video.poster ||
    (parsed?.provider === 'youtube' ? `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg` : '')

  function toggle() {
    if (parsed) {
      setPlaying(true)
      return
    }
    const next = !playing
    setPlaying(next)
    const bar = barRef.current
    if (bar) {
      bar.style.transition = next ? 'width 90s linear' : 'width .3s ease'
      bar.style.width = next ? '100%' : '0'
    }
  }

  if (playing && parsed) {
    return (
      <div className="video-shell">
        <div className="video-tile playing" id="videoTile">
          <iframe
            src={fctoEmbedSrc(parsed)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="video-shell">
      <div className={cn('video-tile', playing && 'playing')} id="videoTile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {poster ? <img src={poster} alt={video.title} /> : null}
        <div className="scrim" />
        <div className="video-tag">
          <span className="rec" /> {video.tag}
        </div>
        <div className="video-name">
          <div className="n">{video.name}</div>
          <div className="r">{video.role}</div>
        </div>
        <button className="video-play" id="videoPlay" type="button" onClick={toggle}>
          <span className="tri">
            <PlayTri />
          </span>
          {video.play}
        </button>
      </div>
      <div className="video-caption">
        <span>{video.timeStart}</span>
        <span className="bar">
          <i id="videoBar" ref={barRef} />
        </span>
        <span>{video.timeEnd}</span>
        <span id="videoState">{playing ? video.statePlaying : video.stateIdle}</span>
      </div>
    </div>
  )
}

// ── Statement cursor-follow glow: pointer tracked across the whole section ──
function StatementGlow({ statement }: { statement: FctoContent['statement'] }) {
  const secRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const line = (
    <>
      <span className="lite">{statement.line1}</span>
      <br />
      <span className="lime">{statement.line2}</span>
    </>
  )

  function onEnter() {
    if (prefersReducedMotion()) return
    glowRef.current?.classList.add('lit')
  }
  function onLeave() {
    const g = glowRef.current
    if (!g) return
    g.classList.remove('lit')
    g.style.removeProperty('--mx')
    g.style.removeProperty('--my')
  }
  function onMove(e: React.PointerEvent) {
    if (prefersReducedMotion()) return
    const g = glowRef.current
    if (!g) return
    const r = g.getBoundingClientRect()
    g.style.setProperty('--mx', `${e.clientX - r.left}px`)
    g.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <section className="statement" ref={secRef} onPointerEnter={onEnter} onPointerLeave={onLeave} onPointerMove={onMove}>
      <div className="wrap">
        <span className="eyebrow">{statement.eyebrow}</span>
        <div className="glow" id="glowStmt" ref={glowRef}>
          <h2 className="base">{line}</h2>
          <h2 className="torch" aria-hidden="true">
            {line}
          </h2>
        </div>
        <div className="sub">{statement.sub}</div>
      </div>
    </section>
  )
}

// ── De-risk marquees: two rows, each duplicated for the loop; row B rotated ──
function DeriskRow({ seq, dir }: { seq: readonly string[]; dir: 'l' | 'r' }) {
  const doubled = [...seq, ...seq]
  return (
    <div className="drow">
      <div className={cn('dtrack', dir)}>
        {doubled.map((b, i) => (
          <span key={`${b}-${i}`} className="contents">
            <span className="chip">{b}</span>
            <span className="dia" />
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Multi-step match form ──
function MatchForm({ mf }: { mf: FctoContent['matchform'] }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(0)

  const nextLabel = step === 2 ? mf.nextStep2 : step === 3 ? mf.nextStep3 : mf.nextDefault

  return (
    <>
      <div className="mf-card">
        <div className="mf-progress" id="mfProgress">
          {mf.progress.map((s, i) => (
            <div key={s.num} className={cn('st', i <= step && 'done')}>
              <span className="num">{s.num}</span>
              <span className="lb">{s.lb}</span>
            </div>
          ))}
        </div>
        <div className="mf-q">
          <h3 id="mfTitle">{mf.steps[step].title}</h3>
          <p id="mfHint">{mf.steps[step].hint}</p>
        </div>
        <div className="mf-opts" id="mfOpts" style={{ display: step === 3 ? 'none' : 'grid' }}>
          {mf.options.map((o, i) => (
            <button
              key={o.label}
              type="button"
              className={cn('mf-opt', o.wide && 'wide', selected === i && 'on')}
              onClick={() => setSelected(i)}
            >
              {MF_OPTION_ICONS[i]}
              <span>{o.label}</span>
            </button>
          ))}
        </div>
        <div className="mf-nav" style={{ justifyContent: step === 3 ? 'flex-start' : 'space-between' }}>
          <button
            className="mf-back"
            id="mfBack"
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => (s > 0 ? s - 1 : s))}
          >
            {mf.back}
          </button>
          <button
            className="btn-primary"
            id="mfNext"
            type="button"
            style={{ flexDirection: 'row-reverse', padding: '14px 14px 14px 24px' }}
            onClick={() => setStep((s) => (s < 3 ? s + 1 : s))}
          >
            {nextLabel}
            <span className="arw">
              <Arrow />
            </span>
          </button>
        </div>
      </div>
      <div className="mf-reassure">
        <div className="mf-talk">
          <span className="lbl">{mf.reassureLabel}</span>
          <button className="pill-soft" type="button">
            <ChatIcon /> {mf.pillAi}
          </button>
          <button className="pill-soft" type="button">
            <CalendarIcon /> {mf.pillBook}
          </button>
        </div>
        <div className="trust-row" style={{ justifyContent: 'center', marginTop: 0 }}>
          {mf.trust.map((t) => (
            <span key={t} className="t">
              <Check /> {t}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

export function FractionalCtoTemplate({ content = FCTO }: { content?: FctoContent }) {
  const rootRef = useRef<HTMLElement>(null)

  // Scroll reveal: add `.in` to `.rvl` elements as they enter view (source
  // IntersectionObserver, threshold .14). Reduced motion is handled in CSS.
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
      { threshold: 0.14 },
    )
    root.querySelectorAll('.rvl').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const derisk = content.derisk.benefits
  const rowB = [derisk[2], derisk[3], derisk[0], derisk[1]]

  return (
    <main id="main" className="fcto" ref={rootRef}>
      {/* 1. HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow-pill">
              <span className="d" />
              <span className="eyebrow">{content.hero.eyebrow}</span>
            </span>
            <h1>
              {content.hero.h1Lead} <em>{content.hero.h1Em}</em>
            </h1>
            <p className="hero-sub">{content.hero.sub}</p>
            <div className="hero-ctas">
              <a href="#match" className="btn-primary">
                <span className="arw">
                  <Arrow />
                </span>
                {content.hero.ctaPrimary}
              </a>
              <a href="#how" className="btn-ghost">
                {content.hero.ctaGhost}
              </a>
            </div>
            <div className="trust-row">
              {content.hero.trust.map((t) => (
                <span key={t} className="t">
                  <Check /> {t}
                </span>
              ))}
            </div>
          </div>
          <HeroCluster hero={content.hero} />
        </div>
      </section>

      {/* 2. TRUSTED BY */}
      <section className="trusted">
        <div className="wrap trusted-inner">
          <span className="trusted-label">{content.trusted.label}</span>
          <span className="trusted-div" />
          <LogoMarquee logos={content.trusted.logos} />
          <button className="pill-soft ai-pill" type="button">
            <ChatIcon /> {content.trusted.aiPill}
          </button>
        </div>
      </section>

      {/* 3. VIDEO */}
      <section className="video" id="how">
        <div className="wrap">
          <span className="eyebrow">{content.video.eyebrow}</span>
          <h2 className="section-title">{content.video.title}</h2>
          <VideoTile video={content.video} />
        </div>
      </section>

      {/* 4. WHAT THEY DO */}
      <section className="does">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow">{content.does.eyebrow}</span>
            <h2 className="section-title">{content.does.title}</h2>
          </div>
          <div className="does-grid">
            {content.does.cards.map((c, i) => (
              <div key={c.h4} className="do-card rvl">
                <div className="ic">{DOES_ICONS[i]}</div>
                <h4>{c.h4}</h4>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. STATEMENT */}
      <StatementGlow statement={content.statement} />

      {/* 6. MATCHED IN 7 DAYS */}
      <section className="matched" id="process">
        <div className="wrap">
          <div className="top">
            <div>
              <span className="eyebrow">{content.matched.eyebrow}</span>
              <h2>
                {content.matched.h2Lead} <em>{content.matched.h2Em}</em>
              </h2>
            </div>
            <p className="sub">{content.matched.topSub}</p>
          </div>
          <div className="m-grid">
            <div className="m-feature rvl">
              <div className="badge">
                <ChatIcon />
              </div>
              <h3>{content.matched.feature.h3}</h3>
              <p>{content.matched.feature.p}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="m-photo">
                {content.matched.feature.image ? (
                  <img src={content.matched.feature.image} alt={content.matched.feature.h3} />
                ) : null}
              </div>
              <div className="foot">{content.matched.feature.foot}</div>
            </div>
            <div className="m-steps">
              {content.matched.steps.map((s, i) => (
                <div key={s.h4} className="m-step rvl">
                  <div className="r">{MATCHED_STEP_ICONS[i]}</div>
                  <div>
                    <h4>{s.h4}</h4>
                    <p>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY LOW RISK */}
      <section className="derisk">
        <div className="wrap">
          <span className="eyebrow">{content.derisk.eyebrow}</span>
        </div>
        <DeriskRow seq={derisk} dir="l" />
        <DeriskRow seq={rowB} dir="r" />
      </section>

      {/* 8. SELF CHECK */}
      <section className="selfcheck">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow">{content.selfcheck.eyebrow}</span>
            <h2 className="section-title">
              {content.selfcheck.h2Lead} <em>{content.selfcheck.h2Em}</em>
            </h2>
          </div>
          <div className="sc-grid">
            {content.selfcheck.items.map((it) => (
              <div key={it.n} className="sc-item">
                <span className="n">{it.n}</span>
                <p>{it.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. MATCH FORM */}
      <section className="matchform" id="match">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow">{content.matchform.eyebrow}</span>
            <h2>
              {content.matchform.h2Lead} <em>{content.matchform.h2Em}</em>
            </h2>
            <p className="lead">{content.matchform.lead}</p>
          </div>
          <MatchForm mf={content.matchform} />
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="faq">
        <div className="wrap faq-grid">
          <div className="faq-left">
            <span className="eyebrow">{content.faq.eyebrow}</span>
            <h2>{content.faq.title}</h2>
            <div className="faq-cta">
              <span className="eyebrow">{content.faq.ctaEyebrow}</span>
              <p>{content.faq.ctaBody}</p>
              <a href="#" className="btn-primary">
                <span className="arw">
                  <Arrow />
                </span>
                {content.faq.ctaBtn}
              </a>
            </div>
          </div>
          <div className="faq-list">
            {content.faq.items.map((f, i) => (
              <details key={f.n} className="faq-item" name="fcto-faq" open={i === 0}>
                <summary className="faq-q">
                  <span className="n">{f.n}</span>
                  <span className="q">{f.q}</span>
                  <span className="tog" />
                </summary>
                <div className="faq-a">
                  <div className="inner">{f.a}</div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA */}
      <section className="final">
        <div className="wrap final-inner">
          <div>
            <h2>
              {content.final.h2Lead} <em>{content.final.h2Em}</em>
            </h2>
            <p>{content.final.p}</p>
          </div>
          <div className="r">
            <a href="#match" className="btn-dark">
              <span className="arw">
                <Arrow />
              </span>
              {content.final.cta}
            </a>
            <div className="metrics">
              {content.final.metrics.map((m) => (
                <span key={m} className="m">
                  <span className="d" />
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
