/**
 * One-time migration: turns the Educational Page's existing ~10 Cards Grid /
 * Feature Grid cards into standalone `educationalArticle` documents at
 * /educational/<slug>, then:
 *
 *   1. Creates a `redirect` document (308 permanent) for every card/feature
 *      that already had a legacy root-level WordPress URL set as its
 *      actionLink/linkUrl (e.g. "/automatic-versus-manual-wheelchair-ramp-
 *      which-is-better-for-you/") — these are the actual "legacy article
 *      URLs" the redirect feature is for. Reuses the legacy URL's own path
 *      segment as the new article's slug, so the only thing that changes is
 *      the base path (/educational/<same-slug>).
 *   2. Cards/features with no legacy URL get a slug derived from their
 *      title instead — nothing to redirect from, since they never had a
 *      standalone URL in the first place.
 *   3. Patches each source card/feature in place so it now links to its new
 *      article (cardAction: 'openLink' + actionLink for cardItem, linkUrl
 *      for featureCardItem) — every migrated card becomes clickable,
 *      regardless of whether it had a legacy URL before.
 *
 * Document ids use a hyphen, not a dot (`educationalArticle-<slug>`, not
 * `educationalArticle.<slug>`) — confirmed empirically that this dataset's
 * public/anonymous read path (the one the live site actually uses) never
 * returns a document whose `_id` contains a ".", no matter how long you
 * wait, while the exact same document under a dotless id is instantly
 * visible. The slug *field* (and so every public URL) is unaffected either
 * way — only the internal `_id` format changes. The pre-existing bulk CSV
 * redirect importer (importRedirects.ts) has the same dotted-id issue; this
 * script just avoids repeating it.
 *
 * Idempotent: every document id is derived deterministically from the
 * card's own _key, so re-running this is a no-op update, not a duplicate.
 *
 * Run with:
 *   npx sanity exec scripts/migrateCardsToEducationalArticles.ts --with-user-token
 *   npx sanity exec scripts/migrateCardsToEducationalArticles.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')
const EDUCATIONAL_PAGE_ID = '36adacbd-bb61-41f6-80a3-058b1f22f112'

const client = getCliClient({apiVersion: '2024-01-01'})

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Reuses a legacy URL's own path segment as the new slug, e.g. "/foo-bar/" -> "foo-bar". */
function slugFromLegacyUrl(url: string): string {
  return url.replace(/^\/+|\/+$/g, '')
}

/**
 * True once a card/feature's link already points at its migrated article
 * (i.e. a previous run of this script already patched it) — distinguishes
 * that from a genuine, not-yet-migrated legacy WordPress URL, so re-running
 * this script is a true no-op instead of nesting /educational/ onto itself.
 */
function isAlreadyMigrated(url: string): boolean {
  return url.startsWith('/educational/')
}

/** The slug this card/feature should use, given its current link value (legacy URL, already-migrated link, or none). */
function resolveSlug(url: string | null | undefined, title: string): string {
  if (!url) return slugify(title)
  if (isAlreadyMigrated(url)) return url.replace(/^\/educational\//, '').replace(/\/+$/, '')
  return slugFromLegacyUrl(url)
}

interface CardRow {
  _key: string
  title: string
  eyebrow?: string | null
  legacyUrl?: string | null
  image?: unknown
}
interface FeatureRow {
  _key: string
  title: string
  legacyUrl?: string | null
  image?: unknown
}

async function main() {
  const data = await client.fetch<{
    cardsSectionKey: string | null
    cards: CardRow[]
    featureSectionKey: string | null
    features: FeatureRow[]
  }>(
    `*[_id == $id][0]{
      "cardsSectionKey": sections[_type=="cardsGridSection"][0]._key,
      "cards": sections[_type=="cardsGridSection"][0].cards[]{
        _key, title, eyebrow, "legacyUrl": actionLink.endpoint, image
      },
      "featureSectionKey": sections[_type=="featureGridSection"][0]._key,
      "features": sections[_type=="featureGridSection"][0].features[]{
        _key, title, "legacyUrl": linkUrl, image
      }
    }`,
    {id: EDUCATIONAL_PAGE_ID},
  )

  if (!data.cardsSectionKey && !data.featureSectionKey) {
    console.error(
      'No cardsGridSection/featureGridSection found on the Educational Page — nothing to migrate.',
    )
    process.exit(1)
  }

  const articles: {_id: string; slug: string; title: string; eyebrow?: string; image?: unknown}[] =
    []
  const redirects: {_id: string; source: string; destination: string}[] = []
  const cardPatches: {_key: string; slug: string}[] = []
  const featurePatches: {_key: string; slug: string}[] = []

  for (const card of data.cards ?? []) {
    const slug = resolveSlug(card.legacyUrl, card.title)
    articles.push({
      _id: `educationalArticle-${slug}`,
      slug,
      title: card.title,
      eyebrow: card.eyebrow ?? undefined,
      image: card.image,
    })
    if (card.legacyUrl && !isAlreadyMigrated(card.legacyUrl)) {
      redirects.push({
        _id: `redirect-${slugify(card.legacyUrl)}`,
        source: card.legacyUrl,
        destination: `/educational/${slug}`,
      })
    }
    cardPatches.push({_key: card._key, slug})
  }

  for (const feature of data.features ?? []) {
    const slug = resolveSlug(feature.legacyUrl, feature.title)
    articles.push({
      _id: `educationalArticle-${slug}`,
      slug,
      title: feature.title,
      image: feature.image,
    })
    if (feature.legacyUrl && !isAlreadyMigrated(feature.legacyUrl)) {
      redirects.push({
        _id: `redirect-${slugify(feature.legacyUrl)}`,
        source: feature.legacyUrl,
        destination: `/educational/${slug}`,
      })
    }
    featurePatches.push({_key: feature._key, slug})
  }

  // Collision check against existing customPage slugs — informational only:
  // /educational/[slug] and /[slug] are separate route namespaces (the
  // paths never overlap), so this can't actually shadow anything, but it's
  // worth surfacing before shipping in case two slugs happen to read the same.
  const customPageSlugs: {slug: string}[] = await client.fetch(
    `*[_type == "customPage" && defined(slug.current)]{"slug": slug.current}`,
  )
  const customPageSlugSet = new Set(customPageSlugs.map((s) => s.slug))
  const overlaps = articles.filter((a) => customPageSlugSet.has(a.slug))

  console.log(`Articles to create/update: ${articles.length}`)
  for (const a of articles) console.log(`  /educational/${a.slug}  —  ${a.title}`)
  console.log('')
  console.log(`Redirects to create/update: ${redirects.length}`)
  for (const r of redirects) console.log(`  ${r.source}  →  ${r.destination}`)
  console.log('')
  if (overlaps.length > 0) {
    console.log(
      `NOTE: ${overlaps.length} article slug(s) also exist as a customPage slug (no routing conflict — separate paths):`,
    )
    for (const o of overlaps) console.log(`  ${o.slug}`)
    console.log('')
  }

  if (!WRITE) {
    console.log('Dry run only — re-run with -- --write to apply.')
    return
  }

  // Clean up any earlier run's dotted-id documents (see the file-level
  // comment) before writing the dotless replacements, so this never leaves
  // both an invisible old copy and a working new one side by side.
  const staleDottedIds: string[] = await client.fetch(
    `*[(_type == "educationalArticle" || _type == "redirect") && _id match "*.*"]._id`,
  )
  if (staleDottedIds.length > 0) {
    console.log(
      `Removing ${staleDottedIds.length} stale dotted-id document(s) from an earlier run...`,
    )
    const cleanupTx = client.transaction()
    for (const id of staleDottedIds) cleanupTx.delete(id)
    await cleanupTx.commit()
  }

  const tx = client.transaction()

  for (const a of articles) {
    tx.createOrReplace({
      _id: a._id,
      _type: 'educationalArticle',
      isActive: true,
      title: a.title,
      slug: {_type: 'slug', current: a.slug},
      ...(a.eyebrow ? {eyebrow: a.eyebrow} : {}),
      ...(a.image ? {image: a.image} : {}),
    })
  }

  for (const r of redirects) {
    tx.createOrReplace({
      _id: r._id,
      _type: 'redirect',
      source: r.source,
      destination: r.destination,
      permanent: true,
      isActive: true,
      notes: 'Auto-created by migrateCardsToEducationalArticles.ts',
    })
  }

  for (const p of cardPatches) {
    tx.patch(EDUCATIONAL_PAGE_ID, (patch) =>
      patch.set({
        [`sections[_key=="${data.cardsSectionKey}"].cards[_key=="${p._key}"].cardAction`]:
          'openLink',
        [`sections[_key=="${data.cardsSectionKey}"].cards[_key=="${p._key}"].actionLink`]: {
          _type: 'linkEndpoint',
          endpoint: `/educational/${p.slug}`,
          openInNewTab: false,
        },
        [`sections[_key=="${data.cardsSectionKey}"].cards[_key=="${p._key}"].actionOpenInNewTab`]: false,
      }),
    )
  }

  for (const p of featurePatches) {
    tx.patch(EDUCATIONAL_PAGE_ID, (patch) =>
      patch.set({
        [`sections[_key=="${data.featureSectionKey}"].features[_key=="${p._key}"].linkUrl`]: `/educational/${p.slug}`,
      }),
    )
  }

  await tx.commit()
  console.log(
    `Done. Created/updated ${articles.length} article(s), ${redirects.length} redirect(s), and linked ${cardPatches.length + featurePatches.length} card(s)/feature(s).`,
  )
  console.log(
    'Remember to run `npm run redirects:sync` in apps/web (or wait for the next publish) to push the new redirects live.',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
