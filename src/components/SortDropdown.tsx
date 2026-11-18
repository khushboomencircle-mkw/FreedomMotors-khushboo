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
  const toggleRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    // Keyboard: move into the list as soon as it opens, on the selected option.
    const items = listRef.current?.querySelectorAll<HTMLElement>('[role=option]')
    items?.[Math.max(0, SORT_OPTIONS.indexOf(selected))]?.focus()
    return () => document.removeEventListener('pointerdown', handleClickOutside)
    // Only when it opens — `selected` just picks which option gets the first focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const choose = (option: string) => {
    setSelected(option)
    setOpen(false)
    toggleRef.current?.focus()
  }

  // Arrow keys / Home / End move between options, Enter or Space picks one, Escape closes.
  const onListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role=option]'))
    const at = items.indexOf(document.activeElement as HTMLElement)
    const go = (i: number) => {
      e.preventDefault()
      items[(i + items.length) % items.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault()
      setOpen(false)
      if (e.key === 'Escape') toggleRef.current?.focus()
    } else if ((e.key === 'Enter' || e.key === ' ') && at >= 0) {
      e.preventDefault()
      choose(SORT_OPTIONS[at])
    }
  }

  return (
    <div ref={containerRef} className="sort-dropdown relative w-full sm:w-auto">
      <button
        ref={toggleRef}
        type="button"
        className="sort-dropdown-toggle tap-target flex w-full items-center justify-between gap-2 rounded-[var(--theme-button-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] bg-transparent px-4 py-2 text-sm text-[var(--theme-text,#e5e7eb)] sm:w-auto"
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
          ref={listRef}
          role="listbox"
          aria-label="Sort vehicles by"
          onKeyDown={onListKeyDown}
          className="sort-dropdown-menu absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.1))] bg-[var(--theme-surface,#1b1b1b)] py-1 shadow-xl"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option === selected
            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => choose(option)}
                className={`sort-dropdown-item tap-target flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'selected bg-white/5 text-[var(--theme-text,#ffffff)]'
                    : 'text-[var(--theme-muted,#d1d5db)] hover:bg-white/5 hover:text-[var(--theme-text,#ffffff)]'
                }`}
              >
                {option}
                {isSelected && (
                  <Check
                    className="h-4 w-4 flex-shrink-0 text-[var(--theme-primary,#ef4444)]"
                    aria-hidden
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
