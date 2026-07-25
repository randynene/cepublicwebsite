// MYGRATR-STATIC-1 Step 1 follow-up — source + upload CE's site-wide
// og:image from the live Webflow site, then patch
// siteSettings.defaultOgImage with the asset reference.
//
// Source: <meta property="og:image"> from https://www.cloudemployee.io/
// (canonical site-wide image, file name `usthumb.png` = "US thumbnail").
// Audit confirms: PNG, 1470x796, ~656KB.
//
// Reuse, not synthesis. If the source 404s or the format is wrong, this
// script halts. Do not invent a substitute.
//
// Run once. Idempotent (asset upload is content-hashed by Sanity; a
// second run uploads a new asset and updates the reference).

import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const SOURCE_URL =
  'https://cdn.prod.website-files.com/673326831abed6267051fa11/6840ce62d88af1753f71051b_7b93393439ec160cc7efb030c8c23e72_usthumb.png'

// Pre-staged at /tmp/mygratr-static-1/usthumb.png by the parent step.
// If absent, the script re-downloads it.
const STAGED_PATH = '/tmp/mygratr-static-1/usthumb.png'

// Author-voice rule: no em or en dashes. Comma form.
const DEFAULT_ALT = 'Cloud Employee, embedded nearshore developer teams'

async function ensureStaged(): Promise<Buffer> {
  if (fs.existsSync(STAGED_PATH)) {
    return fs.readFileSync(STAGED_PATH)
  }
  console.log(`Staged file missing, fetching ${SOURCE_URL} ...`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) {
    throw new Error(`Source fetch failed: HTTP ${res.status} ${res.statusText}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(path.dirname(STAGED_PATH), { recursive: true })
  fs.writeFileSync(STAGED_PATH, buf)
  return buf
}

function assertPng(buf: Buffer): void {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < sig.length; i++) {
    if (buf[i] !== sig[i]) {
      throw new Error(`Source is not a valid PNG (byte ${i} = ${buf[i]?.toString(16)}, expected ${sig[i].toString(16)})`)
    }
  }
}

async function main() {
  const buf = await ensureStaged()
  assertPng(buf)
  console.log(`og:image: ${buf.length} bytes, valid PNG signature`)

  console.log('Uploading to Sanity as asset ...')
  const asset = await sanityWriteClient.assets.upload('image', buf, {
    filename: 'cloud-employee-default-og-image.png',
    contentType: 'image/png',
  })
  console.log(`Asset uploaded: ${asset._id}`)

  console.log('Patching siteSettings.defaultOgImage ...')
  await sanityWriteClient
    .patch('siteSettings')
    .set({
      defaultOgImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt: DEFAULT_ALT,
      },
    })
    .commit()

  console.log('siteSettings.defaultOgImage set to asset reference', asset._id)
}

main().catch((err) => {
  console.error('seed-default-og-image: FAILED', err)
  process.exit(1)
})
