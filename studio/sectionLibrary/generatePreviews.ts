/**
 * Writes the section pictures for the Add menu into public/studio-assets/sections/.
 *
 *   npm run sections:previews
 *
 * The files are committed, so this only needs running when a picture in previews.ts changes. A test fails if the
 * committed files and previews.ts ever disagree.
 */
import fs from 'node:fs'
import path from 'node:path'
import {PREVIEW_TYPES, sectionPreviewSvg} from './previews'

export const PREVIEW_DIR = path.join(process.cwd(), 'public', 'studio-assets', 'sections')

function main() {
  fs.mkdirSync(PREVIEW_DIR, {recursive: true})
  for (const type of PREVIEW_TYPES) {
    fs.writeFileSync(path.join(PREVIEW_DIR, `${type}.svg`), sectionPreviewSvg(type)!)
    console.log(`  wrote ${type}.svg`)
  }
}

if (process.argv[1]?.endsWith('generatePreviews.ts')) main()
