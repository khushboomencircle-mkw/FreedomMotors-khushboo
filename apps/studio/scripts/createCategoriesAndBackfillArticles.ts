/**
 * 1. Creates every category from the canonical list that doesn't already
 *    exist (3 of 9 already existed from earlier manual work).
 * 2. Backfills each educationalArticle's `categories[]` reference array by
 *    matching its existing `eyebrow` string (comma-separated tags, e.g.
 *    "Accessible SUVs, Vehicle Maintenance") against category titles,
 *    case-insensitively — without this, every article has zero real
 *    category references even though the data to derive them already
 *    exists, so the category-driven filter would show no results for
 *    anything.
 *
 * Dotless ids throughout (`category-<slug>`) — see
 * migrateCardsToEducationalArticles.ts's file comment for why.
 *
 * Run with:
 *   npx sanity exec scripts/createCategoriesAndBackfillArticles.ts --with-user-token
 *   npx sanity exec scripts/createCategoriesAndBackfillArticles.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')
const client = getCliClient({apiVersion: '2024-01-01'})

const CANONICAL_CATEGORIES = [
  'Accessible SUVs',
  'Accessible Vans',
  'Drivers',
  'Features & Technology',
  'Freedom Motors News',
  'Lifestyle',
  'Passengers',
  'Uncategorized',
  'Vehicle Maintenance',
]

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const existing: {_id: string; title: string}[] = await client.fetch(`*[_type == "category"]{_id, title}`)
  const existingTitles = new Set(existing.map((c) => c.title.toLowerCase()))

  const toCreate = CANONICAL_CATEGORIES.filter((title) => !existingTitles.has(title.toLowerCase()))
  console.log(`Categories already existing: ${existing.length}`)
  console.log(`Categories to create: ${toCreate.length}`)
  for (const title of toCreate) console.log(`  ${title}`)
  console.log('')

  const articles: {_id: string; title: string; eyebrow?: string | null}[] = await client.fetch(
    `*[_type == "educationalArticle"]{_id, title, eyebrow}`,
  )
  console.log(`Articles to backfill categories for: ${articles.length}`)

  if (!WRITE) {
    console.log('')
    console.log('Dry run only — re-run with -- --write to apply.')
    return
  }

  const tx = client.transaction()
  for (const title of toCreate) {
    tx.createOrReplace({
      _id: `category-${slugify(title)}`,
      _type: 'category',
      title,
      slug: {_type: 'slug', current: slugify(title)},
    })
  }
  await tx.commit()

  // Re-fetch so newly-created categories are available for the backfill pass.
  const allCategories: {_id: string; title: string}[] = await client.fetch(`*[_type == "category"]{_id, title}`)
  const byTitleLower = new Map(allCategories.map((c) => [c.title.toLowerCase(), c._id]))

  const backfillTx = client.transaction()
  let backfilledCount = 0
  for (const article of articles) {
    if (!article.eyebrow) continue
    const tags = article.eyebrow.split(',').map((t) => t.trim()).filter(Boolean)
    const refs = tags
      .map((tag) => byTitleLower.get(tag.toLowerCase()))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({_type: 'reference' as const, _ref: id, _key: id}))
    if (refs.length === 0) continue
    backfillTx.patch(article._id, (patch) => patch.set({categories: refs}))
    backfilledCount++
    console.log(`  ${article.title}: ${tags.join(', ')}`)
  }
  await backfillTx.commit()

  console.log('')
  console.log(`Created ${toCreate.length} categor${toCreate.length === 1 ? 'y' : 'ies'}, backfilled categories on ${backfilledCount} article(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
