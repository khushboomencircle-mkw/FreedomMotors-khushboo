'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Search, RotateCcw, Share2, X} from 'lucide-react'
import SortDropdown from './SortDropdown'
import ShareResultsModal from './ShareResultsModal'

export interface ActiveFilter {
  /** The query param key, e.g. "make" — used to build the "remove" link. */
  key: string
  /** Display label for the filter category, e.g. "Make". */
  label: string
  value: string
}

/**
 * Toolbar above the vehicle grid — search input, result count, active filter
 * chips (from the URL's query params — see VehiclesPage), and the Reset /
 * Share / Sort controls from the reference design.
 *
 * Colors here follow the Site Theme (var(--theme-*, ...)) the same way
 * PageSection content does — if no Site Theme is set, the var falls back to
 * this component's own static dark design, unchanged from before.
 *
 * Most of this is still visual-only, by design: this page has no live
 * filtering yet (data comes straight from Sanity, with Postgres planned to
 * replace it later). What's real:
 *  - Reset clears the search box (the only filter state that exists so far).
 *  - Each active-filter chip's × is a real link back to this same page
 *    without that one query param.
 *  - Share opens a modal with the current (shareable) URL.
 *  - Sort opens a real dropdown and tracks a selection — it just doesn't
 *    reorder the list yet (see SortDropdown).
 */
export default function VehicleSearchBar({
  totalCount,
  rangeStart,
  rangeEnd,
  activeFilters = [],
}: {
  totalCount: number
  rangeStart: number
  rangeEnd: number
  activeFilters?: ActiveFilter[]
}) {
  const [search, setSearch] = useState('')
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--theme-border,rgba(255,255,255,0.1))] pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted,#6b7280)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              aria-label="Search vehicles"
              className="tap-target w-full rounded-[var(--theme-input-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] bg-[var(--theme-surface,rgba(255,255,255,0.05))] py-2 pl-9 pr-4 text-base pointer-fine:text-sm text-[var(--theme-text,#ffffff)] placeholder:text-[var(--theme-muted,#6b7280)] focus:border-[var(--theme-primary,#dc2626)] focus:outline-none"
            />
          </div>

          <span className="text-sm text-[var(--theme-muted,#9ca3af)]">
            Showing {rangeStart}–{rangeEnd} of {totalCount} result{totalCount === 1 ? '' : 's'}
          </span>

          {/* Clears the search box above — the only other filter state that exists right now. */}
          <button
            type="button"
            onClick={() => setSearch('')}
            className="tap-target inline-flex items-center gap-1.5 rounded-[var(--theme-button-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text,#ffffff)] transition-colors] ]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="tap-target inline-flex items-center gap-1.5 rounded-[var(--theme-button-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text,#ffffff)] transition-colors] ]"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Results
          </button>
        </div>

        <SortDropdown />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--theme-muted,#6b7280)]">
            Filtering by:
          </span>
          {activeFilters.map((f) => (
            <Link
              key={f.key}
              href={removeFilterHref(activeFilters, f.key)}
              className="tap-target inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-surface,rgba(255,255,255,0.1))] px-3 py-1 text-xs font-medium text-[var(--theme-text,#e5e7eb)] transition-opacity hover:opacity-80"
            >
              {f.label}: {f.value}
              <X className="h-3 w-3" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      <ShareResultsModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

/** The query string for "every active filter except this one", as a link back to this page. */
function removeFilterHref(filters: ActiveFilter[], keyToRemove: string): string {
  const params = new URLSearchParams()
  for (const f of filters) {
    if (f.key !== keyToRemove) params.set(f.key, f.value)
  }
  const qs = params.toString()
  return qs ? `/vehicles?${qs}` : '/vehicles'
}
