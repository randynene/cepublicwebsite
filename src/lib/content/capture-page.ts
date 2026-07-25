// Capture a live Webflow page into the Sanity static-page shape.
//
// Used for the marketing pages that have no new design yet (About Us, Contact,
// For Developers, Our Work, ...). Those pages must exist at cutover or their URLs
// 404 and their rankings go; they do not have to look final. So we take the live
// page's CONTENT and put it in Sanity in the shape the redesign will use, and
// restyle later. A page that is missing is unrecoverable; a page that looks old is
// a template change.
//
// It captures content, not layout. Webflow's markup is a deep nest of positioning
// divs that carries no meaning we could preserve anyway, and all of it is being
// replaced. So this walks the page in reading order and keeps what a reader would
// keep: the headings, the prose, the lists, the images. Everything else is
// scaffolding for a design we are throwing away.
//
// Sections are split at each <h2>, which is how these pages are actually
// structured — a hero, then a series of headed blocks.
import { JSDOM } from 'jsdom'

import { toPortableText } from '@/lib/content/migration-helpers'

export type CapturedSection = {
  _key: string
  _type: 'richTextSection'
  heading: string | null
  content: unknown[]
}

export type CapturedPage = {
  title: string
  eyebrow: string | null
  heroDescription: unknown[]
  sections: CapturedSection[]
  /**
   * Sections that are a CMS-driven grid, not prose, and were deliberately NOT
   * captured. Each needs a real component reading real documents, not a flattened
   * copy of the rendered cards.
   */
  skipped: Array<{ heading: string; blocks: number; why: string }>
  /**
   * The inline Calendly booking widget, if the page has one.
   *
   * Read from the live markup rather than hardcoded, even though all eight pages
   * that carry it currently point at the same event: a CE-specific URL does not
   * belong in migration logic, and CE will change the event without telling us.
   */
  calendlyUrl: string | null
  metaTitle: string | null
  metaDescription: string | null
}

/**
 * Is this section prose, or is it a grid of cards that got flattened?
 *
 * "Meet your new team" on /about-us is a Webflow CMS list of the 25 team members.
 * Walked as text it yields 92 blocks reading "11", "years", "Tech Founder",
 * "Leading Cloud Employee" — the innards of cards, stripped of the structure that
 * made them mean anything. Storing that would put visible gibberish on the page,
 * and it would duplicate content we already hold properly: those 25 people are
 * teamMember documents in Sanity, and the reviews are review documents.
 *
 * A grid gives itself away by its shape: many blocks, nearly all of them too short
 * to be a sentence. Prose is fewer, longer blocks.
 */
function looksLikeCardGrid(blocks: unknown[]): boolean {
  const texts = blocks
    .flatMap((b) => ((b as { children?: Array<{ text?: string }> }).children ?? []).map((c) => c.text ?? ''))
    .filter(Boolean)

  if (texts.length < 8) return false

  const shortOnes = texts.filter((t) => t.trim().length < 40).length
  return shortOnes / texts.length > 0.6
}

// Headings that belong to the site chrome, not to the page. Every Webflow page
// ends with the same call-to-action band, and our footer already renders it from
// Sanity (footer.topCtaBlock). Capturing it would put a second copy of the footer
// CTA in the middle of every page.
const CHROME_HEADINGS = [
  /ready to hire your next engineer/i,
  /subscribe/i,
  /talent locations/i,
]

function isChromeHeading(text: string): boolean {
  return CHROME_HEADINGS.some((re) => re.test(text))
}

const norm = (s: string | null | undefined): string =>
  stripDashes((s ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim())

/**
 * Em and en dashes out. House style, applied at the boundary.
 *
 * The rule is that Cloud Employee's own writing does not use them, so content
 * arriving from an external source gets normalised on the way in rather than left
 * to be caught by eye later. Webflow's copy is full of them.
 *
 * A spaced em dash becomes a comma ("tough — from freelancers" -> "tough, from
 * freelancers"), which is what the dash was standing in for. An unspaced one, and
 * an en dash in a range ("2024–2026"), becomes a hyphen.
 *
 * `dashesStripped` counts them so the migration reports what it changed instead of
 * quietly rewriting the customer's prose.
 */
export let dashesStripped = 0

export function resetDashCount(): void {
  dashesStripped = 0
}

export function stripDashes(text: string): string {
  const before = text
  const out = text
    .replace(/\s+[—–]\s+/g, ', ')
    .replace(/[—–]/g, '-')
  if (out !== before) {
    dashesStripped += (before.match(/[—–]/g) ?? []).length
  }
  return out
}

/**
 * Elements a reader would keep, in document order.
 *
 * Deliberately shallow: we take the text-bearing leaves and ignore the div soup
 * around them. `img` is included but filtered hard — a Webflow page carries
 * hundreds of images, nearly all of them nav icons, arrow glyphs, client logos in
 * a marquee and CMS-list thumbnails that already live in Sanity as real documents.
 */
const CONTENT_SELECTOR = 'h2, h3, p, ul, ol, blockquote'

// NO HERO IMAGE IS CAPTURED, on purpose.
//
// The first attempt took the first large image before the first <h2>. On
// /about-us that is not the hero photo — it is a client logo from the "trusted by"
// marquee that sits directly under the hero, so the About Us page opened with a
// giant SQR logo. The marquee, the CMS-list thumbnails and the real hero photo are
// indistinguishable from the markup, and every heuristic that told them apart on
// one page got it wrong on another.
//
// A wrong hero image is worse than none: it is visibly broken, whereas no image on
// a page that is admittedly provisional is merely plain. And the pages that keep a
// hero image are the ones being redesigned anyway, so the image will be chosen by
// the design, not inherited from Webflow. Seb can set one in Studio at any time —
// heroImage is a normal field on the singleton.

export async function capturePage(html: string, url: string): Promise<CapturedPage> {
  const dom = new JSDOM(html, { url })
  const doc = dom.window.document

  const metaTitle = norm(doc.title) || null
  // Through norm(), like everything else. Read straight off the tag it bypassed the
  // dash normalisation, and an en dash survived into /our-work's meta description
  // ("removing recruitment drag-delivering vetted developers") — where it is
  // exactly as much a house-style violation as it is in the body, and rather more
  // visible, since it is what Google prints.
  const metaDescription =
    norm(doc.querySelector('meta[name="description"]')?.getAttribute('content')) || null

  // Drop the chrome before reading anything. On pages with no <main>, the nav and
  // footer are siblings of the content, and without this their headings and links
  // arrive as page content.
  for (const sel of ['nav', 'header', 'footer', 'script', 'style', 'noscript', '[class*="nav"]', '[class*="footer"]']) {
    doc.querySelectorAll(sel).forEach((el) => el.remove())
  }

  const root = doc.querySelector('main') ?? doc.body

  const h1 = root.querySelector('h1')
  const title = norm(h1?.textContent) || metaTitle || 'Untitled'

  // The inline booking widget, read from the RAW html.
  //
  // Not from the stripped DOM: the chrome removal above deletes every <script>,
  // and on some of these pages the event URL only appears inside the widget's
  // init script. Scanning the serialized DOM would find it on the pages that use a
  // data attribute and silently miss it on the ones that do not, which is the worst
  // of both - it would look like it worked.
  const calendlyUrl = findCalendlyUrl(html)

  // The eyebrow is the short label immediately above the H1 — Webflow renders it
  // as a sibling or in the H1's parent. Bounded to 60 characters: anything longer
  // is a sentence, and a sentence above the H1 is the lead, not an eyebrow.
  let eyebrow: string | null = null
  if (h1?.previousElementSibling) {
    const candidate = norm(h1.previousElementSibling.textContent)
    if (candidate && candidate.length <= 60) eyebrow = candidate
  }

  // Everything after the H1 up to the first H2 is the hero copy.
  const nodes = [...root.querySelectorAll(CONTENT_SELECTOR)]
  const h1Index = h1 ? nodes.findIndex((n) => h1.compareDocumentPosition(n) & 4) : 0

  const heroHtml: string[] = []

  // findIndex returns -1 when NOTHING follows the H1, and `nodes[-1].tagName`
  // throws. That is not a hypothetical: /book-a-call is a headline over a Calendly
  // embed, with no prose at all, so the walk crashed on the one page shape where
  // there is nothing to walk. Treat "no content after the H1" as an empty capture,
  // which is the honest answer.
  let cursor = h1Index === -1 ? nodes.length : h1Index

  for (; cursor < nodes.length; cursor++) {
    const node = nodes[cursor]
    if (node.tagName === 'H2') break
    if (node.tagName === 'IMG') continue
    if (norm(node.textContent)) heroHtml.push(node.outerHTML)
  }

  const heroDescription =
    heroHtml.length > 0 ? await toPortableText(stripDashes(heroHtml.join(''))) : []

  // Then one section per H2, holding everything up to the next H2.
  const sections: CapturedSection[] = []
  const skipped: CapturedPage['skipped'] = []
  let current: { heading: string; html: string[] } | null = null

  const flush = async (): Promise<void> => {
    if (!current) return
    if (isChromeHeading(current.heading)) {
      current = null
      return
    }
    const content =
      current.html.length > 0 ? await toPortableText(stripDashes(current.html.join(''))) : []

    if (Array.isArray(content) && content.length > 0) {
      if (looksLikeCardGrid(content)) {
        // Refuse it rather than store gibberish. These sections need a component
        // reading the real documents (teamMember, review, customerStory), which
        // Sanity already holds — the schema has grid section types for exactly
        // this. Storing the flattened cards would both look broken and duplicate
        // content we already have properly.
        skipped.push({
          heading: current.heading,
          blocks: content.length,
          why: 'a CMS-driven card grid, not prose — needs a component over the real documents',
        })
        current = null
        return
      }

      sections.push({
        _key: `section-${sections.length}`,
        _type: 'richTextSection',
        heading: current.heading || null,
        content,
      })
    }
    current = null
  }

  for (; cursor < nodes.length; cursor++) {
    const node = nodes[cursor]

    if (node.tagName === 'H2') {
      await flush()
      current = { heading: norm(node.textContent), html: [] }
      continue
    }
    if (!current) continue

    if (node.tagName === 'IMG') {
      // Images inside sections are left out on purpose. toPortableText would need
      // each one uploaded to Sanity first, and on these pages they are almost
      // entirely client logos and CMS thumbnails that already exist in Sanity as
      // real documents. Re-uploading them would duplicate the asset library for
      // pages that are about to be redesigned anyway.
      continue
    }
    if (norm(node.textContent)) current.html.push(node.outerHTML)
  }
  await flush()

  return { title, eyebrow, heroDescription, sections, skipped, calendlyUrl, metaTitle, metaDescription }
}


/**
 * The Calendly event URL on the page, if there is one.
 *
 * Deliberately a text scan rather than a selector. Webflow emits the widget three
 * different ways depending on how the embed was added (a data attribute, an inline
 * script call, a plain link), and the one thing all three have in common is the URL
 * itself. Anchored on `/d/` so it takes the event and not the widget library at
 * calendly.com/assets/external/widget.js.
 */
function findCalendlyUrl(html: string): string | null {
  const m = html.match(/https:\/\/calendly\.com\/d\/[A-Za-z0-9_\/-]+/)
  return m ? m[0] : null
}
