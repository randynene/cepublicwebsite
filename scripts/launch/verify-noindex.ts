// Is anything inviting Google to index a site that is not the real one?
//
// The single most expensive mistake available in a migration is letting a second,
// complete copy of the site into Google's index. Google then has to pick which
// copy is canonical, and it does not always pick yours. Undoing it is slow and
// uncertain, and it happens in the weeks when you can least afford it.
//
// This nearly happened. robots.ts gated indexing on `VERCEL_ENV === 'production'`,
// and staging.jakevibes.dev IS the Vercel production deployment of this project —
// so it was serving `Allow: /` and a sitemap. It got away with it only because the
// deployment was a stale two-page scaffold. Deploying the finished 678-page site
// there would have offered Google the lot.
//
// So we check, rather than trust. Every host that is not the canonical one must
// serve `Disallow: /`.
//
//   npm run launch:verify-noindex
//   npm run launch:verify-noindex -- --target https://staging.jakevibes.dev
const CANONICAL_HOST = 'www.cloudemployee.io'

// Hosts that must NEVER be indexable. Add any new preview or staging domain here.
// Every domain assigned to the Vercel project's PRODUCTION environment. All of
// them are publicly reachable and all of them were serving `Allow: /`, because the
// old rule trusted Vercel's "production" label. A project can have several
// production domains and it is easy to remember one and forget another.
const MUST_NOT_INDEX = [
  'https://staging.jakevibes.dev',
  'https://mygratr.vercel.app',
  'https://mygratr-c3utcgloa-cloud-employee.vercel.app',
]

function targetsFromArgv(): string[] {
  const i = process.argv.indexOf('--target')
  const value = i !== -1 ? process.argv[i + 1] : undefined
  return value ? [value.replace(/\/$/, '')] : MUST_NOT_INDEX
}

type Verdict = {
  origin: string
  reachable: boolean
  indexable: boolean
  robots: string
}

async function check(origin: string): Promise<Verdict> {
  try {
    const res = await fetch(`${origin}/robots.txt`)
    if (!res.ok) {
      return { origin, reachable: false, indexable: false, robots: `HTTP ${res.status}` }
    }
    const robots = (await res.text()).trim()

    // "Indexable" means the file does NOT disallow everything. A robots.txt that
    // allows anything at all on a non-canonical host is a problem, and an
    // `Allow: /` with a sitemap is an active invitation.
    const blocksEverything = /^\s*Disallow:\s*\/\s*$/im.test(robots) && !/^\s*Allow:/im.test(robots)

    return { origin, reachable: true, indexable: !blocksEverything, robots }
  } catch (err) {
    return {
      origin,
      reachable: false,
      indexable: false,
      robots: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main(): Promise<void> {
  const targets = targetsFromArgv()
  console.log(`Canonical host: ${CANONICAL_HOST}`)
  console.log(`Checking ${targets.length} host(s) that must NOT be indexable.\n`)

  let failed = 0

  for (const origin of targets) {
    const v = await check(origin)

    if (!v.reachable) {
      console.log(`  --    ${origin}`)
      console.log(`        not reachable (${v.robots}) — nothing to index, fine.`)
      continue
    }

    if (v.indexable) {
      failed++
      console.error(`  OPEN  ${origin}`)
      console.error(`        Google is allowed to crawl this. It is a duplicate of the real site.`)
      console.error(v.robots.split('\n').map((l) => `          ${l}`).join('\n'))
      console.error(`        Fix: set NEXT_PUBLIC_CANONICAL_HOST only on the deployment serving`)
      console.error(`        ${CANONICAL_HOST}. Every other deployment must leave it unset.`)
    } else {
      console.log(`  BLOCKED  ${origin}`)
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} host(s) invite indexing. A second indexed copy of the site is`)
    console.error(`the most expensive mistake in a migration and the hardest to undo.`)
    process.exit(1)
  }

  console.log(`\nNo non-canonical host is indexable.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
