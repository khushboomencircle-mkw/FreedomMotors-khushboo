import {draftMode} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'

/** Exits preview — linked from the `<PreviewBar />` shown while draft mode is on. */
export async function GET(request: NextRequest) {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', request.nextUrl.origin))
}
