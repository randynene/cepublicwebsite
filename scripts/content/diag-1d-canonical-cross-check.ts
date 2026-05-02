// CONTENT-1D Diagnostic 1 — canonical URL cross-check (READ-ONLY).
//
// For each of the 16 drift _ids, build the URL via urlForDoc, check
// ce-canonical-urls.json, and live-fetch via Playwright with 5s timeout.
// Confirms the docs really have no live page (vs. stale audit data).
//
// No Sanity writes. Live HTTP fetches only.
import * as fs from 'node:fs'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { urlForDoc } from '@/lib/content/url-builder'
import { withBrowser, scrapeMeta } from '@/lib/content/meta-scraper'

const REPO_ROOT = process.cwd()

const DRIFT_IDS = [
  'customerStory-6762ed76b66ee8b78291fa47',
  'review-675a903f1706d77f0614098c',
  'review-675a903f645ca1e0fe2c4acf',
  'review-675a903f6c8b574a0197d163',
  'review-675a903f9013553a15d2f4fe',
  'review-675a903fb5d7b55f448f9bf5',
  'review-675a9040007f51216b9fc5ac',
  'review-675a90401004da9fede19fe7',
  'review-675a90403084bc75767a25b9',
  'review-675a904058d1381ee3cf2e5b',
  'review-675a90408cc0241348e89da4',
  'review-675a904096220698f917505f',
  'review-675a9040a50edca85a62fa94',
  'review-675a9041eaa940a2486cc936',
  'review-67814f55676ab3c3e0e2559e',
  'review-678150505db5e735afafdf95',
]

interface CanonicalUrlsFile {
  canonicalUrls: Array<{ url: string; path: string; status: string | number }>
}

async function main(): Promise<void> {
  const file = path.join(REPO_ROOT, 'audit-output', 'ce-canonical-urls.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as CanonicalUrlsFile
  const pathToStatus = new Map<string, string | number>()
  for (const u of data.canonicalUrls) {
    pathToStatus.set(u.path.replace(/\/$/, ''), u.status)
  }

  // Re-query Sanity in case slugs shifted since the last verifier run.
  const docs = await sanityWriteClient.fetch<
    Array<{ _id: string; _type: string; slug?: { current?: string } }>
  >(`*[_id in $ids]{_id, _type, slug}`, { ids: DRIFT_IDS })
  const docMap = new Map(docs.map((d) => [d._id, d]))

  console.log('\n=== Diagnostic 1 — canonical URL cross-check ===\n')
  console.log(
    '| _id                                         | slug                       | in_canonical | audit_status | live_status | live_error |',
  )
  console.log(
    '|---------------------------------------------|----------------------------|--------------|--------------|-------------|------------|',
  )

  await withBrowser(async (browser) => {
    for (let i = 0; i < DRIFT_IDS.length; i++) {
      const id = DRIFT_IDS[i]
      const doc = docMap.get(id)
      if (!doc || !doc.slug?.current) {
        console.log(
          `| ${id.padEnd(43)} | (no slug)                  | n/a          | —            | —           | doc-or-slug-missing |`,
        )
        continue
      }
      const url = urlForDoc({ _type: doc._type, slug: { current: doc.slug.current } })
      const pathname = new URL(url).pathname.replace(/\/$/, '')
      const auditStatus = pathToStatus.get(pathname)
      const inCanonical = auditStatus !== undefined ? 'yes' : 'no'

      // Live fetch — 5s timeout per spec.
      let liveStatus: string | number = '—'
      let liveError = ''
      try {
        const ctx = await browser.newContext({ userAgent: 'Mygratr-Diag/1.0' })
        const page = await ctx.newPage()
        try {
          const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 })
          liveStatus = resp?.status() ?? 0
        } catch (e) {
          liveError = (e as Error).message.split('\n')[0].slice(0, 60)
        } finally {
          await ctx.close()
        }
      } catch (e) {
        liveError = (e as Error).message.slice(0, 60)
      }

      console.log(
        `| ${id.padEnd(43)} | ${doc.slug.current.padEnd(26)} | ${inCanonical.padEnd(12)} | ${String(auditStatus ?? '—').padEnd(12)} | ${String(liveStatus).padEnd(11)} | ${liveError} |`,
      )

      // 1.5s inter-request delay (skipped on last)
      if (i < DRIFT_IDS.length - 1) {
        await new Promise((r) => setTimeout(r, 1500))
      }
    }
  })

  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
