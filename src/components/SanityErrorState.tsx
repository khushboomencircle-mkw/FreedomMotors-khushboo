'use client'

import {useRouter} from 'next/navigation'

export default function SanityErrorState() {
  const router = useRouter()

  return (
    <div className="min-h-[400px] flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Content</h2>

        <p className="text-gray-400 mb-6">
          We&apos;re having trouble connecting to our content service. Please check your internet
          connection and try again.
        </p>

        <button
          onClick={() => router.refresh()}
          className="bg-[#e3290b] text-white px-6 py-3
          rounded-full font-semibold hover:bg-[#c92108]
          transition"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
