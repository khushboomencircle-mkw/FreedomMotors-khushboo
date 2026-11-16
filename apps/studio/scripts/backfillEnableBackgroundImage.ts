/**
 * One-off backfill for containerConfig's new `enableBackgroundImage` toggle
 * (objects/containerConfig.ts). That field didn't exist before, so every
 * section that already has a real background image uploaded would read as
 * "toggle off" the moment it ships — hiding the image on the live site and
 * hiding the field itself in Studio, even though the data is still there.
 *
 * Sets `container.enableBackgroundImage = true` on every section whose
 * `container.backgroundImage.image.asset` is already populated. Does not
 * touch anything else — sections with no background image are untouched
 * and keep defaulting to off.
 *
 * Dry run by default. Add --write to actually apply.
 *
 * Run with:
 *   npx sanity exec scripts/backfillEnableBackgroundImage.ts --with-user-token
 *   npx sanity exec scripts/backfillEnableBackgroundImage.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')

interface Hit {
  docId: string
  docType: string
  sectionKey: string
  sectionType: string
}

async function main() {
  const client = getCliClient({apiVersion: '2024-01-01'})

  // GROQ's `!` on an undefined value returns null, not true, so "not yet
  // enabled" is filtered in JS below instead of in the query itself.
  const docs = await client.fetch<
    {
      _id: string
      _type: string
      sectionHits: {_key: string; _type: string; enableBackgroundImage: boolean | null}[]
    }[]
  >(`*[]{
    _id, _type,
    "sectionHits": sections[defined(container.backgroundImage.image.asset)]{_key, _type, "enableBackgroundImage": container.enableBackgroundImage}
  }[count(sectionHits) > 0]`)

  const hits: Hit[] = docs.flatMap((doc) =>
    doc.sectionHits
      .filter((s) => !s.enableBackgroundImage)
      .map((s) => ({docId: doc._id, docType: doc._type, sectionKey: s._key, sectionType: s._type})),
  )

  if (hits.length === 0) {
    console.log('No matching sections found. Nothing to do.')
    return
  }

  console.log(`Found ${hits.length} section(s) to backfill across ${new Set(hits.map((h) => h.docId)).size} document(s):\n`)
  for (const h of hits) {
    console.log(`[${h.docType} ${h.docId}] sections[_key=="${h.sectionKey}"] (${h.sectionType})`)
  }

  if (!WRITE) {
    console.log('\nDry run only — no changes made. Re-run with --write to apply.')
    return
  }

  const byDoc = new Map<string, Hit[]>()
  for (const h of hits) byDoc.set(h.docId, [...(byDoc.get(h.docId) ?? []), h])

  for (const [docId, docHits] of byDoc) {
    const setFields = Object.assign(
      {},
      ...docHits.map((h) => ({[`sections[_key=="${h.sectionKey}"].container.enableBackgroundImage`]: true})),
    )
    await client.patch(docId).set(setFields).commit()
    console.log(`Patched ${docId} (${docHits.length} section${docHits.length === 1 ? '' : 's'}).`)
  }

  console.log(`\nDone. Patched ${byDoc.size} document(s), ${hits.length} section(s) total.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
