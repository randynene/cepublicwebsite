// CONTENT-1D §2 — Playwright-backed live-page meta extractor.
//
// Why Playwright (not cheerio): Webflow Technology pages inject JSON-LD
// and tag meta via custom code (per AUDIT-1). cheerio would only see
// the static HTML; Playwright executes JS and reads document.title /
// meta[name=description] AFTER hydration — which is what Google sees.
//
// Annotation: page.title() reads document.title (post-JS). If a Webflow
// page mutates document.title after domcontentloaded, we capture the
// mutated value — correct semantic for SEO meta backfill.
//
// Per-page timeout is 20s (catches stalled pages). Phase-wide 20-min
// abort gate is enforced in meta-backfill-runner.ts (NOT here) — F1.
//
// Concurrency: serial. CE is on Webflow shared hosting; we don't want
// to trigger Cloudflare bot defences mid-migration. The 1.5s
// inter-request delay (F13) is also enforced in the runner.
import { chromium, type Browser } from 'playwright'

export interface ScrapedMeta {
  url: string
  status: number // HTTP status from page.goto()
  rawTitle: string | null
  rawDescription: string | null
  scrapedAt: string // ISO timestamp
  errorMessage?: string // populated on goto/network failure
}

const USER_AGENT = 'Mygratr-MetaBackfill/1.0 (+https://mygratr.dev/bot)'
const PER_PAGE_TIMEOUT_MS = 20_000

export async function scrapeMeta(browser: Browser, url: string): Promise<ScrapedMeta> {
  const ctx = await browser.newContext({ userAgent: USER_AGENT })
  const page = await ctx.newPage()
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: PER_PAGE_TIMEOUT_MS,
    })
    const status = response?.status() ?? 0
    if (status !== 200) {
      return {
        url,
        status,
        rawTitle: null,
        rawDescription: null,
        scrapedAt: new Date().toISOString(),
      }
    }
    const rawTitle = await page.title()
    const rawDescription = await page
      .locator('meta[name="description"]')
      .first()
      .getAttribute('content')
      .catch(() => null)
    return {
      url,
      status,
      rawTitle: rawTitle && rawTitle.length > 0 ? rawTitle : null,
      rawDescription: rawDescription && rawDescription.length > 0 ? rawDescription : null,
      scrapedAt: new Date().toISOString(),
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return {
      url,
      status: 0,
      rawTitle: null,
      rawDescription: null,
      scrapedAt: new Date().toISOString(),
      errorMessage,
    }
  } finally {
    await ctx.close()
  }
}

export async function withBrowser<T>(fn: (b: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch()
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}
