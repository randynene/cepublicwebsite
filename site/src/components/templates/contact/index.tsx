import { cn } from '@/components/ui/_utils/cn'
import { MaterialIcon } from '@/components/ui/icon'
import { HubSpotFormEmbed } from '@/components/ui/hubspot-form-embed'
import type { Locale } from '@/lib/locale'

import { CalendlyPopupButton } from './calendly-popup-button'
import {
  CONTACT_CONTENT,
  type ContactContent,
  type ContactOffice,
  type ContactQuickLink,
} from './content'

// Contact (/contact) — live structure on the dark/lime design system.
// Left column: intro prose + quick-contact strip. Right column: the real
// HubSpot enquiry form. Below: the Our Locations office grid. The
// "Ready to hire your next engineer?" band under this page is the sitewide
// footer CTA block, not part of this template.

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const EYEBROW = 'text-[11.5px] font-semibold uppercase tracking-[1.68px] text-brand-primary'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const BODY = 'text-[#B8C2D1]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const PILL =
  'inline-flex w-fit items-center gap-2.5 rounded-pill border border-[#22314D] bg-[#101B30] px-5 py-3 text-[14px] font-medium text-white transition-colors hover:border-brand-primary/60 hover:text-brand-primary'

// The enquiry panel is LIGHT on purpose, and it is not a style preference.
//
// HubSpot renders this form inside an `<iframe class="hs-form-iframe">`, so the
// C6 HubSpotFormEmbed chassis (and any [&_.hs-input]:... override we pass it)
// never reaches the fields — verified in the browser: the mounted document has
// no .hs-input at all, it lives in the frame. Inside that frame HubSpot applies
// its own theme, which is ink-on-white (label #212D3A, input #F5F8FA). On the
// dark card the labels were effectively invisible.
//
// Two ways out: turn the form into a raw/unstyled form in HubSpot so it mounts
// inline and our CSS applies, or give it a light panel. The first is a change to
// CE's HubSpot account, so it is not the agent's to make. The second is what the
// live site already looks like. Panel is light; page stays dark.
const FORM_PANEL = 'rounded-[20px] border border-[#D8DEE7] bg-white'

// D5 — icons are chrome, chosen by link kind rather than editable in Studio.
const KIND_ICON: Record<ContactQuickLink['kind'], string> = {
  calendly: 'event',
  phone: 'call',
  email: 'mail',
  link: 'arrow_outward',
}

/** tel: hrefs must be digits and a leading +; the label keeps its formatting. */
function telHref(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/[^\d]/g, '')
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`
}

function quickLinkHref(link: ContactQuickLink): string {
  if (link.kind === 'phone') return telHref(link.value)
  if (link.kind === 'email') return `mailto:${link.value}`
  return link.value
}

function QuickLink({ link }: { link: ContactQuickLink }) {
  const icon = <MaterialIcon name={KIND_ICON[link.kind]} size="sm" className="text-brand-primary" />

  if (link.kind === 'calendly') {
    return (
      <CalendlyPopupButton url={link.value} className={PILL}>
        {icon}
        <span>{link.label}</span>
      </CalendlyPopupButton>
    )
  }

  return (
    <a href={quickLinkHref(link)} className={PILL}>
      {icon}
      <span>{link.label}</span>
    </a>
  )
}

function OfficeCard({ office }: { office: ContactOffice }) {
  return (
    <div className={cn(CARD, 'flex h-full flex-col gap-4 p-7')}>
      <h3 className="text-[18px] font-semibold text-white">{office.name}</h3>
      <p className={cn('text-[14px] leading-[22px]', BODY)}>{office.address}</p>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        {office.phone ? (
          <a
            href={telHref(office.phone)}
            className="inline-flex items-center gap-2 text-[13px] text-white transition-colors hover:text-brand-primary"
          >
            <MaterialIcon name={KIND_ICON.phone} size="sm" className="text-brand-primary" />
            <span>{office.phone}</span>
          </a>
        ) : null}
        {office.email ? (
          <a
            href={`mailto:${office.email}`}
            className="inline-flex items-center gap-2 text-[13px] text-white transition-colors hover:text-brand-primary"
          >
            <MaterialIcon name={KIND_ICON.email} size="sm" className="text-brand-primary" />
            <span>{office.email}</span>
          </a>
        ) : null}
      </div>
    </div>
  )
}

export function ContactTemplate({
  locale = 'en-US',
  content = CONTACT_CONTENT,
}: {
  locale?: Locale
  content?: ContactContent
}) {
  void locale // the contactPage singleton serves both locales; kept for parity with sibling templates
  const C = content

  return (
    <main id="main" className="overflow-x-hidden bg-[#070D18]">
      <section className={cn(BAND, 'grid gap-12 pt-[56px] pb-[72px] lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pt-[80px]')}>
        <div>
          <p className={EYEBROW}>{C.hero.eyebrow}</p>
          <h1 className="mt-5 max-w-[560px] text-[38px] font-semibold leading-[1.05] tracking-[-1.6px] text-white lg:text-[58px] lg:leading-[62px] lg:tracking-[-2.2px]">
            {C.hero.titleLead} <span className={ACCENT}>{C.hero.titleAccent}</span>
          </h1>
          <div className="mt-6 flex max-w-[560px] flex-col gap-4">
            {C.hero.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className={cn('text-[16px] leading-[26px]', BODY)}>
                {paragraph}
              </p>
            ))}
          </div>
          {C.contactStrip.links.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {C.contactStrip.links.map((link) => (
                <QuickLink key={`${link.kind}-${link.label}`} link={link} />
              ))}
            </div>
          ) : null}
          {C.contactStrip.note ? (
            <p className={cn('mt-5 text-[13px] leading-[20px]', BODY)}>{C.contactStrip.note}</p>
          ) : null}
        </div>

        <div className={cn(FORM_PANEL, 'h-fit p-7 lg:p-9')}>
          {C.form.heading ? (
            <h2 className="mb-6 text-[24px] font-semibold tracking-[-0.6px] text-[#0A1628]">
              {C.form.heading}
            </h2>
          ) : null}
          {C.form.hubspotFormId ? (
            <HubSpotFormEmbed
              formId={C.form.hubspotFormId}
              {...(C.form.portalId ? { portalId: C.form.portalId } : {})}
            />
          ) : null}
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#0A1628] to-[#0b1a30] py-[72px]">
        <div className={BAND}>
          {C.offices.eyebrow ? <p className={EYEBROW}>{C.offices.eyebrow}</p> : null}
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px]">
            {C.offices.heading}
          </h2>
          {C.offices.items.length ? (
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {C.offices.items.map((office) => (
                <li key={office.name}>
                  <OfficeCard office={office} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default ContactTemplate
