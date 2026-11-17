import {sanityFetch} from './client'
import type {ThemeConfig, ThemeMode} from '@/lib/theme'
import {LANDING_PAGE_VISIBLE, NAV_LINK_HAS_PAGE} from './navQueries'
import {BLOG_POST_VISIBLE} from './blogQueries'

const SECTION_PROJECTION = `{
  _key,
  _type,
  sequence,
  isActive,
  sectionType,
  htmlCode,
  trustindexWidgetId,
  sectionHeading,
  sectionDescription,
  cards[]{
    _key,
    title,
    stepBadge,
    "badge": badge,
    eyebrow,
    image{
      "url": image.asset->url,
      "alt": alt
    },
    description,
    mediaType,
    "videoFileUrl": videoFile.asset->url,
    videoUrl,
    videoThumbnail{"url": asset->url, alt},
    videoOrientation,
    videoSize,
    cardAction,
    actionVideoUrl,
    "actionVideoFileUrl": actionVideoFile.asset->url,
    actionLink{title, label, endpoint, openInNewTab},
    actionOpenInNewTab,
    showButton,
    buttonLabel,
    buttonLink{title, label, endpoint, openInNewTab}
  },
  items[]{
    _key,
    question,
    answer[]{..., markDefs[]{..., "href": href}},
    isExpandedByDefault,
    expandedByDefault
  },
  features[]{
    _key,
    title,
    description,
    mediaType,
    image{"url": image.asset->url, "alt": alt},
    "videoFileUrl": videoFile.asset->url,
    videoUrl,
    videoThumbnail{"url": asset->url, alt},
    accentColor,
    linkUrl,
    link{title, label, endpoint, openInNewTab},
    openInNewTab
  },
  image{"url": image.asset->url, "alt": alt},
  listItems[]{
    _key,
    title,
    description,
    linkUrl,
    openInNewTab,
    buttonLabel,
    buttonShowBg,
    buttonShowBorder
  },
  enableImageHover,
  highlightColor,
  accentBarColor,
  featureDisplayMode,
  showScrollArrows,
  showScrollLine,
  playButtonText,
  "playButtonImageUrl": playButtonImage.asset->url,
  showAccentBar,
  cardWidthPreset,
  showContentOverImage,
  mosaicView,
  cardContentPosition,
  cardContentPaddingTop,
  cardContentPaddingLeft,
  showNumbers,
  showDescriptionOnHover,
  showFooter,
  footerHeading,
  footerHeadingColor,
  footerDividerColor,
  cardHeight,
  cardOverlayStrength,
  descriptionOnHover,
  columns,
  gridGap,
  featureCardRadius,
  cardContentOrder,
  enableLoadMore,
  initialVisibleCount,
  loadMoreButtonLabel,
  oneColumnDisplayMode,
  sliderAutoPlay,
  sliderAutoPlayInterval,
  sliderShowArrows,
  sliderShowDots,
  heading,
  description,
  images[]{
    _key,
    "url": photo.image.asset->url,
    "alt": photo.alt,
    overlayTitle,
    overlayDescription,
    linkUrl,
    openInNewTab,
    image_padding,
    imagePadding{top, right, bottom, left},
    imageRadius,
    imageFit
  },
  photos[]{
    _key,
    "url": image.asset->url,
    alt
  },
  layout,
  lightbox,
  eyebrow,
  headerStyle,
  imageLayout,
  textPosition,
  overlayPosition,
  bannerHeight,
  overlayGradient,
  imageFocalPoint,
  imageSide,
  accordionSide,
  imageWidth,
  splitContentVerticalAlign,
  splitContentBgColor,
  splitImageHeight,
  accordionDividerColor,
  allowMultipleOpen,
  typography{
    headingSize, headingWeight, headingColor, headingAlignment,
    descriptionSize, descriptionWeight, descriptionColor, descriptionLineHeight, descriptionAlignment,
    headingMarginBottom, headingPaddingBottom,
    descriptionMarginTop, descriptionPaddingTop,
    headingShadow{enabled, offsetX, offsetY, blur, color, opacity},
    headingStroke{show, color, width, radius, sides, fullWidth},
    headingFontBorder{enabled, width, color},
    descriptionShadow{enabled, offsetX, offsetY, blur, color, opacity},
    descriptionStroke{show, color, width, radius, sides, fullWidth},
    descriptionFontBorder{enabled, width, color}
  },
  container{
    sectionTheme, bgColor, textColor, containerWidth,
    enableBackgroundImage,
    "backgroundImage": backgroundImage.image.asset->url,
    backgroundOverlay,
    backgroundOverlayColor,
    backgroundImagePosition
  },
  border{
    show, color, width, radius, sides, fullWidth
  },
  enableSectionTheme,
  sectionThemeMode,
  lightTheme,
  darkTheme,
  cardStyle{
    cardBgColor, cardPadding, cardAlignment, cardShadow,
    border{show, color, width, radius, sides, fullWidth},
    cardImageAspectRatio, cardImageFit, cardImageBorderRadius
  },
  showButton,
  buttonLabel,
  buttonLinkUrl,
  buttonLink{title, label, endpoint, openInNewTab},
  buttonStyle,
  buttonTextColor,
  buttonRadius,
  buttonOverlay,
  showSecondaryButton,
  secondaryButtonLabel,
  secondaryButtonLinkUrl,
  secondaryButtonLink{title, label, endpoint, openInNewTab},
  secondaryButtonStyle,
  secondaryButtonTextColor,
  secondaryButtonRadius,
  expandable,
  expandIcon,
  expandedByDefault
}`

/** Expands the `seo` object's `image` from a raw asset reference into a usable URL — same class of fix as Photo Gallery and the mega menu. */
const SEO_PROJECTION = `seo{
  title,
  description,
  canonicalUrl,
  "image": image.asset->url,
  noIndex
}`

export interface Seo {
  title?: string
  description?: string
  canonicalUrl?: string
  image?: string
  noIndex?: boolean
}

export interface ChromeRule {
  route: string
  showHeader?: boolean
  showFooter?: boolean
}

/**
 * Per-page header/footer visibility, keyed by the page's public route.
 * A route ending in "/*" (vehicle detail pages) matches by prefix.
 */
export async function getChromeVisibility() {
  return sanityFetch<ChromeRule[]>(
    `[
    ...*[_id == "homePage"]{"route": "/", showHeader, showFooter},
    ...*[_type == "commercialPage"]{"route": "/commercial", showHeader, showFooter},
    ...*[_type == "contactPage"]{"route": "/contact", showHeader, showFooter},
    ...*[_type == "ourStoryPage"]{"route": "/our-story", showHeader, showFooter},
    ...*[_type == "vehiclesPage"]{"route": "/vehicles", showHeader, showFooter},
    ...*[_type == "convertVehicle2Page"]{"route": "/convert-your-vehicle", showHeader, showFooter},
    ...*[_type == "driver"]{"route": "/drivers", showHeader, showFooter},
    ...*[_type == "customPage" && defined(slug.current)]{"route": "/" + slug.current, showHeader, showFooter},
    ...*[_type == "vehicleDetailPage"]{"route": "/vehicles/*", showHeader, showFooter}
  ]`,
    {},
    {fallback: []},
  )
}

/** Result shape of getSiteSettings() — mirrors the projection below, field for field. */
export interface SiteSettings {
  siteTitle?: string
  siteLogo?: string
  favicon?: string

  // Header
  stickyHeader?: boolean
  headerLogoRedirect?: string
  topBarEnabled?: boolean
  businessHours?: string
  phoneLabel?: string
  phoneNumber?: string
  headerCta?: {label?: string; endpoint?: string; openInNewTab?: boolean}

  // Footer contact
  footerLogo?: string
  footerContactTitle?: string
  addressLine1?: string
  addressLine2?: string
  addressMapUrl?: string
  footerPhoneLabel?: string
  footerPhone?: string
  footerTextLabel?: string
  footerTextNumber?: string
  footerEmail?: string

  // Social media links
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  pinterestUrl?: string

  copyright?: string

  // Other
  seo?: Seo | null

  // Theme
  enableSiteTheme?: boolean
  defaultMode?: ThemeMode
  lightTheme?: ThemeConfig | null
  darkTheme?: ThemeConfig | null
}

export async function getSiteSettings() {
  // Target the Studio singleton by _id — a stray second siteSettings document
  // exists in the dataset, and `*[_type == "siteSettings"][0]` would grab it.
  return sanityFetch<SiteSettings | null>(
    `*[_id == "siteSettings"][0]{
    siteTitle,
    "siteLogo": siteLogo.asset->url,
    "favicon": favicon.asset->url,

    // Header
    stickyHeader,
    headerLogoRedirect,
    topBarEnabled,
    businessHours,
    phoneLabel,
    phoneNumber,
    headerCta,

    // Footer contact
    "footerLogo": footerLogo.asset->url,
    footerContactTitle,
    addressLine1,
    addressLine2,
    addressMapUrl,
    footerPhoneLabel,
    footerPhone,
    footerTextLabel,
    footerTextNumber,
    footerEmail,

    // Social media links
    facebookUrl,
    instagramUrl,
    twitterUrl,
    linkedinUrl,
    youtubeUrl,
    tiktokUrl,
    pinterestUrl,

    copyright,

    // Other
    ${SEO_PROJECTION},

    // Theme
    enableSiteTheme,
    defaultMode,
    lightTheme,
    darkTheme
  }`,
    {},
    {fallback: null},
  )
}

export async function getDriverPage() {
  return sanityFetch(`*[_type == "driver"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

export async function getContactPage() {
  return sanityFetch(`*[_type == "contactPage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

export async function getOurStoryPage() {
  return sanityFetch(`*[_type == "ourStoryPage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

export async function getEducationalPage() {
  return sanityFetch(`*[_type == "educationalPage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

export async function getCommercialPage() {
  return sanityFetch(`*[_type == "commercialPage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

export async function getVehiclesPage() {
  return sanityFetch(`*[_type == "vehiclesPage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

/** The home page rendered at "/" (singleton). */
export async function getHomePage() {
  return sanityFetch(`*[_id == "homePage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

/** Shared sections template for every vehicle detail page. */
export async function getVehicleDetailPage() {
  return sanityFetch(`*[_type == "vehicleDetailPage"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

/** All vehicles, for the listing rendered on the /vehicles page. */
export async function getAllVehicles() {
  return sanityFetch(`*[_type == "vehicle" && isAvailable != false] | order(isFeatured desc, year desc){
    "slug": slug.current,
    year, make, model, trim, body, stock, vin,
    sellingPrice, internetPrice, msrp,
    miles, exteriorColor, conversionType, isFeatured,
    drivetrain, transmission, transmissionDescription, conversionWarranty, doors,
    "mainImage": mainImage.image.asset->url
  }`)
}

/** A single vehicle listing by slug (data only — detail-page sections come from vehicleDetailPage). */
export async function getVehicleBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "vehicle" && slug.current == $slug][0]{
      ...,
      "slug": slug.current,
      "mainImage": mainImage.image.asset->url,
      "gallery": gallery[]{"url": image.asset->url, alt},
      ${SEO_PROJECTION}
    }`,
    {slug},
  )
}

/** All vehicle slugs, for static generation. */
export async function getAllVehicleSlugs() {
  return sanityFetch<{slug: string}[]>(
    `*[_type == "vehicle" && defined(slug.current)]{"slug": slug.current}`,
  )
}

export async function getConvertVehicle2() {
  return sanityFetch(`*[_type == "convertVehicle2Page"][0]{
    pageTitle,
    pageDescription,
    ${SEO_PROJECTION},
    "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
  }`)
}

/** Result shape of getCustomPagesForNav() — one entry per nav-eligible custom page. */
export interface CustomNavPage {
  title?: string
  navLabel?: string
  slug?: string
  navOrder?: number
  openInNewTab?: boolean
}

export async function getCustomPagesForNav() {
  return sanityFetch<CustomNavPage[]>(
    `*[_type == "customPage" && showInNavigation == true && ${LANDING_PAGE_VISIBLE}] | order(navOrder asc){
    title,
    navLabel,
    "slug": slug.current,
    navOrder,
    openInNewTab
  }`,
    {},
    {fallback: []},
  )
}

const BUILT_IN_NAV_HREFS = [
  '/vehicles',
  '/drivers',
  '/convert-your-vehicle',
  '/commercial',
  '/our-story',
  '/contact',
  '/educational',
]

export interface MegaMenuFeature {
  _key: string
  title?: string
  description?: string
  image?: string
  imageAlt?: string
  accentColor?: string
  linkUrl?: string
  openInNewTab?: boolean
  mediaType?: string
  videoUrl?: string
}

export interface MegaMenuLogoItem {
  _key: string
  logo?: string
  label?: string
  href?: string
  openInNewTab?: boolean
}

export interface MegaMenuConfig {
  features?: MegaMenuFeature[]
  showFooter?: boolean
  footerHeading?: string
  footerDividerColor?: string
  logoStrip?: MegaMenuLogoItem[]
  showButton?: boolean
  buttonLabel?: string
  buttonLinkUrl?: string
  buttonStyle?: string
  buttonTextColor?: string
  buttonRadius?: number
  featureDisplayMode?: 'grid' | 'horizontalScroll'
  columns?: '2' | '3' | '4'
  showScrollArrows?: boolean
  showScrollLine?: boolean
  sliderAutoPlay?: boolean
  sliderAutoPlayInterval?: number
  sliderShowArrows?: boolean
  sliderShowDots?: boolean
  cardHeight?: string
  gridGap?: string
  cardWidthPreset?: string
  cardOverlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  featureCardRadius?: number
  showAccentBar?: boolean
  descriptionOnHover?: boolean
  highlightColor?: string
  cardContentPosition?: 'top' | 'bottom'
  cardContentPaddingLeft?: number
  cardContentPaddingTop?: number
  panelBgColor?: string
  panelPadding?: string
  panelMaxWidth?: string
  panelHorizontalPadding?: string
}

export interface NavLink {
  label: string
  href: string
  openInNewTab?: boolean
  showMegaMenu?: boolean
  megaMenuConfig?: MegaMenuConfig
}

export async function getNavLinks() {
  return sanityFetch<NavLink[] | null>(
    `*[_id == "navigationSettings"][0].links[
      showInHeader == true && ${NAV_LINK_HAS_PAGE}
    ]{
      label,
      href,
      openInNewTab,
      showMegaMenu,
      "megaMenuConfig": megaMenuConfig{
        features[]{
          _key,
          title,
          description,
          "image": image.image.asset->url,
          "imageAlt": image.alt,
          accentColor,
          linkUrl,
          openInNewTab,
          mediaType
        },
        showFooter,
        footerHeading,
        footerDividerColor,
        logoStrip[]{
          _key,
          "logo": logo.asset->url,
          label,
          href,
          openInNewTab
        },
        showButton,
        buttonLabel,
        buttonLinkUrl,
        buttonStyle,
        buttonTextColor,
        buttonRadius,
        featureDisplayMode,
        columns,
        showScrollArrows,
        showScrollLine,
        sliderAutoPlay,
        sliderAutoPlayInterval,
        sliderShowArrows,
        sliderShowDots,
        cardHeight,
        gridGap,
        cardWidthPreset,
        cardOverlayStrength,
        featureCardRadius,
        showAccentBar,
        descriptionOnHover,
        highlightColor,
        cardContentPosition,
        cardContentPaddingLeft,
        cardContentPaddingTop,
        panelBgColor,
        panelPadding,
        panelMaxWidth,
        panelHorizontalPadding
      }
    }`,
    {builtIn: BUILT_IN_NAV_HREFS},
    {fallback: null},
  )
}

export async function getFooterNavLinks() {
  // Same rule as the header (see navQueries.ts): built-in pages and external URLs always show;
  // anything else needs a visible Landing Page behind it. A link with no page never shows.
  return sanityFetch<{label: string; href: string; openInNewTab?: boolean}[] | null>(
    `*[_id == "navigationSettings"][0].links[
      showInFooter == true && ${NAV_LINK_HAS_PAGE}
    ]{label, href, openInNewTab}`,
    {builtIn: BUILT_IN_NAV_HREFS},
    {fallback: null},
  )
}

/** A single user-created page, fetched by its URL slug. */
export async function getCustomPageBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "customPage" && slug.current == $slug][0]{
      title,
      pageDescription,
      ${SEO_PROJECTION},
      "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
    }`,
    {slug},
  )
}

/** All custom page slugs, for static generation. */
export async function getAllCustomPageSlugs() {
  return sanityFetch(`*[_type == "customPage" && defined(slug.current)]{
    "slug": slug.current
  }`)
}

/** A single educational article, fetched by its URL slug (/educational/[slug]). */
export async function getEducationalArticleBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "educationalArticle" && slug.current == $slug && isActive != false][0]{
      title,
      eyebrow,
      categories[]->{title, "slug": slug.current},
      image{"url": image.asset->url, "alt": alt},
      description,
      ${SEO_PROJECTION}
    }`,
    {slug},
  )
}

/** All active educational article slugs, for static generation — independent of /[slug]'s own list. */
export async function getAllEducationalArticleSlugs() {
  return sanityFetch(`*[_type == "educationalArticle" && isActive != false && defined(slug.current)]{
    "slug": slug.current
  }`)
}

/**
 * A blog post by its full address (/<landing slug>/<post slug>). The landing page must match the
 * URL's first segment, so a wrong landing slug finds nothing. Visibility rule: see blogQueries.ts.
 */
export async function getBlogPostByPath(landingSlug: string, postSlug: string) {
  return sanityFetch(
    `*[_type == "blogPost" && slug.current == $postSlug && landingPage->slug.current == $landingSlug && ${BLOG_POST_VISIBLE}][0]{
      title,
      eyebrow,
      "landingTitle": landingPage->title,
      "landingSlug": landingPage->slug.current,
      categories[]->{title, "slug": slug.current}[defined(slug)],
      image{"url": image.asset->url, "alt": alt},
      description,
      ${SEO_PROJECTION},
      "sections": sections[] | order(sequence asc)${SECTION_PROJECTION}
    }`,
    {landingSlug, postSlug},
  )
}

/** Every visible blog post's address, for static generation (always the live rule at build time). */
export async function getAllBlogPostPaths() {
  return sanityFetch<{landing: string; post: string}[]>(
    `*[_type == "blogPost" && defined(slug.current) && ${BLOG_POST_VISIBLE}]{
      "landing": landingPage->slug.current,
      "post": slug.current
    }`,
  )
}

export async function getCategoryBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "category" && slug.current == $slug][0]{
      title,
      description,
      ${SEO_PROJECTION},
      "articles": *[
        _type == "educationalArticle" &&
        isActive != false &&
        references(^._id)
      ]{
        title,
        "slug": slug.current,
        eyebrow,
        image{"url": image.asset->url, "alt": alt}
      },
      "posts": *[
        _type == "blogPost" &&
        defined(slug.current) &&
        references(^._id) &&
        ${BLOG_POST_VISIBLE}
      ]{
        title,
        "slug": slug.current,
        "landingSlug": landingPage->slug.current,
        eyebrow,
        image{"url": image.asset->url, "alt": alt}
      }
    }`,
    {slug},
  )
}

/** All category slugs, for static generation. */
export async function getAllCategorySlugs() {
  return sanityFetch<{slug: string}[]>(
    `*[_type == "category" && defined(slug.current)]{"slug": slug.current}`,
  )
}

/** Every category, alphabetically — the Educational page's Filter & Search pill list (see EducationalArticleFilterGrid). */
export async function getAllCategoriesForFilter() {
  return sanityFetch<{slug: string; title: string}[]>(
    `*[_type == "category" && defined(slug.current)] | order(title asc){
      "slug": slug.current,
      title
    }`,
  )
}

/** Every active article with its resolved categories — the data set the Filter & Search grid filters client-side. */
export async function getAllEducationalArticlesForFilter() {
  return sanityFetch<
    {
      slug: string
      title?: string
      eyebrow?: string
      image?: {url?: string; alt?: string}
      categories?: {slug: string; title: string}[]
    }[]
  >(
    `*[_type == "educationalArticle" && isActive != false && defined(slug.current)]{
      "slug": slug.current,
      title,
      eyebrow,
      image{"url": image.asset->url, "alt": alt},
      categories[]->{title, "slug": slug.current}
    }`,
  )
}
