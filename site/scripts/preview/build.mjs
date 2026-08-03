// Builds the standalone preview bundle.
//
// Run: node scripts/preview/build.mjs
// Then: npx @tailwindcss/cli -i src/app/globals.css -o /tmp/preview/preview.css \
//         --content './src/**/*.tsx'

import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as esbuild from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const siteRoot = resolve(here, '../..')
const outDir = '/tmp/preview'

mkdirSync(outDir, { recursive: true })

await esbuild.build({
  entryPoints: [resolve(here, 'entry.tsx')],
  bundle: true,
  outfile: `${outDir}/bundle.js`,
  format: 'iife',
  jsx: 'automatic',
  target: 'es2022',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: {
    // Same alias Next resolves, so imports inside the component are untouched.
    '@': resolve(siteRoot, 'src'),
    'next/link': resolve(here, 'next-link-shim.tsx'),
  },
  logLevel: 'info',
})

console.log(`bundled to ${outDir}/bundle.js`)
