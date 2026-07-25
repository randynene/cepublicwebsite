import type { PortableTextComponents } from '@portabletext/react'
import type { ReactNode } from 'react'

import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

// Long-form reading treatment for Sanity Portable Text body content.
//
// This is the REUSABLE typography layer for utility / static long-form pages
// (Privacy Policy first; About + other static pages inherit it). It is a
// `components` override for the B3 PortableText primitive — it does NOT fork
// PortableText. PortableText deep-merges this over its defaults, so handlers
// we don't touch (image / videoEmbed / table / h5 / h6 / em / code) keep their
// sitewide behaviour.
//
// Design intent (VISUAL_LANGUAGE_SPEC.md): dark ground, readable column.
//   - Body copy uses text-secondary (#B8C2D1), NOT pure white — comfortable
//     for sustained reading on the dark ground. Headings stay white.
//   - Generous line-height (1.8 on paragraphs) + clear H2/H3/H4 step-down.
//   - Section headings (H2) carry an anchor `id` + scroll-margin so the TOC
//     can jump to them without the sticky header covering the target.
//   - Links inherit the lime A2 Link styling (accent on dark).
//   - Long-form heading scale is intentionally SMALLER than the marketing
//     Heading sizes (58/46px) — those are section-marquee sizes, unreadable
//     as inline body headings. Per the Heading primitive's own guidance,
//     one-off reading scales live as template-level className overrides.

// Stable, deterministic slug from heading text. Used by BOTH the heading
// renderer (to set the anchor id) and extractToc (to build the matching
// href), so the two always agree for unique headings.
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// A Portable Text "block" with text children. Loose shape — we only read the
// span text to build heading ids + TOC labels.
interface PortableBlockLike {
  _type?: string
  _key?: string
  style?: string
  children?: Array<{ text?: string }>
}

function blockPlainText(block: PortableBlockLike): string {
  return (block.children ?? []).map((c) => c.text ?? '').join('')
}

export interface TocItem {
  id: string
  text: string
}

// Pre-scan the body for H2 headings to build the table of contents. Runs once
// in the template before render; the heading renderer below reproduces the
// same id from the same text.
export function extractToc(blocks: unknown): TocItem[] {
  if (!Array.isArray(blocks)) return []
  const items: TocItem[] = []
  for (const raw of blocks) {
    const block = raw as PortableBlockLike
    if (block?._type === 'block' && block.style === 'h2') {
      const text = blockPlainText(block).trim()
      if (text) items.push({ id: slugifyHeading(text), text })
    }
  }
  return items
}

// scroll-mt clears the sticky floating-pill header (76px desktop / 64px
// mobile, +breathing room) when an anchor jump lands on a heading.
const HEADING_SCROLL_MARGIN = 'scroll-mt-24 lg:scroll-mt-28'

function headingId(children: ReactNode, value: unknown): string {
  // Prefer the raw block text (stable) for the id; fall back to string
  // children if the block shape is unexpected.
  const text = value ? blockPlainText(value as PortableBlockLike) : ''
  if (text) return slugifyHeading(text)
  if (typeof children === 'string') return slugifyHeading(children)
  return ''
}

export const longformComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <Text as="p" size="lead" className="text-text-secondary leading-[1.8]">
        {children}
      </Text>
    ),
    // H2 — major section. White, ~28px desktop, anchor target for the TOC.
    h2: ({ children, value }) => (
      <Heading
        as="h2"
        size="h4"
        id={headingId(children, value)}
        className={`${HEADING_SCROLL_MARGIN} mt-14 mb-5 text-h4 font-semibold leading-snug lg:text-[1.75rem]`}
      >
        {children}
      </Heading>
    ),
    // H3 — sub-section. ~20px.
    h3: ({ children, value }) => (
      <Heading
        as="h3"
        size="h4"
        id={headingId(children, value)}
        className={`${HEADING_SCROLL_MARGIN} mt-10 mb-3 text-[1.25rem] font-semibold leading-snug`}
      >
        {children}
      </Heading>
    ),
    // H4 — minor heading. ~17px, sits just above body size.
    h4: ({ children, value }) => (
      <Heading
        as="h4"
        size="h4"
        id={headingId(children, value)}
        className={`${HEADING_SCROLL_MARGIN} mt-8 mb-2 text-[1.0625rem] font-semibold`}
      >
        {children}
      </Heading>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-accent-primary/60 pl-5 text-body-lead italic leading-[1.7] text-text-secondary">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 list-disc space-y-2.5 pl-6 marker:text-accent-primary">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 list-decimal space-y-2.5 pl-6 marker:text-text-tertiary">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="pl-1.5 text-body-lead leading-[1.7] text-text-secondary">
        {children}
      </li>
    ),
    number: ({ children }) => (
      <li className="pl-1.5 text-body-lead leading-[1.7] text-text-secondary">
        {children}
      </li>
    ),
  },
  marks: {
    // Emphasis pops to white against the text-secondary body.
    strong: ({ children }) => (
      <strong className="font-semibold text-text-default">{children}</strong>
    ),
  },
}
