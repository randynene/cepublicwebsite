// Rebuild the Travelex wordmark as a vector, then rasterise it sharp.
//
// THE PROBLEM. The only Travelex source we hold is travelex.png, a 260x75
// scraped screenshot of a two-tone card. The white "Travelex" type inside it
// occupies roughly 110x27 pixels and that is the entire resolution available;
// travelex-wordmark.png was a 103x22 lift of exactly that, so at displayH 28 on
// a 2x screen the browser was scaling ~21px of type up to 56px. Seb had already
// asked for it bigger (CE-31), which pushed it past what the pixels could hold,
// and it read as blurry next to six marks that are natively 260px wide.
//
// WHY TRACING FIXES IT even though it adds no information. Upscaling a raster
// interpolates: every edge becomes a gradient, which is what the eye reads as
// blur. potrace instead fits curves to the threshold boundary, so the edges
// come out hard at any size. The letterforms are very slightly heavier and
// tighter than the original because the trace follows the outside of the
// antialiasing, but at 28px that is invisible, and the mark stops being soft.
//
// The upscale before tracing is deliberate. potrace follows a bitmap contour,
// so feeding it a lanczos-smoothed 16x version gives it a cleaner curve to
// follow than the raw 27px-tall pixels would.
//
// OUTPUTS, both committed:
//   travelex-wordmark.svg   the vector, so this never has to be re-derived
//   travelex-wordmark.png   rasterised at 4x display height for next/image,
//                           which does not render SVG (same reason vector.svg
//                           sits beside a PNG for the Todd mark)
//
// This does NOT replace a real brand asset. If Seb supplies Travelex's own SVG,
// drop it in as travelex-wordmark.svg, re-run this to regenerate the PNG, and
// delete the trace step. The ceiling on displayH goes away at that point.
//
// Run: node scripts/static/build-travelex-wordmark.mjs
// Needs: potrace on PATH (brew install potrace)

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import sharp from '../../site/node_modules/sharp/lib/index.js'

const SRC = 'site/public/design/home/logos/travelex.png'
const OUT_DIR = 'site/public/design/home/logos'

// The white type inside the dark panel, measured off a brightness map of the
// source rather than guessed. Everything right of x=184 is the grey
// "worldwide money" panel and is deliberately excluded.
const BOX = { left: 74, top: 39, width: 110, height: 27 }

const TRACE_SCALE = 16
const DISPLAY_H = 28 // must match displayH in client-logo-strip.tsx
const RASTER_MULTIPLE = 4 // 4x covers 2x screens with headroom to grow

const tmp = mkdtempSync(join(tmpdir(), 'travelex-'))

try {
  // 1. crop the type, upscale, flatten to two tones, invert for potrace
  //    (potrace treats DARK as the shape; our type is white)
  const { data, info } = await sharp(SRC)
    .extract(BOX)
    .resize({
      width: BOX.width * TRACE_SCALE,
      height: BOX.height * TRACE_SCALE,
      kernel: 'lanczos3',
    })
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pgm = join(tmp, 'trace.pgm')
  const header = Buffer.from(`P5\n${info.width} ${info.height}\n255\n`, 'ascii')
  const inverted = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += 1) inverted[i] = 255 - data[i]
  writeFileSync(pgm, Buffer.concat([header, inverted]))

  // 2. trace. turdsize drops specks left by the source's JPEG noise; alphamax
  //    and opttolerance are tuned to keep the corners on T, l and x crisp
  //    rather than rounding them off.
  const svgPath = join(tmp, 'traced.svg')
  execFileSync('potrace', [
    '--svg',
    '--turdsize', '8',
    '--alphamax', '1.0',
    '--opttolerance', '0.35',
    '-o', svgPath,
    pgm,
  ])

  const svg = readFileSync(svgPath, 'utf8').replace(/fill="[^"]*"/g, 'fill="#ffffff"')
  writeFileSync(join(OUT_DIR, 'travelex-wordmark.svg'), svg)

  // 3. rasterise for next/image
  const png = await sharp(Buffer.from(svg))
    .resize({ height: DISPLAY_H * RASTER_MULTIPLE })
    .png({ compressionLevel: 9 })
    .toBuffer()
  writeFileSync(join(OUT_DIR, 'travelex-wordmark.png'), png)

  const meta = await sharp(png).metadata()
  console.log(`travelex-wordmark.svg  vector`)
  console.log(`travelex-wordmark.png  ${meta.width}x${meta.height}`)
  console.log(`\nSet width/height in client-logo-strip.tsx to ${meta.width}/${meta.height}.`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
