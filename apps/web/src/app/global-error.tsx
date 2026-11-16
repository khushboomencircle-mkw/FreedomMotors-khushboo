'use client'

import {useEffect, useState} from 'react'
import {Geist} from 'next/font/google'
import {RefreshCw} from 'lucide-react'

/**
 * global-error.tsx fully replaces the root layout (Next.js only renders it
 * when the ROOT layout itself throws), so it does NOT inherit anything from
 * layout.tsx — no Geist font class, no Header/Footer, no Sanity-driven
 * `--theme-*` vars (those come from getSiteSettings(), which is exactly the
 * kind of call that may be implicated in whatever broke the root layout).
 * Re-importing the font and hardcoding the brand colors here, rather than
 * depending on anything from the normal render path, is deliberate.
 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

interface GlobalErrorProps {
  error: Error & {digest?: string}
  retry: () => void
}

export default function GlobalError({error, retry}: GlobalErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [referenceId, setReferenceId] = useState('')

  useEffect(() => {
    setReferenceId(error.digest || crypto.randomUUID().slice(0, 8).toUpperCase())
    console.error('Global Application Error:', error)
  }, [error])

  const handleRetry = () => {
    setIsRetrying(true)
    retry()
    window.setTimeout(() => setIsRetrying(false), 1500)
  }

  return (
    <html lang="en" className={geistSans.variable}>
      <body
        className="min-h-screen text-white antialiased"
        // Inline, not a `bg-[#02090d]` utility class: globals.css's plain
        // `body { background: var(--background); ... }` rule is unlayered,
        // and Tailwind's own utilities live inside `@layer utilities` — an
        // unlayered rule always beats a layered one regardless of
        // specificity, so a bg-* class on <body> specifically would
        // silently lose to that rule (confirmed by actually loading this
        // page and checking its computed background before fixing this).
        // Inline styles aren't subject to that at all.
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
          backgroundColor: '#02090d',
        }}
      >
        <main className="min-h-screen flex items-center overflow-hidden">
          <div className="max-w-7xl w-full mx-auto px-6 lg:px-12 py-16">
            <div className="max-w-lg">
              <span className="text-xl font-bold">Freedom Motors</span>

              <h1 className="mt-6 text-6xl md:text-7xl font-bold tracking-tight mb-5">OOPS...</h1>

              <h2 className="text-2xl md:text-3xl font-bold mb-3">The app hit a snag</h2>

              <p className="text-lg text-gray-200 leading-relaxed mb-8">
                Something went wrong while loading the application. Reload to try again.
              </p>

              <div className="flex flex-wrap gap-5">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="bg-[#e3290b] text-white font-bold px-8 py-4 rounded-full hover:bg-[#c92108] transition flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRetrying ? 'RELOADING...' : 'RELOAD APPLICATION'}
                  <RefreshCw size={22} className={isRetrying ? 'animate-spin' : ''} />
                </button>

                {/* Hard navigation, not router.push — the root layout itself
                    crashed, so Next's client router may not be in a usable
                    state. */}
                <button
                  onClick={() => window.location.assign('/')}
                  className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-200 transition flex items-center gap-4"
                >
                  GO HOME
                  <span className="text-red-600 text-2xl">⟶</span>
                </button>
              </div>

              {referenceId && (
                <p className="mt-8 text-sm text-gray-400">
                  Error reference: <span className="font-mono text-gray-300">{referenceId}</span>
                </p>
              )}

              <p className="mt-3 text-sm text-gray-400">
                Still having trouble? Call us at{' '}
                <a href="tel:8665770794" className="underline hover:text-white">
                  (866) 577-0794
                </a>
              </p>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
