'use client'

// For Engineers page (/for-developers + /uk/for-developers) - "For Engineers 2".
// The page BODY is lifted verbatim from the Figma export (docs/raw-html/for-engineers-2/)
// so it pixel-matches the reference: FE2_PRE_HTML (hero -> testimonials) and
// FE2_POST_HTML (the "Stop applying. Get matched." mini-CTA) are injected as scoped
// markup; FE2_TOKENS_CSS carries the reset + Figma variable tokens + fig-asset image
// classes (all under .fe2). The site layout supplies the announcement bar, nav and
// footer, so the export's own chrome is dropped. The one interactive part - the
// "build your profile" form + live preview - is a real React component (JoinForm),
// styled by FE2_UI_CSS to match the reference form frame.
//
// A fixed 1920px canvas is scaled down below 1920 (pixel-match at 1920, responsive
// -down), exactly like the reference. Motion (cursor spotlight on The Idea, reveal +
// hover on the step cards, pill-CTA hover/scroll-to-form) is wired in one effect and
// is prefers-reduced-motion aware, committing a visible state on a timer so nothing
// stays hidden if the observer never fires. Author voice: no em/en dashes.

import { useEffect, useRef, useState } from 'react'

import type { Locale } from '@/lib/locale'

import { FOR_ENGINEERS_CONTENT, GLYPH, type ForEngineersContent } from './content'
import { FE2_POST_HTML, FE2_PRE_HTML } from './fe2-body'
import { FE2_TOKENS_CSS } from './fe2-css'
import { hydrateFe2 } from './fe2-hydrate'
import { FE2_UI_CSS } from './fe2-styles'

// --- Icons (SVG path data are props; the lint rule ignores props) ---
const V = '0 0 24 24'
function IconArrow() {
  return <svg viewBox={V}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
}
function IconCheck() {
  return <svg viewBox={V}><path d="M20 6L9 17l-5-5" /></svg>
}

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// --- Multi-step "build your profile" form + live profile preview ---
function JoinForm({ content }: { content: ForEngineersContent }) {
  const j = content.join
  const f = j.fields
  const [step, setStep] = useState(0)
  const [loc, setLoc] = useState('')
  const [role, setRole] = useState('')
  const [yrs, setYrs] = useState('')
  const [rate, setRate] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [work, setWork] = useState('')
  const [avail, setAvail] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [styles, setStyles] = useState<string[]>([])

  const toggle = (list: string[], set: (v: string[]) => void, val: string) => {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  // Skill combobox: type to autocomplete against the vocab; Enter adds the matched
  // skill, or whatever was typed if there's no match.
  const [skillInput, setSkillInput] = useState('')
  const presetSkills = f.skills as readonly string[]
  const skillVocab = f.skillVocab as readonly string[]
  const customSkills = skills.filter((s) => !presetSkills.includes(s))
  const allSkillChips = [...presetSkills, ...customSkills]
  const q = skillInput.trim().toLowerCase()
  const suggestions = q
    ? [...new Set([...presetSkills, ...skillVocab])].filter((s) => s.toLowerCase().includes(q) && !skills.includes(s)).slice(0, 6)
    : []
  const addSkill = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    const match = [...presetSkills, ...skillVocab, ...skills].find((s) => s.toLowerCase() === v.toLowerCase())
    const canonical = match ?? v
    if (!skills.includes(canonical)) setSkills([...skills, canonical])
    setSkillInput('')
  }

  // Live preview, synced from form state.
  const pv = j.preview
  const trimmed = name.trim()
  const pvName = trimmed || pv.name
  const pvAva = trimmed ? trimmed.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : GLYPH.question
  const pvRole = role ? role + (yrs ? ` ${GLYPH.dot} ${yrs}` : '') : pv.role
  const pvLoc = loc.trim() ? `${GLYPH.pin} ${loc.split(',')[0]}` : GLYPH.globe
  const pvRate = rate.trim() ? rate + (/mo|month|\//.test(rate) ? '' : ' / mo') : pv.rateEmpty
  const pvTags = [...skills, ...styles]

  return (
    <section className="joinform" id="join">
      <div className="wrap">
        <span className="eyebrow">{j.eyebrow}</span>
        <h2 className="section-title">
          {j.titleLead} <em>{j.titleAccent}</em>
        </h2>
        <p className="lead">{j.lead}</p>

        <div className="jf-grid">
          <div className="jf-card">
            <div className="jf-progress">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`seg${i <= step ? ' done' : ''}`} />
              ))}
            </div>

            {step === 0 && (
              <div className="jf-step active">
                <div className="jf-steplabel">{j.steps[0].label}</div>
                <div className="jf-q">{j.steps[0].q}</div>
                <div className="jf-field">
                  <label htmlFor="fe-loc">{f.locLabel}</label>
                  <input id="fe-loc" type="text" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder={f.locPlaceholder} />
                </div>
                <div className="jf-field">
                  <label htmlFor="fe-role">{f.roleLabel}</label>
                  <select id="fe-role" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="">{f.roleDefault}</option>
                    {f.roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="jf-field">
                  <label htmlFor="fe-yrs">{f.yrsLabel}</label>
                  <select id="fe-yrs" value={yrs} onChange={(e) => setYrs(e.target.value)}>
                    <option value="">{f.yrsDefault}</option>
                    {f.yrs.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="jf-step active">
                <div className="jf-steplabel">{j.steps[1].label}</div>
                <div className="jf-q">{j.steps[1].q}</div>
                <div className="jf-field">
                  <label>{f.skillsLabel}</label>
                  <div className="chips">
                    {allSkillChips.map((s) => (
                      <button key={s} type="button" aria-pressed={skills.includes(s)} className={`chip${skills.includes(s) ? ' on' : ''}`} onClick={() => toggle(skills, setSkills, s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="skill-add">
                    <input
                      className="skill-input"
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill(skillInput)
                        }
                      }}
                      placeholder={f.skillPlaceholder}
                      aria-label={f.skillsLabel}
                      autoComplete="off"
                    />
                    {suggestions.length ? (
                      <div className="skill-suggest">
                        {suggestions.map((s) => (
                          <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addSkill(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="jf-field">
                  <label>{f.styleLabel}</label>
                  <div className="chips">
                    {f.styles.map((s) => (
                      <button key={s} type="button" aria-pressed={styles.includes(s)} className={`chip${styles.includes(s) ? ' on' : ''}`} onClick={() => toggle(styles, setStyles, s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="jf-step active">
                <div className="jf-steplabel">{j.steps[2].label}</div>
                <div className="jf-q">{j.steps[2].q}</div>
                <p className="jf-help">{f.rateHelp}</p>
                <div className="jf-field">
                  <label htmlFor="fe-rate">{f.rateLabel}</label>
                  <input id="fe-rate" type="text" value={rate} onChange={(e) => setRate(e.target.value)} placeholder={f.ratePlaceholder} />
                </div>
                <div className="jf-field">
                  <label htmlFor="fe-avail">{f.availLabel}</label>
                  <select id="fe-avail" value={avail} onChange={(e) => setAvail(e.target.value)}>
                    <option value="">{f.availDefault}</option>
                    {f.avail.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="jf-step active">
                <div className="jf-steplabel">{j.steps[3].label}</div>
                <div className="jf-q">{j.steps[3].q}</div>
                <div className="jf-field">
                  <label htmlFor="fe-name">{f.nameLabel}</label>
                  <input id="fe-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={f.namePlaceholder} />
                </div>
                <div className="jf-field">
                  <label htmlFor="fe-email">{f.emailLabel}</label>
                  <input id="fe-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={f.emailPlaceholder} />
                </div>
                <div className="jf-field">
                  <label htmlFor="fe-work">
                    {f.workLabel} <span className="jf-hint">{f.workHint}</span>
                  </label>
                  <input id="fe-work" type="text" value={work} onChange={(e) => setWork(e.target.value)} placeholder={f.workPlaceholder} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="jf-step active">
                <div className="jf-done">
                  <div className="big">
                    <IconCheck />
                  </div>
                  <h3>{j.done.h}</h3>
                  <p>{j.done.p}</p>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="jf-nav">
                <button type="button" className="jf-back" disabled={step === 0} onClick={() => step > 0 && setStep(step - 1)}>
                  {GLYPH.back} {j.back}
                </button>
                <button type="button" className="jf-next" onClick={() => step < 4 && setStep(step + 1)}>
                  {step === 3 ? j.joinCta : j.continue}
                  <span className="arw">
                    <IconArrow />
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Live profile preview */}
          <div className="jf-preview">
            <div className="pl">{pv.pl}</div>
            <div className="profile-card">
              <div className="pc-top">
                <div className="pc-ava">{pvAva}</div>
                <div>
                  <div className="pc-name">{pvName}</div>
                  <div className="pc-role">{pvRole}</div>
                </div>
                <div className="pc-flag">{pvLoc}</div>
              </div>
              <div className="pc-body">
                <div className="pc-label">{pv.label}</div>
                <div className="pc-tags">
                  {pvTags.length ? (
                    pvTags.map((t) => <span key={t}>{t}</span>)
                  ) : (
                    <span style={{ opacity: 0.5 }}>{pv.tagsEmpty}</span>
                  )}
                </div>
                <div className="pc-match">
                  <span className="r">
                    <IconCheck />
                  </span>
                  <div className="txt">
                    <strong>{pvRate}</strong>
                    <span>{pv.rateSub}</span>
                  </div>
                </div>
              </div>
              <div className="pc-foot">
                {pv.foot.map((ft) => (
                  <div className="s" key={ft.n}>
                    <div className="n">{ft.n}</div>
                    <div className="l">{ft.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ForEngineersTemplate({
  locale = 'en-US',
  content = FOR_ENGINEERS_CONTENT,
}: {
  locale?: Locale
  content?: ForEngineersContent
}) {
  // locale is accepted for parity with sibling templates / metadata; this page's
  // copy is identical across locales, so it is not branched on here.
  void locale

  // The frozen-export body is stored tokenised in fe2-body.ts; hydrate fills
  // every text node + photo from `content` (Sanity, or the static fallback),
  // reproducing the export byte-for-byte when nothing is overridden.
  const preHtml = hydrateFe2(FE2_PRE_HTML, content)
  const postHtml = hydrateFe2(FE2_POST_HTML, content)

  const mainRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = mainRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!root || !stage || !canvas) return
    const reduce = prefersReduced()

    // ---- reveal-on-scroll (step cards) + final-state-on-timer safety ----
    const reveals = [...root.querySelectorAll<HTMLElement>('[data-fe2-reveal]')]
    const showAll = () => reveals.forEach((el) => el.classList.add('fe2-in'))
    let io: IntersectionObserver | null = null
    if (reduce) {
      showAll()
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('fe2-in')
              io?.unobserve(e.target)
            }
          })
        },
        { threshold: 0.15 },
      )
      reveals.forEach((el) => io?.observe(el))
    }
    const revealTimer = setTimeout(showAll, 1400)

    // ---- cursor spotlight on The Idea ----
    const spot = root.querySelector<HTMLElement>('[data-fe2-spotlight]')
    const items = spot ? [...spot.querySelectorAll<HTMLElement>('[data-fe2-glow-item]')] : []
    const onEnter = () => spot?.classList.add('fe2-glowing')
    const onLeave = () => {
      spot?.classList.remove('fe2-glowing')
      items.forEach((i) => i.classList.remove('fe2-lit'))
    }
    const onMove = (e: MouseEvent) => {
      if (!spot) return
      const r = spot.getBoundingClientRect()
      spot.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      spot.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      items.forEach((it) => {
        const ir = it.getBoundingClientRect()
        const d = Math.hypot(e.clientX - (ir.left + ir.width / 2), e.clientY - (ir.top + ir.height / 2))
        it.classList.toggle('fe2-lit', d < 340)
      })
    }
    if (spot && !reduce) {
      spot.addEventListener('mouseenter', onEnter)
      spot.addEventListener('mouseleave', onLeave)
      spot.addEventListener('mousemove', onMove)
    }

    // ---- pill CTAs scroll to the form ----
    const ctas = [...root.querySelectorAll<HTMLElement>('[data-fe2-cta]')]
    const onCta = () => document.getElementById('join')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    ctas.forEach((el) => el.addEventListener('click', onCta))

    // ---- responsive scaler: pixel-match at 1920, scale down below ----
    // Uses CSS `zoom` (not `transform: scale`): zoom shrinks the real layout box,
    // so the page reserves its scaled height, the footer sits directly under the
    // content, and there is no dead scroll space or height-guessing. The factor
    // depends only on viewport width, so it never flaps as images/fonts load.
    const fit = () => {
      const vw = document.documentElement.clientWidth
      const s = vw >= 1920 ? 1 : vw / 1920
      canvas.style.zoom = s === 1 ? '' : String(s)
      // clear any legacy transform-based scaling that may linger
      canvas.style.transform = ''
      canvas.style.transformOrigin = ''
      canvas.style.marginLeft = ''
      canvas.style.marginRight = ''
      stage.style.height = ''
    }
    fit()
    window.addEventListener('resize', fit)

    return () => {
      io?.disconnect()
      clearTimeout(revealTimer)
      if (spot && !reduce) {
        spot.removeEventListener('mouseenter', onEnter)
        spot.removeEventListener('mouseleave', onLeave)
        spot.removeEventListener('mousemove', onMove)
      }
      ctas.forEach((el) => el.removeEventListener('click', onCta))
      window.removeEventListener('resize', fit)
    }
  }, [])

  return (
    <main id="main" className="fe2" ref={mainRef}>
      <style>{FE2_TOKENS_CSS}</style>
      <style>{FE2_UI_CSS}</style>
      <div className="fe2-stage" ref={stageRef}>
        <div className="fe2-canvas" ref={canvasRef}>
          {/* Hero -> testimonials (tokenised Figma export, hydrated from content) */}
          <div dangerouslySetInnerHTML={{ __html: preHtml }} />
          {/* Build your profile (working React form) */}
          <JoinForm content={content} />
          {/* Stop applying. Get matched. mini-CTA (tokenised export, hydrated) */}
          <div dangerouslySetInnerHTML={{ __html: postHtml }} />
        </div>
      </div>
    </main>
  )
}

export default ForEngineersTemplate
