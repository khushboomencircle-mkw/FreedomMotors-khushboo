'use client'

import {useState} from 'react'

export interface FaqItem {
  _key: string
  question: string
  answer: string
  isExpandedByDefault?: boolean
}

export default function FaqAccordionList({
  items,
  dividerColor = '#d1d5db',
  allowMultipleOpen = true,
  isWhiteTheme = true,
  iconType = 'plusMinus',
}: {
  items: FaqItem[]
  dividerColor?: string
  allowMultipleOpen?: boolean
  isWhiteTheme?: boolean
  iconType?: string
}) {
  // Initialize open state from items marked as isExpandedByDefault
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    items.forEach((item) => {
      if (item.isExpandedByDefault) {
        initial[item._key] = true
      }
    })
    return initial
  })

  const toggleItem = (key: string) => {
    setOpenMap((prev) => {
      if (allowMultipleOpen) {
        return {...prev, [key]: !prev[key]}
      } else {
        const nextState = !prev[key]
        return nextState ? {[key]: true} : {}
      }
    })
  }

  if (!items || items.length === 0) return null

  const questionTextColor = isWhiteTheme ? 'text-gray-900' : 'text-white'
  const answerTextColor = isWhiteTheme ? 'text-gray-700' : 'text-gray-300'
  const iconColor = isWhiteTheme ? 'text-gray-600' : 'text-gray-400'

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 sm:mt-12">
      {items.map((item, index) => {
        const isOpen = Boolean(openMap[item._key])
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <div
            key={item._key}
            style={{
              borderTop: isFirst ? `1px solid ${dividerColor}` : undefined,
              borderBottom: `1px solid ${dividerColor}`,
            }}
            className="transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleItem(item._key)}
              aria-expanded={isOpen}
              className="w-full py-5 sm:py-6 flex items-center justify-between text-left group cursor-pointer"
            >
              <span
                className={`text-lg sm:text-xl font-bold pr-4 transition-colors ${questionTextColor} group-hover:text-[#e11900]`}
              >
                {item.question}
              </span>

              {/* Icon */}
              <span
                className={`ml-4 text-2xl font-light shrink-0 transition-transform duration-200 select-none ${iconColor}`}
              >
                {iconType === 'chevron'
                  ? isOpen
                    ? '▲'
                    : '▼'
                  : iconType === 'arrow'
                    ? isOpen
                      ? '↑'
                      : '↓'
                    : isOpen
                      ? '−'
                      : '+'}
              </span>
            </button>

            {/* Expandable Content Area */}
            {isOpen && (
              <div className="pb-6 sm:pb-8 pt-1 text-left animate-fadeIn">
                <p
                  className={`text-base sm:text-[17px] leading-relaxed whitespace-pre-line max-w-4xl ${answerTextColor}`}
                >
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
