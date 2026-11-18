import type {StructureBuilder, StructureResolverContext} from 'sanity/structure'
import {AddIcon} from '@sanity/icons/Add'
import {BookIcon} from '@sanity/icons/Book'
import {CogIcon} from '@sanity/icons/Cog'
import {ComposeIcon} from '@sanity/icons/Compose'
import {CopyIcon} from '@sanity/icons/Copy'
import {CubeIcon} from '@sanity/icons/Cube'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {LinkIcon} from '@sanity/icons/Link'
import {MenuIcon} from '@sanity/icons/Menu'
import {TagIcon} from '@sanity/icons/Tag'
import {TemplatePicker, legacyCreateMenuTemplates} from '../pageTemplateLibrary'
import {singletonStructureItems} from '../singletonStructure'
import StartHere from './StartHere'

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
  startHere: 'Start here',
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

/**
 * The views of the Vehicles list. `isAvailable` is a switch that defaults to on, so "not set" counts as available —
 * the same rule the website uses (a vehicle is hidden only when it is switched off).
 */
export const VEHICLE_VIEWS = [
  {id: 'vehicles-all', title: 'All vehicles', filter: '_type == "vehicle"', newest: false},
  {
    id: 'vehicles-available',
    title: 'Available',
    filter: '_type == "vehicle" && isAvailable != false',
    newest: false,
  },
  {
    id: 'vehicles-unavailable',
    title: 'Not available',
    filter: '_type == "vehicle" && isAvailable == false',
    newest: false,
  },
  {
    id: 'vehicles-featured',
    title: 'Featured',
    filter: '_type == "vehicle" && isFeatured == true',
    newest: false,
  },
  {id: 'vehicles-recent', title: 'Recently added', filter: '_type == "vehicle"', newest: true},
] as const

/** Landing Pages that have at least one blog post (the first step of "By landing page"). */
export const LANDING_PAGES_WITH_POSTS =
  '_type == "customPage" && count(*[_type == "blogPost" && landingPage._ref == ^._id]) > 0'
/** The posts of one landing page (`$id` is that landing page's id). */
export const POSTS_OF_LANDING_PAGE = '_type == "blogPost" && landingPage._ref == $id'

/** Builds the grouped sidebar. */
export function buildStructure(S: StructureBuilder, context: StructureResolverContext) {
  return S.list()
    .title('Content')
    .items([
      // A welcome page with the everyday jobs as buttons.
      S.listItem()
        .id('start-here')
        .title(SIDEBAR.startHere)
        .icon(HelpCircleIcon)
        .child(S.component(StartHere).id('start-here').title(SIDEBAR.startHere)),

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
        .child(
          S.list()
            .title(SIDEBAR.blogPosts)
            .items([
              S.listItem()
                .id('posts-all')
                .title('All posts')
                .icon(BookIcon)
                .child(S.documentTypeList('blogPost').title('All posts')),
              // A post belongs to one Landing Page; this shows the landing pages that have posts, then the posts.
              S.listItem()
                .id('posts-by-landing-page')
                .title('By landing page')
                .icon(ComposeIcon)
                .child(
                  S.documentList()
                    .id('landing-pages-with-posts')
                    .title('Choose a landing page')
                    .schemaType('customPage')
                    .filter(LANDING_PAGES_WITH_POSTS)
                    .child((landingPageId: string) =>
                      S.documentList()
                        .title('Posts')
                        .schemaType('blogPost')
                        .filter(POSTS_OF_LANDING_PAGE)
                        .params({id: landingPageId}),
                    ),
                ),
            ]),
        ),
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
        .child(
          S.list()
            .title(SIDEBAR.vehicles)
            .items(
              VEHICLE_VIEWS.map((view) =>
                S.listItem()
                  .id(view.id)
                  .title(view.title)
                  .icon(CubeIcon)
                  .child(() => {
                    const list = S.documentList()
                      .id(view.id)
                      .title(view.title)
                      .schemaType('vehicle')
                      .filter(view.filter)
                    // "Recently added" is newest first; the other views keep the list's usual order.
                    return view.newest
                      ? list.defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                      : list
                  }),
              ),
            ),
        ),

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
