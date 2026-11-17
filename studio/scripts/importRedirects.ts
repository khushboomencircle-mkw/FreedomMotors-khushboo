import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'
import {normalizePath, splitDestination} from '../schemaTypes/redirectType'

type CsvRow = {old: string; new: string; permanent: boolean}

/** Minimal CSV line splitter: handles double-quoted fields, including an embedded comma or an escaped `""`. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(field)
      field = ''
    } else {
      field += char
    }
  }
  fields.push(field)
  return fields.map((f) => f.trim())
}

function parseType(raw: string | undefined): boolean {
  const value = (raw || '').trim().toLowerCase()
  return value !== 'temporary' && value !== '307' && value !== 'false'
}

function parseCsv(contents: string): CsvRow[] {
  const lines = contents.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  const firstCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase())
  const hasHeader = ['old', 'source', 'from', 'old_address', 'oldpath'].includes(firstCols[0])
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map((line) => {
    const [old, newAddr, type] = parseCsvLine(line)
    return {old, new: newAddr, permanent: parseType(type)}
  })
}

function idForSource(source: string): string {
  const slug =
    source
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'root'
  return `redirect-${slug}`
}

async function run() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error(
      'Usage: npx sanity exec studio/scripts/importRedirects.ts --with-user-token -- /path/to/redirects.csv',
    )
    process.exit(1)
  }

  const rows = parseCsv(readFileSync(filePath, 'utf-8'))
  console.log(`Read ${rows.length} row(s) from ${filePath}.`)

  const client = getCliClient({apiVersion: '2024-01-01'})
  const existing = await client.fetch<{_id: string; source: string; destination: string}[]>(
    `*[_type == "redirect" && !(_id in path("drafts.**")) && defined(source) && defined(destination)]{_id, source, destination}`,
  )
  const graph = new Map<string, {key: string; full: string}>()
  for (const r of existing) graph.set(normalizePath(r.source), splitDestination(r.destination))

  const candidates = new Map<
    string,
    {source: string; destination: string; destinationFull: string; permanent: boolean}
  >()
  const skipped: {row: CsvRow; reason: string}[] = []

  for (const row of rows) {
    const source = normalizePath(row.old)
    const {key: destination, full: destinationFull} = splitDestination(row.new)

    if (!source || !destination) {
      skipped.push({row, reason: 'missing old or new address'})
      continue
    }
    if (source === destination) {
      skipped.push({row, reason: 'old and new address are the same'})
      continue
    }
    if (candidates.has(source)) {
      skipped.push({
        row,
        reason: `duplicate old address within this CSV (already using "${row.old}")`,
      })
      continue
    }

    candidates.set(source, {source, destination, destinationFull, permanent: row.permanent})
    graph.set(source, {key: destination, full: destinationFull})
  }

  const toWrite: {_id: string; source: string; destination: string; permanent: boolean}[] = []
  for (const [source, candidate] of candidates) {
    const seen = new Set<string>([source])
    let current = candidate.destination
    let finalDestination = candidate.destinationFull
    let looped = false

    while (graph.has(current)) {
      if (seen.has(current)) {
        looped = true
        break
      }
      seen.add(current)
      const next = graph.get(current)!
      current = next.key
      finalDestination = next.full
    }

    if (looped) {
      skipped.push({
        row: {old: candidate.source, new: candidate.destination, permanent: candidate.permanent},
        reason: 'part of a redirect loop (with another CSV row or an existing redirect)',
      })
      continue
    }

    if (current !== candidate.destination) {
      console.log(
        `Flattened chain: ${candidate.source} → ${candidate.destination} → … → ${current}`,
      )
    }

    toWrite.push({
      _id: idForSource(source),
      source: candidate.source,
      destination: finalDestination,
      permanent: candidate.permanent,
    })
  }

  if (toWrite.length > 0) {
    const tx = client.transaction()
    for (const doc of toWrite) {
      tx.createOrReplace({
        _id: doc._id,
        _type: 'redirect',
        source: doc.source,
        destination: doc.destination,
        permanent: doc.permanent,
        isActive: true,
      })
    }
    await tx.commit()
  }

  console.log('')
  console.log(`Created/updated ${toWrite.length} redirect(s).`)
  for (const doc of toWrite) {
    console.log(`  ${doc.source}  →  ${doc.destination}  (${doc.permanent ? '308' : '307'})`)
  }

  if (skipped.length > 0) {
    console.log('')
    console.log(`Skipped ${skipped.length} row(s):`)
    for (const s of skipped) {
      console.log(`  ${s.row.old} → ${s.row.new} — ${s.reason}`)
    }
  }

  console.log('')
  console.log(
    'Remember to run `npm run redirects:sync` in the project root (or wait for the next publish) to push these live.',
  )
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
