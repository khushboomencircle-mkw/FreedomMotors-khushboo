/**
 * The ONE map of `sizes` values for every image on the site. A component picks a preset by name
 * (`<SiteImage sizes="cardGrid3" …/>`); nobody writes a `sizes` string by hand.
 *
 * `sizes` tells the browser how wide the image will actually be shown, so it downloads the smallest
 * variant that is sharp enough. Each value is "the widest the image gets" on large screens (the site's
 * content never exceeds 1280px, so a pixel width caps it there) and a share of the viewport below that.
 * The widths the optimizer may generate are in lib/imageConfig.ts (deviceSizes + imageSizes).
 */
export const IMAGE_SIZES = {
  // ── Full-bleed ──
  /** Edge-to-edge hero banner and full-screen feature slides. */
  hero: '100vw',
  /** Section background image (covers the whole section). */
  background: '100vw',

  // ── Page content ──
  /** One wide picture in a standard section (max-w-6xl = 1152px). */
  content: '(min-width: 1280px) 1152px, 100vw',
  /** Pictures in a two-column standard section. */
  contentHalf: '(min-width: 1280px) 564px, (min-width: 640px) 50vw, 100vw',
  /** Picture beside text (up to 70% of the 1280px row). */
  split: '(min-width: 1280px) 896px, (min-width: 768px) 70vw, 100vw',
  /** Picture beside a list (about half the row). */
  half: '(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw',
  /** Blog / article lead picture (max-w-3xl). */
  article: '(min-width: 768px) 720px, 100vw',
  /** Article cards on a category page (1 / 2 / 3 columns). */
  articleCard: '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw',

  // ── Card grids, by number of columns on desktop (1 on phones) ──
  cardGrid1: '(min-width: 1280px) 1232px, 100vw',
  cardGrid2: '(min-width: 1280px) 616px, (min-width: 768px) 50vw, 100vw',
  cardGrid3: '(min-width: 1280px) 410px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  cardGrid4: '(min-width: 1280px) 310px, (min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw',
  /** Cards in the horizontal scroller (narrow 300px … wide 520px, or 90vw on phones). */
  scroller: '(min-width: 768px) 520px, 90vw',

  // ── Vehicles ──
  /** Photo on a /vehicles listing card (sm:w-64 = 256px). */
  vehicleListing: '(min-width: 640px) 256px, 100vw',
  /** Photo on a Vehicle Carousel card (1 / 2 / 3 / 4 across). */
  vehicleCard:
    '(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  /** Main photo on a vehicle's page. Shared by the phone and desktop frames, so one variant is cached and preloaded. */
  gallery: '(min-width: 1024px) 640px, 100vw',
  /** Small gallery thumbnails. */
  thumbnail: '96px',
  /** Enlarged photo in the lightbox (max-w-5xl = 1024px) — large, but capped (never the raw original). */
  lightbox: '(min-width: 1024px) 1024px, 100vw',

  // ── Chrome ──
  /** Header and footer logos (40–48px tall). */
  logo: '192px',
  /** Image on a mega-menu card. */
  megaMenu: '(min-width: 768px) 384px, 50vw',
  /** Tiny images: play-button picture, logo-strip logos. */
  icon: '96px',
} as const

export type ImageSizePreset = keyof typeof IMAGE_SIZES
