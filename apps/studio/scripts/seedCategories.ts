/**
 * One-time seed for the new Category document type (category.ts) — creates
 * the 3 categories that already exist as free-text in two articles'
 * `eyebrow` field ("Accessible SUVs, Accessible Vans, Vehicle Maintenance"
 * and "Accessible SUVs, Accessible Vans"), and attaches the real
 * `categories` references to those same two articles. `eyebrow` itself is
 * left untouched — this is additive, not a migration of that field.
 *
 * Slugs match the live WordPress site's own category URLs byte-for-byte
 * (confirmed directly against it, inconsistent hyphenation and all), so no
 * `redirect` document is needed for these three.
 *
 * Run with: npx sanity exec scripts/seedCategories.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

const CATEGORIES = [
  {_id: 'category-accessiblesuvs', title: 'Accessible SUVs', slug: 'accessiblesuvs'},
  {_id: 'category-accessible-vans', title: 'Accessible Vans', slug: 'accessible-vans'},
  {_id: 'category-vehicle-maintenance', title: 'Vehicle Maintenance', slug: 'vehicle-maintenance'},
] as const

const ARTICLE_CATEGORIES: Record<string, (typeof CATEGORIES)[number]['_id'][]> = {
  'educationalArticle-a-comprehensive-guide-to-maintaining-your-wheelchair-accessible-van': [
    'category-accessible-vans',
    'category-vehicle-maintenance',
  ],
  'educationalArticle-buying-your-first-wheelchair-accessible-vehicle-start-here': [
    'category-accessiblesuvs',
    'category-accessible-vans',
  ],
}

async function run() {
  const client = getCliClient({apiVersion: '2024-01-01'})

  for (const cat of CATEGORIES) {
    await client.createOrReplace({
      _id: cat._id,
      _type: 'category',
      title: cat.title,
      slug: {_type: 'slug', current: cat.slug},
    })
    console.log(`Category ready: ${cat.title} (/category/${cat.slug})`)
  }

  for (const [articleId, categoryIds] of Object.entries(ARTICLE_CATEGORIES)) {
    await client
      .patch(articleId)
      .set({
        categories: categoryIds.map((id) => ({
          _type: 'reference',
          _ref: id,
          _key: id,
        })),
      })
      .commit()
    console.log(`Attached ${categoryIds.length} categor(y/ies) to ${articleId}`)
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
