// Standard placement wrapper for the quick hiring form.
//
// The form goes on roughly 250 pages. If each template positioned it itself, the
// band width, the padding and the vertical rhythm would drift page by page, and
// nobody would notice until someone scrolled twenty of them side by side. One
// wrapper, one set of numbers, so a spacing change is a one-line change.
//
// Placement is LOW on the page, above the footer, on purpose. These are read-first
// pages: someone is still deciding whether CE can do the thing. A form at the top
// interrupts that; a form at the bottom catches the person who has finished
// deciding and is looking for what to do next.

import { Container } from '@/components/ui/container'
import { cn } from '@/components/ui/_utils/cn'

import { QuickHiringForm, type QuickHiringFormProps } from './quick-hiring-form'

// Matches the catalogue templates' band so the form lines up with the content
// above it rather than sitting in its own slightly different column.
const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

export type LeadFormSectionProps = QuickHiringFormProps

export function LeadFormSection(props: LeadFormSectionProps) {
  return (
    <Container>
      <div className={BAND_CLASS}>
        <section className={cn(BAND_PX_CLASS, 'pt-[32px] pb-[80px] lg:pt-[48px]')}>
          <QuickHiringForm {...props} />
        </section>
      </div>
    </Container>
  )
}

/**
 * Technology documents are named "React Developers", "Python Developers" and so
 * on, because each one is a page title. As a preselected stack pill that reads
 * wrong, so the suffix comes off. Anything without the suffix passes through.
 */
export function technologyNameToSkill(technologyName: string): string {
  return technologyName.replace(/\s+Developers?$/i, '').trim()
}

/**
 * Service slug to role, so the role step is answered by the page rather than
 * asked again. Slugs, not names: a name is editorial and Seb can change it in
 * Studio, whereas the slug is the URL and changing it is a redirect decision.
 *
 * Anything absent falls through to no prefill and the visitor picks. That is the
 * right default for the four services that are project work rather than a hire
 * (MVP Development, Mobile Apps, Web-Based Apps, Product Scoping) and for the two
 * location services, where the question is where, not what.
 */
const SERVICE_SLUG_TO_ROLE: Record<string, string> = {
  'ai-engineers': 'ai-engineer',
  'ai-consulting': 'ai-engineer',
  'ai-product-builds': 'ai-engineer',
  'data-scientists': 'data-ml',
  'devops-engineers': 'devops',
  'cloud-engineers': 'devops',
  'software-engineers': 'product-engineer',
  'full-stack-developers': 'product-engineer',
  'front-end-developers': 'product-engineer',
  'back-end-developers': 'product-engineer',
  'web-developers': 'product-engineer',
  'no-code-developers': 'product-engineer',
  'mobile-developers': 'mobile',
  'ios-developers': 'mobile',
  'android-developers': 'mobile',
  'qa-analysts-testers': 'qa',
  'fractional-ctos': 'fractional-cto',
}

export function roleForServiceSlug(slug: string | null | undefined): string | undefined {
  return slug ? SERVICE_SLUG_TO_ROLE[slug] : undefined
}
