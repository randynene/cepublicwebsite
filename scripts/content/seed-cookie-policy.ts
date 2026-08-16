import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Seed the `cookiePolicyPage` singleton (Aug 2026), alongside the consent banner.
//
// Unlike the other two legal singletons there is nothing to migrate: the Webflow
// site had no cookie notice, which is precisely why this work exists. The copy
// below is authored, not captured.
//
// THE TABLE IS THE PART THAT ROTS. Its rows must match the vendors actually
// loaded by site/src/components/consent/gated-scripts.tsx and the GTM container.
// Vendors change cookie names and lifetimes without telling anyone, so this
// needs re-verifying against a real cookie audit of production periodically. An
// inaccurate cookie table is its own compliance problem, not a cosmetic one.
//
// Not legal advice: written to reflect ICO guidance and PECR reg 6, not reviewed
// by a solicitor.
//
// House style: no em/en dashes (repo hard rule). normalizeDeep strips any that
// slip in, matching seed-shared-service-faqs.ts.
//
// Idempotent: fixed _id "cookiePolicyPage" + createOrReplace. Dry-run by
// default; pass --apply to write.
//
// Run (preview):  npm run content:seed-cookie-policy
// Run (write):    npm run content:seed-cookie-policy -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const CONTACT_EMAIL = 'info@cloudemployee.io'
const PRIVACY_PATH = '/legals/privacy-policy'

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | {
      kind: 'table'
      caption: string
      header: string[]
      rows: string[][]
    }

const BODY: Block[] = [
  {
    kind: 'p',
    text: 'This policy explains what cookies we use on cloudemployee.io, what each one is for, and how you control them. It sits alongside our Privacy Policy, which covers personal data more broadly.',
  },

  { kind: 'h2', text: 'What cookies are' },
  {
    kind: 'p',
    text: 'Cookies are small text files that a website stores on your device. They are widely used to make sites work, to remember your settings, and to tell site owners how their site is being used. Some are set by us and some are set by other companies whose services appear on our pages.',
  },
  {
    kind: 'p',
    text: 'This policy also covers similar technologies that do the same job by different means, including pixels, tags, and browser storage. Where we say "cookies" below, we mean all of them.',
  },

  { kind: 'h2', text: 'Your choice' },
  {
    kind: 'p',
    text: 'When you first visit cloudemployee.io we ask which cookies you are happy for us to set. Only the cookies that are strictly necessary for the site to work are set before you answer. Everything else waits for your permission, and nothing in the analytics or marketing categories loads until you give it.',
  },
  {
    kind: 'p',
    text: 'You can change your answer whenever you like using the Cookie settings link in the footer of every page. Withdrawing your consent is as straightforward as giving it, and it will not stop you using the site or reduce what you can see.',
  },
  {
    kind: 'p',
    text: 'We remember your answer for twelve months. After that we will ask again. We will also ask again sooner if we add a service that your previous answer could not reasonably have covered.',
  },

  { kind: 'h2', text: 'Strictly necessary cookies' },
  {
    kind: 'p',
    text: 'These make the site function and cannot be switched off. They do not track you across other websites and they are not used for advertising. They include the cookie that records your cookie choice, which has to exist in order for us to honour the answer you gave.',
  },
  {
    kind: 'table',
    caption: 'Strictly necessary cookies. Always set.',
    header: ['Cookie', 'Set by', 'Purpose', 'Duration'],
    rows: [
      ['ce_cookie_consent', 'Cloud Employee', 'Remembers your cookie choice', '12 months'],
      ['Platform cookies', 'Vercel', 'Routing, security, and load balancing', 'Session'],
    ],
  },

  { kind: 'h2', text: 'Analytics cookies' },
  {
    kind: 'p',
    text: 'These help us understand how the site is used: which pages people read, which routes they take through the site, and where they run into trouble. We use this to decide what to fix and what to write next.',
  },
  {
    kind: 'p',
    text: 'We are interested in patterns across visitors, not in identifying you personally. If you turn these off, we still count visits in an aggregated form that does not identify anyone and does not involve storing anything on your device.',
  },
  {
    kind: 'table',
    caption: 'Analytics cookies. Set only if you agree to analytics.',
    header: ['Cookie', 'Set by', 'Purpose', 'Duration'],
    rows: [
      ['_ga, _ga_*', 'Google Analytics', 'Distinguishes visitors and measures site use', '2 years'],
      ['_hjSessionUser_*', 'Hotjar', 'Recognises a returning visitor', '12 months'],
      ['_hjSession_*', 'Hotjar', 'Holds the current session data', '30 minutes'],
    ],
  },

  { kind: 'h2', text: 'Marketing cookies' },
  {
    kind: 'p',
    text: 'These let us measure whether our advertising reaches the right people, and let partners such as LinkedIn and Meta show you our adverts on their platforms. They also let us see whether an advert led to an enquiry, which is how we judge whether our advertising is worth continuing.',
  },
  {
    kind: 'p',
    text: 'If you turn these off you will still see advertising elsewhere on the internet. It simply will not be based on your visit here.',
  },
  {
    kind: 'table',
    caption: 'Marketing cookies. Set only if you agree to marketing.',
    header: ['Cookie', 'Set by', 'Purpose', 'Duration'],
    rows: [
      ['hubspotutk, __hstc, __hssc', 'HubSpot', 'Links an enquiry to how you found us', '6 months'],
      ['_fbp', 'Meta', 'Advert delivery and measurement', '3 months'],
      [
        'bcookie, lidc, UserMatchHistory',
        'LinkedIn',
        'Advert targeting and conversion tracking',
        '24 hours to 12 months',
      ],
    ],
  },

  { kind: 'h2', text: 'Cookies set by other companies' },
  {
    kind: 'p',
    text: 'Some of the cookies listed above are set by services we use rather than by us, and those companies act as controllers of the data they collect through them. Their own privacy notices explain what they do with that information, and we would encourage you to read them if you want the full picture.',
  },
  {
    kind: 'p',
    text: 'We do not control those cookies and we cannot delete them on your behalf. What we can do, and what we do, is stop those services loading at all unless you have agreed to the category they belong to.',
  },

  { kind: 'h2', text: 'Controlling cookies in your browser' },
  {
    kind: 'p',
    text: 'You can also block or delete cookies through your browser settings, independently of the choice you make here. Chrome, Safari, Firefox and Edge all have a privacy or cookies section in their settings, and each publishes instructions for it.',
  },
  {
    kind: 'p',
    text: 'Be aware that blocking all cookies at the browser level will break parts of most websites, including this one. You can also opt out of many advertising cookies across a large number of sites at once through the Your Online Choices service run by the European Interactive Digital Advertising Alliance.',
  },

  { kind: 'h2', text: 'How long cookies last' },
  {
    kind: 'p',
    text: 'Session cookies are deleted when you close your browser. Persistent cookies stay on your device for the period shown in the table above, or until you delete them, whichever comes first.',
  },

  { kind: 'h2', text: 'Your data protection rights' },
  {
    kind: 'p',
    text: 'Where cookies collect personal data, you have rights over that data under the UK GDPR. These include the right to access it, to have it corrected or erased, to object to how it is used, and to complain to a supervisory authority. Our Privacy Policy explains those rights in full and how to exercise them.',
  },

  { kind: 'h2', text: 'Changes to this policy' },
  {
    kind: 'p',
    text: 'We update this policy when the cookies we use change. If we add anything that needs your permission, we will ask you again rather than relying on an answer you gave before it existed. The date at the top of this page shows when it was last revised.',
  },

  { kind: 'h2', text: 'Contact' },
  {
    kind: 'p',
    text: `If you have a question about this policy or about how we use cookies, write to us at ${CONTACT_EMAIL} and we will answer.`,
  },
  {
    kind: 'p',
    text: "You also have the right to complain to the Information Commissioner's Office, the UK supervisory authority for data protection, at ico.org.uk. We would rather you gave us the chance to put things right first, but that route is always open to you.",
  },
]

const key = () => randomUUID().slice(0, 12)

function toPortableText(blocks: Block[]): unknown[] {
  const out: unknown[] = []

  for (const b of blocks) {
    if (b.kind === 'table') {
      out.push({
        _type: 'table',
        _key: key(),
        caption: b.caption,
        boldFirstColumn: true,
        headerRows: [{ _type: 'tableHeaderRow', _key: key(), cells: b.header }],
        bodyRows: b.rows.map((cells) => ({
          _type: 'tableBodyRow',
          _key: key(),
          cells,
        })),
      })
      continue
    }

    out.push({
      _type: 'block',
      _key: key(),
      style: b.kind === 'h2' ? 'h2' : 'normal',
      ...(b.kind === 'li' ? { listItem: 'bullet', level: 1 } : {}),
      markDefs: [],
      children: [{ _type: 'span', _key: key(), text: b.text, marks: [] }],
    })
  }

  return out
}

function buildDoc() {
  return {
    _id: 'cookiePolicyPage',
    _type: 'cookiePolicyPage',
    title: 'Cookie Policy',
    eyebrow: 'Legal',
    metaTitle: 'Cookie Policy | Cloud Employee',
    metaDescription:
      'What cookies cloudemployee.io uses, what each one does, and how to change or withdraw your choice at any time.',
    sections: [
      {
        _type: 'richTextSection',
        _key: key(),
        content: toPortableText(BODY),
      },
    ],
  }
}

// Strips em/en dashes anywhere in the document, per the repo hard rule. Copied
// from seed-shared-service-faqs.ts rather than shared, matching how the other
// seed scripts do it.
function normalizeDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/—/g, '-').replace(/–/g, '-') as unknown as T
  }
  if (Array.isArray(value)) return value.map((v) => normalizeDeep(v)) as unknown as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalizeDeep(v)]),
    ) as unknown as T
  }
  return value
}

async function main() {
  const apply = process.argv.includes('--apply')
  const doc = normalizeDeep(buildDoc())

  const headings = BODY.filter((b) => b.kind === 'h2').length
  const paras = BODY.filter((b) => b.kind === 'p').length
  const tables = BODY.filter((b) => b.kind === 'table').length
  console.log(
    `cookiePolicyPage: ${headings} headings, ${paras} paragraphs, ${tables} table. Privacy Policy lives at ${PRIVACY_PATH}.`,
  )

  if (!apply) {
    console.log('\nDRY RUN (no write). Document preview:\n')
    console.log(JSON.stringify(doc, null, 2))
    console.log('\nRe-run with --apply to write to Sanity.')
    return
  }

  await sanityWriteClient.createOrReplace(doc)
  console.log('\nSeeded cookiePolicyPage singleton (_id: cookiePolicyPage).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
