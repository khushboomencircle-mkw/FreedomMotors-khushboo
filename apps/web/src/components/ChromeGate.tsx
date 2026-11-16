'use client'

import {usePathname} from 'next/navigation'
import {resolveChrome} from '@/lib/chrome'
import type {ChromeRule} from '@/sanity/queries'

/**
 * Shows or hides the site header/footer for the current route based on each
 * page's per-page "Show Header" / "Show Footer" toggles. usePathname resolves
 * correctly during SSR, so there is no flash of hidden chrome.
 */
export default function ChromeGate({
  type,
  rules,
  children,
}: {
  type: 'header' | 'footer'
  rules: ChromeRule[] | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const {showHeader, showFooter} = resolveChrome(pathname, rules)
  const show = type === 'header' ? showHeader : showFooter
  if (!show) return null
  return <>{children}</>
}
