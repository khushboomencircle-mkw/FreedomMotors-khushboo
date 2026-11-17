import {
  getChromeVisibility,
  getCustomPagesForNav,
  getFooterNavLinks,
  getNavLinks,
  getSiteSettings,
} from '@/sanity/queries'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChromeGate from '@/components/ChromeGate'
import {resolveGlobalTheme, themeToCssVars, cssVarsToString} from '@/lib/theme'
import {SanityLive} from '@/sanity/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'
import PreviewBar from '@/components/PreviewBar'
import {Suspense} from 'react'

// Site chrome (header, footer, theme, preview tools) for every public page.
// Moved here from the root layout so /studio (outside this group) renders without it.

async function SiteShell({children}: {children: React.ReactNode}) {
  const [settings, customNavPages, navLinks, footerNavLinks, chromeRules, {isEnabled: isPreview}] =
    await Promise.all([
      getSiteSettings(),
      getCustomPagesForNav(),
      getNavLinks(),
      getFooterNavLinks(),
      getChromeVisibility(),
      draftMode(),
    ])

  // Global Site Theme → :root CSS variables.
  const globalVars = cssVarsToString(themeToCssVars(resolveGlobalTheme(settings)))
  const rootStyle = [
    globalVars,
    settings?.enableSiteTheme && settings?.defaultMode && `color-scheme:${settings.defaultMode}`,
    // Softened Text color for secondary footer text; only exists while Site Theme is on.
    settings?.enableSiteTheme &&
      '--theme-text-soft:color-mix(in srgb,var(--theme-text) 72%,transparent)',
  ]
    .filter(Boolean)
    .join(';')

  return (
    <>
      {isPreview && <PreviewBar />}
      {rootStyle && <style dangerouslySetInnerHTML={{__html: `:root{${rootStyle}}`}} />}
      <ChromeGate type="header" rules={chromeRules}>
        <Header settings={settings} customNavPages={customNavPages} navLinks={navLinks} />
      </ChromeGate>
      <main className="flex-1">{children}</main>
      <ChromeGate type="footer" rules={chromeRules}>
        <Footer settings={settings} navLinks={footerNavLinks} />
      </ChromeGate>
      {/* Click-to-edit overlays on stega-encoded text — only present (and only
          does anything) while draft mode is on; a no-op bundle otherwise.
          VisualEditing uses useSearchParams() internally, which requires its own
          Suspense boundary in Next.js to avoid suspending the parent SiteShell. */}
      {isPreview && (
        <Suspense>
          <VisualEditing />
        </Suspense>
      )}
    </>
  )
}

export default function SiteLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <Suspense fallback={<div className="flex-1" />}>
        <SiteShell>{children}</SiteShell>
      </Suspense>
      {/* Refreshes the open page the moment content is published in Sanity. */}
      <SanityLive action="refresh" />
    </>
  )
}
