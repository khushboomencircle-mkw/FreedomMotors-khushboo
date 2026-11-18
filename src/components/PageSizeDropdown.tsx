'use client'

import {useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {ChevronDown, Check} from 'lucide-react'

/**
 * "Items per page" as a dropdown (Toggle → Menu → Items, one Selected Item
 * with a checkmark) — the same pattern as the Sort dropdown, but each option
 * is a real link (?perPage=N, resetting to page 1), so choosing one actually
 * changes how many vehicles show, not just which label is displayed.
 *
 * Colors follow the Site Theme (var(--theme-*, ...)); each falls back to
 * this component's own static dark design when no Site Theme is set.
 */
export default function PageSizeDropdown({
  perPage,
  options,
}: {
  perPage: number
  /**
   * Each option's href, pre-computed by the server parent and passed as
   * plain data — not a function. VehiclePagination is a Server Component;
   * this is a Client Component ('use client' below), and a function prop
   * can't cross that boundary (it isn't serializable), only plain data can.
   */
  options: {size: number; href: string}[]
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="page-size-dropdown relative inline-block text-left">
      <button
        type="button"
        className="page-size-dropdown-toggle tap-target flex items-center gap-2 rounded-[var(--theme-button-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] px-4 py-2 text-sm text-[var(--theme-text,#e5e7eb)]"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {perPage} per page
        <ChevronDown
          className={`h-4 w-4 text-[var(--theme-muted,#6b7280)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="page-size-dropdown-menu absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.1))] bg-[var(--theme-surface,#1b1b1b)] py-1 shadow-xl"
        >
          {options.map(({size, href}) => {
            const isSelected = size === perPage
            return (
              <li key={size} role="option" aria-selected={isSelected}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`page-size-dropdown-item tap-target flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'selected bg-white/5 text-[var(--theme-text,#ffffff)]'
                      : 'text-[var(--theme-muted,#d1d5db)] hover:bg-white/5 hover:text-[var(--theme-text,#ffffff)]'
                  }`}
                >
                  {size} per page
                  {isSelected && (
                    <Check
                      className="h-4 w-4 flex-shrink-0 text-[var(--theme-primary,#ef4444)]"
                      aria-hidden
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
