import {presentationTool, defineLocations} from 'sanity/presentation'

/**
 * Presentation Tool — the "live preview" from the Page Builder proposal:
 * click-to-edit overlays on the real rendered page, inside Studio.
 *
 * Studio is embedded in the web app (/studio), so the preview is the same
 * site it runs on — it needs the `/api/draft-mode` routes and
 * `SANITY_API_READ_TOKEN` — see .env.local.example.
 */

// SANITY_STUDIO_PREVIEW_URL is forwarded to the browser by next.config.ts `env`.
// Unset → the site this Studio is served from (same origin, works locally and deployed).
const PREVIEW_URL =
  process.env.SANITY_STUDIO_PREVIEW_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
/** A singleton page: one fixed document → one fixed route, nothing to resolve. */
const singleton = (href: string) =>
  defineLocations({
    select: {title: 'pageTitle'},
    resolve: (doc) => ({
      locations: [{title: doc?.title || href, href}],
    }),
  })

export const presentation = presentationTool({
  name: 'preview',
  title: 'Preview',
  previewUrl: {
    initial: PREVIEW_URL,
    previewMode: {
      enable: '/api/draft-mode/enable',
      disable: '/api/draft-mode/disable',
      // The proposal's "share preview links with your team for review" — an
      // Editor can turn this on from the Presentation Tool's own Share menu
      // to hand out a link that works for anyone, logged into Studio or not.
      shareAccess: true,
    },
  },
  resolve: {
    locations: {
      homePage: singleton('/'),
      driver: singleton('/drivers'),
      ourStoryPage: singleton('/our-story'),
      commercialPage: singleton('/commercial'),
      vehiclesPage: singleton('/vehicles'),
      contactPage: singleton('/contact'),
      convertVehicle2Page: singleton('/convert-your-vehicle'),
      educationalPage: singleton('/educational'),
      // A shared template for every vehicle's detail page, not a page of its
      // own — there's no single URL for it. Points at the listing that links
      // to all of them; open a specific `vehicle` document (below) to preview
      // one car's actual detail page.
      vehicleDetailPage: singleton('/vehicles'),
      customPage: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: [{title: doc?.title || 'Untitled Page', href: `/${doc?.slug || ''}`}],
        }),
      }),
      // A post lives under its landing page: /<landing page slug>/<post slug>.
      blogPost: defineLocations({
        select: {title: 'title', slug: 'slug.current', landingSlug: 'landingPage.slug.current'},
        resolve: (doc) =>
          doc?.slug && doc?.landingSlug
            ? {
                locations: [
                  {title: doc.title || 'Untitled Post', href: `/${doc.landingSlug}/${doc.slug}`},
                ],
              }
            : {locations: []},
      }),
      vehicle: defineLocations({
        select: {year: 'year', make: 'make', model: 'model', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: [
            {
              title: [doc?.year, doc?.make, doc?.model].filter(Boolean).join(' ') || 'Vehicle',
              href: `/vehicles/${doc?.slug || ''}`,
            },
          ],
        }),
      }),
    },
  },
})
