/**
 * Migration: ensure footer nav links exist in navigationSettings.
 *  1. Set showInFooter: true on the six built-in header links.
 *  2. Append footer-only links (Privacy Policy, Educational) if not present.
 *
 * Run with: npx sanity exec scripts/seedFooterLinks.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

// Links that are header+footer — only need showInFooter flipped
const HEADER_FOOTER_KEYS = new Set([
  'nav-vehicles',
  'nav-drivers',
  'nav-vehicle',
  'nav-commercial',
  'nav-our-story',
  'nav-contact',
  'nav-careers',
])

// Footer-only links to insert if missing
const FOOTER_ONLY_LINKS = [
  {
    _type: 'navigationLink',
    _key: 'nav-privacy-policy',
    label: 'PRIVACY POLICY',
    href: '/privacy-policy',
    openInNewTab: false,
    showInHeader: false,
    showInFooter: true,
  },
  {
    _type: 'navigationLink',
    _key: 'nav-educational',
    label: 'EDUCATIONAL',
    href: '/educational',
    openInNewTab: false,
    showInHeader: false,
    showInFooter: true,
  },
]

async function patchDoc(client: ReturnType<typeof getCliClient>, docId: string) {
  const current = await client.fetch<{
    links?: {_key: string; href: string; showInFooter?: boolean}[]
  } | null>(`*[_id == $id][0]{ links }`, {id: docId})

  if (!current) {
    console.log(`[${docId}] Document not found — skipping.`)
    return
  }

  const existingLinks = current.links ?? []
  const existingKeys = new Set(existingLinks.map((l) => l._key))

  // 1. Flip showInFooter on built-in header links that still have it false
  const keysToFlip = existingLinks.filter((l) => HEADER_FOOTER_KEYS.has(l._key) && !l.showInFooter)

  // 2. Footer-only links not yet in the document
  const linksToAdd = FOOTER_ONLY_LINKS.filter((l) => !existingKeys.has(l._key))

  if (keysToFlip.length === 0 && linksToAdd.length === 0) {
    console.log(`[${docId}] Already up to date. Nothing to do.`)
    return
  }

  let tx = client.patch(docId)

  // Flip showInFooter in-place
  for (const l of keysToFlip) {
    tx = tx.set({[`links[_key=="${l._key}"].showInFooter`]: true})
  }

  // Append missing footer-only links at the end
  if (linksToAdd.length > 0) {
    const merged = [...existingLinks, ...linksToAdd]
    tx = tx.set({links: merged})
  }

  await tx.commit({autoGenerateArrayKeys: false})

  if (keysToFlip.length > 0) {
    console.log(
      `[${docId}] Set showInFooter: true on ${keysToFlip.length} link(s):`,
      keysToFlip.map((l) => l.href).join(', '),
    )
  }
  if (linksToAdd.length > 0) {
    console.log(
      `[${docId}] Added ${linksToAdd.length} footer-only link(s):`,
      linksToAdd.map((l) => l.href).join(', '),
    )
  }
}

async function run() {
  const client = getCliClient({apiVersion: '2024-01-01'})
  await patchDoc(client, 'navigationSettings')
  await patchDoc(client, 'drafts.navigationSettings')
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  ;(globalThis as any).process?.exit(1)
})
