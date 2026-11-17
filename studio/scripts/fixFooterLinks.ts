/**
 * One-off fix: set showInFooter: false on nav links that should NOT appear in
 * the footer. Only PRIVACY POLICY, CAREERS, OUR STORY, EDUCATIONAL, CONTACT
 * should have showInFooter: true.
 *
 * Run with: npx sanity exec studio/scripts/fixFooterLinks.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

// Only these keys stay in the footer
const KEEP_IN_FOOTER = new Set([
  'nav-our-story',
  'nav-contact',
  'nav-careers',
  'nav-privacy-policy',
  'nav-educational',
])

async function patchDoc(client: ReturnType<typeof getCliClient>, docId: string) {
  const current = await client.fetch<{
    links?: {_key: string; href: string; label: string; showInFooter?: boolean}[]
  } | null>(`*[_id == $id][0]{ links }`, {id: docId})

  if (!current) {
    console.log(`[${docId}] Document not found — skipping.`)
    return
  }

  const toDisable = (current.links ?? []).filter(
    (l) => l.showInFooter && !KEEP_IN_FOOTER.has(l._key),
  )

  if (toDisable.length === 0) {
    console.log(`[${docId}] Already clean. Nothing to do.`)
    return
  }

  let tx = client.patch(docId)
  for (const l of toDisable) {
    tx = tx.set({[`links[_key=="${l._key}"].showInFooter`]: false})
  }
  await tx.commit()

  console.log(
    `[${docId}] Set showInFooter: false on ${toDisable.length} link(s):`,
    toDisable.map((l) => `${l.label} (${l.href})`).join(', '),
  )
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
