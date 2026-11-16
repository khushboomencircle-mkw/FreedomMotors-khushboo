'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {NO_IMAGE_FALLBACK_URL} from './PageSection'

interface Category {
  slug: string
  title: string
}

interface Article {
  slug: string
  title?: string
  eyebrow?: string
  image?: {url?: string; alt?: string}
  categories?: Category[]
}

interface Props {
  categories: Category[]
}

/**
 * The Educational page's Filter & Search bar + article grid, shown at the
 * "Static Section" placeholder's position (see educational/page.tsx). Lists
 * every real Category document as a pill and filters the real
 * educationalArticle documents by that relationship — not by the old
 * Cards Grid Section cards or their free-text `eyebrow` string, which this
 * replaces. Pills come from `categories` (already alphabetical from the
 * query), so "All" is the only option not backed by a real document.
 */
export default function EducationalArticleFilterGrid({categories}: Props) {
  const [selected, setSelected] = useState<string | null>(null) // category slug, or null = "All"
  const [search, setSearch] = useState('')

  const pillClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wide transition-colors ${
      active
        ? 'border-red-600 bg-red-600 text-white'
        : 'border-[var(--theme-border,#374151)] text-[var(--theme-text,#ffffff)] hover:border-red-500 hover:text-red-500'
    }`

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thick">
          <div className="flex items-center gap-2 pb-2 w-max">
            <button type="button" onClick={() => setSelected(null)} className={pillClass(selected === null)}>
              All
            </button>
            {categories && categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setSelected(category.slug)}
                className={pillClass(selected === category.slug)}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="sm:w-64 shrink-0 rounded-full border border-[var(--theme-border,#374151)] bg-transparent px-4 py-2 text-sm text-[var(--theme-text,#ffffff)] placeholder-[var(--theme-muted,#9ca3af)] focus:outline-none focus:border-red-500"
        />
      </div>
    </div>
  )
}
