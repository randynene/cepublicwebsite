import { notFound } from 'next/navigation'

// MYGRATR-STATIC-1 Step 4 — pagination helper for hub pages.
//
// URL convention (locked in plan-mode):
//   - Page 1:   /<hub>          (no ?page=1 in canonical)
//   - Page 2+:  /<hub>?page=N
//
// Validation:
//   - Missing ?page   → page 1
//   - ?page=abc       → notFound() (400-equivalent surfaced as 404)
//   - ?page=-1, =0, =1.5 → notFound()
//   - ?page=99 on 7-page hub → notFound() (caller passes totalPages)

export const HUB_PAGE_SIZE = 12

export type PaginationState = {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  offset: number
  limit: number
  hasPrev: boolean
  hasNext: boolean
  prevUrl: string | null
  nextUrl: string | null
  canonicalUrl: string
}

// Parse + validate raw `page` search-param value. Triggers notFound() on
// invalid input. Returns 1 for missing input.
export function parsePageParam(raw: string | string[] | undefined): number {
  if (raw === undefined || raw === null) return 1
  // Arrays come from duplicate ?page=1&page=2 — invalid by contract.
  if (Array.isArray(raw)) notFound()
  const trimmed = raw.trim()
  if (trimmed === '') return 1
  // Strict positive integer pattern — rejects 1.5, -1, 0, abc, '0001'.
  if (!/^[1-9][0-9]*$/.test(trimmed)) notFound()
  const n = Number(trimmed)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) notFound()
  return n
}

// Builds the full PaginationState. Call notFound() if currentPage exceeds
// totalPages (e.g. ?page=99 on a 7-page hub).
//
// `totalItems` is the count AFTER featured-pinning exclusion (so the main
// list excludes the 0-2 hub-pinned items per Amendment "Hub featured
// pinning takes precedence").
export function buildPagination({
  currentPage,
  totalItems,
  basePath,
  pageSize = HUB_PAGE_SIZE,
}: {
  currentPage: number
  totalItems: number
  basePath: string
  pageSize?: number
}): PaginationState {
  const safeTotal = Math.max(0, totalItems)
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize))
  if (currentPage > totalPages) notFound()

  const offset = (currentPage - 1) * pageSize
  const limit = pageSize
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages
  const prevUrl = hasPrev
    ? currentPage - 1 === 1
      ? basePath
      : `${basePath}?page=${currentPage - 1}`
    : null
  const nextUrl = hasNext ? `${basePath}?page=${currentPage + 1}` : null
  const canonicalUrl = currentPage === 1 ? basePath : `${basePath}?page=${currentPage}`

  return {
    currentPage,
    pageSize,
    totalItems: safeTotal,
    totalPages,
    offset,
    limit,
    hasPrev,
    hasNext,
    prevUrl,
    nextUrl,
    canonicalUrl,
  }
}

// Number badges (truncated). Returns the list of pages to render with
// ellipsis markers as `null`. Always renders first + last; condenses
// middle when totalPages > 5.
//
// Example for currentPage=8, totalPages=12:
//   [1, null, 7, 8, 9, null, 12]
export function buildPageNumbers(
  currentPage: number,
  totalPages: number,
): Array<number | null> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const set = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])
  const sorted = Array.from(set)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)
  const result: Array<number | null> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null)
    result.push(sorted[i])
  }
  return result
}
