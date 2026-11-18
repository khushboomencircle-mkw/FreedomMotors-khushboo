import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
/**
 * Writes studio/usability/fieldLock.json: every field of the schema, as it is now.
 *
 *   npm run schema:lock
 *
 * The lock is a promise: fields may be ADDED freely, but a locked field may never be removed or renamed (see
 * fieldIntegrity.ts). Run this only after ADDING fields, and read the diff: it should contain only new lines. If the
 * diff shows a removed line, a field was removed — stop and put it back.
 */
import fs from 'node:fs'
import path from 'node:path'
import {schemaTypes} from '../schemaTypes'
import {describeSchema, type TypeLike} from './fieldIntegrity'

export const LOCK_FILE = path.join(process.cwd(), 'studio', 'usability', 'fieldLock.json')

function main() {
  const lines = describeSchema(schemaTypes as unknown as TypeLike[])
  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify(lines, null, 0)
      .replace(/","/g, '",\n  "')
      .replace(/^\[/, '[\n  ')
      .replace(/\]$/, '\n]') + '\n',
  )
  console.log(`locked ${lines.length} fields in ${path.relative(process.cwd(), LOCK_FILE)}`)
}

if (process.argv[1]?.endsWith('generateFieldLock.ts')) main()
