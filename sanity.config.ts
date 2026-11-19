'use client'

// Sanity Studio, embedded in the Next app at /studio (see src/app/studio).
// 'use client' is required: the Studio config holds functions and runs in the browser.
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './studio/schemaTypes'
import { presentation } from './studio/presentation'
import { registeredPageTemplates } from './studio/pageTemplateLibrary'
import { buildStructure } from './studio/usability/structure'
import { OpenInPreviewAction } from './studio/usability/OpenInPreviewAction'
import { isPreviewable } from './studio/usability/previewPaths'
import { DuplicateLandingPageAction } from './studio/schemaTypes/actions/DuplicateLandingPageAction'
import { guardLandingPageAction } from './studio/schemaTypes/actions/LandingPageGuardActions'
import { withoutSingletonActions, withoutSingletonCreateOptions } from './studio/singletonPages'
import { sectionCopyPasteFieldActionsResolver } from './studio/schemaTypes/fieldActions/sectionCopyPasteFieldActions'
import {requireEnv} from './src/lib/env'
const dynamicPages = [
  { type: 'convertVehicle2Page', title: 'Convert Your Vehicle' },
  { type: 'driver', title: 'Driver Page' },
  // Adding a new page to the sidebar is now as simple as adding a new object line:
  // { type: 'aboutPage', title: 'About Us Page' },
]

// Which Sanity project/dataset this Studio manages comes from the website's own NEXT_PUBLIC_SANITY_*
// variables (one setting for both), so the site and the Studio can never point at different projects.
// There is no fallback: a missing variable stops the Studio with a clear message (see src/lib/env.ts).
const projectId = requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)
const studioTitle = 'Freedom motor'

export default defineConfig({
  name: 'default',
  title: studioTitle,
  // Must match the route folder src/app/studio/[[...tool]].
  basePath: '/studio',

  projectId,
  dataset,

  plugins: [
    structureTool({
      // The sidebar, grouped by task (see studio/usability/structure.ts).
      structure: (S, context) => buildStructure(S, context),
    }),
    presentation,
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Drop the auto-generated blank-document template for customPage and
    // replace it with the hardcoded templates (studio/pageTemplates.ts) plus the one library
    // template (studio/pageTemplateLibrary) — keeps every other document
    // type's default create-template untouched.
    templates: (prev) => [
      ...prev.filter((t) => t.schemaType !== 'customPage'),
      ...registeredPageTemplates,
    ],
  },

  document: {
    // Scoped to customPage only — every other document type keeps its built-in
    // actions unchanged. Duplicate is replaced; Delete and both Unpublish actions
    // (plain, and the Releases one) are wrapped so they stay disabled while any
    // Blog Post is attached to the landing page.
    actions: (prev, context) => {
      const actions =
        context.schemaType === 'customPage'
          ? prev.map((action) => {
            if (action.action === 'duplicate') return DuplicateLandingPageAction
            if (action.action === 'delete') return guardLandingPageAction(action, 'delete')
            if (action.action === 'unpublish' || action.action === 'unpublishVersion') {
              return guardLandingPageAction(action, 'unpublish')
            }
            return action
          })
          : prev
      // A fixed page (Home, Commercial …) can be neither duplicated nor deleted — there is only ever one.
      const allowed = withoutSingletonActions(actions, context.schemaType)
      // Every page-like document also gets "Preview on site" in its menu.
      return isPreviewable(context.schemaType) ? [...allowed, OpenInPreviewAction] : allowed
    },
    // The fixed pages are never offered in a "+ New document" menu. Landing Pages and everything else are.
    newDocumentOptions: (prev) => withoutSingletonCreateOptions(prev),
    // Always-visible Copy/Paste icon buttons on every page type's `sections`
    // field — wraps Sanity's own built-in copyField/pasteField field actions.
    unstable_fieldActions: sectionCopyPasteFieldActionsResolver,
  },
})
