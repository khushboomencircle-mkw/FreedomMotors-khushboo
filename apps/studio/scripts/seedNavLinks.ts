/**
 * One-time seed: prepend the six built-in nav links to BOTH the published
 * and draft navigationSettings documents, keeping any links already there.
 * Run with: npx sanity exec scripts/seedNavLinks.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

const BUILT_IN_LINKS = [
  /* HEADER NAV ITEMS */ 
  {_type: 'navigationLink', _key: 'nav-vehicles',    label: 'VEHICLES',              href: '/vehicles',              openInNewTab: false, showInHeader: true, showInFooter: false},
  {_type: 'navigationLink', _key: 'nav-drivers',     label: 'DRIVERS',               href: '/drivers',               openInNewTab: false, showInHeader: true, showInFooter: false},
  {_type: 'navigationLink', _key: 'nav-vehicle',     label: 'CONVERT YOUR VEHICLE',  href: '/convert-your-vehicle',  openInNewTab: false, showInHeader: true, showInFooter: false},
  {_type: 'navigationLink', _key: 'nav-commercial',  label: 'COMMERCIAL',            href: '/commercial',            openInNewTab: false, showInHeader: true, showInFooter: false},
  {_type: 'navigationLink', _key: 'nav-our-story',   label: 'OUR STORY',             href: '/our-story',             openInNewTab: false, showInHeader: true, showInFooter: true},
  {_type: 'navigationLink', _key: 'nav-contact',     label: 'CONTACT',               href: '/contact',               openInNewTab: false, showInHeader: true, showInFooter: true},
  {_type: 'navigationLink', _key: 'nav-careers',     label: 'CAREERS',               href: 'https://freedom-motors-usa.careerplug.com/',               openInNewTab: false, showInHeader: true, showInFooter: true},

  /* FOOTER NAV ITEMS */ 
  {_type: 'navigationLink', _key: 'nav-privacy-policy', label: 'Privacy Policy', href: '/privacy-policy', openInNewTab: false, showInHeader: false, showInFooter: true},
  {_type: 'navigationLink', _key: 'nav-educational', label: 'Educational', href: '/educational', openInNewTab: false, showInHeader: false, showInFooter: true},
]

async function patchDoc(client: ReturnType<typeof getCliClient>, docId: string) {
  const current = await client.fetch<{links?: {href: string; _key: string}[]} | null>(
    `*[_id == $id][0]{ links }`,
    {id: docId},
  )

  const existingHrefs = new Set((current?.links ?? []).map((l) => l.href))
  const toAdd = BUILT_IN_LINKS.filter((l) => !existingHrefs.has(l.href))

  if (toAdd.length === 0) {
    console.log(`[${docId}] All built-in nav links already present. Nothing to do.`)
    return
  }

  const merged = [...toAdd, ...(current?.links ?? [])]

  await client
    .patch(docId)
    .set({links: merged})
    .commit({autoGenerateArrayKeys: false})

  console.log(`[${docId}] Seeded ${toAdd.length} link(s):`, toAdd.map((l) => l.href).join(', '))
}

async function run() {
  const client = getCliClient({apiVersion: '2024-01-01'})
  await patchDoc(client, 'navigationSettings')
  await patchDoc(client, 'drafts.navigationSettings')
}

run().catch((err) => {
  console.error(err)
  // eslint-disable-next-line no-undef
  ;(globalThis as any).process?.exit(1)
})
