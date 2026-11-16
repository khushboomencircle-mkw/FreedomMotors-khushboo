'use client'

import {useEffect, useRef, useState} from 'react'
import {ChevronDown, Check} from 'lucide-react'

const SORT_OPTIONS = [
  'Recommended Vehicles',
  'Price: Low to High',
  'Price: High to Low',
  'Mileage: Low to High',
  'Year: Newest First',
]

/**
 * Custom sorting dropdown (Dropdown Toggle → Dropdown Menu → Dropdown Items,
 * one Selected Item marked with a checkmark). Choosing an option only updates
 * which one shows as selected here — there's no live sort applied to the
 * list yet, the same "visual now, wired up later" status as the filter
 * sidebar (see VehicleFilterSidebar) until the data layer supports it.
 *
 * Colors follow the Site Theme (var(--theme-*, ...)); each falls back to
 * this component's own static dark design when no Site Theme is set.
 */
export default function SortDropdown() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(SORT_OPTIONS[0])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="sort-dropdown relative w-full sm:w-auto">
      <button
        type="button"
        className="sort-dropdown-toggle flex w-full items-center justify-between gap-2 rounded-[var(--theme-button-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] bg-transparent px-4 py-2 text-sm text-[var(--theme-text,#e5e7eb)] sm:w-auto"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Sort by {selected}
        <ChevronDown
          className={`h-4 w-4 text-[var(--theme-muted,#6b7280)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="sort-dropdown-menu absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.1))] bg-[var(--theme-surface,#1b1b1b)] py-1 shadow-xl"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option === selected
            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setSelected(option)
                  setOpen(false)
                }}
                className={`sort-dropdown-item flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'selected bg-white/5 text-[var(--theme-text,#ffffff)]'
                    : 'text-[var(--theme-muted,#d1d5db)] hover:bg-white/5 hover:text-[var(--theme-text,#ffffff)]'
                }`}
              >
                {option}
                {isSelected && (
                  <Check className="h-4 w-4 flex-shrink-0 text-[var(--theme-primary,#ef4444)]" aria-hidden />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
