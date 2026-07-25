import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { PortableText } from '@/components/ui/portable-text'
import { Text } from '@/components/ui/text'
import { UI_STRINGS } from '@/lib/ui-strings'

import { extractToc, longformComponents, type TocItem } from './longform'

// LEGAL / long-form static text template (Privacy Policy first-of-kind).
//
// Renders inside the global Header + Footer chrome (root layout wraps Nav +
// Footer; the route wraps this in <main id="main">). Static, no motion: the
// TOC uses a sticky sidebar (CSS) on desktop and a native <details> disclosure
// on mobile — no JS scroll-spy.
//
// This template + the longform PortableText treatment are the reusable
// long-form reading pattern that About and other static text pages inherit.

export interface LegalPageTemplateProps {
  title: string
  eyebrow?: string | null
  /** Pre-formatted, e.g. "12 June 2026". */
  lastUpdated?: string | null
  /** Sanity Portable Text body (the richTextSection content). */
  body: Parameters<typeof PortableText>[0]['value']
}

function zeroPad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

// Desktop: sticky "On this page" sidebar. Lime serif-italic numerals per
// VISUAL_LANGUAGE_SPEC §8c (serif-italic numerals used for indices).
function TocSidebar({ items }: { items: TocItem[] }) {
  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-28 hidden max-h-[calc(100vh-9rem)] overflow-y-auto lg:block"
    >
      <p className="text-eyebrow mb-4 uppercase text-text-tertiary">
        {UI_STRINGS['legal.tableOfContents']}
      </p>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className="font-serif italic text-accent-primary"
            >
              {zeroPad(i + 1)}
            </span>
            <a
              href={`#${item.id}`}
              className="text-body-sm leading-snug text-text-secondary transition-colors duration-reveal ease-reveal hover:text-text-default"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Mobile: collapsible "On this page" disclosure (native <details>, no JS).
function TocDisclosure({ items }: { items: TocItem[] }) {
  return (
    <details className="mb-10 rounded-md border border-border-subtle bg-section-bg-card/60 lg:hidden">
      <summary className="text-eyebrow cursor-pointer list-none px-5 py-4 uppercase text-text-tertiary [&::-webkit-details-marker]:hidden">
        {UI_STRINGS['legal.tableOfContents']}
      </summary>
      <ol className="space-y-3 px-5 pb-5">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className="font-serif italic text-accent-primary"
            >
              {zeroPad(i + 1)}
            </span>
            <a
              href={`#${item.id}`}
              className="text-body-sm leading-snug text-text-secondary hover:text-text-default"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  )
}

export default function LegalPageTemplate({
  title,
  eyebrow,
  lastUpdated,
  body,
}: LegalPageTemplateProps) {
  const toc = extractToc(body)
  const hasToc = toc.length > 1
  const lastUpdatedLabel = lastUpdated
    ? `${UI_STRINGS['legal.lastUpdated']}: ${lastUpdated}`
    : null

  return (
    <article className="pb-20 lg:pb-28">
      <Container width="default">
        <div className="mx-auto max-w-[1000px]">
          {/* Hero */}
          <header className="border-b border-border-subtle pt-10 pb-8 lg:pt-16 lg:pb-10">
            {eyebrow && (
              <Text
                as="p"
                size="small"
                className="text-eyebrow mb-4 uppercase text-accent-primary"
              >
                {eyebrow}
              </Text>
            )}
            <Heading
              as="h1"
              size="h2"
              className="text-[2.5rem] leading-tight lg:text-[3.25rem]"
            >
              {title}
            </Heading>
            {lastUpdatedLabel && (
              <Text as="p" size="small" className="mt-5 text-text-tertiary">
                {lastUpdatedLabel}
              </Text>
            )}
          </header>

          {/* Body + TOC */}
          <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-14">
            <div className="lg:order-1">
              {hasToc && <TocDisclosure items={toc} />}
              <div className="max-w-[70ch]">
                <PortableText
                  value={body}
                  components={longformComponents}
                  className="gap-5"
                />
              </div>
            </div>
            {hasToc && (
              <aside className="lg:order-2">
                <TocSidebar items={toc} />
              </aside>
            )}
          </div>
        </div>
      </Container>
    </article>
  )
}
