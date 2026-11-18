/**
 * One-off migration: copies the four original templates into Sanity as `pageTemplate` documents.
 *
 *   npm run templates:migrate                       # DRY RUN — prints what would be created, writes nothing
 *   npm run templates:migrate -- --write            # creates the missing documents in the configured dataset
 *   npm run templates:migrate -- --write --dataset=staging   # same, in another dataset (try a non-production one first)
 *
 * Needs SANITY_API_WRITE_TOKEN (an Editor token: sanity.io/manage → API → Tokens) in .env.local for --write; never commit it.
 * Safe to run more than once: documents that already exist are left exactly as they are.
 */
import {createClient} from '@sanity/client'
import {legacyTemplateDocuments} from './legacyTemplateDocuments'
import {TEMPLATE_API_VERSION} from './queries'

async function main() {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const datasetArg = args.find((a) => a.startsWith('--dataset='))?.split('=')[1]

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'sp8bk444'
  const dataset = datasetArg || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const docs = legacyTemplateDocuments()

  console.log(
    `Target: project ${projectId}, dataset "${dataset}" — ${write ? 'WRITE' : 'dry run (nothing will be written)'}`,
  )
  for (const doc of docs) {
    console.log(
      `  ${doc._id}  "${doc.title}"  category=${doc.category}  sections=${doc.sections.length}`,
    )
  }

  if (!write) {
    console.log('\nDry run only. Re-run with --write to create these documents.')
    return
  }

  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) {
    console.error(
      '\nSANITY_API_WRITE_TOKEN is not set. Add it to .env.local (or the environment) and try again.',
    )
    process.exitCode = 1
    return
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: TEMPLATE_API_VERSION,
    token,
    useCdn: false,
  })

  try {
    const existing = new Set<string>(
      await client.fetch(`*[_id in $ids]._id`, {ids: docs.map((d) => d._id)}),
    )
    const missing = docs.filter((d) => !existing.has(d._id))
    for (const doc of docs.filter((d) => existing.has(d._id))) {
      console.log(`  kept (already exists): ${doc._id}`)
    }
    if (missing.length === 0) {
      console.log('\nNothing to create.')
      return
    }
    // createIfNotExists, so a template created by someone else between the check above and now is not overwritten.
    const tx = client.transaction()
    for (const doc of missing) tx.createIfNotExists(doc)
    await tx.commit()
    for (const doc of missing) console.log(`  created: ${doc._id}`)
    console.log(`\nDone: ${missing.length} template(s) created.`)
  } catch (error) {
    console.error('\nMigration failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

main()
