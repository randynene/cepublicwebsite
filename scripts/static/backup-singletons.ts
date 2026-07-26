import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Snapshot / restore Sanity singleton documents.
//
// WHY THIS EXISTS. Every scripts/static/seed-*.ts ends in createOrReplace on a
// hardcoded _id. That is a clean overwrite: anything Seb edited in Studio for
// that document is gone, with no warning and no undo. Sanity's own document
// history covers it, but only inside the retention window and only one field
// diff at a time through the UI, which is not a recovery path anyone wants to
// be discovering during a launch. So: take a snapshot first.
//
// Restore is in the same file on purpose. A backup nobody has ever restored is
// not a backup, it is a folder of JSON.
//
//   npm run static:backup-singletons                       # every known singleton
//   npm run static:backup-singletons -- howItWorksPage     # named docs only
//   npm run static:backup-singletons -- --list             # what is in the dataset
//   npm run static:backup-singletons -- --restore <dir>            # dry run
//   npm run static:backup-singletons -- --restore <dir> --apply    # write
//
// Token: SANITY_MIGRATION_WRITE_TOKEN

const BACKUP_ROOT = path.resolve(process.cwd(), 'audit-output', 'sanity-backups')

// Singletons are identified by _id, not by a marker field, so the set has to be
// derived. Anything whose _id equals its _type is a singleton by this codebase's
// convention (homePage, contactPage, siteSettings, navigation, footer...).
const SINGLETON_QUERY = `*[_id == _type && !(_id in path("drafts.**"))]._id`

interface SanityDoc {
  _id: string
  _type: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  [key: string]: unknown
}

function stamp(): string {
  // 2026-07-26T04-31-07Z, filesystem-safe and sorts chronologically.
  return new Date().toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, 'Z')
}

async function listSingletonIds(): Promise<string[]> {
  const ids = await sanityWriteClient.fetch<string[]>(SINGLETON_QUERY)
  return [...ids].sort()
}

async function backup(ids: string[]): Promise<void> {
  const targets = ids.length > 0 ? ids : await listSingletonIds()

  if (targets.length === 0) {
    console.log('No singleton documents found. Nothing to back up.')
    return
  }

  const dir = path.join(BACKUP_ROOT, stamp())
  await fs.mkdir(dir, { recursive: true })

  const written: string[] = []
  const missing: string[] = []

  for (const id of targets) {
    const doc = await sanityWriteClient.fetch<SanityDoc | null>(
      `*[_id == $id][0]`,
      { id },
    )

    if (!doc) {
      missing.push(id)
      continue
    }

    const file = path.join(dir, `${id}.json`)
    await fs.writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
    written.push(id)
  }

  const manifest = {
    takenAt: new Date().toISOString(),
    projectId: sanityWriteClient.config().projectId,
    dataset: sanityWriteClient.config().dataset,
    requested: targets,
    written,
    missing,
  }
  await fs.writeFile(
    path.join(dir, '_manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )

  console.log(`Backed up ${written.length} document(s) to:`)
  console.log(`  ${dir}`)
  for (const id of written) console.log(`  - ${id}`)

  if (missing.length > 0) {
    // Not an error. A singleton that has never been seeded does not exist yet,
    // which is worth saying out loud before a seed creates it.
    console.log(`\nNot present in the dataset (nothing to lose): ${missing.join(', ')}`)
  }

  console.log(`\nRestore with:\n  npm run static:backup-singletons -- --restore ${dir} --apply`)
}

async function restore(dir: string, apply: boolean): Promise<void> {
  const resolved = path.resolve(dir)
  const entries = (await fs.readdir(resolved)).filter(
    (f) => f.endsWith('.json') && f !== '_manifest.json',
  )

  if (entries.length === 0) {
    throw new Error(`No document snapshots found in ${resolved}`)
  }

  console.log(`${apply ? 'Restoring' : 'DRY RUN — would restore'} ${entries.length} document(s) from:`)
  console.log(`  ${resolved}\n`)

  for (const entry of entries) {
    const raw = await fs.readFile(path.join(resolved, entry), 'utf8')
    const doc = JSON.parse(raw) as SanityDoc

    // _rev is a snapshot of a revision that no longer exists after any later
    // write; sending it back makes Sanity reject the mutation as a conflict.
    // _updatedAt is server-owned. Both are dropped; _id and _type are the
    // identity we are restoring.
    const { _rev: _ignoredRev, _updatedAt: _ignoredUpdatedAt, ...payload } = doc

    if (!payload._id || !payload._type) {
      throw new Error(`${entry} is missing _id or _type; refusing to restore it`)
    }

    if (apply) {
      await sanityWriteClient.createOrReplace(payload as SanityDoc & { _id: string; _type: string })
      console.log(`  restored ${payload._id}`)
    } else {
      console.log(`  would restore ${payload._id} (${Object.keys(payload).length} fields)`)
    }
  }

  if (!apply) {
    console.log('\nNothing was written. Re-run with --apply to restore for real.')
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.includes('--list')) {
    const ids = await listSingletonIds()
    console.log(`${ids.length} singleton document(s) in the dataset:`)
    for (const id of ids) console.log(`  - ${id}`)
    return
  }

  const restoreIdx = args.indexOf('--restore')
  if (restoreIdx !== -1) {
    const dir = args[restoreIdx + 1]
    if (!dir || dir.startsWith('--')) {
      throw new Error('--restore needs a backup directory path')
    }
    await restore(dir, args.includes('--apply'))
    return
  }

  await backup(args.filter((a) => !a.startsWith('--')))
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
