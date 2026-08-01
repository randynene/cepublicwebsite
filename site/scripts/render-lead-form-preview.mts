// Renders the REAL quick hiring form to a static HTML file so it can be looked at
// without running the site.
//
// Why this exists: running the app needs .env.local, which holds live credentials,
// and creating that file is a hard no-touch rule. That should not mean nobody can
// see the form before it deploys. This imports the actual component, renders it
// with react-dom/server, and compiles the real Tailwind output against the real
// tokens, so what you look at is the component and not a mock-up of it.
//
// WHAT IT CANNOT SHOW. Effects do not run in a static render, so this is the FIRST
// step only, in its initial state. Step transitions, the skill search, validation
// and the Calendly embed all need a browser. The Vercel preview is still the real
// visual check; this is the fast one.
//
// Run: npx tsx scripts/render-lead-form-preview.mts && npx @tailwindcss/cli \
//        -i src/app/globals.css -o /tmp/preview.css --content /tmp/lead-form.html

import { writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Dynamic import, because a static one of a .tsx module from an .mts entry does
// not resolve under tsx's ESM mode. Not a hint that anything is wrong with the
// component; it imports cleanly everywhere Next actually loads it.
const { QuickHiringForm } = await import('../src/components/lead-form/quick-hiring-form')

const OUT = '/tmp/lead-form.html'

const body = renderToStaticMarkup(
  createElement(
    'div',
    { className: 'mx-auto max-w-[1280px] px-[22px] sm:px-[32px] lg:px-[64px] py-16' },
    createElement(QuickHiringForm, { sourcePage: '/technology/react-developers' }),
  ),
)

const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Quick hiring form preview</title>
    <link rel="stylesheet" href="/tmp/preview.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <style>
      body { background: #070D18; font-family: Inter, system-ui, sans-serif; }
    </style>
  </head>
  <body>${body}</body>
</html>
`

writeFileSync(OUT, html)
console.log(`wrote ${OUT}`)
