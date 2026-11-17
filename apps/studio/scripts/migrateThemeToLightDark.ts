/**
 * One-time migration for the "single siteTheme/sectionTheme field" ->
 * "separate lightTheme/darkTheme fields" schema change (siteSettingsType.ts
 * and fields/sectionTheme.ts). Each existing themeConfig value is copied
 * into whichever of lightTheme/darkTheme matches the mode it was already
 * tagged with (site: defaultMode; section: sectionThemeMode) — the content
 * an admin already set is kept exactly as-is, just filed under the correct
 * mode, with nothing invented for the other mode (left blank, so it falls
 * back to the new built-in default for that mode — see lib/theme.ts).
 *
 * Run with: npx sanity exec scripts/migrateThemeToLightDark.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

async function run() {
  const client = getCliClient({apiVersion: '2024-01-01'})

  // --- Site-level: siteSettings.siteTheme -> siteSettings.(light|dark)Theme ---
  const siteSettings = await client.fetch<{
    _id: string
    defaultMode?: 'light' | 'dark'
    siteTheme?: Record<string, unknown>
  } | null>(`*[_id == "siteSettings"][0]{_id, defaultMode, siteTheme}`)

  if (siteSettings?.siteTheme) {
    const targetField = siteSettings.defaultMode === 'light' ? 'lightTheme' : 'darkTheme'
    await client
      .patch(siteSettings._id)
      .set({[targetField]: siteSettings.siteTheme})
      .unset(['siteTheme'])
      .commit()
    console.log(
      `siteSettings: migrated siteTheme -> ${targetField} (defaultMode was "${siteSettings.defaultMode}")`,
    )
  } else {
    console.log('siteSettings: no siteTheme content to migrate.')
  }

  // --- Section-level: sections[]._sectionTheme -> sections[].(light|dark)Theme ---
  // Generic across every section type that has the shared sectionTheme fields,
  // found by scanning every document with a `sections` array (same pattern used
  // to seed/verify this content earlier) rather than hardcoding each page type.
  const docsWithSectionThemes = await client.fetch<
    {
      docId: string
      sections: {
        _key: string
        sectionThemeMode?: 'light' | 'dark'
        sectionTheme?: Record<string, unknown>
      }[]
    }[]
  >(
    `*[defined(sections)]{
      "docId": _id,
      "sections": sections[defined(sectionTheme)]{_key, sectionThemeMode, sectionTheme}
    }[count(sections) > 0]`,
  )

  for (const doc of docsWithSectionThemes) {
    const patch = client.patch(doc.docId)
    for (const section of doc.sections) {
      const targetField = section.sectionThemeMode === 'light' ? 'lightTheme' : 'darkTheme'
      patch.set({[`sections[_key=="${section._key}"].${targetField}`]: section.sectionTheme})
      patch.unset([`sections[_key=="${section._key}"].sectionTheme`])
      console.log(
        `${doc.docId}: migrated section ${section._key} sectionTheme -> ${targetField} (sectionThemeMode was "${section.sectionThemeMode}")`,
      )
    }
    await patch.commit()
  }

  if (docsWithSectionThemes.length === 0) {
    console.log('No sections with sectionTheme content to migrate.')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
