import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { presentation } from './presentation'
import { pageTemplates } from './pageTemplates'
import { DuplicateLandingPageAction } from './schemaTypes/actions/DuplicateLandingPageAction'
import { sectionCopyPasteFieldActionsResolver } from './schemaTypes/fieldActions/sectionCopyPasteFieldActions'
const dynamicPages = [
  { type: 'convertVehicle2Page', title: 'Convert Your Vehicle' },
  { type: 'driver', title: 'Driver Page' },
  // Adding a new page to the sidebar is now as simple as adding a new object line:
  // { type: 'aboutPage', title: 'About Us Page' },
]


// Which Sanity project/dataset this Studio manages, and what its header
// says — all overridable per environment (see apps/studio/.env.example) so
// pointing this Studio at a different project (e.g. the client's own, once
// created) is an env var change, not a code change. Falls back to this
// repo's current dev project/branding so nothing breaks before those are set.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'sp8bk444'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const studioTitle = process.env.SANITY_STUDIO_TITLE || 'Freedom motor'

export default defineConfig({
  name: 'default',
  title: studioTitle,

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site Settings')
              .child(
                S.document().schemaType('siteSettings').documentId('siteSettings'),
              ),
            S.listItem()
              .title('Pages')
              .child(
                S.list()
                  .title('Pages')
                  .items([
                    S.documentTypeListItem('homePage').title('Home Page'),
                    S.documentTypeListItem('vehiclesPage').title('Vehicle Page'),
                    S.documentTypeListItem('vehicleDetailPage').title('Vehicle Detail Page'),
                    S.documentTypeListItem('convertVehicle2Page').title('Convert Your Vehicle'),
                    S.documentTypeListItem('driver').title('Driver Page'),
                    S.documentTypeListItem('commercialPage').title('Commercial Page'),
                    S.documentTypeListItem('ourStoryPage').title('Our Story Page'),
                    S.documentTypeListItem('contactPage').title('Contact Page'),
                    S.documentTypeListItem('educationalPage').title('Educational Page'),
                    S.divider(),

                    // 🚀 NATIVE "+" ACCESSIBLE FOR USERS:
                    // This lets users dynamically add an infinite number of new pages
                    S.listItem()
                      .title('Landing Page(s)')
                      .child(
                        S.documentTypeList('customPage')
                          .title('Landing Page(s)')
                          .initialValueTemplates(
                            pageTemplates.map((t) => S.initialValueTemplateItem(t.id)),
                          )
                      ),
                  ]),
              ),
              // Vehicle inventory — a separate schema from the Pages list.
              S.listItem()
              .title('Vehicle Listing')
              .child(
                S.documentTypeList('vehicle').title('Vehicle Listing'),
              ),
              // Standalone articles at /educational/[slug] — separate from the
              // Educational Page's own hand-curated sections.
              S.listItem()
              .title('Educational Articles')
              .child(
                S.documentTypeList('educationalArticle').title('Educational Articles'),
              ),
              S.listItem()
              .title('Categories')
              .child(
                S.documentTypeList('category').title('Categories'),
              ),
              S.listItem()
              .title('Navigation')
              .child(
                S.document().schemaType('navigationSettings').documentId('navigationSettings'),
              ),
              S.listItem()
              .title('Redirects')
              .child(
                S.documentTypeList('redirect').title('Redirects'),
              ),
          ]),
    }),
    presentation,
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Drop the auto-generated blank-document template for customPage and
    // replace it with pageTemplates' own 4 — keeps every other document
    // type's default create-template untouched.
    templates: (prev) => [...prev.filter((t) => t.schemaType !== 'customPage'), ...pageTemplates],
  },

  document: {
    // Scoped to customPage only — every other document type keeps the
    // built-in Duplicate action unchanged.
    actions: (prev, context) =>
      context.schemaType === 'customPage'
        ? prev.map((action) => (action.action === 'duplicate' ? DuplicateLandingPageAction : action))
        : prev,
    // Always-visible Copy/Paste icon buttons on every page type's `sections`
    // field — wraps Sanity's own built-in copyField/pasteField field actions.
    unstable_fieldActions: sectionCopyPasteFieldActionsResolver,
  },
})
