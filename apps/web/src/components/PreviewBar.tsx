/**
 * Fixed banner shown only while draft mode is on (Presentation Tool preview,
 * or a shared preview link). Plain server-rendered markup — no client JS of
 * its own — so it costs nothing on normal page views, where it never renders.
 */
export default function PreviewBar() {
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-black"
    >
      <span>Previewing unpublished changes</span>
      <a href="/api/draft-mode/disable" className="underline underline-offset-2 hover:opacity-80">
        Exit preview
      </a>
    </div>
  )
}
