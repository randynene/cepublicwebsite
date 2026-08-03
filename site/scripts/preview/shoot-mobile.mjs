// Mobile check for the landscape band. The two-column grid is lg-only, so this
// confirms it collapses to a single readable column rather than squeezing.
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const OUT = '/workspace/artifacts/form-states'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle' })
await page.waitForSelector('text=What role are you hiring for?')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/m1-role.png` })

await page.getByRole('button', { name: 'AI / ML', exact: true }).click()
await page.getByRole('button', { name: /Next|Book a call/ }).first().click()
await page.waitForSelector('text=Any particular stack?')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/m2-skills.png` })
await browser.close()
console.log('mobile shots written')
