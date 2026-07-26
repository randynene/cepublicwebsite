import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { CONTACT_CONTENT as C } from '../../site/src/components/templates/contact/content'

// Seed contactPage singleton (bespoke Contact shape, WP-05).
//
// Copy, phone numbers, office addresses and the Calendly URL are transcribed
// from the live page. The HubSpot form GUID is the REAL form
// ("Contact Request (via cloudemployee.io/contact)"), not the
// hubspotonwebflow.com bridge id that the live markup carries.
//
// Run: npm run static:seed-contact-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

const META_TITLE = 'Contact Us | Cloud Employee'
const META_DESCRIPTION =
  'Talk to Cloud Employee about building your engineering team. Send a message and we reply within 24 hours, or book a video call with us directly today.'

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

function normalizeStr(s: string): string {
  return s.replace(/—/g, ', ').replace(/–/g, '-')
}

function normalizeDeep<T>(value: T): T {
  if (typeof value === 'string') return normalizeStr(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => normalizeDeep(v)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = STRUCTURAL_KEYS.has(k) ? v : normalizeDeep(v)
    }
    return out as T
  }
  return value
}

function keyed<T extends Record<string, unknown>>(
  items: readonly T[],
  prefix: string,
): Array<T & { _key: string }> {
  return items.map((item, i) => ({ _key: `${prefix}-${i}`, ...item }))
}

function buildDoc() {
  return normalizeDeep({
    _id: 'contactPage',
    _type: 'contactPage',
    title: 'Contact Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    hero: {
      eyebrow: C.hero.eyebrow,
      titleLead: C.hero.titleLead,
      titleAccent: C.hero.titleAccent,
      paragraphs: [...C.hero.paragraphs],
    },
    contactStrip: {
      links: keyed(
        C.contactStrip.links.map((l) => ({
          _type: 'contactQuickLink',
          kind: l.kind,
          label: l.label,
          value: l.value,
        })),
        'contact-link',
      ),
      note: C.contactStrip.note,
    },
    form: {
      hubspotFormId: C.form.hubspotFormId,
    },
    offices: {
      eyebrow: C.offices.eyebrow,
      heading: C.offices.heading,
      items: keyed(
        C.offices.items.map((o) => ({
          _type: 'contactOffice',
          name: o.name,
          address: o.address,
          ...(o.phone ? { phone: o.phone } : {}),
          ...(o.email ? { email: o.email } : {}),
        })),
        'contact-office',
      ),
    },
  })
}

async function main() {
  console.log('Building contactPage doc...')
  const doc = buildDoc()
  console.log(`  metaTitle: ${doc.metaTitle.length} chars`)
  console.log(`  metaDescription: ${doc.metaDescription.length} chars`)
  console.log(`  quick links: ${doc.contactStrip.links.length}`)
  console.log(`  offices: ${doc.offices.items.length}`)
  console.log(`  hubspot form: ${doc.form.hubspotFormId}`)
  await sanityWriteClient.createOrReplace(doc)
  console.log('createOrReplace contactPage OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
