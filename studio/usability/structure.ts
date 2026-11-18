import type {StructureBuilder, StructureResolverContext} from 'sanity/structure'
import {AddIcon} from '@sanity/icons/Add'
import {BookIcon} from '@sanity/icons/Book'
import {CogIcon} from '@sanity/icons/Cog'
import {ComposeIcon} from '@sanity/icons/Compose'
import {CopyIcon} from '@sanity/icons/Copy'
import {CubeIcon} from '@sanity/icons/Cube'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {LinkIcon} from '@sanity/icons/Link'
import {MenuIcon} from '@sanity/icons/Menu'
import {TagIcon} from '@sanity/icons/Tag'
import {TemplatePicker, legacyCreateMenuTemplates} from '../pageTemplateLibrary'
import {singletonStructureItems} from '../singletonStructure'

/**
 * The Studio sidebar, organised by what an editor wants to DO rather than by how the content is stored:
 *
 *   Pages       the fixed pages, and Landing Pages (as many as you like)
 *   Create      start a new page from a template
 *   Content     blog posts, articles, categories
 *   Vehicles    the vehicle inventory
 *   Library     the page templates
 *   Settings    site settings, navigation, redirects
 *
 * Nothing here changes how content is stored — the same document types, in a clearer order, with plain names and an
 * icon on every entry. Switch it off with STUDIO_SIDEBAR_ENABLED (studio/usability/index.ts) to get the old list back.
 */

/** The sidebar's visible labels, in one place (also what the tests check). */
export const SIDEBAR = {
  pagesHeading: 'Pages',
  pages: 'Pages',
  landingPages: 'Landing Pages',
  createHeading: 'Create',
  newFromTemplate: 'New page from a template',
  contentHeading: 'Content',
  blogPosts: 'Blog Posts',
  articles: 'Educational Articles',
  categories: 'Categories',
  vehiclesHeading: 'Vehicles',
  vehicles: 'Vehicles',
  libraryHeading: 'Library',
  templates: 'Page Templates',
  settingsHeading: 'Settings',
  siteSettings: 'Site Settings',
  navigation: 'Navigation',
  redirects: 'Redirects',
} as const

/** Builds the grouped sidebar. */
export function buildStructure(S: StructureBuilder, context: StructureResolverContext) {
  return S.list()
    .title('Content')
    .items([
      // ── Pages ──
      S.divider().title(SIDEBAR.pagesHeading),
      // The fixed pages: each opens its one document directly (see studio/singletonPages.ts).
      S.listItem()
        .id('pages')
        .title(SIDEBAR.pages)
        .icon(DocumentsIcon)
        .child(S.list().title(SIDEBAR.pages).items(singletonStructureItems(S, context))),
      // Landing Pages: as many as you like, so this list keeps its "+".
      S.listItem()
        .id('landing-pages')
        .title(SIDEBAR.landingPages)
        .icon(ComposeIcon)
        .child(
          S.documentTypeList('customPage')
            .title(SIDEBAR.landingPages)
            .initialValueTemplates(
              legacyCreateMenuTemplates.map((t) => S.initialValueTemplateItem(t.id)),
            ),
        ),

      // ── Create ──
      S.divider().title(SIDEBAR.createHeading),
      // Pick an active template from the Page Templates library; the new page starts as a copy of it.
      S.listItem()
        .id('new-page-from-template')
        .title(SIDEBAR.newFromTemplate)
        .icon(AddIcon)
        .child(
          S.component(TemplatePicker).id('new-page-from-template').title(SIDEBAR.newFromTemplate),
        ),

      // ── Content ──
      S.divider().title(SIDEBAR.contentHeading),
      // Each post belongs to one Landing Page and lives at /<landing page>/<slug>.
      S.listItem()
        .id('blog-posts')
        .title(SIDEBAR.blogPosts)
        .icon(BookIcon)
        .child(S.documentTypeList('blogPost').title(SIDEBAR.blogPosts)),
      // Standalone articles at /educational/[slug] — separate from the Educational Page's own sections.
      S.listItem()
        .id('educational-articles')
        .title(SIDEBAR.articles)
        .icon(BookIcon)
        .child(S.documentTypeList('educationalArticle').title(SIDEBAR.articles)),
      S.listItem()
        .id('categories')
        .title(SIDEBAR.categories)
        .icon(TagIcon)
        .child(S.documentTypeList('category').title(SIDEBAR.categories)),

      // ── Vehicles ──
      S.divider().title(SIDEBAR.vehiclesHeading),
      // Vehicle inventory — a separate schema from the Pages list.
      S.listItem()
        .id('vehicles')
        .title(SIDEBAR.vehicles)
        .icon(CubeIcon)
        .child(S.documentTypeList('vehicle').title(SIDEBAR.vehicles)),

      // ── Library ──
      S.divider().title(SIDEBAR.libraryHeading),
      // The starting points offered when creating a Landing Page (see studio/pageTemplateLibrary).
      S.listItem()
        .id('page-templates')
        .title(SIDEBAR.templates)
        .icon(CopyIcon)
        .child(S.documentTypeList('pageTemplate').title(SIDEBAR.templates)),

      // ── Settings ──
      S.divider().title(SIDEBAR.settingsHeading),
      S.listItem()
        .id('site-settings')
        .title(SIDEBAR.siteSettings)
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .id('navigation')
        .title(SIDEBAR.navigation)
        .icon(MenuIcon)
        .child(S.document().schemaType('navigationSettings').documentId('navigationSettings')),
      S.listItem()
        .id('redirects')
        .title(SIDEBAR.redirects)
        .icon(LinkIcon)
        .child(S.documentTypeList('redirect').title(SIDEBAR.redirects)),
    ])
}
