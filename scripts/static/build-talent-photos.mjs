// Build the shared talent-profile photo set.
//
// Source photos live outside the repo (Jake's "Website images/Talent profiles"
// folder, one sub-folder per region). They arrive at mixed sizes and aspect
// ratios - portrait phone shots, 16:9 landscape stills, near-square crops - and
// every surface that renders them (home marquee card 340x420, location hero
// card 300x380) wants the same 4:5 portrait. So every photo is cropped to 4:5
// ONCE here and written to site/public/design/talent/.
//
// focusX / focusY are the subject's face position in the SOURCE frame (0-1).
// The crop window is centred on that point and clamped inside the frame, which
// is what stops a 16:9 source from cropping to an ear. They were set by eye per
// photo; re-check the output if a source file is ever replaced.
//
// zoom tightens the crop around that focus point (2 = half-size window, so the
// subject fills twice as much of the card). The source set mixes tight
// headshots with three-quarter body shots, and without this the body shots
// render as a distant figure next to a face.
//
// Run: node scripts/static/build-talent-photos.mjs

import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'

import sharp from '../../site/node_modules/sharp/lib/index.js'

const SRC_ROOT = '/Users/jakehall/Desktop/Website images/Talent profiles'
const OUT_DIR = path.resolve(
  process.cwd(),
  'site/public/design/talent',
)

// Three crops per person, because the surfaces are shaped differently and a
// single master gets over-zoomed / face-truncated on the wrong shape:
//   portrait 4:5     -> home marquee card (340x420) + location stack card
//   wide     ~11:10  -> "Engineers we've placed from ..." card (~368x330)
//   slide    ~1.74:1 -> home ProfileCard photo area (488x280) — used on the
//                       Eastern Europe hero slideshow. Portrait masters forced
//                       into this frame with object-cover cut heads in half.
const VARIANTS = [
  { suffix: '', aspect: 4 / 5, width: 680, height: 850 },
  { suffix: '-wide', aspect: 368 / 330, width: 760, height: 682 },
  // Slide is built separately — a straight 1.74:1 cover crop clips the crown
  // of every headshot, so buildSlide() pads headroom onto the canvas.
]

/** slug -> source file + face focus point. Slug matches the roster in
 *  site/src/lib/talent/roster.ts. */
// NOT in this list, deliberately:
//   europe/EU.jpg    - the same woman as "EU 1.jpg" (same nose stud, same
//                      blazer, same shoot), so she is one person, not two.
//   europe/Heather.png - profile removed on Jake's instruction (3 Aug).
//
// Four of these people are also the home HERO cards, and the hero named them
// first, so the roster follows the hero: EU 2 = Petra K., EU 3 = Marcelo P.,
// LATAM 3 = Rafael S. (replaces Gabriel on the home hero), Kyla = Kyla T.
const PHOTOS = [
  // Eastern Europe
  // Ivana stands right-of-centre in the source; the landscape slide uses the
  // full width at zoom 1 so she stays parked on the right. slideZoom + slideFocusX
  // tighten and pan so her face sits in the middle of the EE ProfileCard.
  {
    slug: 'ivana-m',
    src: 'europe/EU 1.jpg',
    focusY: 0.3,
    // Face sits slightly right of centre in the source; mild zoom so the pan
    // can move. 0.515 recentres her (0.50 left her right; 0.535 overshot left).
    slideFocusX: 0.515,
    slideFocusY: 0.3,
    slideZoom: 1.2,
  },
  { slug: 'petra-k', src: 'europe/EU 2.jpg', focusY: 0.3 },
  { slug: 'marcelo-p', src: 'europe/EU 3.png', focusX: 0.53, focusY: 0.36 },
  // Anto: 5625x4500 studio headshot. Crown is already near the source top, so
  // buildSlide() extends matching studio grey above the frame, then full-bleed
  // crops (no letterbox bars — those read as "blocked").
  {
    slug: 'anto-s',
    src: 'europe/Anto.jpg',
    focusX: 0.5,
    focusY: 0.42,
    slideFocusX: 0.5,
    // Authored against the ORIGINAL frame (remap happens after pad).
    slideFocusY: 0.32,
    slideZoom: 1.0,
    slidePadTopRatio: 0.2,
  },
  // LATAM
  // Mateo: face was high in the 4:5 marquee crop — lower focusY + ease zoom.
  { slug: 'mateo-r', src: 'latam/LATAM.png', focusX: 0.5, focusY: 0.34, zoom: 1.1 },
  { slug: 'gabriel-k', src: 'latam/LATAM 2.png', focusY: 0.4 },
  { slug: 'rafael-s', src: 'latam/LATAM 3.png', focusY: 0.4, zoom: 1.3 },
  // Philippines
  { slug: 'kyla-t', src: 'philippines/Kyla.png', focusX: 0.46, focusY: 0.3, zoom: 1.75 },
  // Ericka: face sits slightly right of centre in the source.
  { slug: 'ericka-n', src: 'philippines/Ericka.png', focusX: 0.52, focusY: 0.3, zoom: 1.45 },
  { slug: 'ros-v', src: 'philippines/Ros.png', focusY: 0.3, zoom: 1.5 },
  { slug: 'russel-d', src: 'philippines/Russel.png', focusY: 0.3, zoom: 1.45 },
  { slug: 'stephen-l', src: 'philippines/Stephen.png', focusY: 0.32, zoom: 1.4 },
  // Africa
  // Grace: face sits slightly right of centre — mild pan.
  { slug: 'grace-o', src: 'Africa/Grace.png', focusX: 0.55, focusY: 0.34, zoom: 1.3 },
]

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

/** Largest window of `aspect` that fits the source, centred on the face,
 *  then tightened by `zoom` around that same point. */
function cropRect(width, height, aspect, focusX = 0.5, focusY = 0.5, zoom = 1) {
  let w, h
  if (width / height > aspect) {
    h = height
    w = Math.round(height * aspect)
  } else {
    w = width
    h = Math.round(width / aspect)
  }
  w = Math.round(w / zoom)
  h = Math.round(h / zoom)
  // zoom < 1 zooms out (bigger window). Never let it exceed the source.
  if (w > width) {
    w = width
    h = Math.round(width / aspect)
  }
  if (h > height) {
    h = height
    w = Math.round(height * aspect)
  }
  return {
    left: clamp(Math.round(focusX * width - w / 2), 0, width - w),
    top: clamp(Math.round(focusY * height - h / 2), 0, height - h),
    width: w,
    height: h,
  }
}

const SLIDE_W = 976
const SLIDE_H = 560

/**
 * Full-bleed landscape crop matching the home ProfileCard photo area
 * (488x280). Per-photo `slideFocusX` / `slideFocusY` / `slideZoom` override the
 * portrait focus when the landscape frame needs a different pan (Ivana) or a
 * tighter centred face (Anto).
 */
async function buildSlide(src, photo, outPath) {
  let input = src
  let { width, height } = await sharp(src).metadata()
  const focusX = photo.slideFocusX ?? photo.focusX ?? 0.5
  let focusY = photo.slideFocusY ?? photo.focusY ?? 0.32
  const zoom = photo.slideZoom ?? 1
  const aspect = SLIDE_W / SLIDE_H

  // Studio pad above crown-tight sources (Anto). Extends the canvas with the
  // sampled background colour so the landscape card can show real headroom
  // without shrinking the face into letterbox bars.
  if (photo.slidePadTopRatio > 0) {
    const padTop = Math.round(height * photo.slidePadTopRatio)
    const sample = await sharp(src)
      .extract({ left: 0, top: 0, width: 60, height: 60 })
      .raw()
      .toBuffer({ resolveWithObject: true })
    let r = 0
    let g = 0
    let b = 0
    const n = sample.info.width * sample.info.height
    for (let i = 0; i < sample.data.length; i += sample.info.channels) {
      r += sample.data[i]
      g += sample.data[i + 1]
      b += sample.data[i + 2]
    }
    const background = {
      r: Math.round(r / n),
      g: Math.round(g / n),
      b: Math.round(b / n),
    }
    const origH = height
    input = await sharp(src)
      .extend({ top: padTop, bottom: 0, left: 0, right: 0, background })
      .toBuffer()
    ;({ width, height } = await sharp(input).metadata())
    // slideFocusY is authored against the ORIGINAL frame; remap into padded.
    focusY = (focusY * origH + padTop) / height
  }

  // Same window maths as cropRect, but for the slide aspect.
  let w
  let h
  if (width / height > aspect) {
    h = height
    w = Math.round(height * aspect)
  } else {
    w = width
    h = Math.round(width / aspect)
  }
  w = Math.round(w / zoom)
  h = Math.round(h / zoom)
  if (w > width) {
    w = width
    h = Math.round(width / aspect)
  }
  if (h > height) {
    h = height
    w = Math.round(height * aspect)
  }
  const left = clamp(Math.round(focusX * width - w / 2), 0, width - w)
  const top = clamp(Math.round(focusY * height - h / 2), 0, height - h)

  await sharp(input)
    .extract({ left, top, width: w, height: h })
    .resize(SLIDE_W, SLIDE_H)
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outPath)
}

async function main() {
  // Anto only exists inside the Google Drive zip, so it is unpacked to /tmp
  // before this runs (see the shell step in the build notes).
  const antoTmp = '/tmp/tp-src/Anto.jpg'
  await mkdir(OUT_DIR, { recursive: true })

  for (const photo of PHOTOS) {
    const src =
      photo.slug === 'anto-s' ? antoTmp : path.join(SRC_ROOT, photo.src)
    const { width, height } = await sharp(src).metadata()

    for (const v of VARIANTS) {
      const rect = cropRect(
        width,
        height,
        v.aspect,
        photo.focusX,
        photo.focusY,
        photo.zoom,
      )
      await sharp(src)
        .extract(rect)
        .resize(v.width, v.height, { fit: 'cover' })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(OUT_DIR, `${photo.slug}${v.suffix}.jpg`))
      console.log(
        `${photo.slug}${v.suffix}: ${width}x${height} -> crop ${rect.width}x${rect.height} @${rect.left},${rect.top} -> ${v.width}x${v.height}`,
      )
    }

    const slidePath = path.join(OUT_DIR, `${photo.slug}-slide.jpg`)
    // Petra's home hero crop is the locked reference for this face — reuse it
    // so the EE slideshow and the home hero can never drift apart.
    if (photo.slug === 'petra-k') {
      const homePetra = path.resolve(
        process.cwd(),
        'site/public/design/home/engineers/hero-card/petra.jpg',
      )
      await sharp(homePetra)
        .resize(SLIDE_W, SLIDE_H, { fit: 'cover' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(slidePath)
      console.log(`${photo.slug}-slide: reused home hero-card/petra.jpg -> ${SLIDE_W}x${SLIDE_H}`)
    } else {
      await buildSlide(src, photo, slidePath)
      console.log(`${photo.slug}-slide: ${width}x${height} -> ${SLIDE_W}x${SLIDE_H} (full-bleed)`)
    }
  }

  // Home hero ProfileCard is 488x280 — a landscape frame, so the source photo
  // has to carry real space above the crown or the card clips the head.
  //
  // Kyla, Marcelo and Petra ship as pre-made hero assets and are left alone.
  // These three are cropped here from the same sources the roster uses, at the
  // full source width so there is no pillarbox and nothing composited.
  //
  // Rafael (LATAM 3) is deliberately NOT here: his source is framed with the
  // crown flush against the top edge, so no crop of it shows his full head. He
  // keeps his LATAM page cards, which use the taller 4:5 crop. Gabriel IS here
  // — the blurred side strips were baked into the old hand-made gabriel.jpg,
  // not present in his photo, so a straight crop fixes him.
  const HERO_CARDS = [
    { file: 'grace.jpg', src: 'Africa/Grace.png', focusY: 0.42 },
    // 0.37 seats his face above the card's name scrim without clipping his
    // hair; 0.42 starts cutting the crown.
    { file: 'gabriel.jpg', src: 'latam/LATAM 2.png', focusY: 0.37 },
    { file: 'russel.jpg', src: 'philippines/Russel.png', focusY: 0.3 },
  ]
  const heroCardDir = path.resolve(
    process.cwd(),
    'site/public/design/home/engineers/hero-card',
  )
  await mkdir(heroCardDir, { recursive: true })
  for (const card of HERO_CARDS) {
    const cardSrc = path.join(SRC_ROOT, card.src)
    const { width: cw, height: ch } = await sharp(cardSrc).metadata()
    const rect = cropRect(cw, ch, 488 / 280, 0.5, card.focusY, 1.0)
    await sharp(cardSrc)
      .extract(rect)
      .resize(488, 280, { fit: 'cover' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(path.join(heroCardDir, card.file))
    console.log(
      `hero-card/${card.file}: ${cw}x${ch} -> crop ${rect.width}x${rect.height} @${rect.left},${rect.top} -> 488x280`,
    )
  }

  const written = await readdir(OUT_DIR)
  console.log(`\n${written.length} photos in ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
