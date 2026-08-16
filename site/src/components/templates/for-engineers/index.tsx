'use client'

// For Engineers page (/for-developers + /uk/for-developers) - "For Engineers 2".
// The page BODY is lifted verbatim from the Figma export (docs/raw-html/for-engineers-2/)
// so it pixel-matches the reference: FE2_PRE_HTML (hero -> testimonials) and
// FE2_POST_HTML (the "Stop applying. Get matched." mini-CTA) are injected as scoped
// markup; FE2_TOKENS_CSS carries the reset + Figma variable tokens + fig-asset image
// classes (all under .fe2). The site layout supplies the announcement bar, nav and
// footer, so the export's own chrome is dropped. The on-page "build your profile"
// form was retired Aug 2026 - talent goes to talent.cloudemployee.io via the lime
// final CTA instead. Sanity still holds forDevelopersPage.join for a later wire-up.
//
// A fixed 1920px canvas is scaled down below 1920 (pixel-match at 1920, responsive
// -down), exactly like the reference. Motion (cursor spotlight on The Idea, reveal +
// hover on the step cards, pill-CTA hover) is wired in one effect and is
// prefers-reduced-motion aware, committing a visible state on a timer so nothing
// stays hidden if the observer never fires. Author voice: no em/en dashes.

import { useEffect, useRef } from 'react'

import { HeroTrustBar } from '@/components/social-proof/hero-trust-bar'
import { parseVideoUrl } from '@/components/ui/video-embed'
import type { Locale } from '@/lib/locale'

import { FOR_ENGINEERS_CONTENT, type ForEngineersContent } from './content'
import { FE2_POST_HTML, FE2_PRE_HTML } from './fe2-body'
import { FE2_TOKENS_CSS } from './fe2-css'
import { hydrateFe2 } from './fe2-hydrate'
import { FE2_UI_CSS } from './fe2-styles'

const VIDEO_POSTER_CLASS = 'fig-asset-8f1066200d444094-72cc5769'

// At or below this width the page stops being a scaled 1920px frame and becomes
// an ordinary stacked document. The reflow itself is CSS (see the "phones and
// small tablets" block in fe2-styles.ts) and the two MUST move together: a
// mismatch would leave the H1 compensated for a zoom that is no longer applied,
// which is what rendered it at 195px on a phone. 900px is the boundary the rest
// of this template already treats as mobile.
const FE2_MOBILE_MAX = 900

// Width of the reserved number column in each "why this exists" stat card.
// MUST match grid-template-columns on [data-fe2-problem-stats] > * in
// fe2-styles.ts: this is the threshold that decides whether a number is too
// wide for its column and needs stepping down (CE-59).
const STAT_NUM_COL_PX = 210

/**
 * `ambient` = the silent looping wallpaper treatment the testimonial tile uses:
 * plays itself, no sound, no player chrome. Browsers only allow unprompted
 * playback when it is muted, so muted and autoplay travel together here.
 * Without it, the same embed is a normal click-to-play video with sound.
 */
function fe2EmbedSrc(
  parsed: NonNullable<ReturnType<typeof parseVideoUrl>>,
  ambient = false,
): string {
  if (parsed.provider === 'youtube') {
    // YouTube needs `playlist` set to its own id for `loop` to do anything.
    return ambient
      ? `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&playsinline=1&rel=0`
      : `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0`
  }
  if (parsed.provider === 'vimeo') {
    // Vimeo's `background` does the whole ambient treatment in one flag.
    return ambient
      ? `https://player.vimeo.com/video/${parsed.id}?background=1&autoplay=1&loop=1&muted=1&dnt=1`
      : `https://player.vimeo.com/video/${parsed.id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`
  }
  if (parsed.provider === 'linkedin') {
    return `https://www.linkedin.com/embed/feed/update/urn:li:share:${parsed.id}`
  }
  return `https://www.loom.com/embed/${parsed.id}?autoplay=1`
}

/** Navigate or smooth-scroll for Studio-owned CTA hrefs (#join, /path, https://…). */
function followCtaHref(href: string, reduce: boolean) {
  const target = href.trim()
  if (!target) return
  if (target.startsWith('#')) {
    const id = target.slice(1)
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    return
  }
  // Off-site destinations (live talent board) open in a new tab so the engineer
  // does not lose the profile form they may already be filling in.
  if (/^https?:\/\//i.test(target)) {
    window.open(target, '_blank', 'noopener,noreferrer')
    return
  }
  window.location.assign(target)
}

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Figma export wraps the hero title in a <span>. Screaming Frog (and Google)
// need a real <h1>. Promote that outer title span after hydrate so FE2_PRE_HTML
// stays byte-identical for the parity verifier.
function promoteHeroTitleToH1(html: string): string {
  return html.replace(
    /<span( style="[^"]*font-size: 52px;[^"]*")>([\s\S]*?)<\/span>(?=<span style="position: relative; width: 500px)/,
    '<h1$1 data-fe2-hero-title="1">$2</h1>',
  )
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** CE-13 — turn the hero sub into two lines + a lime-italic rotating word. */
function injectHeroSubRotator(html: string, content: ForEngineersContent): string {
  const sub = content.hero.sub
  const words = content.hero.subRotate?.filter(Boolean) ?? []
  if (!sub || words.length === 0) return html
  const first = escHtml(words[0] ?? '')
  const lead = (content.hero.subRotateLead ?? '').trim()
  const leadHtml = lead ? `<span class="fe2-rotator-lead">${escHtml(lead)} </span>` : ''
  const escapedSub = escHtml(sub)
  const escapedSubRe = escapedSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // The hydrated sub sits as text inside its span; rewrite that node and keep a
  // class hook for the larger type size.
  if (!html.includes(`>${escapedSub}</span>`)) return html
  return html.replace(
    new RegExp(
      `(<span style="position: relative;[^"]*font-size: 18px;[^"]*")>${escapedSubRe}</span>`,
    ),
    `$1 class="fe2-hero-sub">${escapedSub}<span class="fe2-rotator" data-fe2-rotator aria-live="polite">${leadHtml}<em class="fe2-rotator-word">${first}</em></span></span>`,
  )
}

// Split the frozen export body after its FIRST top-level <div> (the hero), so
// the hero can be given its own full-viewport wrapper and everything from
// "Applying is broken" down starts below the fold. Depth-counts <div>/</div>;
// the export is machine-generated and contains no <div in attribute text.
function splitHeroBlock(html: string): [hero: string, rest: string] {
  let depth = 0
  const re = /<div\b|<\/div>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    if (match[0] === '</div>') {
      depth -= 1
      if (depth === 0) return [html.slice(0, re.lastIndex), html.slice(re.lastIndex)]
    } else {
      depth += 1
    }
  }
  return ['', html]
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
  // H1 promotion runs after hydrate so verify-fe2-parity still sees a clean
  // hydrate(template, defaults) === export match.
  const preHtml = promoteHeroTitleToH1(
    injectHeroSubRotator(hydrateFe2(FE2_PRE_HTML, content), content),
  )
  const postHtml = hydrateFe2(FE2_POST_HTML, content)
  const [heroHtml, restHtml] = splitHeroBlock(preHtml)

  const mainRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

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

    // CE-28 — pin an in-page id on the "How it works / THE PROCESS" block so the
    // hero ghost CTA can scroll here instead of leaving for /how-it-works.
    const howEyebrow = [...root.querySelectorAll('span')].find(
      (el) => el.textContent?.trim() === content.how.eyebrow,
    )
    const howSection = howEyebrow?.closest<HTMLElement>('div[style*="padding"]')
    if (howSection && !howSection.id) {
      howSection.id = 'fe2-how'
      howSection.style.scrollMarginTop = '96px'
    }

    // Why-this-exists stats: mark the row + each body so CSS can unlock the
    // frozen 280px / overflow:hidden that was truncating "publicly".
    const seventy = [...root.querySelectorAll('span')].find(
      (el) => el.textContent?.trim() === '70%',
    )
    const statsRow = seventy?.parentElement?.parentElement
    if (statsRow) {
      statsRow.setAttribute('data-fe2-problem-stats', '1')
      for (const col of statsRow.children) {
        const body = col.querySelector('span:last-of-type')
        if (body) body.setAttribute('data-fe2-stat-body', '1')

        /**
         * CE-59 / CE-45 — stop a long "number" running into the copy.
         *
         * The number sits in a fixed 210px column so the copy starts on the
         * same vertical line in all four cards. Three of them are short
         * numerals and fit easily. The fourth is the phrase "$ you set it",
         * which at the export's 52px serif italic is wider than the column,
         * and because the number is nowrap it spilled straight over the copy
         * with no gap.
         *
         * Tagged by MEASURED WIDTH, not by card index or by matching the
         * string, so it stays correct if Jake rewrites the copy or reorders
         * the stats. The card index would silently attach to the wrong box
         * the first time the array changes.
         */
        const num = col.querySelector<HTMLElement>('span:first-of-type')
        if (num) {
          num.setAttribute('data-fe2-stat-num', '1')
          /*
           * Measure the TEXT, not the box. The frozen export pins every one of
           * these spans to an inline width:280px, so getBoundingClientRect on
           * the element returns 280 for all four and would tag every card as
           * long. A range over the text nodes gives the actual ink width.
           */
          const range = document.createRange()
          range.selectNodeContents(num)
          if (range.getBoundingClientRect().width > STAT_NUM_COL_PX) {
            num.setAttribute('data-fe2-stat-num-long', '1')
          }
          range.detach()
        }
      }
    }

    /**
     * Hero heading: keep the line breaks the copy asks for, and only those.
     *
     * titleLead already carries its own newlines. The browser was wrapping on
     * top of those (the export's inline white-space:pre-wrap allows it), which
     * orphaned "the" onto its own line. promoteHeroTitleToH1 stamps
     * data-fe2-hero-title on the <h1> at HTML time. The fallback here covers
     * a Sanity override that still produced an h1 if the promote regex missed.
     *
     * Do not search spans for the lead: after promotion, titleLead is a bare
     * text node of the <h1>, with only the lime accent in a child <span>.
     */
    const heading = root.querySelector('h1')
    if (heading && !heading.hasAttribute('data-fe2-hero-title')) {
      const heroLead = content.hero.titleLead.split('\n')[0]?.trim()
      if (heroLead && heading.textContent?.trim().startsWith(heroLead)) {
        heading.setAttribute('data-fe2-hero-title', '1')
      }
    }

    // Hide "A community, in person" + the three photo cards (placeholder subs).
    if (content.benefits.hideCommunityBlock) {
      const community = [...root.querySelectorAll('span')].find(
        (el) => el.textContent?.trim() === 'A community, in person.',
      )
      // Item cell (icon + copy) — climb to the flex row that holds the 4th benefit.
      const communityCell = community?.closest<HTMLElement>('div[style*="flex-grow:1"]')
      const communityRow = communityCell?.parentElement
      if (communityRow) communityRow.setAttribute('data-fe2-community-hidden', '1')
      const photo = root.querySelector<HTMLElement>(
        '.fig-asset-8165165c9b13b738-2f197fb6',
      )
      const photosRow = photo?.parentElement?.parentElement
      if (photosRow) photosRow.setAttribute('data-fe2-community-hidden', '1')
    }

    // CE-13 — cycle the lime-italic rotating word under the hero subhead.
    const rotateWords = (content.hero.subRotate ?? []).filter(Boolean)
    const rotatorWord = root.querySelector<HTMLElement>('[data-fe2-rotator] .fe2-rotator-word')
    let rotateTimer: number | undefined
    if (rotatorWord && rotateWords.length > 1 && !reduce) {
      let i = 0
      rotateTimer = window.setInterval(() => {
        rotatorWord.classList.add('is-out')
        window.setTimeout(() => {
          i = (i + 1) % rotateWords.length
          rotatorWord.textContent = rotateWords[i] ?? ''
          rotatorWord.classList.remove('is-out')
        }, 280)
      }, 2600)
    }

    // ---- pill CTAs follow Studio-owned hrefs (default #join / #fe2-how) ----
    // Ghost CTA stays on this page and scrolls to THE PROCESS (#fe2-how). The old
    // /how-it-works value is treated as stale so a Studio leftover cannot send
    // candidates off-page.
    const primaryHref = content.hero.ctaPrimaryHref || '#join'
    const rawGhost = (content.hero.ctaGhostHref || '').trim()
    const ghostHref =
      !rawGhost || rawGhost === '/how-it-works' || rawGhost === '/uk/how-it-works'
        ? '#fe2-how'
        : rawGhost
    const finalHref = content.final.ctaHref || '#join'
    const ctas = [...root.querySelectorAll<HTMLElement>('[data-fe2-cta]')]
    // First data-fe2-cta = hero primary; last = final CTA (frozen HTML order).
    const onPrimary = () => followCtaHref(primaryHref, reduce)
    const onFinal = () => followCtaHref(finalHref, reduce)
    const heroPrimary = ctas[0]
    const finalCta = ctas.length > 1 ? ctas[ctas.length - 1] : null
    heroPrimary?.addEventListener('click', onPrimary)
    if (finalCta && finalCta !== heroPrimary) finalCta.addEventListener('click', onFinal)

    // Ghost CTA is the sibling flex row after the hero primary (no data attr in export).
    const ghostEl = heroPrimary?.nextElementSibling as HTMLElement | null
    const onGhost = () => followCtaHref(ghostHref, reduce)
    if (ghostEl) {
      ghostEl.style.cursor = 'pointer'
      ghostEl.setAttribute('role', 'link')
      ghostEl.addEventListener('click', onGhost)
    }

    // ---- testimonial video: silent looping wallpaper when videoUrl is set ----
    // Mounted into the poster div rather than the tile, so the pill and caption
    // that sit later in the export's markup keep painting over the video.
    const videoUrl = (content.tests.videoUrl || '').trim()
    const parsedVideo = videoUrl ? parseVideoUrl(videoUrl) : null
    const poster = root.querySelector<HTMLElement>(`.${VIDEO_POSTER_CLASS}`)
    // The tile is the poster's parent: it holds the poster plus the pill, play
    // button and caption. Do NOT reach for it with closest() on the border
    // radius - the poster carries the same 16px radius, so closest() returns
    // the poster itself and the play chrome is never found.
    const videoTile = poster?.parentElement ?? null
    let playTarget: HTMLElement | null = null
    let onVideo: (() => void) | null = null
    let onVideoKey: ((e: KeyboardEvent) => void) | null = null

    if (poster && videoTile && parsedVideo) {
      const playButton = videoTile.querySelector<HTMLElement>('div[style*="border-radius:58px"]')
      // Figma ships the button's display inline; hiding it overwrites that, so
      // keep the original to put back rather than clearing to the UA default.
      const inlineDisplay = playButton?.style.display
      const playDisplay = inlineDisplay && inlineDisplay !== 'none' ? inlineDisplay : 'flex'
      // The player iframe is painted later in the same stacking context, so the
      // button needs to be lifted or the iframe eats the click.
      if (playButton) playButton.style.zIndex = '3'
      poster.style.overflow = 'hidden'

      // Spinner over the poster art until the player reports itself loaded.
      const loader = document.createElement('div')
      loader.className = 'fe2-video-loading'
      loader.setAttribute('aria-hidden', 'true')

      const mountVideo = (ambient: boolean) => {
        // Always a fresh iframe: pressing play has to restart from zero, which
        // reusing the looping one cannot do without the Vimeo player SDK.
        poster.querySelectorAll('iframe').forEach((f) => f.remove())

        // Play button and spinner both want the centre, so they take turns.
        if (playButton) playButton.style.display = 'none'
        poster.appendChild(loader)

        const iframe = document.createElement('iframe')
        iframe.src = fe2EmbedSrc(parsedVideo, ambient)
        iframe.title = content.tests.videoLabel || 'Cloud Employee video'
        iframe.allow = 'autoplay; fullscreen; picture-in-picture'
        iframe.allowFullscreen = true
        // The poster frame is wider than 16:9. Sizing the iframe to the frame's
        // WIDTH and letting the overflow crop top and bottom fills the tile
        // edge to edge; sizing it to fit would pillarbox it in player black.
        iframe.style.cssText =
          'position:absolute;left:0;top:50%;transform:translateY(-50%);width:100%;aspect-ratio:16/9;border:0;display:block;z-index:1'
        iframe.addEventListener(
          'load',
          () => {
            loader.remove()
            // The ambient loop keeps the play button, because it is silent and
            // starts wherever the loop happens to be - there is still a video
            // to actually watch. The full player has its own controls.
            if (ambient && playButton) playButton.style.display = playDisplay
          },
          { once: true },
        )
        poster.appendChild(iframe)
      }

      // Silent loop straight away. Someone who asked for less motion gets the
      // poster art and the play button instead.
      if (reduce) {
        loader.remove()
        if (playButton) playButton.style.display = playDisplay
      } else {
        mountVideo(true)
      }

      // Play = the real thing, from the top, with sound.
      if (playButton) {
        playButton.style.cursor = 'pointer'
        playButton.setAttribute('role', 'button')
        playButton.setAttribute('tabindex', '0')
        playButton.setAttribute('aria-label', content.tests.videoLabel || 'Play video')
        onVideo = () => mountVideo(false)
        playButton.addEventListener('click', onVideo)
        onVideoKey = (e: KeyboardEvent) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          mountVideo(false)
        }
        playButton.addEventListener('keydown', onVideoKey)
      }
      playTarget = playButton
    }

    // ---- responsive scaler: pixel-match at 1920, scale down below ----
    // Uses CSS `zoom` (not `transform: scale`): zoom shrinks the real layout box,
    // so the page reserves its scaled height, the footer sits directly under the
    // content, and there is no dead scroll space or height-guessing. The factor
    // depends only on viewport width, so it never flaps as images/fonts load.
    const fit = () => {
      const vw = document.documentElement.clientWidth
      const hero = heroRef.current

      // Phones and small tablets: no canvas, so nothing to scale and nothing to
      // compensate. Clearing the custom property hands the H1 back to the
      // sitewide marketing-hero token, and clearing min-height lets the hero
      // take the height its own stacked content needs.
      if (vw <= FE2_MOBILE_MAX) {
        canvas.style.zoom = ''
        canvas.style.removeProperty('--fe2-marketing-hero-size')
        canvas.style.transform = ''
        canvas.style.transformOrigin = ''
        canvas.style.marginLeft = ''
        canvas.style.marginRight = ''
        stage.style.height = ''
        if (hero) hero.style.minHeight = ''
        return
      }

      const s = vw >= 1920 ? 1 : vw / 1920
      canvas.style.zoom = s === 1 ? '' : String(s)
      // The fixed 1920px Figma canvas is zoomed as a whole. Compensate the hero
      // H1 before that zoom so its rendered size still matches every other
      // marketing page (40px minimum, fluid to 60px).
      const renderedHeroSize = Math.min(60, Math.max(40, vw * 0.052))
      canvas.style.setProperty('--fe2-marketing-hero-size', `${renderedHeroSize / s}px`)
      // clear any legacy transform-based scaling that may linger
      canvas.style.transform = ''
      canvas.style.transformOrigin = ''
      canvas.style.marginLeft = ''
      canvas.style.marginRight = ''
      stage.style.height = ''

      // Hero fills the viewport under the chrome. The hero lives INSIDE the
      // zoomed canvas, so a px value written here is multiplied by `s` when it
      // renders: divide by s to land on the real viewport height. Measuring the
      // hero's own document offset covers the announcement bar + header without
      // hard-coding either height.
      if (hero) {
        hero.style.minHeight = ''
        const offset = hero.getBoundingClientRect().top + window.scrollY
        const avail = Math.max(420, window.innerHeight - offset)
        hero.style.minHeight = `${avail / s}px`
      }
    }
    fit()
    window.addEventListener('resize', fit)

    return () => {
      io?.disconnect()
      clearTimeout(revealTimer)
      if (rotateTimer !== undefined) window.clearInterval(rotateTimer)
      if (spot && !reduce) {
        spot.removeEventListener('mouseenter', onEnter)
        spot.removeEventListener('mouseleave', onLeave)
        spot.removeEventListener('mousemove', onMove)
      }
      heroPrimary?.removeEventListener('click', onPrimary)
      if (finalCta && finalCta !== heroPrimary) finalCta.removeEventListener('click', onFinal)
      ghostEl?.removeEventListener('click', onGhost)
      if (playTarget && onVideo) playTarget.removeEventListener('click', onVideo)
      if (playTarget && onVideoKey) playTarget.removeEventListener('keydown', onVideoKey)
      window.removeEventListener('resize', fit)
    }
  }, [
    content.hero.ctaPrimaryHref,
    content.hero.ctaGhostHref,
    content.hero.subRotate,
    content.hero.titleLead,
    content.how.eyebrow,
    content.final.ctaHref,
    content.tests.videoUrl,
    content.tests.videoLabel,
  ])

  return (
    <main id="main" className="fe2" ref={mainRef}>
      <style>{FE2_TOKENS_CSS}</style>
      <style>{FE2_UI_CSS}</style>
      <div className="fe2-stage" ref={stageRef}>
        <div className="fe2-canvas" ref={canvasRef}>
          {/* Hero, held to a full viewport height so it is all a visitor sees on
           * landing. The See-more control that used to sit here was cut with the
           * rest of them; the client logo strip closes the hero instead, same as
           * every other marketing page. No AI CTA on this one — the assistant is
           * a buyer-side tool and this page speaks to candidates. */}
          {/* fe2-figma marks the lifted export. The mobile reflow in
           * fe2-styles.ts unpins fixed Figma geometry wholesale, which is only
           * safe over this markup: the React components in the canvas (the
           * logo marquee below) lay themselves out and must be left alone. */}
          <div className="fe2-hero-vh" ref={heroRef}>
            <div className="fe2-figma" dangerouslySetInnerHTML={{ __html: heroHtml }} />
            <HeroTrustBar showAi={false} className="fe2-trust" />
          </div>
          {/* Everything from "Applying is broken" down */}
          <div id="fe2-after-hero" className="fe2-figma" dangerouslySetInnerHTML={{ __html: restHtml }} />
          {/* Stop applying. Get matched. mini-CTA (tokenised export, hydrated) */}
          <div className="fe2-figma" dangerouslySetInnerHTML={{ __html: postHtml }} />
        </div>
      </div>
    </main>
  )
}

export default ForEngineersTemplate
