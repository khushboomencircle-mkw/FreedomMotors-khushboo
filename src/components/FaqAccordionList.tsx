'use client'

import {useState} from 'react'
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react'

export interface FaqItem {
  _key: string
  question: string
  /** Rich text (block content array) or legacy plain string */
  answer: PortableTextBlock[] | string
  isExpandedByDefault?: boolean
  expandedByDefault?: boolean
}

function AnswerBody({answer, textColorClass}: {answer: FaqItem['answer']; textColorClass: string}) {
  if (!answer) return null

  if (typeof answer === 'string') {
    return (
      <p className={`text-base leading-relaxed whitespace-pre-line ${textColorClass}`}>{answer}</p>
    )
  }

  const components: PortableTextComponents = {
    block: {
      normal: ({children}) => (
        <p className={`text-base leading-relaxed mb-2 last:mb-0 ${textColorClass}`}>{children}</p>
      ),
      h3: ({children}) => (
        <h3 className={`text-lg font-semibold mb-2 ${textColorClass}`}>{children}</h3>
      ),
    },
    list: {
      bullet: ({children}) => (
        <ul className={`list-disc list-inside space-y-1 mb-2 ${textColorClass}`}>{children}</ul>
      ),
      number: ({children}) => (
        <ol className={`list-decimal list-inside space-y-1 mb-2 ${textColorClass}`}>{children}</ol>
      ),
    },
    listItem: {
      bullet: ({children}) => (
        <li className={`text-base leading-relaxed ${textColorClass}`}>{children}</li>
      ),
      number: ({children}) => (
        <li className={`text-base leading-relaxed ${textColorClass}`}>{children}</li>
      ),
    },
    marks: {
      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
      em: ({children}) => <em className="italic">{children}</em>,
      underline: ({children}) => <span className="underline">{children}</span>,
      link: ({value, children}) => (
        <a
          href={value?.href}
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
          className="underline opacity-80 hover:opacity-100"
        >
          {children}
        </a>
      ),
    },
  }

  return <PortableText value={answer} components={components} />
}

export default function FaqAccordionList({
  items,
  dividerColor = '#d1d5db',
  allowMultipleOpen = true,
  isWhiteTheme = true,
  iconType = 'plusMinus',
  variant = 'default',
  accentColor = '#dc2626',
}: {
  items: FaqItem[]
  dividerColor?: string
  allowMultipleOpen?: boolean
  isWhiteTheme?: boolean
  iconType?: string
  variant?: 'default' | 'numberedCards'
  accentColor?: string
}) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    items.forEach((item) => {
      if (item.isExpandedByDefault || item.expandedByDefault) {
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

  if (variant === 'numberedCards') {
    const cardBg = isWhiteTheme ? '#ffffff' : 'rgba(255,255,255,0.03)'
    // Honor the editor's Divider Line Color for the card outline; fall back to a
    // theme-appropriate default only when no color is provided.
    const cardBorder = dividerColor || (isWhiteTheme ? '#e5e7eb' : 'rgba(255,255,255,0.12)')

    return (
      <div className="w-full flex flex-col gap-4">
        {items.map((item, index) => {
          const isOpen = Boolean(openMap[item._key])
          const num = String(index + 1).padStart(2, '0')

          return (
            <div
              key={item._key}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'box-shadow 150ms ease',
                boxShadow: isOpen ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              <button
                type="button"
                onClick={() => toggleItem(item._key)}
                aria-expanded={isOpen}
                className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{color: accentColor, letterSpacing: '0.5px'}}
                  >
                    {num}
                  </span>
                  <span className={`text-base sm:text-lg font-bold truncate ${questionTextColor}`}>
                    {item.question}
                  </span>
                </span>
                <span
                  className="ml-4 shrink-0 inline-flex items-center justify-center"
                  style={{
                    color: accentColor,
                    width: '26px',
                    height: '26px',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 180ms ease',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                  aria-hidden
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 animate-fadeIn">
                  <AnswerBody answer={item.answer} textColorClass={answerTextColor} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 sm:mt-12">
      {items.map((item, index) => {
        const isOpen = Boolean(openMap[item._key])
        const isFirst = index === 0

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

            {isOpen && (
              <div className="pb-6 sm:pb-8 pt-1 text-left animate-fadeIn">
                <AnswerBody answer={item.answer} textColorClass={answerTextColor} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
