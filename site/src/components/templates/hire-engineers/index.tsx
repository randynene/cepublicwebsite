'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Spotlight } from '@/components/motion/spotlight'
import { cn } from '@/components/ui/_utils/cn'
import { parseVideoUrl } from '@/components/ui/video-embed'
import { CALC, HE, type HireEngineersContent } from './content'
import './hire-engineers.css'

// Inline style for a real photo dropped into a placeholder slot: fill the tile,
// cover-crop, inherit the tile's rounding. Empty slots keep the CSS placeholder.
const OFFER_IMG_PLACEHOLDER = 'imgslot offer-img rvl'
const OFFER_IMG_WITH_PHOTO = 'imgslot offer-img has-img rvl'

const COVER: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
}

// Build a provider embed URL (autoplay) from a parsed YouTube/Vimeo/Loom link.
function heEmbedSrc(parsed: NonNullable<ReturnType<typeof parseVideoUrl>>): string {
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

// Hire Engineers landing page (/services/software-engineers).
// 1:1 port of docs/raw-html/Hire Engineers Page (offline).html. The design
// system lives in ./hire-engineers.css (scoped under .he); this component
// reproduces the source markup and re-implements the source <script> behaviour
// with React state. The source's own <nav>/<footer> are intentionally dropped -
// the shared global header + footer render those (same as /our-work).

// ── Reused inline stroke icons (styling comes from the scoped CSS) ──
// Both take an optional `className` so call sites can opt into the "draw"
// hover motion (icon-motion icon-motion--draw); pathLength=100 normalises
// the dash maths for that motion regardless of the path's real length, and
// is otherwise inert.
function Arrow({ className }: { className?: string } = {}) {
  return (
    <svg viewBox="0 0 24 24">
      <path className={className} d="M5 12h14M13 6l6 6-6 6" pathLength={100} />
    </svg>
  )
}
function Check({ className }: { className?: string } = {}) {
  return (
    <svg viewBox="0 0 24 24">
      <path className={className} d="M20 6L9 17l-5-5" pathLength={100} />
    </svg>
  )
}

// Offer-card icons, in section order. Motion picked by what each card means:
// "Replace anytime" is the one process/loop concept (spin); the rest bob.
const OFFER_ICONS: ReactNode[] = [
  <svg key="o0" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
  </svg>,
  <svg key="o1" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>,
  <svg key="o2" viewBox="0 0 24 24" className="icon-motion icon-motion--spin">
    <path d="M3 12a9 9 0 0115.7-6M21 12a9 9 0 01-15.7 6" />
    <path d="M18 3v3h-3M6 21v-3h3" />
  </svg>,
  <svg key="o3" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7z" />
  </svg>,
]

// Role-card icons, in section order (matches roles.items). DevOps -> spin
// (process loop), AI/ML -> twinkle (sparkle), QA's checkmark and the
// catch-all's arrow -> draw (trace-in); the rest default to bob.
const ROLE_ICONS: ReactNode[] = [
  <svg key="r0" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
  </svg>,
  <svg key="r1" viewBox="0 0 24 24" className="icon-motion icon-motion--spin">
    <path d="M12 3v18M3 12h18" />
  </svg>,
  <svg key="r2" viewBox="0 0 24 24">
    <path className="icon-motion icon-motion--draw" d="M9 11l3 3 8-8" pathLength={100} />
    <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
  </svg>,
  <svg key="r3" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>,
  <svg key="r4" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M4 4h16v12H4z" />
    <path d="M8 20h8M12 16v4" />
  </svg>,
  <svg key="r5" viewBox="0 0 24 24" className="icon-motion icon-motion--twinkle">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>,
  <svg key="r6" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" />
  </svg>,
  <svg key="r7" viewBox="0 0 24 24">
    <path className="icon-motion icon-motion--draw" d="M5 12h14M13 6l6 6-6 6" pathLength={100} />
  </svg>,
]

// Step-0 role-option icons, in order (matches find.step0.opts). Same
// motion logic as ROLE_ICONS: AI/ML -> twinkle, DevOps -> spin, rest bob.
const STEP0_ICONS: ReactNode[] = [
  <svg key="s0" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>,
  <svg key="s1" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M3 9h18" />
  </svg>,
  <svg key="s2" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
  </svg>,
  <svg key="s3" viewBox="0 0 24 24" className="icon-motion icon-motion--twinkle">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M4 12H2M22 12h-2" />
  </svg>,
  <svg key="s4" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M4 4h16v12H4z" />
    <path d="M8 20h8" />
  </svg>,
  <svg key="s5" viewBox="0 0 24 24" className="icon-motion icon-motion--spin">
    <path d="M12 3v18M3 12h18" />
  </svg>,
  <svg key="s6" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>,
  <svg key="s7" viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
    <path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" />
  </svg>,
]

// ── Pricing cost calculator (source <script> engine, verbatim tables) ──
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
const r50 = (n: number) => Math.round(n / 50) * 50

function Calculator({ price }: { price: HireEngineersContent['price'] }) {
  const [role, setRole] = useState<string>(price.roleOptions[0])
  const [region, setRegion] = useState<string>(price.regionOptions[0])
  const [sen, setSen] = useState<string>(price.senOptions[0])
  const [cost, setCost] = useState<string>(price.initialCost)
  const [save, setSave] = useState<string>(price.initialSave)

  // Matches the source exactly: recompute only on a <select> change (the
  // opening figures are the hard-coded initial values until the user touches
  // a dropdown).
  function recompute(r: string, rg: string, s: string) {
    const m = r50(CALC.base[r] * CALC.rMult[rg] * CALC.sMult[s])
    const sv = Math.max(0, CALC.usA[r] * CALC.sMult[s] - m * 12)
    setCost(fmt(m))
    setSave(fmt(r50(sv)) + '/yr saved')
  }

  return (
    <div className="calc">
      <div className="calc-in">
        <div className="calc-field">
          <label>{price.roleLabel}</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              recompute(e.target.value, region, sen)
            }}
          >
            {price.roleOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="calc-field">
          <label>{price.regionLabel}</label>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              recompute(role, e.target.value, sen)
            }}
          >
            {price.regionOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="calc-field">
          <label>{price.senLabel}</label>
          <select
            value={sen}
            onChange={(e) => {
              setSen(e.target.value)
              recompute(role, region, e.target.value)
            }}
          >
            {price.senOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="calc-out">
        <div className="ol">{price.outLabel}</div>
        <div className="oc">
          {cost}
          <span className="per">{price.per}</span>
        </div>
        <div className="calc-div" />
        <div className="calc-save">
          <span style={{ opacity: 0.6 }}>{price.vsLabel}</span>
          <span>{save}</span>
        </div>
        <a
          href="#find"
          className="btn-primary"
          style={{ background: 'var(--ink)', color: '#fff', marginTop: '26px', alignSelf: 'flex-start' }}
        >
          <span className="arw" style={{ background: 'var(--lime)' }}>
            <svg viewBox="0 0 24 24" style={{ stroke: 'var(--ink)' }}>
              <path className="icon-motion icon-motion--draw" d="M5 12h14M13 6l6 6-6 6" pathLength={100} />
            </svg>
          </span>
          {price.cta}
        </a>
      </div>
    </div>
  )
}

// ── Multi-step "find your engineer" form ──
function OptionGroup({ options, icons, single }: { options: readonly string[]; icons?: ReactNode[]; single?: boolean }) {
  const [sel, setSel] = useState<Set<number>>(new Set())
  function toggle(i: number) {
    setSel((prev) => {
      if (single) return new Set([i])
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }
  return (
    <div className="opts">
      {options.map((o, i) => (
        <button key={o} type="button" className={cn('opt', 'icon-card', sel.has(i) && 'sel')} onClick={() => toggle(i)}>
          {icons ? <span className="ic">{icons[i]}</span> : null}
          <span className="on">{o}</span>
        </button>
      ))}
    </div>
  )
}

function FindForm({ find }: { find: HireEngineersContent['find'] }) {
  const [step, setStep] = useState(0)
  const next = () => setStep((s) => (s < 3 ? s + 1 : s))
  const back = () => setStep((s) => (s > 0 ? s - 1 : s))
  const sendLead = () => {}

  const stepClass = (i: number) => (i === step ? 'step active' : 'step')
  const stpClass = (i: number) => (i === step ? 'stp active' : i < step ? 'stp done' : 'stp')

  return (
    <div className="form-card">
      <div className="stepper">
        {find.stepper.map((s, i) => (
          <div key={s.num} className={stpClass(i)}>
            <span className="num">{s.num}</span>
            <span className="lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      <div className={stepClass(0)}>
        <div className="q">{find.step0.q}</div>
        <div className="q-hint">{find.step0.hint}</div>
        <OptionGroup options={find.step0.opts} icons={STEP0_ICONS} single />
      </div>

      <div className={stepClass(1)}>
        <div className="q">{find.step1.q}</div>
        <div className="q-hint">{find.step1.hint}</div>
        <OptionGroup options={find.step1.opts} />
      </div>

      <div className={stepClass(2)}>
        <div className="q">{find.step2.q}</div>
        <div className="q-hint">{find.step2.hint}</div>
        <OptionGroup options={find.step2.opts} single />
      </div>

      <div className={stepClass(3)}>
        <div className="q">{find.step3.q}</div>
        <div className="q-hint">{find.step3.hint}</div>
        <div className="matches">
          {find.step3.matches.map((m) => (
            <div key={m.nm} className="match">
              <span className="m-face">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.image ? (
                  <img src={m.image} alt={m.nm} style={COVER} />
                ) : (
                  <span className="ftag">{m.ftag}</span>
                )}
              </span>
              <div>
                <div className="m-nm">{m.nm}</div>
                <div className="m-rl">{m.rl}</div>
              </div>
              <div className="m-rate">
                <div className="r">{m.rate}</div>
                <div className="l">{find.step3.per}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="next" style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }} onClick={sendLead}>
          {find.step3.cta}
          <span className="arw">
            <Arrow className="icon-motion icon-motion--draw" />
          </span>
        </button>
      </div>

      <div className="card-foot" style={{ display: step === 3 ? 'none' : 'flex' }}>
        <div className="trust">
          {find.footTrust.map((t) => (
            <span key={t} className="t">
              <Check className="icon-motion icon-motion--draw" /> {t}
            </span>
          ))}
        </div>
        <div className="nav-btns">
          <button className="back" onClick={back} disabled={step === 0}>
            {find.back}
          </button>
          <button className="next" onClick={next}>
            {find.next}{' '}
            <span className="arw">
              <Arrow className="icon-motion icon-motion--draw" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Explorable profile (vetting section, right column) + faux modal ──
// The "90-second tour" link plays a real embed when vet.tourVideoUrl is set
// (optional vet.tourPoster shows as the still); otherwise it stays inert, as in
// the source design.
function ProfileExplorer({ vet }: { vet: HireEngineersContent['vet'] }) {
  const [open, setOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourPlaying, setTourPlaying] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const tourRef = useRef<HTMLDivElement>(null)

  const p = vet.profile
  const parsedTour = vet.tourVideoUrl ? parseVideoUrl(vet.tourVideoUrl) : null
  const tourPoster =
    vet.tourPoster ||
    (parsedTour?.provider === 'youtube'
      ? `https://img.youtube.com/vi/${parsedTour.id}/hqdefault.jpg`
      : '')

  function openProfile() {
    setOpen((o) => !o)
    requestAnimationFrame(() => modalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  function openTour(e: React.MouseEvent) {
    e.preventDefault()
    if (!parsedTour) return
    setTourOpen(true)
    // With no poster, autoplay straight into the embed.
    if (!tourPoster) setTourPlaying(true)
    requestAnimationFrame(() => tourRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  return (
    <div>
      <div className="prof-wrap" onClick={openProfile}>
        <div className="prof rvl">
          <div className="prof-top">
            <span className="prof-av">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={p.image} alt={p.nm} style={COVER} /> : p.av}
            </span>
            <div>
              <div className="prof-nm">{p.nm}</div>
              <div className="prof-rl">{p.rl}</div>
            </div>
          </div>
          <div className="prof-tabs">
            {p.tabs.map((t, i) => (
              <span key={t} className={cn(i === 0 && 'on')}>
                {t}
              </span>
            ))}
          </div>
          <div className="prof-body">
            <div className="prof-lbl">{p.assessment}</div>
            <div className="prof-scores">
              {p.scores.map((s) => (
                <div key={s.sn} className="prof-sc">
                  <span className="sn">{s.sn}</span>
                  <span className="sb">
                    <span className="sf" style={{ width: `${s.w}%` }} />
                  </span>
                  <span className="sp">{s.sp}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="prof-open">
            <span className="po-t">{p.openTitle}</span>
            <span className="po-b">
              {p.openBtn} <Arrow className="icon-motion icon-motion--draw" />
            </span>
          </div>
        </div>
      </div>
      <a className="prof-tour" href={vet.tourVideoUrl || '#'} onClick={openTour}>
        <span className="pt-ic">
          <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {vet.tour}
      </a>
      {parsedTour && tourOpen ? (
        <div className="pmodal open" ref={tourRef}>
          <div
            style={{
              position: 'relative',
              aspectRatio: '16 / 9',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#0b1424',
            }}
          >
            {tourPlaying ? (
              <iframe
                src={heEmbedSrc(parsedTour)}
                title={vet.tour}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setTourPlaying(true)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {tourPoster ? <img src={tourPoster} alt={vet.tour} style={COVER} /> : null}
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="56" height="56" style={{ fill: '#fff' }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={cn('pmodal', open && 'open')} ref={modalRef}>
          <div className="pm-note">
            <strong>{vet.modalStrong}</strong>
            <br />
            {vet.modalBody}
          </div>
        </div>
      )}
    </div>
  )
}

export function HireEngineersTemplate({ content = HE }: { content?: HireEngineersContent }) {
  const rootRef = useRef<HTMLElement>(null)

  // Reveal-on-scroll: add `.in` to `.rvl` elements as they enter view (source
  // IntersectionObserver, threshold .12). Reduced-motion is handled in CSS.
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
      { threshold: 0.12 },
    )
    root.querySelectorAll('.rvl').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  // A real offer photo hides the placeholder chrome (tag + caption brief).
  const offerHasImage = Boolean(content.offer.img.image)
  const offerImgClass = offerHasImage ? OFFER_IMG_WITH_PHOTO : OFFER_IMG_PLACEHOLDER

  return (
    <main id="main" className="he" ref={rootRef}>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">{content.hero.eyebrow}</span>
            <h1>
              {content.hero.h1Lead}{' '}
              <em>{content.hero.h1Em}</em>
            </h1>
            <p className="hero-sub">{content.hero.sub}</p>
            <div className="hero-ctas">
              <a href="#find" className="btn-primary">
                <span className="arw">
                  <Arrow className="icon-motion icon-motion--draw" />
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
                  <Check className="icon-motion icon-motion--draw" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="match-card rvl">
            <div className="mc-head">
              <span className="lbl">{content.hero.card.label}</span>
              <span className="badge">{content.hero.card.badge}</span>
            </div>
            <div className="mc-body">
              {content.hero.card.candidates.map((c) => (
                <div key={c.nm} className="mc-cand">
                  <span className="mc-av">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.image ? <img src={c.image} alt={c.nm} style={COVER} /> : c.av}
                  </span>
                  <div>
                    <div className="mc-nm">{c.nm}</div>
                    <div className="mc-rl">{c.rl}</div>
                  </div>
                  <div className="mc-rate">
                    <div className="r">{c.rate}</div>
                    <div className="l">{content.hero.card.per}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mc-foot">
              <Check className="icon-motion icon-motion--draw" /> {content.hero.card.foot}
            </div>
          </div>
        </div>
      </section>

      {/* OFFERING */}
      <section className="offer">
        <div className="wrap">
          <span className="eyebrow">{content.offer.eyebrow}</span>
          <h2 className="st">
            {content.offer.h2Lead}{' '}
            <em>{content.offer.h2Em}</em>
          </h2>
          <p className="lead">{content.offer.lead}</p>
          <div className="offer-inner">
            <div className="offer-grid">
              {content.offer.cards.map((c, i) => (
                <div key={c.h4} className="offer-card icon-card rvl">
                  <span className="offer-ic">{OFFER_ICONS[i]}</span>
                  <h4>{c.h4}</h4>
                  <p>{c.p}</p>
                </div>
              ))}
            </div>
            {/* Real photo shipped: the "Image suggestion" tag + caption are
             * the placeholder brief and are dropped once an image exists. */}
            <div className={offerImgClass}>
              {offerHasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.offer.img.image} alt={content.offer.img.t} style={COVER} />
              ) : (
                <>
                  <span className="tag">{content.offer.img.tag}</span>
                  <div className="cap">
                    <div className="t">{content.offer.img.t}</div>
                    <div className="s">{content.offer.img.s}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="roles">
        <div className="wrap">
          <span className="eyebrow">{content.roles.eyebrow}</span>
          <h2 className="st">
            {content.roles.h2Lead}{' '}
            <em>{content.roles.h2Em}</em>
          </h2>
          <div className="roles-grid">
            {content.roles.items.map((r, i) => (
              <a key={r.rn} className="role icon-card rvl">
                <span className="ri">{ROLE_ICONS[i]}</span>
                <div className="rn">{r.rn}</div>
                <div className="rd">{r.rd}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="wrap">
          <span className="eyebrow">{content.how.eyebrow}</span>
          <h2 className="st">
            {content.how.h2Lead}{' '}
            <em>{content.how.h2Em}</em>
          </h2>
          <div className="how-strip">
            {content.how.steps.map((s) => (
              <div key={s.n} className="how-step rvl">
                <div className="n">{s.n}</div>
                <h4>{s.h4}</h4>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
          <a href="#" className="how-more">
            {content.how.more}{' '}
            <svg viewBox="0 0 24 24">
              <path className="icon-motion icon-motion--draw" d="M5 12h14M13 6l6 6-6 6" pathLength={100} />
            </svg>
          </a>
        </div>
      </section>

      {/* VETTING */}
      <section className="vet">
        <div className="wrap">
          <span className="eyebrow">{content.vet.eyebrow}</span>
          <h2 className="st">
            {content.vet.h2Lead}{' '}
            <em>{content.vet.h2Em}</em>
          </h2>
          <div className="vet-grid">
            <div>
              <div className="vet-points">
                {content.vet.points.map((pt) => (
                  <div key={pt.h4} className="vet-point icon-card">
                    <span className="vc">
                      <Check className="icon-motion icon-motion--draw" />
                    </span>
                    <div>
                      <h4>{pt.h4}</h4>
                      <p>{pt.p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ProfileExplorer vet={content.vet} />
          </div>
        </div>
      </section>

      {/* PROOF — cursor spotlight on the heading only. Spotlight's own
          bg-[#070D18] loses to `.he .proof`'s higher-specificity --navy, so the
          section keeps its designed ground and just gains the glow layer. */}
      <Spotlight className="proof">
        <div className="wrap">
          <div data-spot-item className="transition-opacity duration-300 motion-safe:opacity-55">
            <span className="eyebrow">{content.proof.eyebrow}</span>
            <h2 className="st">
              {content.proof.h2Lead}{' '}
              <em>{content.proof.h2Em}</em>
            </h2>
          </div>
          <div className="cs-grid">
            <div className="cs-main rvl">
              <div className="cs-stat">{content.proof.stat}</div>
              <div className="cs-quote">{content.proof.quote}</div>
              <div className="cs-who">
                <span
                  className="a"
                  style={content.proof.whoImage ? { position: 'relative', overflow: 'hidden' } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {content.proof.whoImage ? (
                    <img src={content.proof.whoImage} alt={content.proof.whoName} style={COVER} />
                  ) : null}
                </span>
                <div>
                  <div className="nm">{content.proof.whoName}</div>
                  <div className="rl">{content.proof.whoRole}</div>
                </div>
              </div>
            </div>
            <div className="cs-side">
              <div className="imgslot rvl" style={{ minHeight: '150px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {content.proof.sideImg.image ? <img src={content.proof.sideImg.image} alt={content.proof.sideImg.t} style={COVER} /> : null}
                <span className="tag">{content.proof.sideImg.tag}</span>
                <div className="cap">
                  <div className="t">{content.proof.sideImg.t}</div>
                  <div className="s">{content.proof.sideImg.s}</div>
                </div>
              </div>
              <div className="cs-mini rvl">
                <div className="n">{content.proof.mini.n}</div>
                <div className="l">{content.proof.mini.l}</div>
              </div>
            </div>
          </div>
          <div className="visit-band">
            <div className="imgslot rvl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {content.proof.visitImg.image ? <img src={content.proof.visitImg.image} alt={content.proof.visitImg.t} style={COVER} /> : null}
              <span className="tag">{content.proof.visitImg.tag}</span>
              <div className="cap">
                <div className="t">{content.proof.visitImg.t}</div>
                <div className="s">{content.proof.visitImg.s}</div>
              </div>
            </div>
          </div>
          <p className="proof-note">{content.proof.note}</p>
        </div>
      </Spotlight>

      {/* PRICING */}
      <section className="price">
        <div className="wrap">
          <span className="eyebrow">{content.price.eyebrow}</span>
          <h2 className="st">
            {content.price.h2Lead}{' '}
            <em>{content.price.h2Em}</em>
          </h2>
          <Calculator price={content.price} />
          <p className="proof-note">{content.price.note}</p>
        </div>
      </section>

      {/* FIND YOUR ENGINEER */}
      <section className="findform" id="find">
        <div className="wrap">
          <div className="ff-head">
            <span className="eyebrow">{content.find.eyebrow}</span>
            <h2 className="st">
              {content.find.h2Lead}{' '}
              <em>{content.find.h2Em}</em>
            </h2>
            <p className="lead">{content.find.lead}</p>
          </div>

          <div className="ff-layout">
            <FindForm find={content.find} />
            <div className="imgslot ff-img rvl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {content.find.img.image ? <img src={content.find.img.image} alt={content.find.img.t} style={COVER} /> : null}
              <span className="tag">{content.find.img.tag}</span>
              <div className="cap">
                <div className="t">{content.find.img.t}</div>
                <div className="s">{content.find.img.s}</div>
              </div>
            </div>
          </div>

          <div className="talk">
            <span className="lbl">{content.find.talkLabel}</span>
            <a href="#">
              <svg viewBox="0 0 24 24" className="icon-motion icon-motion--twinkle">
                <path d="M4 5h16v11H9l-4 3z" />
              </svg>{' '}
              {content.find.talkAi}
            </a>
            <a href="#">
              <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
                <path d="M4 4h4l2 5-3 2a11 11 0 006 6l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 011-2z" />
              </svg>{' '}
              {content.find.talkBook}
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <h2>
            {content.final.h2Lead}{' '}
            <em>{content.final.h2Em}</em>
          </h2>
          <p>{content.final.p}</p>
          <a href="#find" className="btn-primary">
            <span className="arw">
              <Arrow className="icon-motion icon-motion--draw" />
            </span>
            {content.final.cta}
          </a>
          <div className="sub">{content.final.sub}</div>
        </div>
      </section>
    </main>
  )
}
