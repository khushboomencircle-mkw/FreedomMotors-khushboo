import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import './globals.css'
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

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Static fallback metadata — used verbatim if the Sanity fetch below fails,
// and as the base `title`/`description` either way. `icons` is added only
// when a favicon is actually uploaded in Site Settings: omitted (not set to
// `undefined`) so no empty `<link rel="icon">` renders when it isn't set.
// `favicon.ico` lives in `public/`, not `app/`, specifically so it stays a
// plain static file instead of Next's special `app/favicon.ico` convention,
// which would otherwise inject its own `<link>` alongside this one.
export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: 'Freedom Motors',
    description: 'Freedom Motors',
  }

  try {
    const settings = await getSiteSettings()
    return settings?.favicon ? {...base, icons: {icon: settings.favicon}} : base
  } catch (error) {
    console.error('[Sanity] Failed to fetch Site Settings favicon:', error)
    return base
  }
}

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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="flex-1" />}>
          <SiteShell>{children}</SiteShell>
        </Suspense>
        {/* Refreshes the open page the moment content is published in Sanity. */}
        <SanityLive action="refresh" />
      </body>
    </html>
  )
}
