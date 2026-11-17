'use client'

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-200 transition flex items-center gap-4"
    >
      GO BACK
      <span className="text-red-600 text-2xl">⟶</span>
    </button>
  )
}
