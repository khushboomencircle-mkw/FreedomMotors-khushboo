import Link from 'next/link'
import {ChevronLeft, ChevronRight} from 'lucide-react'
import PageSizeDropdown from './PageSizeDropdown'
import {PAGE_SIZE_OPTIONS} from '@/lib/pagination'

export {PAGE_SIZE_OPTIONS}

/** First/last pages, a window around the current page, and 'gap' markers between — standard pagination shape. */
function getPageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1)

  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result: (number | 'gap')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('gap')
    result.push(p)
    prev = p
  }
  return result
}

/**
 * Pagination + "items per page" — both fully functional: page links and the
 * per-page choice both navigate via real URLs (?page=N&perPage=M), so they
 * work without JavaScript and are shareable/bookmarkable, the same way the
 * active-filter chips do. Always rendered, even with a single page, rather
 * than disappearing — "Page 1 of 1" with inactive arrows is still useful
 * confirmation that paging is there and working.
 *
 * The active page and current per-page choice follow the Site Theme's button
 * color (var(--theme-button-bg, ...)); everything else follows the general
 * text theme. Both fall back to this component's own static design when no
 * Site Theme is set.
 */
export default function VehiclePagination({
  currentPage,
  totalPages,
  perPage,
  getPageHref,
  getPerPageHref,
}: {
  currentPage: number
  totalPages: number
  perPage: number
  getPageHref: (page: number) => string
  getPerPageHref: (perPage: number) => string
}) {
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  const pageLinkClass = (active: boolean) =>
    `tap-target flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
      active
        ? 'btn-border bg-[var(--theme-button-bg,#dc2626)] text-[var(--theme-button-text,#ffffff)]'
        : 'text-[var(--theme-text,#d1d5db)] hover:bg-white/5'
    }`

  const arrowClass = (enabled: boolean) =>
    `tap-target flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
      enabled
        ? 'text-[var(--theme-text,#d1d5db)] hover:bg-white/5'
        : 'pointer-events-none text-[var(--theme-muted,#4b5563)]'
    }`

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
        {currentPage > 1 ? (
          <Link
            href={getPageHref(currentPage - 1)}
            aria-label="Previous page"
            className={arrowClass(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span aria-hidden className={arrowClass(false)}>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}

        {pageNumbers.map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-[var(--theme-muted,#6b7280)]">
              ...
            </span>
          ) : (
            <Link
              key={p}
              href={getPageHref(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={pageLinkClass(p === currentPage)}
            >
              {p}
            </Link>
          ),
        )}

        {currentPage < totalPages ? (
          <Link
            href={getPageHref(currentPage + 1)}
            aria-label="Next page"
            className={arrowClass(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span aria-hidden className={arrowClass(false)}>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </nav>

      <PageSizeDropdown
        perPage={perPage}
        options={PAGE_SIZE_OPTIONS.map((size) => ({size, href: getPerPageHref(size)}))}
      />
    </div>
  )
}
