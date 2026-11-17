'use client'

import {useState} from 'react'

const ICONS: Record<string, {open: string; closed: string}> = {
  plusMinus: {open: '−', closed: '+'},
  chevron: {open: '▲', closed: '▼'},
  arrow: {open: '↑', closed: '↓'},
  caret: {open: '▾', closed: '▸'},
}

export default function ExpandableSection({
  icon = 'plusMinus',
  expandedByDefault = false,
  heading,
  children,
}: {
  icon?: string
  expandedByDefault?: boolean
  heading?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(expandedByDefault)
  const iconSet = ICONS[icon] || ICONS.plusMinus

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-xl font-semibold text-gray-900">{heading || 'Section'}</span>
        <span className="text-2xl text-gray-500 ml-4 shrink-0">
          {open ? iconSet.open : iconSet.closed}
        </span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}
