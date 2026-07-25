// Build a table of contents from a post's Portable Text. Spec §7.3 / D24.
//
// NO NEW SCHEMA FIELD. The headings are already in the body; asking an editor to
// maintain a second, parallel list of them would guarantee the two drift apart, and the
// first person to notice would be a reader clicking a link to a section that no longer
// exists.
//
// THE SLUG IS THE CONTRACT. The same function assigns the id to the heading in the body
// and the href in the rail, so they cannot disagree. If they did, every link would be
// dead and nothing would throw - the page would just quietly not work.

export type TocEntry = {
  id: string
  text: string
  level: 2
}

type Block = {
  _type?: string
  _key?: string
  style?: string
  children?: Array<{ text?: string }>
}

/** The plain text of a block. */
function blockText(block: Block): string {
  return (block.children ?? [])
    .map((c) => c.text ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A URL-safe id.
 *
 * Deliberately NOT random and NOT index-based. An id derived from the heading's own
 * words survives an editor inserting a paragraph above it, which an index would not,
 * and it means a link someone shared to #key-market-insights still lands in the right
 * place next month. That is the whole reason to anchor a heading in the first place.
 */
export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      // strip accents, then anything that is not a word character or a space
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      .replace(/-$/, '') || 'section'
  )
}

/**
 * Every H2 in the body, in document order, with a stable unique id.
 *
 * H2 ONLY, per Jake. H3s are still real headings in the article - they just do not
 * appear in the contents rail. That keeps the list short enough to float in full
 * without scrolling, which is the point: a rail of 40 H2+H3 entries was taller than the
 * screen; a rail of ~10 H2s is not.
 *
 * Duplicate headings get a numeric suffix. Two sections called "Overview" are not
 * unusual in a long article, and two elements with the same id is invalid HTML that
 * browsers resolve by silently picking the first - so the second link in the rail would
 * scroll to the wrong place, and only on some posts.
 */
export function buildToc(body: unknown[] | null | undefined): TocEntry[] {
  if (!Array.isArray(body)) return []

  const seen = new Map<string, number>()
  const entries: TocEntry[] = []

  for (const raw of body as Block[]) {
    if (raw?._type !== 'block') continue
    if (raw.style !== 'h2') continue

    const text = blockText(raw)
    if (!text) continue

    const base = slugifyHeading(text)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    const id = n === 0 ? base : `${base}-${n + 1}`

    entries.push({ id, text, level: 2 })
  }

  return entries
}

/**
 * The id for a heading block, resolved the same way buildToc resolved it.
 *
 * The body renderer calls this per heading. It re-walks the whole body rather than
 * taking an index, because PortableText hands its components a block, not a position,
 * and a heading's id must depend on how many identical headings came BEFORE it. Cheap:
 * these bodies are tens of blocks, not thousands.
 */
export function headingIdFor(body: unknown[] | null | undefined, block: unknown): string | undefined {
  const b = block as Block
  // H2 only. H3s no longer get an id, because the rail no longer links to them - and an
  // unreferenced id is just dead weight in the DOM.
  if (b?._type !== 'block' || b.style !== 'h2') return undefined

  const toc = buildToc(body)
  const key = b._key

  // Match on _key when we have one - it is unique per block and immune to two headings
  // sharing the same words. Fall back to the first unclaimed text match.
  if (key) {
    const blocks = (body as Block[]).filter(
      (x) => x?._type === 'block' && x.style === 'h2' && blockText(x),
    )
    const idx = blocks.findIndex((x) => x._key === key)
    if (idx >= 0 && toc[idx]) return toc[idx].id
  }

  return toc.find((t) => t.text === blockText(b))?.id
}
