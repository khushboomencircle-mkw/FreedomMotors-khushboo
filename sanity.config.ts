'use client'

// Sanity Studio, embedded in the Next app at /studio (see src/app/studio).
// 'use client' is required: the Studio config holds functions and runs in the browser.
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './studio/schemaTypes'
import { presentation } from './studio/presentation'
import {
  TemplatePicker,
  legacyCreateMenuTemplates,
  registeredPageTemplates,
} from './studio/pageTemplateLibrary'
import { DuplicateLandingPageAction } from './studio/schemaTypes/actions/DuplicateLandingPageAction'
import { guardLandingPageAction } from './studio/schemaTypes/actions/LandingPageGuardActions'
import { sectionCopyPasteFieldActionsResolver } from './studio/schemaTypes/fieldActions/sectionCopyPasteFieldActions'
const dynamicPages = [
  { type: 'convertVehicle2Page', title: 'Convert Your Vehicle' },
  { type: 'driver', title: 'Driver Page' },
  // Adding a new page to the sidebar is now as simple as adding a new object line:
  // { type: 'aboutPage', title: 'About Us Page' },
]

// Which Sanity project/dataset this Studio manages, and what its header
// says — all overridable per environment (see .env.local.example) so
// pointing this Studio at a different project (e.g. the client's own, once
// created) is an env var change, not a code change. Falls back to this
// repo's current dev project/branding so nothing breaks before those are set.
// Project/dataset use the website's own NEXT_PUBLIC_SANITY_* variables (one setting
// for both), so the site and the Studio can never point at different projects.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'sp8bk444'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const studioTitle = process.env.SANITY_STUDIO_TITLE || 'Freedom motor'

export default defineConfig({
  name: 'default',
  title: studioTitle,
  // Must match the route folder src/app/studio/[[...tool]].
  basePath: '/studio',

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
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
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
                            legacyCreateMenuTemplates.map((t) => S.initialValueTemplateItem(t.id)),
                          ),
                      ),
                    // Pick an active template from the Page Templates library; the new page starts as a copy of it.
                    S.listItem()
                      .title('New Template Page')
                      .child(
                        S.component(TemplatePicker)
                          .id('new-page-from-template')
                          .title('New Template Page'),
                      ),
                    // Each post belongs to one Landing Page and lives at /<landing page>/<slug>.
                    S.listItem()
                      .title('Blog Posts')
                      .child(S.documentTypeList('blogPost').title('Blog Posts')),
                  ]),
              ),
            // The library of starting points offered when creating a Landing Page (see studio/pageTemplateLibrary).
            S.listItem()
              .title('Page Templates')
              .child(S.documentTypeList('pageTemplate').title('Page Templates')),
            // Vehicle inventory — a separate schema from the Pages list.
            S.listItem()
              .title('Vehicle Listing')
              .child(S.documentTypeList('vehicle').title('Vehicle Listing')),
            // Standalone articles at /educational/[slug] — separate from the
            // Educational Page's own hand-curated sections.
            S.listItem()
              .title('Educational Articles')
              .child(S.documentTypeList('educationalArticle').title('Educational Articles')),
            S.listItem()
              .title('Categories')
              .child(S.documentTypeList('category').title('Categories')),
            S.listItem()
              .title('Navigation')
              .child(
                S.document().schemaType('navigationSettings').documentId('navigationSettings'),
              ),
            S.listItem()
              .title('Redirects')
              .child(S.documentTypeList('redirect').title('Redirects')),
          ]),
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
    actions: (prev, context) =>
      context.schemaType === 'customPage'
        ? prev.map((action) => {
          if (action.action === 'duplicate') return DuplicateLandingPageAction
          if (action.action === 'delete') return guardLandingPageAction(action, 'delete')
          if (action.action === 'unpublish' || action.action === 'unpublishVersion') {
            return guardLandingPageAction(action, 'unpublish')
          }
          return action
        })
        : prev,
    // Always-visible Copy/Paste icon buttons on every page type's `sections`
    // field — wraps Sanity's own built-in copyField/pasteField field actions.
    unstable_fieldActions: sectionCopyPasteFieldActionsResolver,
  },
})
