// Extract all bundled image assets from a Claude/Figma "Bundled Page" export.
// The export stores assets in a <script type="__bundler/manifest"> block as a
// JSON map: { "<uuid>": { mime, compressed, data(base64[, gzip]) } }.
// Usage: node scripts/template-home/extract-assets.mjs <path-to-home.html> <out-dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { join } from 'node:path'

const [, , htmlPath, outDir] = process.argv
if (!htmlPath || !outDir) {
  console.error('usage: node extract-assets.mjs <home.html> <out-dir>')
  process.exit(1)
}

const html = readFileSync(htmlPath, 'utf8')

const START = '<script type="__bundler/manifest">'
const startIdx = html.indexOf(START)
if (startIdx === -1) throw new Error('manifest script not found')
const afterStart = startIdx + START.length
const endIdx = html.indexOf('</script>', afterStart)
const manifestJson = html.slice(afterStart, endIdx).trim()

const manifest = JSON.parse(manifestJson)
mkdirSync(outDir, { recursive: true })

const extForMime = (mime) => {
  const m = {
    'image/svg+xml': 'svg',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  }
  return m[mime] || 'bin'
}

const index = []
for (const [uuid, entry] of Object.entries(manifest)) {
  const { mime, compressed, data } = entry
  let buf = Buffer.from(data, 'base64')
  if (compressed) {
    try {
      buf = gunzipSync(buf)
    } catch (e) {
      console.warn(`! gunzip failed for ${uuid}: ${e.message}`)
    }
  }
  const ext = extForMime(mime)
  const filename = `${uuid}.${ext}`
  writeFileSync(join(outDir, filename), buf)
  index.push({ uuid, mime, ext, bytes: buf.length, filename })
}

index.sort((a, b) => b.bytes - a.bytes)
writeFileSync(join(outDir, '_index.json'), JSON.stringify(index, null, 2))

const byMime = {}
for (const e of index) byMime[e.mime] = (byMime[e.mime] || 0) + 1
console.log(`extracted ${index.length} assets to ${outDir}`)
console.log('by mime:', byMime)
console.log('largest 15 (likely photos):')
for (const e of index.slice(0, 15)) {
  console.log(`  ${(e.bytes / 1024).toFixed(0).padStart(6)} KB  ${e.mime.padEnd(14)} ${e.filename}`)
}
