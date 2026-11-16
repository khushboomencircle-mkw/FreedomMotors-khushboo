'use client'

import {useEffect, useState} from 'react'

interface CardEntry {
  key: string
  node: React.ReactNode
}

interface Props {
  items: CardEntry[]
  initialVisibleCount: number
  buttonLabel: string
  gridClassName: string
  gapPx: string
}

/**
 * Reveal-only pagination for Cards Grid Section — every card is already
 * loaded server-side, this just slices how many are shown. Needs
 * client-side state (how many are revealed), so only this leaf is a client
 * component, same reasoning as OneColumnSlider being split out on its own.
 */
export default function LoadMoreCardsGrid({
  items,
  initialVisibleCount,
  buttonLabel,
  gridClassName,
  gapPx,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount)

  // Resets back to the initial count whenever the underlying set of cards
  // changes (e.g. an active filter/search narrows which cards are
  // included) — `keysSignature` is a primitive, so this effect only fires
  // when the actual set of cards changes, not on every server re-render of
  // an unchanged list (which would otherwise recreate `items` every time).
  const keysSignature = items.map((item) => item.key).join('|')
  useEffect(() => {
    setVisibleCount(initialVisibleCount)
  }, [keysSignature, initialVisibleCount])

  const visible = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return (
    <div>
      <div className={`grid ${gridClassName}`} style={{gap: gapPx}}>
        {visible.map((item) => item.node)}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(items.length)}
            className="rounded-full bg-[var(--theme-button-bg,#dc2626)] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[var(--theme-button-text,#ffffff)] transition-opacity hover:opacity-90"
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  )
}
