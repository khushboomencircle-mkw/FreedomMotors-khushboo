import type {ChromeRule} from '@/sanity/queries'

/**
 * Resolve whether the header and footer should show for a given pathname.
 * Defaults to showing both when no page rule matches (so untracked routes,
 * the home page, etc. keep the chrome). A rule ending in "/*" matches by prefix.
 */
export function resolveChrome(
  pathname: string,
  rules: ChromeRule[] | null | undefined,
): {showHeader: boolean; showFooter: boolean} {
  if (!rules || rules.length === 0) return {showHeader: true, showFooter: true}

  const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/'

  let match = rules.find((r) => r.route === path)
  if (!match) {
    match = rules.find(
      (r) => r.route.endsWith('/*') && path.startsWith(r.route.slice(0, -2) + '/'),
    )
  }

  return {
    showHeader: match?.showHeader !== false,
    showFooter: match?.showFooter !== false,
  }
}
