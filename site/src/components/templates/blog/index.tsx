import type { ReactNode } from 'react'

import { BlogPostJsonLd } from '@/components/templates/blog/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArticleBody } from '@/components/blog/article-body'
import { BlogBand } from '@/components/blog/container'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { buildToc } from '@/lib/blog/toc'
import { Container } from '@/components/ui/container'
import { Divider } from '@/components/ui/divider'
import { Heading } from '@/components/ui/heading'
import { Icon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { PortableText } from '@/components/ui/portable-text'
import { Tag } from '@/components/ui/tag'
import { Text } from '@/components/ui/text'
import { buildLocalePath } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type {
  BlogPost,
  RelatedBlogPost,
} from '@/types/sanity/documents/blog-post'

export interface BlogTemplateProps {
  post: BlogPost
  relatedPosts: RelatedBlogPost[]
  locale: 'en-US' | 'en-GB'
}

function formatPostDate(
  iso: string | null | undefined,
  locale: 'en-US' | 'en-GB',
): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// Probe 3b shape: areasOfExpertise is PortableText with listItem='bullet'
// blocks holding a single text span. Render as pill row by overriding the
// list container + listItem renderer rather than the default <ul>/<li>.
const expertiseComponents = {
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <div className="flex flex-wrap gap-2">{children}</div>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => <Tag>{children}</Tag>,
  },
}

export default function BlogTemplate({
  post,
  relatedPosts,
  locale,
}: BlogTemplateProps) {
  const hasFaqs = Array.isArray(post.faqs) && post.faqs.length > 0
  const formattedDate = formatPostDate(post.date, locale)
  const author = post.author ?? null
  const authorByline = author
    ? UI_STRINGS['blogPost.authorByline'].replace('{name}', author.name)
    : null
  const moreArticlesHeading = UI_STRINGS['blogPost.moreArticlesOn'].replace(
    '{category}',
    post.category.name,
  )


  // Built from the body's own H2s and H3s. No schema field: a parallel list of
  // headings maintained by an editor would drift from the real ones, and the first
  // person to notice would be a reader clicking through to a section that is not there.
  const toc = buildToc(post.content as unknown[])

  return (
    <article className="pb-16 lg:pb-24">
      <BlogPostJsonLd post={post} locale={locale} />
      {/* Header: title + date only. No breadcrumb (Jake), no hero image - the
          thumbnail moves down INTO the body, above the TL;DR (see below). */}
      <BlogBand className="pt-8 lg:pt-12">
        <Heading as="h1" className="mb-4">
          {post.title}
        </Heading>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-text-default/70">
          {formattedDate && <Text size="small">{formattedDate}</Text>}
          {formattedDate && authorByline && (
            <Text size="small" aria-hidden="true">
              ·
            </Text>
          )}
          {authorByline && <Text size="small">{authorByline}</Text>}
        </div>
      </BlogBand>

      {/* TWO COLUMNS: the article, and a 300px rail that follows you down it.
          minmax(0,1fr) not 1fr - a plain 1fr refuses to shrink below its content's
          intrinsic width, so one long unbroken code line or a wide table blows the
          column out and shoves the rail off the screen. */}
      <BlogBand className="mt-10 lg:mt-12">
        <div className="grid grid-cols-1 gap-10 min-[900px]:grid-cols-[minmax(0,1fr)_300px] min-[900px]:gap-16">
          <div className="min-w-0">
        {/* The main image, IN the body above the TL;DR - not a hero. It sits in the
            left column so the table of contents starts beside it, on the right. */}
        {post.thumbnailImage && (
          <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-[16px]">
            <Image
              source={post.thumbnailImage}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 900px) 62vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {post.tldrSection && post.tldrSection.length > 0 && (
          <aside className="mb-10">
            <Card tone="muted">
              <CardContent>
                <Heading as="h2" size="h4" className="mb-3">
                  {UI_STRINGS['blogPost.tldrHeading']}
                </Heading>
                <PortableText value={post.tldrSection} />
              </CardContent>
            </Card>
          </aside>
        )}

        {/* The category + tag pills were removed here per Jake ("remove all the little
            tags"). The category link survives in the related-posts heading and the
            BreadcrumbList JSON-LD, so internal linking and SEO are unaffected. */}

        <ArticleBody body={post.content as unknown[]} />

        {hasFaqs && (
          <section className="mt-12">
            <Heading as="h2" className="mb-6">
              {UI_STRINGS['blogPost.faqsHeading']}
            </Heading>
            <Accordion type="single" collapsible>
              {post.faqs!.map((faq, idx) => (
                <AccordionItem
                  key={faq._key ?? idx}
                  value={faq._key ?? `faq-${idx}`}
                >
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <PortableText value={faq.answer} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
          </div>

          {/* The rail. Server-rendered links; only the scroll-tracking is client-side,
              so the contents list is in the HTML at first paint and a crawler reads it
              as a normal list of in-page links. */}
          <TableOfContents entries={toc} />
        </div>
      </BlogBand>

      {author && (
        <Container width="default" as="section" className="mt-16">
          <Divider className="mb-12" />
          <Card
            as="section"
            className="grid gap-6 p-6 md:grid-cols-[200px_1fr] md:gap-10 md:p-0"
          >
            <CardHeader className="p-0 md:p-6" bleed>
              {author.teamMemberImage && (
                <div className="relative aspect-square w-full overflow-hidden rounded-md md:w-[200px]">
                  <Image
                    source={author.teamMemberImage}
                    alt={author.name}
                    fill
                    sizes="(min-width: 768px) 200px, 100vw"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <Heading as="h3" size="h4">
                {author.name}
              </Heading>
              {author.position && (
                <Text size="small" className="mt-1 text-text-default/70">
                  {author.position}
                </Text>
              )}
              {author.aboutContent && (
                <>
                  <Heading as="h4" size="eyebrow" className="mt-6 mb-2">
                    {UI_STRINGS['blogPost.authorAboutHeading']}
                  </Heading>
                  <PortableText value={author.aboutContent} />
                </>
              )}
              {author.areasOfExpertise && (
                <>
                  <Heading as="h4" size="eyebrow" className="mt-6 mb-2">
                    {UI_STRINGS['blogPost.authorExpertiseHeading']}
                  </Heading>
                  <PortableText
                    value={author.areasOfExpertise}
                    components={expertiseComponents}
                  />
                </>
              )}
              {author.linkedinLink && (
                <div className="mt-6">
                  <Link href={author.linkedinLink} external>
                    <span className="inline-flex items-center gap-1.5">
                      <span>{UI_STRINGS['blogPost.viewOnLinkedin']}</span>
                      <Icon name="linkedin" size="sm" />
                    </span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      )}

      {/* The bottom breadcrumb was removed here per Jake. The BreadcrumbList
          structured data is still emitted by BlogPostJsonLd, which is where a
          breadcrumb trail actually earns its keep in search results. */}

      {relatedPosts.length > 0 && (
        <Container width="default" className="mt-12 lg:mt-16">
          <Heading as="h2" className="mb-8">
            {moreArticlesHeading}
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relPost) => (
              <Card as="article" key={relPost._id}>
                <CardHeader bleed>
                  {relPost.thumbnailImage && (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        source={relPost.thumbnailImage}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Tag>{relPost.category.name}</Tag>
                  <Heading as="h3" size="h4" className="mt-3 mb-4">
                    {relPost.title}
                  </Heading>
                  <Link
                    href={buildLocalePath(
                      `/${relPost.category.slug}/${relPost.slug}`,
                      locale,
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{UI_STRINGS['blogPost.readArticle']}</span>
                      <Icon name="chevron-right" size="sm" />
                    </span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      )}
    </article>
  )
}
