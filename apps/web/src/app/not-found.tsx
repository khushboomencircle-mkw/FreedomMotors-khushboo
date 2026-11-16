'use client'

import BackButton from '@/components/BackButton'
import Image from 'next/image'
import Link from 'next/link'


export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-140px)] bg-[#02090d] text-white flex items-center overflow-hidden">
      <div className="max-w-7xl w-full mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 lg:gap-16">

          {/* Left Content */}
          <div className="max-w-lg order-2 md:order-1">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-5">
              OOPS...
            </h1>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Looks like you're lost
            </h2>

            <p className="text-lg text-gray-200 leading-relaxed mb-8">
              Sorry, the page you are looking for doesn’t exist
              or has been moved.
            </p>

            <div className="flex flex-wrap gap-5">
              <BackButton />

              <Link
                href="/"
                className="bg-[#e3290b] text-white font-bold px-8 py-4 rounded-full hover:bg-[#c92108] transition flex items-center gap-4"
              >
                GO TO HOMEPAGE
                <span className="text-2xl">⟶</span>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center items-center order-1 md:order-2">
            <div className="absolute w-[80%] aspect-square rounded-full bg-blue-200/10 blur-[90px]" />

            <Image
              src="https://www.freedommotors.com/wp-content/themes/digitalsilk/assets/_dist/images/error.png"
              alt="Freedom Motors 404 error illustration"
              width={780}
              height={780}
              priority
              className="relative w-full max-w-[650px] h-auto object-contain"
            />
          </div>

        </div>
      </div>
    </main>
  )
}