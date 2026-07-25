// PLACEHOLDER content for the design preview ONLY.
//
// This is NOT Cloud Employee's real privacy policy. It is representative,
// generic copy shaped like a privacy policy (TOC-able H2 sections, paragraphs,
// lists, a link, emphasis, an H3 sub-section) so the long-form reading
// treatment can be reviewed at /legals/privacy-policy/preview before real
// content is authored in Sanity Studio. The production route at
// /legals/privacy-policy renders the real Sanity body instead.

type Block = Record<string, unknown>

function p(key: string, text: string): Block {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
  }
}

function h(key: string, style: 'h2' | 'h3', text: string): Block {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
  }
}

function bullets(key: string, items: string[]): Block {
  return items.map((text, i) => ({
    _type: 'block',
    _key: `${key}-${i}`,
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}-${i}s`, text, marks: [] }],
  })) as unknown as Block
}

export const PREVIEW_PRIVACY_BODY = [
  p(
    'intro',
    'This privacy policy explains how we collect, use, and protect your personal information when you visit our website, contact our team, or use our services. We are committed to handling your data responsibly and transparently.',
  ),

  h('s1', 'h2', 'Information we collect'),
  p(
    's1p1',
    'We collect information you provide directly to us, information collected automatically as you use the site, and information from third parties where you have consented to share it. The categories of data are described below.',
  ),
  ...(bullets('s1l', [
    'Contact details such as your name, email address, company, and phone number when you submit a form.',
    'Usage data such as pages viewed, time on page, referring source, and approximate location.',
    'Device data such as browser type, operating system, and screen size.',
  ]) as unknown as Block[]),

  h('s2', 'h2', 'How we use your information'),
  p(
    's2p1',
    'We use the information we collect to respond to your enquiries, deliver and improve our services, send relevant communications where you have opted in, and meet our legal obligations.',
  ),
  h('s2b', 'h3', 'Marketing communications'),
  p(
    's2bp1',
    'Where you have given consent, we may send you occasional updates about our services. You can withdraw consent at any time using the unsubscribe link in any email, and we will stop sending marketing messages.',
  ),

  h('s3', 'h2', 'Cookies and tracking'),
  p(
    's3p1',
    'We use cookies and similar technologies to operate the site, remember your preferences, and understand how the site is used. You can control cookies through your browser settings. Disabling some cookies may affect how the site functions.',
  ),

  h('s4', 'h2', 'How we share information'),
  p(
    's4p1',
    'We do not sell your personal information. We share data only with service providers who help us operate the business, where required by law, or as part of a corporate transaction, and always under appropriate safeguards.',
  ),

  h('s5', 'h2', 'Data retention'),
  p(
    's5p1',
    'We keep personal information only for as long as necessary to fulfil the purposes set out in this policy, after which it is deleted or anonymised. Retention periods vary depending on the type of data and our legal obligations.',
  ),

  h('s6', 'h2', 'Your rights'),
  p(
    's6p1',
    'Depending on your location, you may have the right to access, correct, delete, or restrict the processing of your personal information, and to object to certain uses. To exercise any of these rights, contact us using the details below.',
  ),

  h('s7', 'h2', 'Contact us'),
  {
    _type: 'block',
    _key: 's7p1',
    style: 'normal',
    markDefs: [
      { _type: 'link', _key: 'lnk1', href: 'mailto:privacy@example.com' },
    ],
    children: [
      {
        _type: 'span',
        _key: 's7p1a',
        text: 'If you have questions about this policy or how your data is handled, please email ',
        marks: [],
      },
      { _type: 'span', _key: 's7p1b', text: 'privacy@example.com', marks: ['lnk1'] },
      { _type: 'span', _key: 's7p1c', text: '. We aim to respond within five working days.', marks: [] },
    ],
  },
] as unknown as Parameters<
  typeof import('@/components/ui/portable-text').PortableText
>[0]['value']
