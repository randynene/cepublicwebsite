import { Fragment } from 'react'

import { Link } from '@/components/ui/link'
import { Icon } from '@/components/ui/icon'
import { UI_STRINGS } from '@/lib/ui-strings'

export interface BreadcrumbItem {
  name: string
  href: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null
  return (
    <nav
      aria-label={UI_STRINGS['breadcrumb.ariaLabel']}
      className={className}
    >
      <ol className="flex flex-wrap items-center gap-2 text-body-sm text-text-default/80">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={`${item.href}-${index}`}>
              <li className="inline-flex items-center">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-text-default">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} tone="cc-blue">
                    {item.name}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="inline-flex items-center text-text-default/40">
                  <Icon name="chevron-right" size="sm" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
