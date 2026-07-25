import type { ReactNode } from 'react'

import type {
  FooterBottomPillLink as FooterBottomPillLinkData,
  FooterLink,
  FooterSection,
  TalentLocations,
} from '@/lib/sanity/queries/footer'

import type { Locale } from '@/lib/locale-path'

import {
  FOOTER_GRID,
  FooterBottomPillLink as FooterBottomPillLinkRow,
  FooterEyebrow,
  FooterLinkList,
} from './_parts'

function ColumnBlock({
  eyebrow,
  links,
  context,
  children,
  eyebrowClass,
  listGap,
  locale,
}: {
  eyebrow: string
  links: FooterLink[]
  context: string
  children?: ReactNode
  locale: Locale
  eyebrowClass?: string
  listGap?: string
}) {
  return (
    <div>
      <FooterEyebrow className={eyebrowClass}>{eyebrow}</FooterEyebrow>
      <FooterLinkList links={links} context={context} gapClass={listGap} locale={locale} />
      {children}
    </div>
  )
}

export function FooterLinkGrid({
  sections,
  talentLocations,
  locale,
}: {
  sections?: FooterSection[] | null
  talentLocations?: TalentLocations | null
  locale: Locale
}) {
  const expertise = sections?.[0]
  const learnMore = sections?.[1]

  const rolesLinks = expertise?.columns?.[0]?.links ?? []
  const techLinks = expertise?.columns?.[1]?.links ?? []
  const companyLinks = learnMore?.columns?.[0]?.links ?? []
  const resourceLinks = learnMore?.columns?.[1]?.links ?? []
  const bottomPills: FooterBottomPillLinkData[] = expertise?.bottomPillLinks ?? []
  const talentItems = talentLocations?.items ?? []

  return (
    <>
      {/* Desktop — Footer.html 4-column grid */}
      <div className={cnHiddenDesktop(FOOTER_GRID)}>
        <ColumnBlock
          eyebrow="Roles"
          links={rolesLinks}
          context="sections[0].columns[0]"
          eyebrowClass="mb-5"
          locale={locale}
        >
          {bottomPills.length > 0 ? (
            <div className="mt-[30px] flex flex-col gap-[14px]">
              {bottomPills.map((pill) => (
                <FooterBottomPillLinkRow
                  key={pill._key}
                  label={pill.label}
                  url={pill.url}
                  context={`bottomPillLinks.${pill.label}`}
          locale={locale}
        />
              ))}
            </div>
          ) : null}
        </ColumnBlock>

        <ColumnBlock
          eyebrow="Technologies"
          links={techLinks}
          context="sections[0].columns[1]"
          eyebrowClass="mb-5"
          locale={locale}
        >
          {talentItems.length > 0 ? (
            <>
              <FooterEyebrow className="mb-5 mt-8">
                {talentLocations?.sectionLabel ?? 'Talent Locations'}
              </FooterEyebrow>
              <FooterLinkList
                links={talentItems}
                context="talentLocations"
                gapClass="gap-[13px]"
              locale={locale}
            />
            </>
          ) : null}
        </ColumnBlock>

        <ColumnBlock
          eyebrow="Company"
          links={companyLinks}
          context="sections[1].columns[0]"
          eyebrowClass="mb-5"
          locale={locale}
        />

        <ColumnBlock
          eyebrow="Resources"
          links={resourceLinks}
          context="sections[1].columns[1]"
          eyebrowClass="mb-5"
          locale={locale}
        />
      </div>

      {/* Mobile — Footer.html mobile frame (stacked sections) */}
      <div className="flex flex-col lg:hidden">
        <ColumnBlock
          eyebrow="Roles"
          links={rolesLinks}
          context="sections[0].columns[0]"
          eyebrowClass="mb-[18px]"
          listGap="gap-[14px]"
          locale={locale}
        >
          {bottomPills.length > 0 ? (
            <div className="my-6 flex flex-col gap-[14px]">
              {bottomPills.map((pill) => (
                <FooterBottomPillLinkRow
                  key={pill._key}
                  label={pill.label}
                  url={pill.url}
                  context={`bottomPillLinks.${pill.label}`}
          locale={locale}
        />
              ))}
            </div>
          ) : null}
        </ColumnBlock>

        <ColumnBlock
          eyebrow="Technologies"
          links={techLinks}
          context="sections[0].columns[1]"
          eyebrowClass="mb-[18px]"
          listGap="gap-[14px]"
          locale={locale}
        />

        {talentItems.length > 0 ? (
          <div className="mt-9">
            <FooterEyebrow className="mb-[18px]">
              {talentLocations?.sectionLabel ?? 'Talent Locations'}
            </FooterEyebrow>
            <FooterLinkList
              links={talentItems}
              context="talentLocations"
              gapClass="gap-[14px]"
              locale={locale}
            />
          </div>
        ) : null}

        <div className="mt-9">
          <ColumnBlock
            eyebrow="Company"
            links={companyLinks}
            context="sections[1].columns[0]"
            eyebrowClass="mb-[18px]"
            listGap="gap-[14px]"
          locale={locale}
        />
        </div>

        <div className="mt-9">
          <ColumnBlock
            eyebrow="Resources"
            links={resourceLinks}
            context="sections[1].columns[1]"
            eyebrowClass="mb-[18px]"
            listGap="gap-[14px]"
          locale={locale}
        />
        </div>
      </div>
    </>
  )
}

function cnHiddenDesktop(className: string) {
  return `${className} hidden lg:grid`
}
