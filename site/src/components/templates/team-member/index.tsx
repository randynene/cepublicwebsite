import type { ReactNode } from 'react'

import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/breadcrumbs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Icon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { PortableText } from '@/components/ui/portable-text'
import { Tag } from '@/components/ui/tag'
import { Text } from '@/components/ui/text'
import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import { toInternalHref } from '@/lib/url'
import type {
  AuthorBlogPost,
  TeamMember,
} from '@/types/sanity/documents/team-member'

export interface TeamMemberTemplateProps {
  member: TeamMember
  articles: AuthorBlogPost[]
  locale: Locale
}

// Team Member.html .ce-subhead — 22px white semibold section labels.
const SECTION_LABEL_CLASS =
  'text-[22px] font-semibold leading-none tracking-[-0.5px] text-text-default'

// Team Member.html .ce-body — 16px / 25px muted body copy.
const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

const aboutTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-4 last:mb-0')}>{children}</p>
    ),
  },
}

const expertiseComponents = {
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <div className="flex flex-wrap gap-2.5">{children}</div>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <Tag tone="ghost-lime">{children}</Tag>
    ),
  },
}

function formatTimeAtCloudEmployee(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const years = Number.parseInt(trimmed, 10)
  if (Number.isNaN(years)) return trimmed
  return years === 1 ? '1 year' : `${years} years`
}

function SectionLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn(SECTION_LABEL_CLASS, className)}>{children}</p>
  )
}

export default function TeamMemberTemplate({
  member,
  articles,
  locale,
}: TeamMemberTemplateProps) {
  const hasAbout =
    Array.isArray(member.aboutContent) && member.aboutContent.length > 0
  const hasExpertise =
    Array.isArray(member.areasOfExpertise) &&
    member.areasOfExpertise.length > 0
  const timeLabel = formatTimeAtCloudEmployee(member.timeAtCloudEmployee)
  const bookHref = member.bookACallLink
    ? toInternalHref(member.bookACallLink)
    : null
  const linkedinHref = member.linkedinLink ?? null
  const hasCtas = Boolean(
    (bookHref && bookHref.href !== '#') || linkedinHref,
  )

  const imageAlt = member.teamMemberImage.alt?.trim() || member.name

  const articlesHeading = UI_STRINGS['teamMember.articlesFrom'].replace(
    '{name}',
    member.name,
  )

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: UI_STRINGS['breadcrumb.home'], href: buildLocalePath('/', locale) },
    {
      name: UI_STRINGS['breadcrumb.aboutUs'],
      href: buildLocalePath('/about-us', locale),
    },
    { name: member.name, href: buildLocalePath(`/team/${member.slug}`, locale) },
  ]

  return (
    <article>
      <Container width="default" className="pt-8 lg:pt-12">
        <Breadcrumbs items={breadcrumbItems} className="mb-8" />

        {/* Team Member.html page content — radial wash + export padding */}
        <div
          className={cn(
            'bg-[radial-gradient(110%_60%_at_0%_0%,#0c1830_0%,#070D18_55%)]',
            'px-[22px] py-12 pb-16',
            'sm:px-8 lg:px-16 lg:py-[72px] lg:pb-24',
          )}
        >
          <header>
            <Heading as="h1" size="h2" className="mb-3">
              {member.name}
            </Heading>
            {member.position && (
              <Text
                as="p"
                size="lead"
                className="mb-12 font-medium text-brand-primary"
              >
                {member.position}
              </Text>
            )}
            {!member.position && <div className="mb-12" aria-hidden="true" />}
          </header>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[360px_1fr_360px] lg:items-start lg:gap-14">
            <section aria-label={member.name} className="order-1 lg:order-none">
              <div className="relative mx-auto h-[300px] w-full max-w-[360px] overflow-hidden rounded-[18px] border border-border-subtle bg-gradient-to-br from-[#16223A] to-[#0D1626] lg:mx-0 lg:h-[440px] lg:max-w-none lg:rounded-[20px]">
                <Image
                  source={member.teamMemberImage}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 360px, 100vw"
                  className="object-cover"
                />
              </div>
            </section>

            <section className="order-2 lg:order-none">
              {hasAbout && (
                <>
                  <SectionLabel className="mb-[18px]">
                    {UI_STRINGS['teamMember.aboutHeading']}
                  </SectionLabel>
                  <PortableText
                    value={member.aboutContent!}
                    components={aboutTextComponents}
                  />
                </>
              )}

              {hasCtas && (
                <div className="mt-8 flex flex-wrap gap-3.5">
                  {bookHref && bookHref.href !== '#' && (
                    <MegaMenuPillLabel
                      as="a"
                      href={bookHref.href}
                      variant="pill-green"
                      size="cta"
                      leadingArrow
                      leadingGlyph="→"
                      label={UI_STRINGS['teamMember.bookACall']}
                    />
                  )}
                  {linkedinHref && (
                    <MegaMenuPillLabel
                      as="a"
                      href={linkedinHref}
                      external
                      variant="pill-outline-dark"
                      size="cta"
                      leadingArrow
                      leadingGlyph="in"
                      label={UI_STRINGS['teamMember.connectLinkedin']}
                    />
                  )}
                </div>
              )}
            </section>

            <aside className="order-3 lg:order-none">
              {timeLabel && (
                <div className="mb-9">
                  <SectionLabel className="mb-3.5">
                    {UI_STRINGS['teamMember.timeAtCloudEmployeeLabel']}
                  </SectionLabel>
                  <p className={cn(BODY_MUTED_CLASS, 'mb-0')}>{timeLabel}</p>
                </div>
              )}

              {hasExpertise && (
                <div>
                  <SectionLabel className="mb-[18px]">
                    {UI_STRINGS['teamMember.expertiseHeading']}
                  </SectionLabel>
                  <PortableText
                    value={member.areasOfExpertise!}
                    components={expertiseComponents}
                  />
                </div>
              )}
            </aside>
          </div>

          <section className="mt-16 lg:mt-24">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Heading as="h2" className="mb-0 text-h3 leading-[56px] tracking-[-1.4px]">
                {articlesHeading}
              </Heading>
              <MegaMenuPillLabel
                as="a"
                href={buildLocalePath('/blog', locale)}
                variant="pill-outline-dark"
                size="cta"
                leadingArrow
                leadingGlyph="→"
                label={UI_STRINGS['teamMember.viewAllContent']}
                className="shrink-0"
              />
            </div>

            {articles.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-border-default bg-[rgba(27,42,69,0.25)] px-8 py-14 text-center lg:p-14">
                <p className="text-[19px] font-medium leading-[28.5px] tracking-[-0.08px] text-text-tertiary">
                  {UI_STRINGS['teamMember.noArticles']}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((post) => (
                  <Card as="article" key={post._id}>
                    <CardHeader bleed>
                      {post.thumbnailImage && (
                        <div className="relative aspect-[16/9] w-full">
                          <Image
                            source={post.thumbnailImage}
                            alt={post.title}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Tag>{post.category.name}</Tag>
                      <Heading as="h3" size="h4" className="mt-3 mb-4">
                        {post.title}
                      </Heading>
                      <Link
                        href={buildLocalePath(
                          `/${post.category.slug}/${post.slug}`,
                          locale,
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span>{UI_STRINGS['teamMember.readArticle']}</span>
                          <Icon name="chevron-right" size="sm" />
                        </span>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </article>
  )
}
