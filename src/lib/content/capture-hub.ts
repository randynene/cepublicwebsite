// Capture a live hub page's prose into the Sanity hub-singleton shape.
//
// The hubs are the pages Google actually sends people to, and we have been
// shipping them as a headline over a grid of cards. The live pages carry a great
// deal more: a lead paragraph, several hundred words of body copy under "Key
// Topics" and "Key Market Insights", and an FAQ block. None of it was migrated,
// because `introContent` was never projected and no hub schema had anywhere to put
// FAQs at all.
//
// That is the wrong content to lose. A blog post is one page; a hub is the entry
// point to a whole category, and its prose is the part an answer engine can quote.
// So this reads the three things the cards are not:
//
//   heroDescription  the lead paragraph under the H1
//   introContent     the body copy BELOW the grid ("Key Topics", "Key Market
//                    Insights"). "intro" is a misnomer inherited from the schema;
//                    on the live page this copy comes last, and last is where it
//                    renders.
//   faqs             the .faq-item accordion, as structured question/answer pairs,
//                    so it can be emitted as FAQPage JSON-LD
//
// It does NOT capture the card grid. Those cards are blogPost and video documents
// that already exist in Sanity; a flattened copy of their rendered innards would be
// both duplicate content and gibberish (see looksLikeCardGrid in capture-page).
import { JSDOM } from 'jsdom'

import { stripDashes } from '@/lib/content/capture-page'
import { toPortableText } from '@/lib/content/migration-helpers'

export type CapturedFaq = {
  _key: string
  _type: 'faqItem'
  question: string
  answer: unknown[]
}

export type CapturedHub = {
  /** The live H1, reported so a seed can compare rather than blindly overwrite. */
  liveTitle: string | null
  heroDescription: unknown[]
  introContent: unknown[]
  faqs: CapturedFaq[]
}

// Every string leaving this module goes through here: the lead, the headings, the
// FAQ questions and answers. Whitespace collapsed, zero-width junk dropped, house
// style applied. Doing it in one place is why the hero and the FAQ answers cannot
// drift apart from the body copy on any of it.
const norm = (s: string | null | undefined): string => stripDashes(collapse(s ?? ''))

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Text the page shows that is not the page's content. Both of these sit inside
// <main> on this site: the first is the announcement bar, the second is a standing
// cross-link that Webflow renders into the FAQ section on every hub.
const CHROME_TEXT = [
  /^new price comparison calculator/i,
  /^got questions\? check out our frequently asked questions page/i,
]

const isChrome = (text: string): boolean => CHROME_TEXT.some((re) => re.test(text))

/**
 * Is this element inside a CMS card, the chrome, or the FAQ block?
 *
 * Webflow renders every CMS list item as `.w-dyn-item`. Anything inside one is
 * card innards, and the document behind it is already in Sanity. The FAQ block is
 * excluded here because it is captured separately, as structured pairs.
 */
const inCardOrChrome = (el: Element): boolean =>
  !!el.closest(
    '.w-dyn-item, [role="listitem"], nav, header, footer, form, ' +
      '.faq-list, .faq-item, [s-accordion="root"]',
  )

/**
 * The FAQ accordion.
 *
 * The markup is a Webflow/`s-accordion` widget, and its class names are a trap.
 * `.faq-btn` sounds like the question but is the +/- glyph: two empty divs,
 * `.line-1` and `.line-2`. Reading the question from it yields an empty string,
 * which is how the first pass captured zero FAQs on all sixteen hubs while
 * appearing to work.
 *
 * The real shape:
 *   .faq-item
 *     [s-accordion="trigger"]   the question (plus the glyph, which has no text)
 *     [s-accordion="content"]   the answer
 *
 * Anchored on the `s-accordion` attributes rather than the class names, because
 * the attributes describe the widget's structure while the classes describe its
 * styling, and only one of those is a contract. (`.toogle-top` is also misspelt in
 * the source, which is not a thing to depend on.)
 */
async function captureFaqs(root: Element): Promise<CapturedFaq[]> {
  const out: CapturedFaq[] = []
  const items = [...root.querySelectorAll('.faq-item, [s-accordion="root"]')]

  for (const [idx, item] of items.entries()) {
    const trigger = item.querySelector('[s-accordion="trigger"], .toogle-top')
    const content = item.querySelector('[s-accordion="content"], .answer-faq')
    if (!trigger) continue

    // Drop the glyph before reading the question. It contributes no text today,
    // but it is inside the trigger and a future icon with a label would land in
    // the middle of the question.
    const triggerClone = trigger.cloneNode(true) as Element
    triggerClone.querySelectorAll('.faq-btn').forEach((b) => b.remove())
    const question = norm(triggerClone.textContent)
    if (!question) continue

    const answerRoot = content ?? item
    let parts = [...answerRoot.querySelectorAll('p, li')]
      .map((p) => norm(p.textContent))
      .filter((t) => t.length > 0 && !isChrome(t) && t !== question)

    // Some answers are bare text in a div with no <p> wrapper.
    if (parts.length === 0) {
      const bare = norm(answerRoot.textContent)
      const cleaned = bare === question ? '' : bare
      if (cleaned) parts = [cleaned]
    }
    if (parts.length === 0) continue

    const html = parts.map((t) => `<p>${escapeHtml(t)}</p>`).join('')
    out.push({
      _key: `faq-${idx}`,
      _type: 'faqItem',
      question,
      answer: await toPortableText(html),
    })
  }

  return out
}

export async function captureHub(html: string, url: string): Promise<CapturedHub> {
  const dom = new JSDOM(html, { url })
  const doc = dom.window.document
  const Node = dom.window.Node

  for (const sel of ['script', 'style', 'noscript']) {
    doc.querySelectorAll(sel).forEach((el) => el.remove())
  }

  const root = doc.querySelector('main') ?? doc.body

  const faqs = await captureFaqs(root)

  const h1 = root.querySelector('h1')
  const liveTitle = norm(h1?.textContent) || null

  // ── The lead paragraph ────────────────────────────────────────────────────
  // The first real prose after the H1. Cards and chrome are excluded, and a
  // 40-character floor keeps out badges ("5 min read"): on a hub with no lead,
  // such as /reviews, the next paragraph in document order belongs to a card, and
  // capturing it would put a review excerpt in the hero.
  let heroDescription: unknown[] = []
  if (h1) {
    for (const p of root.querySelectorAll('p')) {
      const isAfterH1 =
        h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING
      if (!isAfterH1 || inCardOrChrome(p)) continue
      const text = norm(p.textContent)
      if (!text || isChrome(text) || text.length < 40) continue
      heroDescription = await toPortableText(`<p>${escapeHtml(text)}</p>`)
      break
    }
  }

  // ── The body copy ─────────────────────────────────────────────────────────
  // "Key Topics", "Key Market Insights": the prose these URLs rank for. Everything
  // before the FAQ block that is not a card and not chrome, then filtered down to
  // what is actually prose.
  //
  // The filtering is the whole job, and the first pass got it wrong in three ways
  // that all looked fine in a block count:
  //
  //   - it repeated the lead paragraph as the first body block
  //   - it kept headings like "Hear from our customers:" whose content is a card
  //     grid we deliberately do not capture, leaving a heading over nothing
  //   - it emitted empty blocks, because Webflow pads its layout with paragraphs
  //     containing a single zero-width joiner
  //
  // So a heading survives only if real prose follows it before the next heading.
  // That is what distinguishes an editorial section from a label on a visual block,
  // and it needs no per-hub knowledge.
  const faqBlock = root.querySelector('.faq-list, .faq-item, [s-accordion="root"]')
  const leadText = leadTextOf(heroDescription)

  type Candidate = { kind: 'heading' | 'prose'; html: string; text: string }
  const candidates: Candidate[] = []

  for (const el of root.querySelectorAll('h2, h3, p, ul, ol')) {
    if (inCardOrChrome(el)) continue

    if (faqBlock) {
      const beforeFaqs = faqBlock.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING
      if (!beforeFaqs) continue
    }

    const text = norm(el.textContent)
    if (!isProse(text) || isChrome(text)) continue
    if (leadText && text === leadText) continue // the lead is already the hero
    if (/^h[23]$/i.test(el.tagName) && /^FAQ/i.test(text)) continue // template renders its own

    if (el.tagName === 'UL' || el.tagName === 'OL') {
      const lis = [...el.querySelectorAll('li')]
        .map((li) => inlineHtml(li))
        .filter((h) => isProse(h.text))
      if (lis.length === 0) continue
      candidates.push({
        kind: 'prose',
        html: `<ul>${lis.map((l) => `<li>${l.html}</li>`).join('')}</ul>`,
        text,
      })
      continue
    }

    if (/^h[23]$/i.test(el.tagName)) {
      const tag = el.tagName.toLowerCase()
      candidates.push({ kind: 'heading', html: `<${tag}>${escapeHtml(text)}</${tag}>`, text })
      continue
    }

    candidates.push({ kind: 'prose', html: `<p>${inlineHtml(el).html}</p>`, text })
  }

  // Drop a heading with no prose beneath it: it labels a card grid or an image
  // block, and the thing it labels is not here.
  const kept = candidates.filter((c, i) => {
    if (c.kind === 'prose') return true
    const next = candidates[i + 1]
    return next !== undefined && next.kind === 'prose'
  })

  const introContent = kept.length > 0 ? await toPortableText(kept.map((c) => c.html).join('')) : []

  return { liveTitle, heroDescription, introContent, faqs }
}

/**
 * Real text, or Webflow's layout padding?
 *
 * Webflow spaces its sections with paragraphs holding a single zero-width joiner
 * (U+200D) or a non-breaking space. They are invisible on the page and arrive as
 * empty Portable Text blocks, so they are stripped rather than stored.
 */
function isProse(text: string): boolean {
  // Escaped, not literal: zero-width characters are invisible in source, and a
  // regex you cannot see is a regex you cannot review.
  //   200B zero-width space  200C non-joiner  200D joiner  FEFF BOM  00A0 nbsp
  return text.replace(/[\u200B\u200C\u200D\uFEFF\u00A0\s]/g, '').length > 0
}

/** The plain text of the captured lead, for de-duplicating it out of the body. */
function leadTextOf(blocks: unknown[]): string | null {
  const first = blocks[0] as { children?: Array<{ text?: string }> } | undefined
  if (!first?.children) return null
  return norm(first.children.map((c) => c.text ?? '').join('')) || null
}

/**
 * A paragraph's inline HTML, keeping the links.
 *
 * The Knowledge Hubs' body copy is threaded with "View related blog: ..." links
 * into the very articles the hub exists to rank for. Capturing textContent kept the
 * words and dropped every one of those links, which is the opposite of the point:
 * on a hub page the internal links ARE the SEO value.
 *
 * Only anchors and emphasis survive. Everything else in Webflow's markup is a
 * positioning div for a design we are replacing, and `htmlToBlocks` would drop it
 * anyway. Absolute self-links become paths so they route internally rather than
 * bouncing the visitor out to the old site.
 */
function inlineHtml(el: Element): { html: string; text: string } {
  const parts: string[] = []

  const walk = (node: ChildNode): void => {
    if (node.nodeType === 3) {
      parts.push(escapeHtml(stripDashes(node.textContent ?? '')))
      return
    }
    if (node.nodeType !== 1) return

    const e = node as Element
    const tag = e.tagName.toLowerCase()

    if (tag === 'a') {
      const raw = e.getAttribute('href') ?? ''
      const href = raw
        .replace(/^https?:\/\/(www\.)?cloudemployee\.io/i, '')
        .trim()
      const inner = [...e.childNodes].map((c) => {
        const box: string[] = []
        const save = parts.length
        walk(c)
        box.push(...parts.splice(save))
        return box.join('')
      }).join('')
      if (href && inner) {
        parts.push(`<a href="${escapeHtml(href)}">${inner}</a>`)
      } else {
        parts.push(inner)
      }
      return
    }

    if (tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i') {
      const save = parts.length
      ;[...e.childNodes].forEach(walk)
      const inner = parts.splice(save).join('')

      // An emphasis tag wrapping nothing but whitespace carries no emphasis, only
      // a space. Keep the space, drop the tag.
      //
      // The live copy really contains `Clients achieve<strong> </strong>faster`,
      // and htmlToBlocks discards the empty span, taking the only space between
      // the two words with it: "Clients achievefaster". The browser renders it
      // correctly, so the source looks fine and the migration silently corrupts
      // the sentence. Worth the special case; this is precisely the kind of damage
      // nobody finds until a customer reads their own page.
      if (inner.trim() === '') {
        if (inner.length > 0) parts.push(' ')
        return
      }

      const emphasis = tag === 'strong' || tag === 'b' ? 'strong' : 'em'
      parts.push(`<${emphasis}>${inner}</${emphasis}>`)
      return
    }
    // A <br> is a space, not nothing. Dropping it glued words together across the
    // line break: "Clients achieve<br>faster team ramp-up" became "achievefaster".
    // Invisible in a block count, obvious to a reader, and exactly the kind of
    // damage a migration must not do quietly.
    if (tag === 'br') {
      parts.push(' ')
      return
    }

    ;[...e.childNodes].forEach(walk)
  }

  ;[...el.childNodes].forEach(walk)

  const html = collapse(parts.join(''))
  return { html, text: norm(el.textContent) }
}

/**
 * Collapse runs of whitespace, and drop the zero-width characters Webflow scatters
 * through its rich text. They are invisible on the page but real in the string, and
 * they would arrive in Sanity as leading gibberish on a third of the body blocks.
 */
function collapse(s: string): string {
  return s
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
