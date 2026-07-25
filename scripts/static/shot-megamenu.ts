import { chromium } from 'playwright'

const OUT = process.env.OUT ?? 'audit-output/static-3'
const TRIGGER = process.env.TRIGGER ?? 'Services'
const NAME = process.env.NAME ?? 'services'

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: TRIGGER }).first().click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/mega-${NAME}__desktop.png` })
  console.log(`captured ${OUT}/mega-${NAME}__desktop.png`)
  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
