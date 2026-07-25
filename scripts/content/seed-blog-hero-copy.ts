// Seed the blog family's hero copy from spec §7, and re-home the long lead.
//
// Two things happen here, and the second is the one that matters.
//
// 1. The §7 table (eyebrow / H1 / lead) is written into Sanity, so the copy is
//    editable by Seb without a deploy rather than frozen into a component. Every H1 in
//    the table is IDENTICAL to the one the live site serves today, so this changes no
//    headline and carries no SEO risk - it was checked against live, not assumed.
//
// 2. THE LONG LEAD IS MOVED, NOT OVERWRITTEN. The six topic hubs currently carry the
//    live site's long opening paragraph as their hero lead. The spec replaces the hero
//    lead with short new copy and says the long paragraph "lives in the long-form block
//    below". So it is PREPENDED to introContent rather than discarded.
//
//    Overwriting would have been one line and would have silently deleted a paragraph
//    of the ranking content this whole rebuild exists to protect. The migration's job
//    is to move CE's words around, never to lose them.
//
// Idempotent: re-running does not prepend the paragraph twice, because it checks
// whether introContent already opens with it.
//
//   npm run content:seed-blog-hero          # dry run
//   npm run content:seed-blog-hero -- --apply
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { ensureSanity } from '@/lib/env'

ensureSanity()

const APPLY = process.argv.includes('--apply')

type Copy = { eyebrow: string; h1: string; lead: string }

// Spec §7, verbatim.
const HERO: Record<string, Copy> = {
  blogHub: {
    eyebrow: 'Cloud Employee Blog',
    h1: 'All Blogs & Guides',
    lead: 'Expert insights on hiring, managing, and retaining top engineers.',
  },
  staffAugmentationHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Staff Augmentation Knowledge Hub',
    lead: 'Everything on augmenting your team with vetted, embedded engineers.',
  },
  nearshoringOffshoringHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Nearshoring & Offshoring Knowledge Hub',
    lead: 'Choosing, scoping, and running a nearshore partner that delivers.',
  },
  scalingTeamsHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Scaling Software Teams Knowledge Hub',
    lead: 'Keeping velocity and culture intact as engineering headcount grows.',
  },
  hiringTipsHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Hiring Developers Knowledge Hub',
    lead: 'Practical playbooks for assessing and hiring real engineering ability.',
  },
  managingEngineersHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Managing Engineers Knowledge Hub',
    lead: 'Leading distributed engineering teams without burning them out.',
  },
  aiInSoftwareDevelopmentHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'AI in Software Development Knowledge Hub',
    lead: 'Shipping AI features safely - validation, risk, and standards.',
  },
}

type Block = { _type: string; _key?: string; children?: Array<{ text?: string }> }

const plain = (b: Block): string =>
  (b.children ?? []).map((c) => c.text ?? '').join('').trim()

function leadParagraph(text: string, key: string): Block {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}-s`, text, marks: [] }],
  } as Block
}

async function main(): Promise<void> {
  console.log(APPLY ? 'APPLY\n' : 'DRY RUN - nothing written. Pass --apply.\n')

  let moved = 0

  for (const [id, copy] of Object.entries(HERO)) {
    const doc = await sanityWriteClient.fetch<{
      title?: string
      eyebrow?: string
      heroDescription?: Block[]
      introContent?: Block[]
    } | null>(
      `*[_id == $id][0]{ title, eyebrow, heroDescription, introContent }`,
      { id },
    )
    if (!doc) {
      console.error(`  MISSING  ${id}`)
      continue
    }

    const oldLead = (doc.heroDescription ?? []).map(plain).filter(Boolean).join(' ')
    const intro = doc.introContent ?? []
    const introOpener = intro[0] ? plain(intro[0]) : ''

    // Is the old hero lead a paragraph worth keeping? On /blog it is a short lead the
    // spec replaces outright. On the topic hubs it is the opening paragraph of the
    // ranking content and must survive.
    const isLongLead = oldLead.length > 120 && id !== 'blogHub'
    const alreadyMoved = introOpener === oldLead

    const patch: Record<string, unknown> = {
      title: copy.h1,
      eyebrow: copy.eyebrow,
      heroDescription: [leadParagraph(copy.lead, 'hero-lead')],
    }

    let note = ''
    if (isLongLead && !alreadyMoved) {
      patch.introContent = [leadParagraph(oldLead, 'moved-lead'), ...intro]
      note = `  <- long lead (${oldLead.length} chars) moved into the long-form band`
      moved++
    } else if (isLongLead && alreadyMoved) {
      note = '  (long lead already re-homed)'
    }

    console.log(`  ${id.padEnd(28)} h1="${copy.h1.slice(0, 34)}"${note}`)

    if (APPLY) {
      await sanityWriteClient.patch(id).set(patch).commit()
    }
  }

  console.log(
    `\n${moved} long lead(s) moved from the hero into the long-form band. None discarded.`,
  )
  if (!APPLY) console.log('Nothing was written. Re-run with --apply.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
