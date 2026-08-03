// Is the form identical on two pages? Diff the computed styles rather than the
// screenshots.
//
// It exists because "make it look the same" is not eyeballable at this scale. The
// Fractional CTO page rendered the form's question at 46px/700 instead of 26px/600
// because `.fcto .matchform h2` is (0,2,1) and beat the exemption's (0,2,0)
// wildcard. Two screenshots side by side would have shown "a bit bigger"; this
// showed the exact four properties and their values, which is what made the fix a
// one-line specificity change rather than a guess.
//
// The one difference it still reports is a fontFamily FALLBACK-LIST string
// ("Inter, Inter Fallback" vs the same plus system-ui, sans-serif). Both resolve to
// Inter, so there is no rendered difference. Left visible rather than filtered out,
// because a check that hides its own known noise teaches you to trust it blindly.
//
// Run: node scripts/preview/diff-lead-form.mjs

import { chromium } from 'playwright'
const BASE = 'https://mygratr-git-cursor-hubspot-gateway-lock-c05e-cloud-employee.vercel.app'
const PROPS = ['fontSize','fontWeight','lineHeight','letterSpacing','color','paddingTop','paddingLeft','borderRadius','borderTopWidth','borderTopColor','height','textTransform','fontFamily','backgroundColor']
const b = await chromium.launch()
const out = {}
for (const [name, path] of [['home','/'],['fcto','/services/fractional-ctos']]) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } })
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1500)
  out[name] = await p.evaluate((PROPS) => {
    const root = document.querySelector('.qh-form')
    const pick = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      for (const k of PROPS) o[k] = cs[k]
      o._h = Math.round(el.getBoundingClientRect().height)
      o._w = Math.round(el.getBoundingClientRect().width)
      return o
    }
    return {
      wrapper: pick(root),
      box: pick(root?.firstElementChild),
      heading: pick(root?.querySelector('h2')),
      sub: pick(root?.querySelector('h2')?.nextElementSibling),
      railLabel: pick(root?.querySelector('ol li span:nth-child(2)')),
      tile: pick(root?.querySelector('button[aria-pressed]')),
      tileLabel: pick(root?.querySelector('button[aria-pressed] span:last-child')),
      trust: pick(root?.querySelector('ul li')),
      next: pick(root?.querySelector('button.cta-sweep')),
    }
  }, PROPS)
  await p.close()
}
await b.close()

for (const key of Object.keys(out.home)) {
  const a = out.home[key], c = out.fcto[key]
  if (!a || !c) { console.log(`${key}: home=${!!a} fcto=${!!c}`); continue }
  const diffs = Object.keys(a).filter((k) => String(a[k]) !== String(c[k]))
  if (diffs.length) {
    console.log(`\n${key}:`)
    for (const d of diffs) console.log(`  ${d.padEnd(18)} home=${a[d]}   fcto=${c[d]}`)
  }
}
console.log('\n(no output for an element means it is identical)')
