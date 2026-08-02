// Walks the quick hiring form through every state and photographs each one.
//
// Why a click-through rather than rendering each step directly: a state reached by
// driving the real UI is a state the UI can actually reach. Rendering step 4 in
// isolation would happily produce a screenshot of a step that is unreachable
// because the Continue button before it never enables.
//
// Run: node scripts/preview/shoot-states.mjs

import { mkdirSync } from 'node:fs'

import { chromium } from 'playwright'

const OUT = '/workspace/artifacts/form-states'
const URL = 'http://localhost:8899/index.html'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1400, height: 1100 },
  deviceScaleFactor: 2,
})

const shots = []

/**
 * Settle before firing. Buttons carry `transition-colors`, and photographing the
 * instant after a click catches the colour part-way between states. That produced
 * a screenshot of a lime button rendered as murky olive and sent me looking for a
 * styling bug that did not exist. A screenshot taken mid-transition is evidence of
 * nothing.
 */
const SETTLE_MS = 500

async function shoot(name, note) {
  await page.waitForTimeout(SETTLE_MS)
  const file = `${OUT}/${name}.png`
  await page.locator('section').first().screenshot({ path: file })
  shots.push(`${name}: ${note}`)
  console.log(`  ${name}`)
}

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('text=What kind of engineer do you need?')

await shoot('01-role-empty', 'step 1, nothing chosen, Continue inactive')

await page.getByRole('button', { name: 'AI Engineer', exact: true }).click()
await shoot('02-role-chosen', 'step 1, AI Engineer selected, Continue now lime')

await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForSelector('text=Any particular stack?')
await shoot('03-skills-default', 'step 2, AI-biased pills because the role was AI Engineer')

await page.getByPlaceholder('Search any technology').fill('kube')
await page.waitForTimeout(150)
await shoot('04-skills-search', 'typing "kube" resolves to Kubernetes')

await page.getByRole('button', { name: 'Kubernetes', exact: true }).first().click()
await page.getByPlaceholder('Search any technology').fill('rag')
await page.waitForTimeout(150)
await page.keyboard.press('Enter')
await page.getByPlaceholder('Search any technology').fill('quantum annealing')
await page.waitForTimeout(150)
await shoot('05-skills-unknown', 'a technology not in the list is offered, not rejected')

await page.keyboard.press('Enter')
await page.waitForTimeout(150)
await shoot('06-skills-selected', 'three selected, including the custom one')

await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForSelector('text=How long do you need help for?')
await shoot('07-length', 'step 3')

await page.getByText('More than 6 months').click()
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForSelector('text=What level of commitment do you need?')
await page.getByText('Full-time (40h/week)').click()
await shoot('08-commitment', 'step 4, full-time selected')

await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForSelector('text=Where do we send your matches?')
await shoot('09-details-empty', 'step 5, empty')

// Submit with nothing filled in, to photograph what the visitor is told.
await page.getByRole('button', { name: 'Book a call' }).click()
await page.waitForTimeout(200)
await shoot('10-details-errors', 'validation: name, email and consent')

await page.getByLabel('First name').fill('Jake')
await page.getByLabel('Last name').fill('Hall')
await page.getByLabel('Work email').fill('jake@cloudemployee.io')
await page.getByLabel('Phone number (optional)').fill('+44 7700 900000')
await page.getByLabel('Company').fill('Cloud Employee')
// Radix renders a button[role=checkbox], not a native input.
await page.getByRole('checkbox').click()
await shoot('11-details-filled', 'filled, consent ticked, submit now active')

await browser.close()
console.log(`\n${shots.length} states written to ${OUT}`)
for (const s of shots) console.log(`  ${s}`)
