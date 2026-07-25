// CONTENT-1E Step 1 — w-embed sweep probe.
//
// Read-only sweep against Webflow source for the 5 doc types that flowed
// through CONTENT-1C's `toPortableText` (blogPost, compareBlog, technology,
// service, customerStory). Surfaces every Webflow RichText embed wrapper
// instance with classification metadata so the migrator can be designed
// against real shapes.
//
// Wrapper selectors (corrected during Checkpoint 1 pre-flight):
//   - `div[data-rt-embed-type]`  — Webflow RichText Embed component
//     (the API returns this attribute; `class="w-embed"` is the published-
//     site class only and does not appear in CMS RichText HTML)
//   - `figure.w-richtext-figure-type-video`  — Webflow RichText video figure
//
// Pattern: mirrors scripts/template-blog/probe-rich-text-gaps.ts (read-only
// diagnostic probe).
//
// Output:
//   - audit-output/content-1e/w-embed-sweep-inventory.json (full inventory)
//   - stdout summary: totals by docType, classification taxonomy, 3 samples,
//     and full inner HTML for any "other" / "style-only" entries (OVERRIDE 3).
//
// Run: npx tsx scripts/content/probe-w-embed-sweep.ts

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { JSDOM } from 'jsdom'

import { ensureWebflow } from '@/lib/env'
import { getCollectionItems, type WebflowItem } from '@/lib/content/webflow-read-client'
import {
  CE_COLLECTION_IDS,
  CE_BLOG_COLLECTIONS,
} from '@/lib/content/ce-collection-ids'

ensureWebflow()

type EmbedType = 'table' | 'iframe' | 'script' | 'style-only' | 'other'

type InventoryEntry = {
  docId: string
  slug: string | null
  docType: 'blogPost' | 'compareBlog' | 'technology' | 'service' | 'customerStory'
  collectionSlug: string
  fieldName: string
  wrapperKind: 'div[data-rt-embed-type]' | 'figure.w-richtext-figure-type-video'
  position: number
  embedType: EmbedType
  // Truncated for confirmed shapes (table / iframe); FULL for other /
  // style-only / script per OVERRIDE 3 so Checkpoint 1 can manually
  // classify edge cases without re-fetching Webflow.
  innerHtml: string
  innerHtmlTruncated: boolean
  iframeSrc?: string | null
  tableShape?: { headerCells: number; bodyRows: number; bodyCells: number }
}

const SNIPPET_MAX = 400

function classify(wrapperEl: Element): {
  embedType: EmbedType
  iframeSrc?: string | null
  tableShape?: { headerCells: number; bodyRows: number; bodyCells: number }
} {
  const table = wrapperEl.querySelector('table')
  if (table) {
    const headerCells = table.querySelectorAll('thead th, thead td').length
    const bodyRows = table.querySelectorAll('tbody tr').length
    const bodyCells = table.querySelectorAll('tbody td').length
    return { embedType: 'table', tableShape: { headerCells, bodyRows, bodyCells } }
  }

  const iframe = wrapperEl.querySelector('iframe')
  if (iframe) {
    const src = iframe.getAttribute('src') ?? ''
    return { embedType: 'iframe', iframeSrc: src || null }
  }

  const script = wrapperEl.querySelector('script')
  if (script) return { embedType: 'script' }

  const style = wrapperEl.querySelector('style')
  // style-only: contains <style> AND no meaningful element siblings
  if (style) {
    const otherEls = Array.from(wrapperEl.children).filter(
      (c) => c.tagName.toUpperCase() !== 'STYLE',
    )
    const textContent = (wrapperEl.textContent ?? '').replace(style.textContent ?? '', '').trim()
    if (otherEls.length === 0 && textContent === '') {
      return { embedType: 'style-only' }
    }
  }

  return { embedType: 'other' }
}

function captureInnerHtml(
  wrapperEl: Element,
  embedType: EmbedType,
): { innerHtml: string; innerHtmlTruncated: boolean } {
  const raw = wrapperEl.innerHTML ?? ''
  // OVERRIDE 3: full inner HTML for non-confirmed shapes; truncate confirmed.
  const isConfirmedShape = embedType === 'table' || embedType === 'iframe'
  if (!isConfirmedShape) {
    return { innerHtml: raw, innerHtmlTruncated: false }
  }
  if (raw.length <= SNIPPET_MAX) {
    return { innerHtml: raw, innerHtmlTruncated: false }
  }
  return {
    innerHtml: raw.slice(0, SNIPPET_MAX) + '…',
    innerHtmlTruncated: true,
  }
}

function scanFieldForEmbeds(
  html: string,
): Array<{
  wrapperKind: InventoryEntry['wrapperKind']
  position: number
  classification: ReturnType<typeof classify>
  capture: ReturnType<typeof captureInnerHtml>
}> {
  const doc = new JSDOM(html).window.document
  // querySelectorAll combined so position indices come from the merged set,
  // matching the migrator's deterministic _key scheme.
  const wrappers = Array.from(
    doc.querySelectorAll('div[data-rt-embed-type], figure.w-richtext-figure-type-video'),
  )
  return wrappers.map((wrapperEl, position) => {
    const wrapperKind: InventoryEntry['wrapperKind'] =
      wrapperEl.tagName.toUpperCase() === 'FIGURE'
        ? 'figure.w-richtext-figure-type-video'
        : 'div[data-rt-embed-type]'
    const classification = classify(wrapperEl)
    const capture = captureInnerHtml(wrapperEl, classification.embedType)
    return { wrapperKind, position, classification, capture }
  })
}

type DocTypeSpec = {
  docType: InventoryEntry['docType']
  idPrefix: string
  // Webflow source collections (1 for most; 7 for blogPost).
  sources: Array<{ collectionId: string; collectionSlug: string }>
  // RichText fields to scan. Sub-section fields (e.g. customerStory's
  // 'the-problem-content') flatten in here — every Webflow field that
  // CONTENT-1C passed through toPortableText is in scope.
  richTextFields: string[]
}

const DOC_TYPE_SPECS: DocTypeSpec[] = [
  {
    docType: 'blogPost',
    idPrefix: 'blogPost',
    sources: CE_BLOG_COLLECTIONS.map((c) => ({ collectionId: c.id, collectionSlug: c.collectionSlug })),
    richTextFields: [
      'content',
      'tldr-section',
      ...Array.from({ length: 6 }, (_, i) => `faq-content-${i + 1}`),
    ],
  },
  {
    docType: 'compareBlog',
    idPrefix: 'compareBlog',
    sources: [{ collectionId: CE_COLLECTION_IDS.compareBlogs, collectionSlug: 'compare-blogs' }],
    richTextFields: [
      'content',
      'tldr-section',
      ...Array.from({ length: 6 }, (_, i) => `faq-content-${i + 1}`),
    ],
  },
  {
    docType: 'technology',
    idPrefix: 'technology',
    sources: [{ collectionId: CE_COLLECTION_IDS.technologyPages, collectionSlug: 'technology-pages' }],
    richTextFields: ['fold-1---paragraph', 'fold-2---paragraph', 'fold-5---description'],
  },
  {
    docType: 'service',
    idPrefix: 'service',
    sources: [{ collectionId: CE_COLLECTION_IDS.services, collectionSlug: 'services' }],
    richTextFields: ['fold-1---paragraph', 'fold-2---paragraph-2', 'fold-5---description'],
  },
  {
    docType: 'customerStory',
    idPrefix: 'customerStory',
    sources: [{ collectionId: CE_COLLECTION_IDS.customerStories, collectionSlug: 'customer-stories' }],
    richTextFields: [
      'video-testimonial-intro-content',
      'tldr-content',
      'hiring-needs-table',
      'the-customer-content',
      'the-problem-content',
      'the-solution-content',
      'the-impact-content',
      'cta-content',
    ],
  },
]

function itemSlug(item: WebflowItem): string | null {
  const f = item.fieldData
  const fromFieldData = f['slug']
  if (typeof fromFieldData === 'string' && fromFieldData.trim() !== '') return fromFieldData
  return item.slug ?? null
}

async function main() {
  console.log('=== CONTENT-1E w-embed sweep — read-only probe ===\n')

  const inventory: InventoryEntry[] = []
  const perTypeStats: Record<string, { docsScanned: number; docsWithEmbeds: number; embedCount: number }> = {}
  const taxonomy: Record<EmbedType, number> = {
    table: 0,
    iframe: 0,
    script: 0,
    'style-only': 0,
    other: 0,
  }

  for (const spec of DOC_TYPE_SPECS) {
    let docsScanned = 0
    const docsWithEmbeds = new Set<string>()
    let embedCount = 0

    for (const source of spec.sources) {
      const items = await getCollectionItems(source.collectionId)
      console.log(
        `[${spec.docType}] ${source.collectionSlug}: ${items.length} items`,
      )
      for (const item of items) {
        docsScanned++
        const f = item.fieldData
        const docId = `${spec.idPrefix}-${item.id}`
        const slug = itemSlug(item)

        for (const fieldName of spec.richTextFields) {
          const html = f[fieldName]
          if (typeof html !== 'string' || html.trim() === '') continue
          const hits = scanFieldForEmbeds(html)
          for (const hit of hits) {
            taxonomy[hit.classification.embedType]++
            embedCount++
            docsWithEmbeds.add(docId)
            const entry: InventoryEntry = {
              docId,
              slug,
              docType: spec.docType,
              collectionSlug: source.collectionSlug,
              fieldName,
              wrapperKind: hit.wrapperKind,
              position: hit.position,
              embedType: hit.classification.embedType,
              innerHtml: hit.capture.innerHtml,
              innerHtmlTruncated: hit.capture.innerHtmlTruncated,
              ...(hit.classification.iframeSrc !== undefined
                ? { iframeSrc: hit.classification.iframeSrc }
                : {}),
              ...(hit.classification.tableShape
                ? { tableShape: hit.classification.tableShape }
                : {}),
            }
            inventory.push(entry)
          }
        }
      }
    }

    perTypeStats[spec.docType] = {
      docsScanned,
      docsWithEmbeds: docsWithEmbeds.size,
      embedCount,
    }
  }

  // ---------------------------------------------------------------
  // Write inventory JSON
  // ---------------------------------------------------------------
  const outDir = resolve(process.cwd(), 'audit-output/content-1e')
  mkdirSync(outDir, { recursive: true })
  const outFile = resolve(outDir, 'w-embed-sweep-inventory.json')
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        perTypeStats,
        taxonomy,
        totalEmbedCount: inventory.length,
        entries: inventory,
      },
      null,
      2,
    ),
  )
  console.log(`\nWrote ${inventory.length} inventory entries to ${outFile}`)

  // ---------------------------------------------------------------
  // Stdout summary — Checkpoint 1 surface
  // ---------------------------------------------------------------
  console.log('\n=== Checkpoint 1 summary ===\n')

  console.log('Per-doc-type stats:')
  for (const [docType, stats] of Object.entries(perTypeStats)) {
    console.log(
      `  ${docType.padEnd(14)} scanned=${stats.docsScanned}  docsWithEmbeds=${stats.docsWithEmbeds}  embeds=${stats.embedCount}`,
    )
  }
  const totalDocsWithEmbeds = Object.values(perTypeStats).reduce(
    (sum, s) => sum + s.docsWithEmbeds,
    0,
  )
  console.log(`  ${'TOTAL'.padEnd(14)} docsWithEmbeds=${totalDocsWithEmbeds}  embeds=${inventory.length}`)

  console.log('\nClassification taxonomy:')
  for (const [embedType, count] of Object.entries(taxonomy)) {
    console.log(`  ${embedType.padEnd(14)} ${count}`)
  }

  console.log('\n3 sample inventory entries:')
  const samples = inventory.slice(0, 3)
  for (const s of samples) {
    console.log(
      JSON.stringify(
        {
          docType: s.docType,
          slug: s.slug,
          collectionSlug: s.collectionSlug,
          fieldName: s.fieldName,
          wrapperKind: s.wrapperKind,
          position: s.position,
          embedType: s.embedType,
          iframeSrc: s.iframeSrc,
          tableShape: s.tableShape,
          innerHtmlPreview:
            s.innerHtml.length > 200 ? s.innerHtml.slice(0, 200) + '…' : s.innerHtml,
        },
        null,
        2,
      ),
    )
  }

  // OVERRIDE 3: full inner HTML for "other" / "style-only" / "script" so
  // Checkpoint 1 can manually classify edge cases.
  const edgeCases = inventory.filter(
    (e) => e.embedType === 'other' || e.embedType === 'style-only' || e.embedType === 'script',
  )
  if (edgeCases.length > 0) {
    console.log(`\n=== Edge-case entries (${edgeCases.length}) — FULL inner HTML ===`)
    for (const e of edgeCases) {
      console.log(
        `\n--- ${e.docType} / ${e.slug ?? '(no-slug)'} / ${e.fieldName} / pos=${e.position} / ${e.embedType} (${e.wrapperKind}) ---`,
      )
      console.log(e.innerHtml)
    }
  } else {
    console.log('\nNo edge-case entries (no "other" / "style-only" / "script" classifications).')
  }

  console.log('\n=== HALT — Checkpoint 1 — Jake review required ===')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
