/**
 * Resets `container.backgroundOverlay` to 0 on every section that has an
 * overlay strength set but no background image enabled — the overlay was
 * silently darkening those sections with no way to see why (the field only
 * renders in Studio once `enableBackgroundImage` is on), and PageSection.tsx
 * now suppresses it visually in that case too, so this is pure data
 * cleanup, not a visual change on the live site.
 *
 * Deliberately does NOT touch sections where `enableBackgroundImage` is
 * true — there the overlay is currently real and visible over an actual
 * photo, most likely set on purpose for text legibility.
 *
 * Dry run by default. Add --write to actually apply.
 *
 * Run with:
 *   npx sanity exec studio/scripts/resetOrphanedOverlayStrength.ts --with-user-token
 *   npx sanity exec studio/scripts/resetOrphanedOverlayStrength.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')

interface Hit {
  docId: string
  docType: string
  sectionKey: string
  sectionType: string
  overlay: number
}

async function main() {
  const client = getCliClient({apiVersion: '2024-01-01'})

  // `enableBackgroundImage` filtered in JS, not GROQ — GROQ's `!` on an
  // undefined value returns null, not true, which would silently drop
  // every section that's never had the field touched at all.
  const docs = await client.fetch<
    {
      _id: string
      _type: string
      sectionHits: {
        _key: string
        _type: string
        overlay: number
        enableBackgroundImage: boolean | null
      }[]
    }[]
  >(`*[]{
    _id, _type,
    "sectionHits": sections[defined(container.backgroundOverlay) && container.backgroundOverlay != 0]{
      _key, _type,
      "overlay": container.backgroundOverlay,
      "enableBackgroundImage": container.enableBackgroundImage
    }
  }[count(sectionHits) > 0]`)

  const hits: Hit[] = docs.flatMap((doc) =>
    doc.sectionHits
      .filter((s) => !s.enableBackgroundImage)
      .map((s) => ({
        docId: doc._id,
        docType: doc._type,
        sectionKey: s._key,
        sectionType: s._type,
        overlay: s.overlay,
      })),
  )

  if (hits.length === 0) {
    console.log('No orphaned overlay values found. Nothing to do.')
    return
  }

  console.log(
    `Found ${hits.length} orphaned overlay value(s) to reset across ${new Set(hits.map((h) => h.docId)).size} document(s):\n`,
  )
  for (const h of hits) {
    console.log(
      `[${h.docType} ${h.docId}] sections[_key=="${h.sectionKey}"] (${h.sectionType}) — overlay ${h.overlay} -> 0`,
    )
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
      ...docHits.map((h) => ({
        [`sections[_key=="${h.sectionKey}"].container.backgroundOverlay`]: 0,
      })),
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
