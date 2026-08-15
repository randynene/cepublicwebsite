// Contact (/contact) — static defaults / Sanity fallback.
// Live structure: hero prose + quick-contact strip on the left, enquiry form on
// the right, then the Our Locations office grid. Copy, phone numbers, addresses
// and the Calendly URL are transcribed from the live page, not invented.
//
// Author voice: no em/en dashes — hyphens only.

export const CONTACT_META = {
  title: 'Contact Us | Cloud Employee',
  description:
    'Talk to Cloud Employee about building your engineering team. Send a message and we reply within 24 hours, or book a video call with us directly today.',
} as const

export type ContactQuickLinkKind = 'calendly' | 'phone' | 'email' | 'link'

export interface ContactQuickLink {
  kind: ContactQuickLinkKind
  label: string
  /** Calendly URL, phone number, email address, or a path. */
  value: string
}

export interface ContactOffice {
  name: string
  address: string
  phone?: string
  email?: string
}

export interface ContactContent {
  hero: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    paragraphs: string[]
  }
  contactStrip: {
    links: ContactQuickLink[]
    note: string
  }
  form: {
    heading: string
    hubspotFormId: string
    portalId: string
  }
  offices: {
    eyebrow: string
    heading: string
    items: ContactOffice[]
  }
}

// The real HubSpot form behind the live contact page:
// "Contact Request (via cloudemployee.io/contact)", portal 22809822.
// The GUID in the live page markup (fb70845a-...) belongs to the
// hubspotonwebflow.com bridge and 404s against HubSpot, exactly like the
// footer newsletter did. Verified by npm run launch:verify-hubspot-forms.
const CONTACT_HUBSPOT_FORM_ID = '4b883c7d-72c1-4f9c-8196-de68fce303d6'

const CALENDLY_URL = 'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee?hide_gdpr_banner=1'

export const CONTACT_CONTENT: ContactContent = {
  hero: {
    eyebrow: "Let's talk.",
    titleLead: 'Contact us',
    titleAccent: 'today',
    paragraphs: [
      '→ A call with our CTO and a US or UK-based Account Manager',
      '→ A brief built around your stack, team and timeline',
      "→ A cost and location comparison for the roles you're hiring",
      '→ Two vetted engineer profiles within 7 days - free to interview',
    ],
  },
  contactStrip: {
    links: [
      { kind: 'calendly', label: 'Schedule a Video Call', value: CALENDLY_URL },
      { kind: 'phone', label: '+1 (727) 615-6813', value: '+1 (727) 615-6813' },
      { kind: 'email', label: 'info@cloudemployee.io', value: 'info@cloudemployee.io' },
    ],
    note: 'Live Chat available Mon to Fri, 9 AM to 6 PM (UTC+8)',
  },
  form: {
    heading: '',
    hubspotFormId: CONTACT_HUBSPOT_FORM_ID,
    portalId: '',
  },
  offices: {
    eyebrow: 'Where we are',
    heading: 'Our Locations',
    items: [
      {
        name: 'USA Office',
        address: 'Cloud Employee USA Inc, 1000 Brickell Ave, Miami, FL 33131, United States',
        phone: '+1 (727) 615-6813',
        email: 'info@cloudemployee.io',
      },
      {
        name: 'UK Office',
        address: 'Cloud Employee Ltd, 77 New Cavendish St, Marylebone, London W1W 6XB',
        phone: '+44 204 538 4990',
        email: 'info@cloudemployee.co.uk',
      },
      {
        name: 'Australia Office',
        address:
          'Cloud Employee Australia PTY Ltd, Level 2, 57 Grosvenor Street, Neutral Bay, Sydney, NSW 2089',
        phone: '+61 255 035 212',
        email: 'info@cloudemployee.com.au',
      },
      {
        name: 'Philippines Office',
        address:
          'Cloud Employee Inc, Armstrong, 134 H. V. Dela Costa Street, Salcedo Village, Manila, Philippines',
        email: 'info@cloudemployee.io',
      },
    ],
  },
}
