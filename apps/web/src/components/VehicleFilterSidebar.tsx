'use client'

import {useState} from 'react'
import {ChevronDown} from 'lucide-react'

/**
 * The filter categories from the reference design. Each is a real accordion
 * row — clickable, with a rotating chevron — but `options` is empty for all
 * of them for now: there's no filter data wired up yet (see the note on
 * VehicleSearchBar). A row with no options renders disabled rather than
 * clickable, specifically so it can never open into blank space — there's
 * nothing to show, so it doesn't pretend otherwise. Once a category gets a
 * real options list, that row becomes interactive on its own, nothing else
 * has to change.
 */
const FILTER_CATEGORIES: {label: string; options: string[]}[] = [
  {label: 'Make', options: []},
  {label: 'Models', options: []},
  {label: 'Price', options: []},
  {label: 'Year', options: []},
  {label: 'Body Type', options: []},
  {label: 'Conversion Location', options: []},
  {label: 'Ramp Operation', options: []},
  {label: 'Ramp Width', options: []},
  {label: 'Driver Options', options: []},
  {label: 'Fuel Type', options: []},
  {label: 'Drivetrain', options: []},
]

function FilterAccordionRow({label, options}: {label: string; options: string[]}) {
  const [open, setOpen] = useState(false)
  const hasOptions = options.length > 0

  return (
    <div className="filter-accordion-item">
      <button
        type="button"
        disabled={!hasOptions}
        aria-expanded={hasOptions ? open : undefined}
        onClick={() => hasOptions && setOpen((o) => !o)}
        className={`filter-accordion-toggle flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide ${
          hasOptions
            ? 'cursor-pointer text-[var(--theme-text,#e5e7eb)]'
            : 'cursor-not-allowed text-[var(--theme-muted,#6b7280)] opacity-60'
        }`}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 text-[var(--theme-muted,#6b7280)] transition-transform ${
            open && hasOptions ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open && hasOptions && (
        <div className="filter-accordion-panel px-4 pb-3 text-sm text-[var(--theme-muted,#9ca3af)]">
          {options.map((option) => (
            <div key={option} className="py-1">
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VehicleFilterSidebar() {
  return (
    <aside className="w-full flex-shrink-0 lg:w-64">
      <div className="divide-y divide-[var(--theme-border,rgba(255,255,255,0.1))] rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.1))] bg-[var(--theme-surface,rgba(255,255,255,0.02))]">
        {FILTER_CATEGORIES.map((category) => (
          <FilterAccordionRow key={category.label} label={category.label} options={category.options} />
        ))}
      </div>
    </aside>
  )
}
