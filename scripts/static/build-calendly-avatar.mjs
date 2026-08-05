// Build the light-background Calendly event avatar.
//
// The uploaded Calendly avatar (calendly-avatar-dark.png, 440x188) is the four
// team headshots plus the CloudEmployee lockup knocked out in white on the
// canonical dark ground #070D18. Calendly's booking card is white, so that
// navy block reads as a foreign rectangle pasted into the page.
//
// This rebuilds the same lockup for a light surface:
//   - the navy field is dropped to transparency
//   - the four headshot discs are carried over UNTOUCHED, masked by the union of
//     the four circles so the source's own overlap z-order survives (extracting
//     each disc separately would duplicate the overlapped crescents)
//   - the wordmark is re-rendered from the vector source in brand navy, so it
//     stays crisp at any size instead of being recoloured pixel-by-pixel
//
// Geometry was measured off the source, not guessed: circle band y 2..104,
// x 41..398, so d = 103 and the four centres sit 85px apart; the logo occupies
// the full 440 width at y 125..187 (aspect 6.98 against the SVG's 7.02).
// Output is 2x so the vector wordmark is retina-crisp at Calendly's ~150px.
//
// Run: node scripts/static/build-calendly-avatar.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from '../../site/node_modules/sharp/lib/index.js'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'site/public/design/brand/calendly-avatar-dark.png')
const LOGO_SVG = path.join(ROOT, 'site/public/ce-logo.svg')
const OUT_DIR = path.join(ROOT, 'site/public/design/brand')

// --color-section-bg-card. Reads as dark blue on white rather than the flat
// near-black of --color-bg-primary (#070D18).
const NAVY = '#101B30'

// The source discs were anti-aliased against navy, so their outermost ~2px are
// a dark remnant that reads as a scrappy outline once the navy field is gone.
// TRIM cuts it off; RING then re-draws a deliberate hairline in its place. The
// ring is not decoration: the headshot backgrounds are near-white studio grey,
// so without it the faces float on Calendly's white card with no boundary.
const TRIM = 4
const RING = 3
const RING_COLOUR = '#D3D8E2'

const SCALE = 2

// Measured off calendly-avatar-dark.png.
const SRC_W = 440
const SRC_H = 188
const CIRCLE_D = 103
const CIRCLE_TOP = 2
const CIRCLE_FIRST_LEFT = 41
const CIRCLE_PITCH = 85
const CIRCLE_COUNT = 4
const LOGO_TOP = 125
const LOGO_BAND_H = SRC_H - LOGO_TOP

async function main() {
  const W = SRC_W * SCALE
  const H = SRC_H * SCALE
  const r = (CIRCLE_D / 2) * SCALE
  const cy = (CIRCLE_TOP + CIRCLE_D / 2) * SCALE
  const centres = Array.from(
    { length: CIRCLE_COUNT },
    (_, i) => (CIRCLE_FIRST_LEFT + CIRCLE_D / 2 + i * CIRCLE_PITCH) * SCALE,
  )

  const bandH = LOGO_TOP * SCALE

  /** Union of the four circles at `radius`, filled flat. */
  const union = (radius, fill) =>
    Buffer.from(
      `<svg width="${W}" height="${bandH}" xmlns="http://www.w3.org/2000/svg">` +
        centres
          .map(
            (cx) => `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}"/>`,
          )
          .join('') +
        `</svg>`,
    )

  // Masked with dest-in so the source keeps its pixels only under the discs.
  // Masking the whole band as one union (rather than extracting each disc)
  // preserves the source's own overlap z-order; per-disc extraction would
  // duplicate the crescents where neighbours overlap.
  const discs = await sharp(SRC)
    .extract({ left: 0, top: 0, width: SRC_W, height: LOGO_TOP })
    .resize(W, bandH, { kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: union(r - TRIM, '#fff'), blend: 'dest-in' }])
    .png()
    .toBuffer()

  // Sits UNDER the discs, wider by TRIM + RING, so the only part that shows is
  // a uniform hairline around the union's outer boundary. Drawing it as a
  // stroke per circle instead would cut visible arcs across the seams.
  const ring = union(r - TRIM + RING, RING_COLOUR)

  // Vector wordmark recoloured at source, then rasterised at output width so it
  // is resolution-independent rather than an upscaled bitmap.
  const svg = await readFile(LOGO_SVG, 'utf8')
  const navySvg = svg.replaceAll('fill="white"', `fill="${NAVY}"`)
  const logo = await sharp(Buffer.from(navySvg), { density: 600 })
    .resize({ width: W })
    .png()
    .toBuffer()
  const logoMeta = await sharp(logo).metadata()

  // Centre the rasterised logo in the band the source used, so the gap under
  // the headshots matches the original lockup.
  const logoTop = Math.round(
    LOGO_TOP * SCALE + (LOGO_BAND_H * SCALE - logoMeta.height) / 2,
  )

  const layers = [
    { input: ring, left: 0, top: 0 },
    { input: discs, left: 0, top: 0 },
    { input: logo, left: 0, top: logoTop },
  ]

  const transparent = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer()

  const white = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer()

  await writeFile(path.join(OUT_DIR, 'calendly-avatar-light.png'), transparent)
  await writeFile(
    path.join(OUT_DIR, 'calendly-avatar-light-white.png'),
    white,
  )

  console.log(`canvas ${W}x${H}`)
  console.log(`discs  r=${r} cy=${cy} cx=[${centres.join(', ')}]`)
  console.log(`logo   ${logoMeta.width}x${logoMeta.height} @ y=${logoTop} fill=${NAVY}`)
  console.log('wrote calendly-avatar-light.png (transparent)')
  console.log('wrote calendly-avatar-light-white.png (white matte)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
