import { chromium } from 'playwright'
import { captureHub } from '@/lib/content/capture-hub'
import { ensureSanity } from '@/lib/env'
ensureSanity()

// Every word we captured must appear in what the live page actually says. A word
// we invented, or two words we glued into one, fails here.
//
// The baseline is built by walking TEXT NODES and joining them with a space, and
// both of the obvious shortcuts are wrong:
//
//   innerText    returns only VISIBLE text, and the FAQ answers live inside a
//                collapsed accordion — every answer word looks invented.
//   textContent  concatenates adjacent elements with NO separator, so the live
//                text contains "DevelopmentFeatured" and never the word
//                "featured" — every heading looks invented.
//
// Both failures accuse the capture of a fault in the checker, which is the more
// dangerous direction: it is the reading that makes you "fix" working code.
const words = (s: string) =>
  s.toLowerCase().replace(/[​‌‍﻿ ]/g, ' ').match(/[a-z0-9%+]+/g) ?? []

const textOf = (blocks: unknown[]): string =>
  (blocks as any[]).map((b) => (b.children ?? []).map((c: any) => c.text ?? '').join('')).join(' ')

const HUBS = ['/blog', '/staff-augmentation', '/nearshoring-offshoring', '/scaling-teams',
  '/hiring-tips', '/managing-engineers', '/ai-in-software-development', '/videos', '/tools',
  '/downloads', '/events', '/services', '/technology', '/customer-stories', '/reviews', '/compare']

async function main() {
  const br = await chromium.launch()
  const p = await br.newPage()
  let bad = 0
  for (const path of HUBS) {
    await p.goto('https://www.cloudemployee.io' + path, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(2000)

    const live = await p.evaluate(() => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const parts: string[] = []
      while (w.nextNode()) parts.push(w.currentNode.nodeValue ?? '')
      return parts.join(' ')
    })

    const cap = await captureHub(await p.content(), 'https://www.cloudemployee.io' + path)
    const liveWords = new Set(words(live))
    const captured = [
      textOf(cap.heroDescription),
      textOf(cap.introContent),
      ...cap.faqs.map((f) => `${f.question} ${textOf(f.answer)}`),
    ].join(' ')

    const orphans = [...new Set(words(captured))].filter((w) => !liveWords.has(w))
    if (orphans.length > 0) bad++
    console.log(
      `  ${orphans.length === 0 ? 'OK  ' : 'FAIL'} ${path.padEnd(28)} ` +
        `${String(words(captured).length).padStart(4)} words, ${String(cap.faqs.length).padStart(2)} faqs` +
        (orphans.length ? `   orphans: ${orphans.slice(0, 8).join(', ')}` : ''),
    )
  }
  await br.close()
  console.log(bad === 0
    ? '\nEvery captured word appears on the live page. Nothing invented, nothing glued.'
    : `\n${bad} hub(s) captured text that is not on the live page.`)
}
main()
