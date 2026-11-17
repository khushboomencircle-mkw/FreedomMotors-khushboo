import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import './globals.css'
import {getSiteSettings} from '@/sanity/queries'

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

// The site's header/footer/preview shell lives in (site)/layout.tsx, so /studio
// (outside that group) shares only this html/body/fonts/CSS.
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
