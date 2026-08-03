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

import { cn } from '@/components/ui/_utils/cn'

import { ROLE_OPTIONS, type RoleId } from './content'
import { QuickHiringForm, type QuickHiringFormProps } from './quick-hiring-form'

// Matches the catalogue templates' band so the form lines up with the content
// above it rather than sitting in its own slightly different column.
const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

export type LeadFormSectionProps = QuickHiringFormProps

export function LeadFormSection(props: LeadFormSectionProps) {
  return (
    // Page ground, not a lighter band. The form is defined by a hairline instead
    // of by a fill, so it sits ON the page rather than interrupting it with a
    // different colour. `bg-bg-primary` is set explicitly rather than inherited:
    // several of the pages this lands on end in a gradient section, and inheriting
    // would put the box on a different shade page to page.
    <section className="qh-form bg-bg-primary">
      <div className={cn(BAND_CLASS, BAND_PX_CLASS, 'py-[52px] lg:py-[68px]')}>
        <div className="rounded-[20px] border border-white/[0.14] p-[22px] sm:p-[30px] lg:p-[40px]">
          <QuickHiringForm {...props} />
        </div>
      </div>
    </section>
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
const SERVICE_SLUG_TO_ROLE: Record<string, RoleId> = {
  'ai-engineers': 'ai-ml',
  'ai-consulting': 'ai-ml',
  'ai-product-builds': 'ai-ml',
  'data-scientists': 'data',
  'devops-engineers': 'devops',
  'cloud-engineers': 'devops',
  'software-engineers': 'full-stack',
  'full-stack-developers': 'full-stack',
  'web-developers': 'full-stack',
  'no-code-developers': 'full-stack',
  'front-end-developers': 'frontend',
  'back-end-developers': 'backend',
  'mobile-developers': 'mobile',
  'ios-developers': 'mobile',
  'android-developers': 'mobile',
  // NOT mapped, because the tile grid has no tile for them: QA Analysts &
  // Testers and Fractional CTOs. Both are real services with their own pages, so
  // their visitors simply start at the role question with nothing preselected.
  // Worth a decision: either add two tiles (making it 10) or accept the gap.
}

/**
 * Guard against exactly the bug this shipped with once. The role ids were renamed
 * when the tile design landed and this map still held the old ones, so every
 * service page silently stopped prefilling: no error, no type failure, the form
 * just quietly asked a question it already knew the answer to. Cross-checking the
 * two lists here turns that into a loud failure at module load instead.
 */
const KNOWN_ROLE_IDS = new Set(ROLE_OPTIONS.map((r) => r.id))
for (const [slug, roleId] of Object.entries(SERVICE_SLUG_TO_ROLE)) {
  if (!KNOWN_ROLE_IDS.has(roleId)) {
    throw new Error(
      `Service "${slug}" maps to role "${roleId}", which is not in ROLE_OPTIONS. ` +
        `Prefill would silently do nothing. Valid ids: ${[...KNOWN_ROLE_IDS].join(', ')}`,
    )
  }
}

export function roleForServiceSlug(slug: string | null | undefined): RoleId | undefined {
  return slug ? SERVICE_SLUG_TO_ROLE[slug] : undefined
}
