'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {RefreshCw} from 'lucide-react'

interface ErrorProps {
  error: Error & {digest?: string}
  retry: () => void
}

export default function Error({error, retry}: ErrorProps) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [referenceId, setReferenceId] = useState('')

  useEffect(() => {
    setReferenceId(error.digest || crypto.randomUUID().slice(0, 8).toUpperCase())
    console.error('Application Error:', error)
  }, [error])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      retry()
    } finally {
      // Keep the loading state briefly for visual feedback.
      window.setTimeout(() => setIsRetrying(false), 1000)
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[#02090d] text-white flex items-center overflow-hidden">
      <div className="max-w-7xl w-full mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-lg">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-5">OOPS...</h1>

          <h2 className="text-2xl md:text-3xl font-bold mb-3">Something went wrong</h2>

          <p className="text-lg text-gray-200 leading-relaxed mb-8">
            We hit an unexpected snag loading this page. Try again, or head back home.
          </p>

          <div className="flex flex-wrap gap-5">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-[#e3290b] text-white font-bold px-8 py-4 rounded-full hover:bg-[#c92108] transition flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRetrying ? 'TRYING AGAIN...' : 'TRY AGAIN'}
              <RefreshCw size={22} className={isRetrying ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleGoHome}
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
  )
}
