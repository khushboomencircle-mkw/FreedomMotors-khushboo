import Link from 'next/link'
import Script from 'next/script'
import {stegaClean} from 'next-sanity'
import ExpandableSection from './ExpandableSection'
import FaqAccordionList, {FaqItem} from './FaqAccordionList'
import VideoLightbox from './VideoLightbox'
import ImageLightbox from './ImageLightbox'
import OneColumnSlider from './OneColumnSlider'
import LoadMoreCardsGrid from './LoadMoreCardsGrid'
import FeatureGridScroller from './FeatureGridScroller'
import FeatureHeroSlider from './FeatureHeroSlider'
import VehicleCarousel from './VehicleCarousel'
import {dataSanity, sectionPath, type SanityDoc} from '@/lib/sanityDoc'
import type {CarouselVehicle} from './VehicleCarouselCard'
import TestimonialCard, {visibleTestimonials, type Testimonial} from './TestimonialCard'
import TestimonialsSlider from './TestimonialsSlider'
import {sanitizeHtml} from '@/lib/sanitizeHtml'
import {resolveSectionTheme, themeToCssVars, type ThemeConfig} from '@/lib/theme'
import {toPlainText} from '@/lib/richText'
import RichText from './RichText'
import SiteImage, {NO_IMAGE_SRC} from './SiteImage'
import type {ImageSizePreset} from '@/lib/imageSizes'

/** Shown in place of a card/feature's image whenever none is uploaded — our own local copy of the "no image" placeholder (public/images). */
export const NO_IMAGE_FALLBACK_URL = NO_IMAGE_SRC

export interface SectionImage {
  _key: string
  url?: string
  alt?: string
  overlayTitle?: string
  overlayDescription?: string
  linkUrl?: string
  openInNewTab?: boolean
  /** @deprecated use imagePadding object */
  image_padding?: string
  imagePadding?: {top?: number; right?: number; bottom?: number; left?: number}
  imageRadius?: number | string
  imageFit?: 'cover' | 'contain'
}

export interface StepCard {
  _key: string
  stepBadge?: string
  badge?: string
  eyebrow?: string
  title?: string
  image?: {
    url?: string
    alt?: string
  }
  description?: string | unknown[]
  mediaType?: 'image' | 'video' | 'none'
  videoFileUrl?: string
  videoUrl?: string
  videoThumbnail?: {url?: string; alt?: string}
  videoOrientation?: 'landscape' | 'portrait'
  videoSize?: 'sm' | 'md' | 'lg' | 'xl'
  cardAction?: 'none' | 'videoLightbox' | 'openLink'
  actionVideoUrl?: string
  actionVideoFileUrl?: string
  actionLink?: {title?: string; label?: string; endpoint?: string; openInNewTab?: boolean}
  actionOpenInNewTab?: boolean
  showButton?: boolean
  buttonLabel?: string
  buttonLink?: {title?: string; label?: string; endpoint?: string; openInNewTab?: boolean}
}

interface BorderSides {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
}

interface BorderConfig {
  show?: boolean
  color?: string
  width?: string
  radius?: string
  sides?: BorderSides
  fullWidth?: boolean
}

interface TextShadowConfig {
  enabled?: boolean
  offsetX?: number
  offsetY?: number
  blur?: number
  color?: string
  opacity?: number
}

interface FontBorderConfig {
  enabled?: boolean
  width?: number
  color?: string
}

interface TypographyConfig {
  headingSize?: string
  headingWeight?: string
  headingColor?: string
  headingAlignment?: 'left' | 'center' | 'right'
  descriptionSize?: string
  descriptionWeight?: string
  descriptionColor?: string
  descriptionLineHeight?: string
  descriptionAlignment?: 'left' | 'center' | 'right'

  headingMarginBottom?: number
  headingPaddingBottom?: number
  descriptionMarginTop?: number
  descriptionPaddingTop?: number
  headingShadow?: TextShadowConfig
  headingStroke?: BorderConfig
  headingFontBorder?: FontBorderConfig
  descriptionShadow?: TextShadowConfig
  descriptionStroke?: BorderConfig
  descriptionFontBorder?: FontBorderConfig
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#000000').replace('#', '')
  if (h.length !== 6) return `rgba(0, 0, 0, ${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function resolveTextShadow(cfg?: TextShadowConfig): string | undefined {
  if (!cfg?.enabled) return undefined
  const x = cfg.offsetX ?? 0
  const y = cfg.offsetY ?? 2
  const blur = Math.max(0, cfg.blur ?? 4)
  // Opacity is on a 0–9 scale (0 = invisible, 9 = fully opaque).
  // Legacy saved values on a 0–100 scale (anything > 9) are converted automatically.
  const raw = cfg.opacity ?? 5
  const alpha = raw > 9 ? Math.max(0, Math.min(100, raw)) / 100 : Math.max(0, Math.min(9, raw)) / 9
  const color = hexToRgba(cfg.color || '#000000', alpha)
  return `${x}px ${y}px ${blur}px ${color}`
}

/**
 * Font Border — an outline traced around each letter's own glyph
 * (`-webkit-text-stroke`), independent of Heading/Description Border (the
 * box outline from getTextBorderStyles, drawn around the whole text block).
 * Both can be on at once.
 */
function resolveFontBorder(cfg?: FontBorderConfig): React.CSSProperties {
  if (!cfg?.enabled) return {}
  const w = Math.max(0, cfg.width ?? 1)
  return {
    WebkitTextStrokeWidth: `${w}px`,
    WebkitTextStrokeColor: cfg.color || '#000000',
  }
}

interface ContainerConfig {
  sectionTheme?: 'dark' | 'light' | 'custom'
  bgColor?: string
  textColor?: string
  containerWidth?: string
  enableBackgroundImage?: boolean
  backgroundImage?: string
  backgroundOverlay?: number
  backgroundOverlayColor?: string
  backgroundImagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

interface CardStyleConfig {
  cardBgColor?: string
  cardPadding?: string
  cardAlignment?: string
  cardShadow?: string
  border?: BorderConfig
  cardImageAspectRatio?: string
  cardImageFit?: string
  cardImageBorderRadius?: string
}

export interface LinkListItem {
  _key: string
  title?: string
  description?: string | unknown[]
  linkUrl?: string
  openInNewTab?: boolean
  buttonLabel?: string
  buttonShowBg?: boolean
  buttonShowBorder?: boolean
}

export interface FeatureCard {
  _key: string
  title?: string
  description?: string | unknown[]
  mediaType?: 'image' | 'video'
  image?: {url?: string; alt?: string}
  videoFileUrl?: string
  videoUrl?: string
  videoThumbnail?: {url?: string; alt?: string}
  accentColor?: string
  linkUrl?: string
  link?: {title?: string; label?: string; endpoint?: string; openInNewTab?: boolean}
  openInNewTab?: boolean
}

export interface Section {
  _key: string
  _type?: string
  sequence?: number
  isActive?: boolean
  htmlCode?: string
  trustindexWidgetId?: string
  enableSectionTheme?: boolean
  sectionThemeMode?: 'light' | 'dark'
  lightTheme?: ThemeConfig | null
  darkTheme?: ThemeConfig | null
  sectionType?: 'cardsGrid' | 'faqAccordion' | 'accordionSection' | 'standard'
  sectionHeading?: string
  sectionDescription?: string | unknown[]
  cards?: StepCard[]
  features?: FeatureCard[]
  showFooter?: boolean
  footerHeading?: string
  footerHeadingColor?: string
  footerDividerColor?: string
  cardHeight?: string
  cardOverlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  descriptionOnHover?: boolean
  image?: {url?: string; alt?: string}
  listItems?: LinkListItem[]
  highlightColor?: string
  accentBarColor?: string
  featureDisplayMode?: 'grid' | 'horizontalScroll'
  showScrollArrows?: boolean
  showScrollLine?: boolean
  playButtonText?: string
  playButtonImageUrl?: string
  showAccentBar?: boolean
  cardWidthPreset?: string
  showContentOverImage?: boolean
  mosaicView?: boolean
  cardContentPosition?: 'top' | 'bottom'
  cardContentPaddingTop?: number
  cardContentPaddingLeft?: number
  showNumbers?: boolean
  showDescriptionOnHover?: boolean
  faqItems?: FaqItem[]
  items?: FaqItem[]
  columns?: string
  gridGap?: string
  featureCardRadius?: number
  cardContentOrder?: 'titleImageDesc' | 'imageTitleDesc' | 'titleDescImage'
  enableLoadMore?: boolean
  initialVisibleCount?: number
  loadMoreButtonLabel?: string
  oneColumnDisplayMode?: 'stack' | 'slider'
  sliderAutoPlay?: boolean
  sliderAutoPlayInterval?: number
  sliderShowArrows?: boolean
  sliderShowDots?: boolean
  eyebrow?: string
  headerStyle?: string
  heading?: string
  description?: string | unknown[]
  images?: SectionImage[]
  imageLayout?: string
  textPosition?: string
  overlayPosition?: string
  bannerHeight?: string
  overlayGradient?: string
  imageFocalPoint?: string
  enableImageHover?: boolean
  imageSide?: 'left' | 'right'
  accordionSide?: 'left' | 'right'
  imageWidth?: string
  splitContentVerticalAlign?: 'top' | 'center' | 'bottom'
  splitContentBgColor?: string
  splitImageHeight?: string
  accordionDividerColor?: string
  allowMultipleOpen?: boolean
  typography?: TypographyConfig
  container?: ContainerConfig
  border?: BorderConfig
  cardStyle?: CardStyleConfig
  showButton?: boolean
  buttonLabel?: string
  buttonLinkUrl?: string
  buttonLink?: {title?: string; label?: string; endpoint?: string; openInNewTab?: boolean}
  buttonStyle?: string
  buttonTextColor?: string
  buttonRadius?: number
  buttonOverlay?: boolean
  showSecondaryButton?: boolean
  secondaryButtonLabel?: string
  secondaryButtonLinkUrl?: string
  secondaryButtonLink?: {title?: string; label?: string; endpoint?: string; openInNewTab?: boolean}
  secondaryButtonStyle?: string
  secondaryButtonTextColor?: string
  secondaryButtonRadius?: number
  expandable?: boolean
  expandIcon?: string
  expandedByDefault?: boolean
  photos?: {_key: string; url?: string; alt?: string}[]
  layout?: 'grid' | 'mosaic' | 'slider' | 'featured'
  lightbox?: boolean
  // Vehicle Carousel Section (vehicleCarouselSection) — `isPreview` is true only on draft reads.
  vehicles?: CarouselVehicle[] | null
  // Testimonials Section (testimonialsSection) — `isPreview` is true only on draft reads.
  testimonials?: Testimonial[]
  showRatings?: boolean
  isPreview?: boolean
}

const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  small: '4px',
  medium: '8px',
  large: '16px',
  full: '9999px',
}

/**
 * Fluid type: `min` px at a 320px-wide viewport, growing in a straight line to `max` px at 1024px,
 * then fixed. Desktop (1024px and up) therefore keeps the exact sizes the editor picked, while a
 * phone gets a heading that fits instead of the full desktop size.
 */
function fluidPx(min: number, max: number) {
  return `clamp(${min}px, calc(${min}px + ${max - min} * (100vw - 320px) / 704), ${max}px)`
}

const HEADING_SIZE_MAP: Record<string, string> = {
  sm: fluidPx(17, 18),
  md: fluidPx(20, 22),
  lg: fluidPx(22, 26),
  xl: fluidPx(26, 32),
  '2xl': fluidPx(30, 44),
}

// 'sm' stays a fixed 14px — it is the editor's deliberate "small print" choice.
const DESC_SIZE_MAP: Record<string, string> = {
  sm: '14px',
  md: '16px',
  lg: fluidPx(16, 18),
  xl: fluidPx(17, 20),
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  medium: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  glow: '0 0 15px rgba(255, 255, 255, 0.08)',
}

function getBorderStyles(border?: BorderConfig): React.CSSProperties {
  if (!border?.show) return {}

  // Always solid — Studio no longer offers dashed/dotted/double, so a legacy
  // document saved with one of those (from before that option was removed)
  // renders the same as everything else instead of keeping its old style.
  const style: React.CSSProperties['borderStyle'] = 'solid'
  const color = border.color || '#374151'
  const width = border.width || '1px'
  const radius = RADIUS_MAP[border.radius || 'none'] || '0px'
  const sides = border.sides || {top: true, right: true, bottom: true, left: true}

  return {
    borderTopWidth: sides.top ? width : '0',
    borderRightWidth: sides.right ? width : '0',
    borderBottomWidth: sides.bottom ? width : '0',
    borderLeftWidth: sides.left ? width : '0',
    borderStyle: style,
    borderColor: color,
    borderRadius: radius,
  }
}

/**
 * Border for the Heading/Description text blocks specifically (not Card or
 * Section Border, which keep using getBorderStyles directly). Drawn flush
 * against the text with no padding, a border looks cramped — left/right sit
 * right on the glyphs — so this adds a little breathing room there:
 *   - heading: top/left/right
 *   - description: bottom/left/right
 * The remaining edge (bottom for heading, top for description) is handled by
 * splitTextSpacing below, together with "Space Below Heading" / "Space Above
 * Description" — see there for why. No-op when the border isn't shown.
 */
function getTextBorderStyles(
  cfg: BorderConfig | undefined,
  edge: 'heading' | 'description',
): React.CSSProperties {
  const borderStyles = getBorderStyles(cfg)
  if (!cfg?.show) return borderStyles
  const breathingRoom: React.CSSProperties =
    edge === 'heading'
      ? {paddingTop: '8px', paddingLeft: '10px', paddingRight: '10px'}
      : {paddingBottom: '8px', paddingLeft: '10px', paddingRight: '10px'}
  return {...breathingRoom, ...borderStyles}
}

/**
 * "Space Below Heading" / "Space Above Description" is the gap between the
 * text and whatever comes right after it. Without a border, that's a plain
 * margin past the text — unchanged from before this existed.
 *
 * With a border drawn on that same edge (bottom for a heading, top for a
 * description), "whatever comes right after" is the border line itself. A
 * margin there would leave the border sitting flush against the text and
 * stack the configured space as an extra, disconnected-looking gap *after*
 * an already-drawn line — the border doesn't "move" when you increase the
 * space, only the gap past it grows. So in that case the space becomes
 * padding instead: it moves the border itself away from the text, and
 * whatever follows sits right after the border with no separate gap.
 */
function splitTextSpacing(
  space: number,
  border: BorderConfig | undefined,
  edge: 'top' | 'bottom',
): {margin: number; padding: number} {
  const sides = border?.sides || {top: true, right: true, bottom: true, left: true}
  const borderOnEdge = Boolean(border?.show) && sides[edge]
  return borderOnEdge ? {margin: 0, padding: space} : {margin: space, padding: 0}
}

const LEGACY_BG: Record<string, string> = {
  red: '#e11900',
  blue: '#2563eb',
  white: '#ffffff',
  dark: '#111827',
  outlineWhite: 'transparent',
  outlineDark: 'transparent',
  solidGray: '#4b5563',
}

const LEGACY_FG: Record<string, string> = {
  red: '#ffffff',
  blue: '#ffffff',
  white: '#000000',
  dark: '#ffffff',
  outlineWhite: '#ffffff',
  outlineDark: '#111827',
  solidGray: '#ffffff',
}

function resolveButtonColors(
  styleVal?: string,
  textVal?: string,
  fallbackBg: string = '#e11900',
  fallbackFg: string = '#ffffff',
) {
  const style = styleVal || ''
  const bg = /^#|^transparent$/i.test(style) ? style : LEGACY_BG[style] || fallbackBg
  const fg = textVal || LEGACY_FG[style] || fallbackFg
  const isOutline = bg.toLowerCase() === 'transparent'
  return {bg, fg, isOutline}
}

/**
 * Button border, in the theme's usual priority: Section Theme > Site Theme > the button's own
 * look. The theme's Button Border / Button Border Width vars win when set (a section theme
 * overrides the site one through the CSS cascade); otherwise outline buttons keep their 2px
 * border in the text color and filled buttons stay borderless.
 */
function buttonBorder(isOutline: boolean, fg: string) {
  return `var(--theme-button-border-width, ${isOutline ? '2px' : '0px'}) solid var(--theme-button-border, ${isOutline ? fg : 'transparent'})`
}

function PrimaryButton({section}: {section: Section}) {
  if (!section.showButton || !section.buttonLabel) return null
  const href = section.buttonLinkUrl || section.buttonLink?.endpoint || '/'
  const {bg, fg, isOutline} = resolveButtonColors(
    section.buttonStyle,
    section.buttonTextColor,
    '#e11900',
    '#ffffff',
  )

  const radius = section.buttonRadius != null ? `${section.buttonRadius}px` : '0px'

  // Theme button tokens (global via :root, or section override) with the
  // section's own button colors as the fallback when no theme applies.
  const style: React.CSSProperties = {
    backgroundColor: isOutline ? bg : `var(--theme-button-bg, ${bg})`,
    color: `var(--theme-button-text, ${fg})`,
    border: buttonBorder(isOutline, fg),
    borderRadius: `var(--theme-button-radius, ${radius})`,
    fontFamily: 'var(--theme-button-font, inherit)',
    fontSize: 'var(--theme-button-size, 0.875rem)',
    fontWeight: 'var(--theme-button-weight, 700)',
    paddingLeft: 'var(--theme-button-px, 28px)',
    paddingRight: 'var(--theme-button-px, 28px)',
    paddingTop: 'var(--theme-button-py, 14px)',
    paddingBottom: 'var(--theme-button-py, 14px)',
    boxShadow: isOutline ? 'none' : '0 2px 6px rgba(0,0,0,0.15)',
  }

  return (
    <Link
      href={href}
      target={section.buttonLink?.openInNewTab ? '_blank' : undefined}
      className="inline-block tracking-wider uppercase transition-opacity duration-200 hover:opacity-90"
      style={style}
    >
      {section.buttonLabel}
    </Link>
  )
}

function SecondaryButton({section}: {section: Section}) {
  const hasConfigured = section.showSecondaryButton && section.secondaryButtonLabel
  const isFreedomHero =
    !section.showSecondaryButton &&
    section.heading?.toLowerCase().includes('convert your own vehicle')

  if (!hasConfigured && !isFreedomHero) return null

  const label = section.secondaryButtonLabel || 'Learn More'
  const href =
    section.secondaryButtonLinkUrl || section.secondaryButtonLink?.endpoint || '#learn-more'
  const {bg, fg, isOutline} = resolveButtonColors(
    section.secondaryButtonStyle || 'outlineWhite',
    section.secondaryButtonTextColor,
    'transparent',
    '#ffffff',
  )

  const radius =
    section.secondaryButtonRadius != null ? `${section.secondaryButtonRadius}px` : '0px'

  // Outline-style secondary buttons keep their own border/bg, but still adopt the
  // theme's button font, size, weight, padding, and corner rounding.
  const style: React.CSSProperties = {
    backgroundColor: isOutline ? bg : `var(--theme-button-bg, ${bg})`,
    color: isOutline ? fg : `var(--theme-button-text, ${fg})`,
    border: buttonBorder(isOutline, fg),
    borderRadius: `var(--theme-button-radius, ${radius})`,
    fontFamily: 'var(--theme-button-font, inherit)',
    fontSize: 'var(--theme-button-size, 0.875rem)',
    fontWeight: 'var(--theme-button-weight, 700)',
    paddingLeft: 'var(--theme-button-px, 28px)',
    paddingRight: 'var(--theme-button-px, 28px)',
    paddingTop: 'var(--theme-button-py, 14px)',
    paddingBottom: 'var(--theme-button-py, 14px)',
  }

  return (
    <Link
      href={href}
      target={section.secondaryButtonLink?.openInNewTab ? '_blank' : undefined}
      className="inline-block tracking-wider uppercase transition-opacity duration-200 hover:opacity-90"
      style={style}
    >
      {label}
    </Link>
  )
}

function CardButton({card}: {card: StepCard}) {
  if (!card.showButton || !card.buttonLabel) return null
  const href = card.buttonLink?.endpoint || '/'
  return (
    <Link
      href={href}
      target={card.buttonLink?.openInNewTab ? '_blank' : undefined}
      className="inline-block mt-4 px-5 py-2.5 bg-[#e11900] hover:bg-[#c51600] text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors"
    >
      {card.buttonLabel}
    </Link>
  )
}

const CARD_OVERLAY_MAP: Record<string, string> = {
  none: 'transparent',
  light: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)',
  medium:
    'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)',
  strong:
    'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.25) 100%)',
}

function LinkListSection({section}: {section: Section}) {
  const items = section.listItems || []
  const image = section.image
  const imageSide = section.imageSide || 'left'
  // Blank = follow the Site Theme primary color (which carries the light/dark defaults); red only while Site Theme is off.
  const highlight = section.highlightColor || 'var(--theme-primary, #dc2626)'
  const showNumbers = section.showNumbers !== false
  const hoverDescOnly = Boolean(section.showDescriptionOnHover)
  const typo = section.typography
  const cont = section.container
  const isWhiteTheme =
    cont?.sectionTheme === 'light' || cont?.bgColor === '#ffffff' || cont?.bgColor === 'white'

  const headingColor = typo?.headingColor || (isWhiteTheme ? '#111827' : '#ffffff')
  const descColor = typo?.descriptionColor || (isWhiteTheme ? '#374151' : '#d1d5db')
  const rowTextColor = isWhiteTheme ? '#111827' : '#ffffff'
  const rowDivider = isWhiteTheme ? '#e5e7eb' : 'rgba(255,255,255,0.1)'

  const imageBlock = (
    <div className="w-full min-w-0 md:flex-1">
      {image?.url ? (
        <SiteImage
          src={image.url}
          alt={image.alt || section.sectionHeading || 'Section image'}
          sizes="half"
          className="w-full h-full object-cover rounded-lg"
          style={{minHeight: '420px'}}
        />
      ) : null}
    </div>
  )

  const contentBlock = (
    <div className="w-full md:flex-1 flex flex-col justify-center">
      {section.sectionHeading && (
        <h2
          className="font-extrabold tracking-tight"
          style={{
            fontSize: HEADING_SIZE_MAP[typo?.headingSize || 'xl'] || '36px',
            fontWeight: typo?.headingWeight || '800',
            color: headingColor,
            lineHeight: 1.15,
            marginBottom: `${splitTextSpacing(typo?.headingMarginBottom ?? 8, typo?.headingStroke, 'bottom').margin}px`,
            paddingBottom: `${(typo?.headingPaddingBottom ?? 0) + splitTextSpacing(typo?.headingMarginBottom ?? 8, typo?.headingStroke, 'bottom').padding}px`,
            textShadow: resolveTextShadow(typo?.headingShadow),
            ...getTextBorderStyles(typo?.headingStroke, 'heading'),
            ...resolveFontBorder(typo?.headingFontBorder),
            textAlign: (typo?.headingAlignment || 'left') as React.CSSProperties['textAlign'],
          }}
        >
          {section.sectionHeading}
        </h2>
      )}
      {section.sectionDescription && (
        <RichText
          value={section.sectionDescription}
          className="mb-8"
          style={{
            fontSize: DESC_SIZE_MAP[typo?.descriptionSize || 'md'] || '16px',
            fontWeight: typo?.descriptionWeight || '400',
            color: descColor,
            lineHeight: typo?.descriptionLineHeight || '1.6',
            marginTop: `${splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').margin}px`,
            paddingTop: `${(typo?.descriptionPaddingTop ?? 0) + splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').padding}px`,
            textShadow: resolveTextShadow(typo?.descriptionShadow),
            ...getTextBorderStyles(typo?.descriptionStroke, 'description'),
            ...resolveFontBorder(typo?.descriptionFontBorder),
            textAlign: (typo?.descriptionAlignment || 'left') as React.CSSProperties['textAlign'],
          }}
        />
      )}

      <ul className="divide-y" style={{borderColor: rowDivider, color: rowTextColor}}>
        {items.map((item, i) => (
          <LinkListRow
            key={item._key}
            item={item}
            index={i}
            showNumbers={showNumbers}
            hoverDescOnly={hoverDescOnly}
            highlight={highlight}
            textColor={rowTextColor}
            dividerColor={rowDivider}
          />
        ))}
      </ul>
    </div>
  )

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-14 items-stretch">
          {imageSide === 'left' ? (
            <>
              {imageBlock}
              {contentBlock}
            </>
          ) : (
            <>
              {contentBlock}
              {imageBlock}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LinkListRow({
  item,
  index,
  showNumbers,
  hoverDescOnly,
  highlight,
}: {
  item: LinkListItem
  index: number
  showNumbers: boolean
  hoverDescOnly: boolean
  highlight: string
  textColor: string
  dividerColor: string
}) {
  const num = String(index + 1).padStart(2, '0')
  const hasBg = Boolean(item.buttonShowBg)
  const hasBorder = Boolean(item.buttonShowBorder)
  const href = item.linkUrl
  // CSS-only hover via a CSS variable + rule in globals.css (.link-list-row:hover).
  // No event handlers → server-component safe.
  const rowStyle = {'--hl': highlight} as React.CSSProperties

  const row = (
    <div
      className="link-list-row group flex items-center gap-4 px-4 sm:px-2 py-2 sm:py-7"
      style={rowStyle}
    >
      {showNumbers && (
        <span className="text-sm font-bold tracking-wider shrink-0 w-8 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {num}
        </span>
      )}

      <div className="flex-1 min-w-0">
        {item.title && (
          <div className="text-lg sm:text-xl font-semibold leading-tight">{item.title}</div>
        )}
        {item.description && (
          <div
            className={
              hoverDescOnly
                ? 'text-sm mt-0 max-h-0 opacity-0 overflow-hidden transition-all duration-200 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-1'
                : 'text-sm mt-1 opacity-90'
            }
          >
            <RichText value={item.description} />
          </div>
        )}
      </div>

      {item.buttonLabel && (
        <span
          className="link-list-btn hidden group-hover:inline-flex items-center gap-1 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full shrink-0"
          style={{
            backgroundColor: hasBg ? '#ffffff' : 'transparent',
            color: hasBg ? highlight : '#ffffff',
            border: hasBorder ? `1px solid ${hasBg ? highlight : '#ffffff'}` : 'none',
          }}
        >
          {item.buttonLabel} <span aria-hidden>→</span>
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <li>
        <Link
          href={href}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
          className="tap-target block"
        >
          {row}
        </Link>
      </li>
    )
  }
  return <li>{row}</li>
}

/** The `sizes` preset for a grid with this many desktop columns (1 on phones). */
function cardGridSizes(columns?: string): ImageSizePreset {
  return columns === '1'
    ? 'cardGrid1'
    : columns === '2'
      ? 'cardGrid2'
      : columns === '4'
        ? 'cardGrid4'
        : 'cardGrid3'
}

const CARD_WIDTH_MAP: Record<string, string> = {
  narrow: 'clamp(200px, 22vw, 300px)',
  normal: 'clamp(260px, 30vw, 400px)',
  wide: 'clamp(320px, 38vw, 520px)',
  full: '90vw',
}

function FeaturePlayButton({
  accent,
  label,
  imageUrl,
}: {
  accent: string
  label: string
  imageUrl?: string
}) {
  return (
    <div
      className="absolute bottom-0 left-0 p-6 sm:p-7 flex items-center gap-3 pointer-events-none"
      aria-hidden
    >
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-xl flex-shrink-0 overflow-hidden"
        style={{background: imageUrl ? 'transparent' : accent || '#dc2626'}}
      >
        {imageUrl ? (
          <SiteImage
            src={imageUrl}
            alt="Play"
            sizes="icon"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="pl-1">▶</span>
        )}
      </span>
      {label && (
        <span className="text-white font-bold text-sm sm:text-base uppercase tracking-widest drop-shadow">
          {label}
        </span>
      )}
    </div>
  )
}

function FeatureGridSection({section, isFirst}: {section: Section; isFirst?: boolean}) {
  const features = section.features || []
  if (features.length === 0) return null

  const typo = section.typography
  const colCount = section.columns || '3'
  const gapPx = section.gridGap != null ? `${section.gridGap}px` : '24px'
  const cardH = section.cardHeight ? `${section.cardHeight}px` : '360px'
  const overlay = CARD_OVERLAY_MAP[section.cardOverlayStrength || 'medium']
  const hoverReveal = section.descriptionOnHover !== false
  const sectionHoverColor = section.highlightColor
  const isHScroll = section.featureDisplayMode === 'horizontalScroll'

  const colClasses: Record<string, string> = {
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  const header = (section.sectionHeading || section.sectionDescription) && (
    <div className="mb-10 sm:mb-14">
      {section.sectionHeading && (
        <h2
          className="font-extrabold tracking-tight"
          style={{
            fontSize: HEADING_SIZE_MAP[typo?.headingSize || '2xl'] || '44px',
            fontWeight: typo?.headingWeight || '800',
            color: typo?.headingColor || '#ffffff',
            textShadow: resolveTextShadow(typo?.headingShadow),
            ...getTextBorderStyles(typo?.headingStroke, 'heading'),
            ...resolveFontBorder(typo?.headingFontBorder),
            marginBottom: `${splitTextSpacing(typo?.headingMarginBottom ?? 12, typo?.headingStroke, 'bottom').margin}px`,
            paddingBottom: `${(typo?.headingPaddingBottom ?? 0) + splitTextSpacing(typo?.headingMarginBottom ?? 12, typo?.headingStroke, 'bottom').padding}px`,
            textAlign: (typo?.headingAlignment || 'center') as React.CSSProperties['textAlign'],
          }}
        >
          {section.sectionHeading}
        </h2>
      )}
      {section.sectionDescription && (
        <RichText
          value={section.sectionDescription}
          className="max-w-3xl mx-auto"
          style={{
            fontSize: DESC_SIZE_MAP[typo?.descriptionSize || 'lg'] || '18px',
            fontWeight: typo?.descriptionWeight || '400',
            color: typo?.descriptionColor || '#d1d5db',
            textShadow: resolveTextShadow(typo?.descriptionShadow),
            ...getTextBorderStyles(typo?.descriptionStroke, 'description'),
            ...resolveFontBorder(typo?.descriptionFontBorder),
            lineHeight: typo?.descriptionLineHeight || '1.65',
            marginTop: `${splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').margin}px`,
            paddingTop: `${(typo?.descriptionPaddingTop ?? 0) + splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').padding}px`,
            textAlign: (typo?.descriptionAlignment || 'center') as React.CSSProperties['textAlign'],
          }}
        />
      )}
    </div>
  )

  const footer = section.showFooter !== false && (section.footerHeading || section.showButton) && (
    <div className="mt-14 sm:mt-16">
      {section.footerHeading && (
        <div className="flex items-center gap-6 mb-9">
          <span
            className="flex-1 h-px"
            style={{background: section.footerDividerColor || '#4b5563'}}
            aria-hidden
          />
          <span
            className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-center"
            style={{color: section.footerHeadingColor || '#ffffff'}}
          >
            {section.footerHeading}
          </span>
          <span
            className="flex-1 h-px"
            style={{background: section.footerDividerColor || '#4b5563'}}
            aria-hidden
          />
        </div>
      )}
      {section.showButton && (
        <div className="text-center">
          <PrimaryButton section={section} />
        </div>
      )}
    </div>
  )

  // Full Screen card width → edge-to-edge hero-style slider (new view). All other
  // horizontal-scroll widths keep the existing draggable scroller below.
  if (isHScroll && section.cardWidthPreset === 'full') {
    return (
      <div className="w-full">
        {header && <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20">{header}</div>}
        <FeatureHeroSlider
          features={features}
          cardHeight={cardH}
          overlay={overlay}
          hoverReveal={hoverReveal}
          showArrows={section.showScrollArrows !== false}
          showDots={section.sliderShowDots !== false}
          autoPlay={section.sliderAutoPlay === true}
          intervalSeconds={section.sliderAutoPlayInterval || 5}
          showAccentBar={section.showAccentBar !== false}
          accentBarColor={section.accentBarColor}
          playButtonText={section.playButtonText ?? 'Play Video'}
          playButtonImageUrl={section.playButtonImageUrl}
          cardContentPosition={section.cardContentPosition}
          cardContentPaddingTop={section.cardContentPaddingTop}
          cardContentPaddingLeft={section.cardContentPaddingLeft}
          preloadFirst={isFirst}
        />
        {footer && <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">{footer}</div>}
      </div>
    )
  }

  if (isHScroll) {
    return (
      <div className="w-full py-16 sm:py-20">
        {header && <div className="max-w-7xl mx-auto px-5 sm:px-8">{header}</div>}
        <div className="w-full px-4 sm:px-6">
          <FeatureGridScroller
            features={features}
            cardHeight={cardH}
            cardGap={gapPx}
            overlay={overlay}
            hoverReveal={hoverReveal}
            highlightColor={sectionHoverColor}
            showScrollArrows={section.showScrollArrows !== false}
            showScrollLine={section.showScrollLine !== false}
            cardRadius={section.featureCardRadius ?? 0}
            playButtonText={section.playButtonText ?? 'Play Video'}
            playButtonImageUrl={section.playButtonImageUrl}
            showAccentBar={section.showAccentBar !== false}
            accentBarColor={section.accentBarColor}
            cardWidthPreset={section.cardWidthPreset}
            cardContentPosition={section.cardContentPosition}
            cardContentPaddingTop={section.cardContentPaddingTop}
            cardContentPaddingLeft={section.cardContentPaddingLeft}
          />
        </div>
        {footer && <div className="max-w-7xl mx-auto px-5 sm:px-8">{footer}</div>}
      </div>
    )
  }

  return (
    <div>
      {header}
      <div className={`grid ${colClasses[colCount] || colClasses['3']}`} style={{gap: gapPx}}>
        {features.map((f, index) => {
          const mosaicView = section.mosaicView === true
          // Every first card in each group of 5 becomes a 2x2 "hero" tile;
          // the rest stay single-cell.
          const isMosaicHero = mosaicView && index % 5 === 0
          // cardH is a hardcoded per-card height (unlike CardsGridSection's
          // cards, which size naturally) — a hero tile needs that doubled,
          // plus the row gap between the two rows it spans, or it would
          // just be a normal-height card floating in an empty 2-row cell.
          const effectiveCardHeight = isMosaicHero ? `calc(${cardH} * 2 + ${gapPx})` : cardH
          const isVideo = f.mediaType === 'video'
          const accent = f.accentColor || '#dc2626'
          // Accent Bar Color is independent of both the play-button accent
          // above and Card Hover Color — this used to fall back to the hover
          // tint, so setting a hover color silently recolored the
          // always-visible bar too, with no way to say "no color" for the bar
          // on its own. "Transparent" is a valid, explicit choice here (not
          // just blank), which is exactly that "no color" — and it never
          // touches the play button, which keeps using `accent` above.
          const barColor = section.accentBarColor || f.accentColor || '#dc2626'
          const hoverTint = sectionHoverColor
            ? `${sectionHoverColor}38`
            : `${f.accentColor || '#dc2626'}38`
          const bgUrl = isVideo ? f.videoThumbnail?.url : f.image?.url || NO_IMAGE_FALLBACK_URL
          const showBar = section.showAccentBar !== false
          const contentIsTop = section.cardContentPosition === 'top'
          const paddingTop = section.cardContentPaddingTop ?? 24
          const paddingLeft = section.cardContentPaddingLeft ?? 24
          // Title/description sit at the top or bottom of the card, in its flow (see the card's flex
          // classes below), so long text makes the card taller instead of being clipped.
          const flowContentStyle: React.CSSProperties = contentIsTop
            ? {position: 'relative', margin: `${paddingTop}px ${paddingLeft}px 0`}
            : {position: 'relative', padding: `24px ${paddingLeft}px`}

          // `!== false`, not `=== true` or a truthy check: every document
          // saved before this field existed comes back with it absent
          // (undefined), and that must keep rendering exactly like `true`
          // (content over the image, as it always has) — not fall through
          // to the new stacked layout below.
          const overImage = section.showContentOverImage !== false

          const cardInner = overImage ? (
            <div
              // The mosaic's big tile is only double height where it really spans two rows (md and up).
              className={`relative flex w-full flex-col overflow-hidden group min-h-[var(--card-h)] ${contentIsTop ? 'justify-start' : 'justify-end'}${isMosaicHero ? ' md:min-h-[var(--mosaic-h)]' : ''}`}
              style={{
                ['--card-h' as string]: cardH,
                ['--mosaic-h' as string]: effectiveCardHeight,
                borderRadius: `${section.featureCardRadius ?? 0}px`,
              }}
            >
              {bgUrl && (
                <SiteImage
                  src={bgUrl}
                  alt={(isVideo ? f.videoThumbnail?.alt : f.image?.alt) || f.title || 'Feature'}
                  sizes="scroller"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {overlay !== 'transparent' && (
                <div className="absolute inset-0" style={{background: overlay}} aria-hidden />
              )}
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{background: hoverTint}}
              />
              {/* Play button overlay for video cards */}
              {isVideo && (
                <FeaturePlayButton
                  accent={accent}
                  label={section.playButtonText ?? 'Play Video'}
                  imageUrl={section.playButtonImageUrl}
                />
              )}
              {/* Title / description content */}
              <div className="flex flex-col gap-3" style={flowContentStyle}>
                {f.title && (
                  <div className="flex items-stretch gap-4">
                    {showBar && <span aria-hidden className="shrink-0 self-stretch" />}
                    <h3 className="text-white font-extrabold leading-tight text-2xl sm:text-[28px] min-w-0">
                      {f.title}
                    </h3>
                  </div>
                )}
                {f.description && (
                  <RichText
                    value={f.description}
                    className={
                      hoverReveal
                        ? 'text-gray-200 text-sm sm:text-base leading-relaxed overflow-hidden max-h-0 opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:max-h-48 group-hover:opacity-100 group-hover:translate-y-0'
                        : 'text-gray-200 text-sm sm:text-base leading-relaxed'
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            (() => {
              // Image and content as separate, non-overlapping blocks — the
              // gradient tint (`overlay`) still doesn't apply, since that's
              // meant to darken the image for text legibility and there's no
              // text sitting on it here. But the hover zoom AND the hover
              // tint are image-hover feedback, not overlay-positioning
              // effects, so both keep working identically to the overImage
              // branch above.
              const titleElement = f.title && (
                <div className="flex items-stretch gap-4">
                  {showBar && (
                    <span
                      aria-hidden
                      className="shrink-0 self-stretch"
                      style={{width: '4px', background: barColor, borderRadius: '2px'}}
                    />
                  )}
                  <h3
                    className="font-extrabold leading-tight text-2xl sm:text-[28px] min-w-0"
                    style={{color: 'var(--theme-text, #ffffff)'}}
                  >
                    {f.title}
                  </h3>
                </div>
              )

              const mediaElement = (
                <div className="relative w-full shrink-0 overflow-hidden" style={{height: cardH}}>
                  {bgUrl && (
                    <SiteImage
                      src={bgUrl}
                      alt={(isVideo ? f.videoThumbnail?.alt : f.image?.alt) || f.title || 'Feature'}
                      sizes="scroller"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{background: hoverTint}}
                  />
                  {isVideo && (
                    <FeaturePlayButton
                      accent={accent}
                      label={section.playButtonText ?? 'Play Video'}
                      imageUrl={section.playButtonImageUrl}
                    />
                  )}
                </div>
              )

              // Colors here read the Site Theme (var(--theme-*), set on :root
              // whenever Site Settings' Theme is enabled), with a fallback
              // matching this card's old overlay-mode colors — this text sits
              // on the page's own background now, not on the image, so it can
              // no longer assume a dark backdrop the way the hardcoded
              // white/gray-200 overlay text could.
              const descElement = f.description && (
                <RichText
                  value={f.description}
                  className="text-sm sm:text-base leading-relaxed"
                  style={{color: 'var(--theme-muted, #d1d5db)'}}
                />
              )

              const contentOrder = section.cardContentOrder || 'titleImageDesc'

              return (
                <div
                  className={`w-full overflow-hidden group${isMosaicHero ? ' h-full' : ''}`}
                  style={{borderRadius: `${section.featureCardRadius ?? 0}px`}}
                >
                  <div className={`flex flex-col gap-3 p-6${isMosaicHero ? ' h-full' : ''}`}>
                    {contentOrder === 'titleImageDesc' && (
                      <>
                        {titleElement}
                        {mediaElement}
                        {descElement}
                      </>
                    )}
                    {contentOrder === 'imageTitleDesc' && (
                      <>
                        {mediaElement}
                        {titleElement}
                        {descElement}
                      </>
                    )}
                    {contentOrder === 'titleDescImage' && (
                      <>
                        {titleElement}
                        {descElement}
                        {mediaElement}
                      </>
                    )}
                  </div>
                </div>
              )
            })()
          )

          const href = f.linkUrl || f.link?.endpoint
          const mosaicWrapperClass = mosaicView
            ? `h-full ${isMosaicHero ? 'md:col-span-2 md:row-span-2' : ''}`.trim()
            : undefined
          if (isVideo && (f.videoUrl || f.videoFileUrl)) {
            return (
              <div key={f._key} className={mosaicWrapperClass}>
                <VideoLightbox
                  trigger={cardInner}
                  videoUrl={f.videoUrl}
                  videoFileUrl={f.videoFileUrl}
                />
              </div>
            )
          }
          return (
            <div key={f._key} className={mosaicWrapperClass}>
              {href ? (
                <Link
                  href={href}
                  target={f.openInNewTab || f.link?.openInNewTab ? '_blank' : undefined}
                  className={`block${mosaicView ? ' h-full' : ''}`}
                >
                  {cardInner}
                </Link>
              ) : (
                cardInner
              )}
            </div>
          )
        })}
      </div>
      {footer}
    </div>
  )
}

const VIDEO_SIZE_MAP: Record<string, string> = {
  sm: '220px',
  md: '320px',
  lg: '440px',
  xl: '560px',
}

/** "16 / 9" or "4/3" → the height as a percentage of the width ("56.25%"), or undefined when it isn't a ratio. */
function ratioToPadding(ratio: React.CSSProperties['aspectRatio']): string | undefined {
  const m = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(String(ratio ?? ''))
  return m && Number(m[1]) > 0 ? `${(Number(m[2]) / Number(m[1])) * 100}%` : undefined
}

function CardMedia({
  card,
  imgStyle,
  sizes,
  mosaic,
}: {
  card: StepCard
  imgStyle: React.CSSProperties
  sizes: ImageSizePreset
  /** Set only in Mosaic View: the picture fills the whole space its card gives it (the big tile is 'hero'). */
  mosaic?: 'hero' | 'tile'
}) {
  const mediaType = card.mediaType || (card.image?.url ? 'image' : 'none')
  if (mediaType === 'none') return null

  if (mediaType === 'video') {
    const thumb = card.videoThumbnail?.url
    const sizeKey = card.videoSize || 'md'
    const orientation = card.videoOrientation || 'landscape'
    const height = VIDEO_SIZE_MAP[sizeKey] || VIDEO_SIZE_MAP.md
    const aspect = orientation === 'portrait' ? '9 / 16' : '16 / 9'

    const videoBox = (
      <div
        className="relative w-full overflow-hidden bg-black"
        style={{aspectRatio: aspect, maxHeight: height, borderRadius: imgStyle.borderRadius}}
      >
        {thumb ? (
          <SiteImage
            src={thumb}
            alt={card.videoThumbnail?.alt || card.title || 'Video'}
            sizes={sizes}
            fill
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center text-white text-2xl pl-1 shadow-xl">
            ▶
          </span>
        </div>
      </div>
    )

    return (
      <div style={{marginBottom: '20px'}}>
        <VideoLightbox
          trigger={videoBox}
          videoUrl={card.videoUrl}
          videoFileUrl={card.videoFileUrl}
        />
      </div>
    )
  }

  if (mosaic) {
    // Mosaic tiles are different heights (the big tile spans two rows), so a picture at its own proportions leaves
    // empty space in the taller ones. Here the picture instead grows to fill whatever space the tile has, cropped
    // to fit (the editor's Image Fit and corner radius still apply). The spacer sets the least height it may have.
    const minHeight = mosaic === 'hero' ? '56.25%' : (ratioToPadding(imgStyle.aspectRatio) ?? '75%')
    return (
      <div
        className="relative flex-1 overflow-hidden"
        style={{marginTop: '20px', marginBottom: '20px', borderRadius: imgStyle.borderRadius}}
      >
        <div aria-hidden style={{paddingTop: minHeight}} />
        <SiteImage
          src={card.image?.url || NO_IMAGE_FALLBACK_URL}
          alt={card.image?.alt || card.title || 'Card Image'}
          sizes={sizes}
          fill
          style={{objectFit: imgStyle.objectFit}}
        />
      </div>
    )
  }

  return (
    <div style={{marginTop: '20px', marginBottom: '20px'}}>
      <SiteImage
        src={card.image?.url || NO_IMAGE_FALLBACK_URL}
        alt={card.image?.alt || card.title || 'Card Image'}
        sizes={sizes}
        style={imgStyle}
      />
    </div>
  )
}

function CardWithAction({card, children}: {card: StepCard; children: React.ReactNode}) {
  const action = card.cardAction || 'none'

  if (action === 'videoLightbox' && (card.actionVideoUrl || card.actionVideoFileUrl)) {
    return (
      <VideoLightbox
        trigger={children}
        videoUrl={card.actionVideoUrl}
        videoFileUrl={card.actionVideoFileUrl}
      />
    )
  }

  if (action === 'openLink' && card.actionLink?.endpoint) {
    return (
      <Link
        href={card.actionLink.endpoint}
        target={card.actionOpenInNewTab !== false ? '_blank' : undefined}
        className="block h-full"
      >
        {children}
      </Link>
    )
  }

  return <>{children}</>
}

function CardsGridSection({section}: {section: Section}) {
  const cards = section.cards || []
  if (cards.length === 0) return null

  const typo = section.typography
  const cs = section.cardStyle

  const order = section.cardContentOrder || 'titleImageDesc'
  const colCount = section.columns || '3'
  const gapPx = section.gridGap ? `${section.gridGap}px` : '24px'

  const colClasses: Record<string, string> = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  // Kept visible by default (no explicit `show: false`) to match this card
  // style's existing look everywhere it's already in use — only the missing
  // per-edge support is new here. `getBorderStyles` isn't reused as-is because
  // it defaults to *hidden*, which would silently remove every card's border
  // across the site the moment this ships.
  const cardBorderConfig = cs?.border
  const cardBorderVisible = cardBorderConfig?.show !== false
  const cardBorderSides = cardBorderConfig?.sides || {
    top: true,
    right: true,
    bottom: true,
    left: true,
  }
  const cardBorderWidth = cardBorderConfig?.width || '1px'

  const cardStyleObj: React.CSSProperties = {
    // "Card & Panel Background" / "Card & Panel Corners" (Site Theme or a
    // Section Theme override) take priority over this card's own Fallback
    // Theme values (cardBgColor / the border's own radius) when a theme is
    // active — var()'s 2nd argument is only used when neither theme defines
    // the property, via the same Site → Section → Fallback cascade every
    // other themed property on this page already uses (see outerWrapperStyle
    // below): the section wrapper sets --theme-surface/--theme-card-radius
    // locally when its own Section Theme is on, :root sets them for the
    // global Site Theme, and CSS custom properties cascade child-wins.
    backgroundColor: `var(--theme-surface, ${cs?.cardBgColor || '#1c1c1c'})`,
    borderTopWidth: cardBorderVisible && cardBorderSides.top ? cardBorderWidth : '0',
    borderRightWidth: cardBorderVisible && cardBorderSides.right ? cardBorderWidth : '0',
    borderBottomWidth: cardBorderVisible && cardBorderSides.bottom ? cardBorderWidth : '0',
    borderLeftWidth: cardBorderVisible && cardBorderSides.left ? cardBorderWidth : '0',
    borderStyle: 'solid', // Studio no longer offers dashed/dotted/double — see getBorderStyles.
    borderColor: cardBorderConfig?.color || '#374151',
    borderRadius: `var(--theme-card-radius, ${RADIUS_MAP[cardBorderConfig?.radius || 'none'] || '0px'})`,
    padding: cs?.cardPadding || '20px',
    textAlign: (cs?.cardAlignment as React.CSSProperties['textAlign']) || 'left',
    boxShadow: SHADOW_MAP[cs?.cardShadow || 'none'] || 'none',
  }

  const imgRatio =
    cs?.cardImageAspectRatio && cs.cardImageAspectRatio !== 'auto'
      ? cs.cardImageAspectRatio
      : undefined

  const imgStyle: React.CSSProperties = {
    aspectRatio: imgRatio,
    objectFit: (cs?.cardImageFit as React.CSSProperties['objectFit']) || 'cover',
    borderRadius: RADIUS_MAP[cs?.cardImageBorderRadius || 'none'] || '0px',
    width: '100%',
    // next/image writes width/height attributes; `auto` keeps the picture's natural proportions, as before.
    height: 'auto',
    display: 'block',
  }

  const headingAlign = typo?.headingAlignment || 'left'
  const descAlign = typo?.descriptionAlignment || 'left'

  return (
    <div>
      {(section.sectionHeading || section.sectionDescription) && (
        <div className="mb-10">
          {section.sectionHeading && (
            <h2
              style={{
                fontSize: HEADING_SIZE_MAP[typo?.headingSize || 'xl'] || '32px',
                fontWeight: typo?.headingWeight || '700',
                color: typo?.headingColor || '#ffffff',
                textShadow: resolveTextShadow(typo?.headingShadow),
                ...getTextBorderStyles(typo?.headingStroke, 'heading'),
                ...resolveFontBorder(typo?.headingFontBorder),
                textAlign: headingAlign as React.CSSProperties['textAlign'],
                marginBottom: `${splitTextSpacing(typo?.headingMarginBottom ?? 12, typo?.headingStroke, 'bottom').margin}px`,
                paddingBottom: `${(typo?.headingPaddingBottom ?? 0) + splitTextSpacing(typo?.headingMarginBottom ?? 12, typo?.headingStroke, 'bottom').padding}px`,
              }}
            >
              {section.sectionHeading}
            </h2>
          )}
          {section.sectionDescription && (
            <RichText
              value={section.sectionDescription}
              className="max-w-4xl"
              style={{
                fontSize: DESC_SIZE_MAP[typo?.descriptionSize || 'md'] || '16px',
                fontWeight: typo?.descriptionWeight || '400',
                color: typo?.descriptionColor || '#9ca3af',
                textShadow: resolveTextShadow(typo?.descriptionShadow),
                ...getTextBorderStyles(typo?.descriptionStroke, 'description'),
                ...resolveFontBorder(typo?.descriptionFontBorder),
                lineHeight: typo?.descriptionLineHeight || '1.65',
                textAlign: descAlign as React.CSSProperties['textAlign'],
                marginTop: `${splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').margin}px`,
                paddingTop: `${(typo?.descriptionPaddingTop ?? 0) + splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').padding}px`,
              }}
            />
          )}
        </div>
      )}

      {(() => {
        const mosaicView = section.mosaicView === true
        const cardElements = cards.map((card, index) => {
          // Every first card in each group of 5 becomes a 2x2 "hero" tile;
          // the rest stay single-cell. Cards.map's existing content/order
          // logic below is untouched either way — this only changes the
          // outer grid-item wrapper's own span.
          const isMosaicHero = mosaicView && index % 5 === 0
          const titleElement = card.title ? (
            <div>
              {(card.eyebrow || card.badge || card.stepBadge) && (
                <span className="inline-block mb-1 text-xs font-semibold uppercase tracking-wider text-green-400">
                  {card.eyebrow || card.badge || card.stepBadge}
                </span>
              )}
              <h3
                className="mb-3 text-white font-bold leading-snug"
                style={{
                  fontSize: HEADING_SIZE_MAP[typo?.headingSize || 'lg'] || '26px',
                  fontWeight: typo?.headingWeight || '700',
                  color: typo?.headingColor || '#ffffff',
                }}
              >
                {card.title}
              </h3>
            </div>
          ) : null

          const mediaElement = (
            <CardMedia
              card={card}
              imgStyle={imgStyle}
              // The big mosaic tile is two columns wide, so it loads a larger picture than a single-column tile.
              sizes={isMosaicHero ? 'content' : cardGridSizes(section.columns)}
              mosaic={mosaicView ? (isMosaicHero ? 'hero' : 'tile') : undefined}
            />
          )

          const descElement = card.description ? (
            <RichText
              value={card.description}
              className="text-gray-300"
              style={{
                fontSize: DESC_SIZE_MAP[typo?.descriptionSize || 'md'] || '15px',
                fontWeight: typo?.descriptionWeight || '400',
                color: typo?.descriptionColor || '#d1d5db',
                lineHeight: typo?.descriptionLineHeight || '1.65',
              }}
            />
          ) : null

          const buttonElement = <CardButton card={card} />

          const cardBody = (
            <div className="flex flex-col justify-between h-full" style={cardStyleObj}>
              {/* In Mosaic View this block grows to the tile's height so the picture can fill the space. */}
              <div className={mosaicView ? 'flex flex-1 flex-col' : undefined}>
                {order === 'titleImageDesc' && (
                  <>
                    {titleElement}
                    {mediaElement}
                    {descElement}
                  </>
                )}
                {order === 'imageTitleDesc' && (
                  <>
                    {mediaElement}
                    {titleElement}
                    {descElement}
                  </>
                )}
                {order === 'titleDescImage' && (
                  <>
                    {titleElement}
                    {descElement}
                    {mediaElement}
                  </>
                )}
              </div>

              {buttonElement}
            </div>
          )

          return (
            <div
              key={card._key}
              // `h-full` only added in mosaic mode: a grid item already
              // stretches to its row's height by default, but CardWithAction
              // can wrap the card in a plain block-level <Link> that doesn't
              // propagate that stretched height to the card inside it — this
              // only matters once a hero tile is actually 2 rows tall.
              className={
                mosaicView
                  ? `h-full ${isMosaicHero ? 'md:col-span-2 md:row-span-2' : ''}`.trim()
                  : undefined
              }
            >
              <CardWithAction card={card}>{cardBody}</CardWithAction>
            </div>
          )
        })

        const isOneColSlider = colCount === '1' && section.oneColumnDisplayMode === 'slider'

        if (isOneColSlider) {
          return (
            <div className="w-full">
              <OneColumnSlider
                autoPlay={section.sliderAutoPlay === true}
                intervalSeconds={section.sliderAutoPlayInterval || 5}
                showArrows={section.sliderShowArrows !== false}
                showDots={section.sliderShowDots !== false}
              >
                {cardElements}
              </OneColumnSlider>
            </div>
          )
        }

        const gridClassName = colClasses[colCount] || colClasses['3']

        if (section.enableLoadMore) {
          return (
            <LoadMoreCardsGrid
              items={cards.map((card, i) => ({key: card._key, node: cardElements[i]}))}
              initialVisibleCount={section.initialVisibleCount || 8}
              buttonLabel={section.loadMoreButtonLabel || 'Load More'}
              gridClassName={gridClassName}
              gapPx={gapPx}
            />
          )
        }

        return (
          <div className={`grid ${gridClassName}`} style={{gap: gapPx}}>
            {cardElements}
          </div>
        )
      })()}

      {section.items && section.items.length > 0 && (
        <div className="mt-16 max-w-5xl mx-auto">
          <FaqAccordionList
            items={section.items}
            dividerColor={section.accordionDividerColor || '#d1d5db'}
            allowMultipleOpen={section.allowMultipleOpen !== false}
            isWhiteTheme={
              section.container?.sectionTheme === 'light' ||
              section.container?.bgColor === '#ffffff'
            }
            iconType={section.expandIcon || 'plusMinus'}
          />
        </div>
      )}
    </div>
  )
}

type Photo = NonNullable<Section['photos']>[number]

const PHOTO_GALLERY_COL_CLASSES: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

/**
 * Photo Gallery Section — a plain array of photos (no card chrome, titles,
 * or links, unlike Cards Grid/Feature Grid) in a Grid, Mosaic, or Slider
 * layout, with an optional click-to-enlarge lightbox.
 */
function PhotoGallerySection({section}: {section: Section}) {
  const photos = (section.photos || []).filter((p) => p.url)
  if (photos.length === 0) return null

  const layout = section.layout || 'grid'
  const lightbox = section.lightbox === true

  // Tiles are `relative` boxes of a fixed shape, so each photo fills its tile (cropped, as before).
  const renderPhoto = (photo: Photo, className: string, sizes: ImageSizePreset) => {
    const img = (
      <SiteImage
        src={photo.url}
        alt={photo.alt || ''}
        sizes={sizes}
        fill
        className={`object-cover ${className}`}
      />
    )
    return lightbox ? <ImageLightbox trigger={img} src={photo.url!} alt={photo.alt} /> : img
  }

  if (layout === 'slider') {
    return (
      <OneColumnSlider showArrows showDots>
        {photos.map((photo) => (
          <div key={photo._key} className="relative w-full aspect-video overflow-hidden rounded-lg">
            {renderPhoto(photo, 'rounded-lg', 'content')}
          </div>
        ))}
      </OneColumnSlider>
    )
  }

  if (layout === 'mosaic') {
    // Every 5th tile spans 2 columns/rows for visual variety — a baseline,
    // not a fixed spec; worth a visual check against a real photo set.
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[140px] sm:auto-rows-[180px] gap-3">
        {photos.map((photo, i) => (
          <div
            key={photo._key}
            className={`relative overflow-hidden rounded-lg ${i % 5 === 0 ? 'col-span-2 row-span-2' : ''}`}
          >
            {renderPhoto(photo, 'rounded-lg', 'cardGrid2')}
          </div>
        ))}
      </div>
    )
  }

  // Grid (default)
  const colClass =
    PHOTO_GALLERY_COL_CLASSES[section.columns || '3'] || PHOTO_GALLERY_COL_CLASSES['3']
  return (
    <div className={`grid ${colClass} gap-4`}>
      {photos.map((photo) => (
        <div key={photo._key} className="relative aspect-[4/3] overflow-hidden rounded-lg">
          {renderPhoto(photo, 'rounded-lg', cardGridSizes(section.columns))}
        </div>
      ))}
    </div>
  )
}

/**
 * Vehicle Carousel Section — the vehicles an editor picked, as a swipeable row of cards. They
 * arrive with the page's own query, already limited to picked vehicles that still exist and are
 * available (same rule as /vehicles — see sanity/vehicleQueries.ts), priced and named by
 * lib/vehicleDisplay.ts, so the section is exactly as fresh as the page.
 * Colors all come from --theme-* variables, so Site Theme and Section Theme apply.
 */
function VehicleCarouselSection({section}: {section: Section}) {
  const vehicles = section.vehicles ?? []

  // Only reachable in preview — PageSection hides an empty carousel on the live site.
  if (vehicles.length === 0) {
    return (
      <div
        className="mx-auto max-w-3xl rounded-xl p-8 text-center"
        style={{border: '2px dashed color-mix(in srgb, currentColor 35%, transparent)'}}
      >
        <p className="font-semibold">Vehicle Carousel</p>
        <p className="mt-1 text-sm opacity-80">
          No vehicles are selected, or the selected ones are unavailable. This note only shows in
          preview — the section stays hidden on the live site until a selected vehicle is available.
        </p>
      </div>
    )
  }

  const hasButton = Boolean(section.showButton && section.buttonLabel)

  return (
    <div>
      {(section.sectionHeading || section.sectionDescription || hasButton) && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            {section.sectionHeading && (
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {section.sectionHeading}
              </h2>
            )}
            {section.sectionDescription && (
              <RichText
                value={section.sectionDescription}
                className="mt-2 text-base leading-relaxed opacity-80 sm:text-lg"
              />
            )}
          </div>
          {hasButton && (
            <div className="shrink-0">
              <PrimaryButton section={section} />
            </div>
          )}
        </div>
      )}

      <VehicleCarousel
        vehicles={vehicles}
        fallbackImageUrl={NO_IMAGE_FALLBACK_URL}
        label={stegaClean(section.sectionHeading) || 'Vehicles for sale'}
      />
    </div>
  )
}

/**
 * Testimonials Section — hand-written customer quotes as a slider, grid, or one featured quote.
 * Every color comes from the --theme-* variables (see TestimonialCard), so Site Theme and
 * Section Theme apply with nothing pinned here.
 *
 * Deliberately NO Review / AggregateRating JSON-LD: self-serving review markup for quotes a
 * business hosts about itself can violate search-engine guidelines.
 */
function TestimonialsSection({section}: {section: Section}) {
  const items = visibleTestimonials(section.testimonials)

  // Only reachable in preview — PageSection hides an empty section on the live site.
  if (items.length === 0) {
    return (
      <div
        className="mx-auto max-w-3xl rounded-xl p-8 text-center"
        style={{border: '2px dashed color-mix(in srgb, currentColor 35%, transparent)'}}
      >
        <p className="font-semibold">Testimonials</p>
        <p className="mt-1 text-sm opacity-80">
          Add at least one testimonial with a quote and a name. This note only shows in preview —
          the section stays hidden on the live site until then.
        </p>
      </div>
    )
  }

  // stegaClean: these strings drive logic, and preview mode can hide invisible markers in them.
  const layout = stegaClean(section.layout) || 'slider'
  const columns = stegaClean(section.columns) || '3'
  const showRatings = section.showRatings !== false
  const heading = stegaClean(section.sectionHeading)

  return (
    <div>
      {(section.sectionHeading || section.sectionDescription) && (
        <div className="mx-auto mb-10 max-w-3xl text-center">
          {section.sectionHeading && (
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {section.sectionHeading}
            </h2>
          )}
          {section.sectionDescription && (
            <RichText
              value={section.sectionDescription}
              className="mt-4 text-base leading-relaxed opacity-90 sm:text-lg"
            />
          )}
        </div>
      )}

      {layout === 'grid' ? (
        // Same column classes as Photo Gallery's grid: 1 on phones, 2 on tablets, 2–3 on desktop.
        <div
          className={`grid gap-6 ${PHOTO_GALLERY_COL_CLASSES[columns] || PHOTO_GALLERY_COL_CLASSES['3']}`}
        >
          {items.map((t) => (
            <TestimonialCard key={t._key} testimonial={t} showRatings={showRatings} />
          ))}
        </div>
      ) : layout === 'featured' ? (
        // Only the first quote — the editor picks it by dragging one to the top of the list.
        <TestimonialCard testimonial={items[0]} showRatings={showRatings} variant="featured" />
      ) : (
        <TestimonialsSlider
          items={items}
          showRatings={showRatings}
          autoPlay={section.sliderAutoPlay === true}
          intervalSeconds={section.sliderAutoPlayInterval ?? 6}
          label={heading || 'Customer testimonials'}
        />
      )}
    </div>
  )
}

/**
 * Generic CTA button — same styling rules as PrimaryButton/SecondaryButton
 * (resolveButtonColors + the theme-var-with-fallback convention) but
 * prop-driven instead of reading straight off a `Section`, so it isn't tied
 * to one section's field names. PrimaryButton/SecondaryButton aren't
 * rewritten to use this as part of this change (out of scope here), but
 * nothing about this component's shape would block that consolidation later.
 */
function CtaButton({
  href,
  label,
  openInNewTab,
  buttonStyle,
  textColor,
  radius,
  fallbackBg,
  fallbackFg,
}: {
  href: string
  label: string
  openInNewTab?: boolean
  buttonStyle?: string
  textColor?: string
  radius?: number
  fallbackBg: string
  fallbackFg: string
}) {
  const {bg, fg, isOutline} = resolveButtonColors(buttonStyle, textColor, fallbackBg, fallbackFg)
  const radiusPx = radius != null ? `${radius}px` : '0px'

  const style: React.CSSProperties = {
    backgroundColor: isOutline ? bg : `var(--theme-button-bg, ${bg})`,
    color: isOutline ? fg : `var(--theme-button-text, ${fg})`,
    border: buttonBorder(isOutline, fg),
    borderRadius: `var(--theme-button-radius, ${radiusPx})`,
    fontFamily: 'var(--theme-button-font, inherit)',
    fontSize: 'var(--theme-button-size, 0.875rem)',
    fontWeight: 'var(--theme-button-weight, 700)',
    paddingLeft: 'var(--theme-button-px, 28px)',
    paddingRight: 'var(--theme-button-px, 28px)',
    paddingTop: 'var(--theme-button-py, 14px)',
    paddingBottom: 'var(--theme-button-py, 14px)',
    boxShadow: isOutline ? 'none' : '0 2px 6px rgba(0,0,0,0.15)',
  }

  return (
    <Link
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      className="inline-block tracking-wider uppercase transition-opacity duration-200 hover:opacity-90"
      style={style}
    >
      {label}
    </Link>
  )
}

/**
 * Call to Action Section — heading, short text, and one or two buttons.
 * Reuses sectionHeading/sectionDescription (the same header fields cards
 * grid/feature grid/etc. use) and the generic button fields — no new field
 * names. No dedicated typography panel (not asked for here): heading/text
 * color comes from the section wrapper's own `color` (set from Section
 * Theme / the fallback theme), the same way StandardSectionContent's plain
 * text does.
 */
function CallToActionSection({section}: {section: Section}) {
  const heading = section.sectionHeading
  const description = section.sectionDescription
  const showPrimary = Boolean(section.showButton && section.buttonLabel)
  const showSecondary = Boolean(section.showSecondaryButton && section.secondaryButtonLabel)

  if (!heading && !description && !showPrimary && !showSecondary) return null

  return (
    <div className="max-w-3xl mx-auto text-center py-2">
      {heading && (
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">{heading}</h2>
      )}
      {description && (
        <RichText
          value={description}
          className="text-base sm:text-lg leading-relaxed mb-8 opacity-90"
        />
      )}
      {(showPrimary || showSecondary) && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {showPrimary && (
            <CtaButton
              href={section.buttonLinkUrl || section.buttonLink?.endpoint || '/'}
              label={section.buttonLabel!}
              openInNewTab={section.buttonLink?.openInNewTab}
              buttonStyle={section.buttonStyle}
              textColor={section.buttonTextColor}
              radius={section.buttonRadius}
              fallbackBg="#e11900"
              fallbackFg="#ffffff"
            />
          )}
          {showSecondary && (
            <CtaButton
              href={section.secondaryButtonLinkUrl || section.secondaryButtonLink?.endpoint || '/'}
              label={section.secondaryButtonLabel!}
              openInNewTab={section.secondaryButtonLink?.openInNewTab}
              buttonStyle={section.secondaryButtonStyle || 'outlineWhite'}
              textColor={section.secondaryButtonTextColor}
              radius={section.secondaryButtonRadius}
              fallbackBg="transparent"
              fallbackFg="#ffffff"
            />
          )}
        </div>
      )}
    </div>
  )
}

function HeroBannerSection({
  section,
  imageUrl,
  altText,
  image,
  preload,
}: {
  section: Section
  imageUrl: string
  altText?: string
  image?: SectionImage
  /** True for the first section of the page: its banner is the largest above-the-fold image, so it is preloaded. */
  preload?: boolean
}) {
  const bannerAccordion = section.items || []
  const hasBannerAccordion = bannerAccordion.length > 0
  const cont = section.container
  const isWhiteTheme =
    cont?.sectionTheme === 'light' || cont?.bgColor === '#ffffff' || cont?.bgColor === 'white'

  const focal = section.imageFocalPoint || 'right center'
  const bannerHeightClass =
    section.bannerHeight === 'medium'
      ? 'min-h-[500px]'
      : section.bannerHeight === 'small'
        ? 'min-h-[380px]'
        : 'min-h-[580px] sm:min-h-[640px] lg:min-h-[720px]'

  const objectPositionStyle: React.CSSProperties = {
    objectPosition:
      focal === 'center' ? 'center' : focal === 'leftCenter' ? 'left center' : 'right center',
  }

  const gradientMode = section.overlayGradient || 'none'
  let gradientOverlay = ''

  if (gradientMode === 'darkLeft') {
    gradientOverlay = 'bg-gradient-to-r from-black/50 via-black/20 to-transparent'
  } else if (gradientMode === 'darkBottom') {
    gradientOverlay = 'bg-gradient-to-t from-black/60 via-black/20 to-transparent'
  } else if (gradientMode === 'darkFull') {
    gradientOverlay = 'bg-black/25'
  }

  return (
    <>
      <div className={`relative w-full overflow-hidden ${bannerHeightClass} flex items-center`}>
        <SiteImage
          src={imageUrl}
          alt={altText || section.heading || 'Hero'}
          sizes="hero"
          fill
          preload={preload}
          className="object-cover"
          style={{...objectPositionStyle, ...(image ? resolveImageStyle(image) : {})}}
        />

        {gradientOverlay && <div className={`absolute inset-0 z-10 ${gradientOverlay}`} />}

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full py-16 sm:py-20">
          <div
            className="max-w-2xl"
            style={{
              textAlign: (section.typography?.headingAlignment ||
                'left') as React.CSSProperties['textAlign'],
            }}
          >
            {section.heading && (
              <h1
                className="tracking-tight mb-5 drop-shadow-sm"
                style={{
                  fontSize: HEADING_SIZE_MAP[section.typography?.headingSize || '2xl'] || '44px',
                  fontWeight: section.typography?.headingWeight || '800',
                  color: section.typography?.headingColor || '#ffffff',
                  lineHeight: 1.15,
                  paddingBottom: `${section.typography?.headingPaddingBottom ?? 0}px`,
                  textShadow: resolveTextShadow(section.typography?.headingShadow),
                  ...getTextBorderStyles(section.typography?.headingStroke, 'heading'),
                  ...resolveFontBorder(section.typography?.headingFontBorder),
                }}
              >
                {section.heading}
              </h1>
            )}

            {section.description && (
              <RichText
                value={section.description}
                className="mb-8 max-w-xl drop-shadow-sm"
                style={{
                  fontSize: DESC_SIZE_MAP[section.typography?.descriptionSize || 'md'] || '16px',
                  fontWeight: section.typography?.descriptionWeight || '400',
                  color: section.typography?.descriptionColor || '#e5e7eb',
                  lineHeight: section.typography?.descriptionLineHeight || '1.65',
                  paddingTop: `${section.typography?.descriptionPaddingTop ?? 0}px`,
                  textShadow: resolveTextShadow(section.typography?.descriptionShadow),
                  ...getTextBorderStyles(section.typography?.descriptionStroke, 'description'),
                  ...resolveFontBorder(section.typography?.descriptionFontBorder),
                  textAlign: (section.typography?.descriptionAlignment ||
                    section.typography?.headingAlignment ||
                    'left') as React.CSSProperties['textAlign'],
                }}
              />
            )}

            <div className="flex flex-wrap items-center gap-4">
              <PrimaryButton section={section} />
              <SecondaryButton section={section} />
            </div>
          </div>
        </div>
      </div>

      {hasBannerAccordion && (
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-14">
          <FaqAccordionList
            items={bannerAccordion}
            dividerColor={section.accordionDividerColor || '#d1d5db'}
            allowMultipleOpen={section.allowMultipleOpen !== false}
            isWhiteTheme={isWhiteTheme}
            iconType={section.expandIcon || 'plusMinus'}
          />
        </div>
      )}
    </>
  )
}

function resolveImageStyle(img: SectionImage): React.CSSProperties {
  let padding: string | undefined
  if (img.imagePadding) {
    const {top = 0, right = 0, bottom = 0, left = 0} = img.imagePadding
    if (top || right || bottom || left) {
      padding = `${top}px ${right}px ${bottom}px ${left}px`
    }
  } else if (img.image_padding != null) {
    padding = `${img.image_padding}px`
  }
  const r = img.imageRadius
  const borderRadius =
    r !== undefined && r !== null && r !== 0 && r !== '0'
      ? typeof r === 'number'
        ? `${r}px`
        : r
      : undefined
  const objectFit = img.imageFit as React.CSSProperties['objectFit'] | undefined
  return {
    ...(padding ? {padding} : {}),
    ...(borderRadius ? {borderRadius} : {}),
    ...(objectFit ? {objectFit} : {}),
  }
}

/**
 * Split an image style into a "frame" (padding + radius, applied to a wrapper div)
 * and the img's own style (object-fit). Putting padding/radius on the wrapper
 * guarantees they're visible — padding creates a visible frame, and border-radius
 * on an overflow:hidden wrapper reliably clips rounded corners.
 */
function splitImageStyles(img: SectionImage): {
  wrapper: React.CSSProperties
  image: React.CSSProperties
} {
  const s = resolveImageStyle(img)
  const wrapper: React.CSSProperties = {}
  const image: React.CSSProperties = {}
  if (s.padding) wrapper.padding = s.padding
  if (s.borderRadius) wrapper.borderRadius = s.borderRadius
  if (s.objectFit) image.objectFit = s.objectFit
  return {wrapper, image}
}

/**
 * Renders a single image as a card. If the image has an overlay title/description,
 * they're painted at the bottom with a gradient. If it has a linkUrl, the whole
 * card is wrapped in a <Link> and an arrow is shown in the top-right.
 */
function BannerImageCard({
  img,
  fallbackAlt,
  className,
  style,
  enableHover = true,
  sizes,
}: {
  img: SectionImage
  fallbackAlt?: string
  className?: string
  style?: React.CSSProperties
  enableHover?: boolean
  /** How wide the card is shown (a preset from lib/imageSizes.ts). */
  sizes: ImageSizePreset
}) {
  const styles = splitImageStyles(img)
  const hasOverlay = Boolean(img.overlayTitle || img.overlayDescription)
  const href = img.linkUrl

  const inner = (
    <div
      className={`relative w-full h-full group ring-0 ${enableHover ? 'ring-red-600 hover:ring-4' : ''} transition-all duration-200 ${className || ''}`}
      style={{...styles.wrapper, overflow: 'hidden', ...style}}
    >
      {img.url && (
        <SiteImage
          src={img.url}
          alt={img.alt || img.overlayTitle || fallbackAlt || 'Image'}
          sizes={sizes}
          fill
          className={`object-cover block ${enableHover ? 'transition-transform duration-500 group-hover:scale-105' : ''}`}
          style={{objectFit: styles.image.objectFit || 'cover'}}
        />
      )}

      {/* Red hover tint — only shown when hover animation is enabled */}
      {enableHover && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{background: 'rgba(220, 38, 38, 0.22)'}}
        />
      )}

      {hasOverlay && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 70%)',
            }}
          />
          <div className="absolute left-0 right-0 bottom-0 p-5 sm:p-6 text-white">
            {img.overlayTitle && (
              <h3 className="font-extrabold text-xl sm:text-2xl leading-tight drop-shadow">
                {img.overlayTitle}
              </h3>
            )}
            {img.overlayDescription && (
              <p className="mt-1 text-sm sm:text-base text-gray-100/90 leading-snug">
                {img.overlayDescription}
              </p>
            )}
          </div>
        </>
      )}

      {href && (
        <span
          aria-hidden
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 text-gray-900 flex items-center justify-center text-sm font-bold shadow transition-all duration-200 ${enableHover ? 'group-hover:translate-x-0.5 group-hover:bg-red-600 group-hover:text-white' : ''}`}
        >
          →
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        target={img.openInNewTab ? '_blank' : undefined}
        rel={img.openInNewTab ? 'noopener noreferrer' : undefined}
        className="block w-full h-full"
      >
        {inner}
      </Link>
    )
  }
  return inner
}

function SplitLayoutSection({section}: {section: Section}) {
  const images = section.images || []
  const imageSide: 'left' | 'right' = section.accordionSide
    ? section.accordionSide === 'left'
      ? 'right'
      : 'left'
    : section.imageSide || 'left'
  const imgWidthPct = parseInt(section.imageWidth || '50', 10)
  const contentWidthPct = 100 - imgWidthPct
  const vAlign = section.splitContentVerticalAlign || 'center'
  const contentBg = section.splitContentBgColor || 'transparent'
  const rowHeight = section.splitImageHeight || 'auto'

  const typo = section.typography
  const cont = section.container

  const accordionItems = section.items || []
  const hasAccordion = accordionItems.length > 0

  const alignItems = vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center'

  const heightStyle: React.CSSProperties =
    rowHeight === 'auto'
      ? {}
      : rowHeight === '100vh'
        ? {minHeight: '100dvh'}
        : {minHeight: `${rowHeight}px`}

  const isWhiteTheme =
    cont?.sectionTheme === 'light' || contentBg === '#ffffff' || cont?.bgColor === '#ffffff'

  const headingColor = typo?.headingColor || (isWhiteTheme ? '#111827' : '#ffffff')
  const descColor = typo?.descriptionColor || (isWhiteTheme ? '#374151' : '#d1d5db')

  const singleImageStyles = images[0] ? splitImageStyles(images[0]) : {wrapper: {}, image: {}}
  const imageMinHeight = rowHeight === 'auto' ? '420px' : undefined

  const imageBlock = (
    <div
      // Below lg the two columns may shrink so 50% + 50% + the gap fits the row (it was wider than the
      // row, pushing the text off a tablet's screen). From lg up they keep their fixed width, unchanged.
      className="w-full min-w-0 md:flex-[0_1_var(--split-basis)] lg:flex-[0_0_var(--split-basis)]"
      style={{
        ['--split-basis' as string]: `${imgWidthPct}%`,
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...heightStyle,
      }}
    >
      {images.length === 1 ? (
        images[0].url && (
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              ...singleImageStyles.wrapper,
              minHeight: imageMinHeight || '420px',
            }}
          >
            <SiteImage
              src={images[0].url}
              alt={images[0].alt || section.heading || 'Section image'}
              sizes="split"
              fill
              className="block"
              style={{objectFit: singleImageStyles.image.objectFit || 'cover'}}
            />
          </div>
        )
      ) : section.imageLayout === 'fullWidth' ? (
        <div className="flex flex-col gap-4 w-full">
          {images.map((img) =>
            img.url ? (
              <div key={img._key} style={{width: '100%', minHeight: '260px'}}>
                <BannerImageCard
                  img={img}
                  sizes="split"
                  fallbackAlt={section.heading}
                  enableHover={section.enableImageHover !== false}
                />
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <div className="flex flex-row flex-wrap gap-4 w-full items-stretch">
          {images.map((img) =>
            img.url ? (
              <div key={img._key} style={{flex: '1 1 0', minWidth: '220px', minHeight: '260px'}}>
                <BannerImageCard
                  img={img}
                  sizes="split"
                  fallbackAlt={section.heading}
                  enableHover={section.enableImageHover !== false}
                />
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )

  const headingDividerColor = isWhiteTheme ? '#dc2626' : '#dc2626'

  const contentBlock = (
    <div
      className="w-full min-w-0 md:flex-[0_1_var(--split-basis)] lg:flex-[0_0_var(--split-basis)]"
      style={{
        ['--split-basis' as string]: `${contentWidthPct}%`,
        maxWidth: '100%',
        backgroundColor: contentBg === 'transparent' ? undefined : contentBg,
        display: 'flex',
        alignItems,
        ...heightStyle,
      }}
    >
      <div className="py-4 sm:py-6 w-full">
        {section.eyebrow && (
          <p
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{color: isWhiteTheme ? '#6b7280' : '#9ca3af'}}
          >
            {section.eyebrow}
          </p>
        )}

        {section.heading && (
          <>
            <h2
              className="font-extrabold tracking-tight"
              style={{
                fontSize: HEADING_SIZE_MAP[typo?.headingSize || 'xl'] || '32px',
                fontWeight: typo?.headingWeight || '700',
                color: headingColor,
                textShadow: resolveTextShadow(typo?.headingShadow),
                ...getTextBorderStyles(typo?.headingStroke, 'heading'),
                ...resolveFontBorder(typo?.headingFontBorder),
                lineHeight: '1.15',
                marginBottom: `${splitTextSpacing(typo?.headingMarginBottom ?? 16, typo?.headingStroke, 'bottom').margin}px`,
                paddingBottom: `${(typo?.headingPaddingBottom ?? 0) + splitTextSpacing(typo?.headingMarginBottom ?? 16, typo?.headingStroke, 'bottom').padding}px`,
                textAlign: (typo?.headingAlignment || 'left') as React.CSSProperties['textAlign'],
              }}
            >
              {section.heading}
            </h2>
            {hasAccordion && (
              <div
                aria-hidden
                style={{
                  width: '48px',
                  height: '3px',
                  backgroundColor: headingDividerColor,
                  marginBottom: '20px',
                }}
              />
            )}
          </>
        )}

        {section.description && (
          <RichText
            value={section.description}
            className="mb-8 leading-relaxed"
            style={{
              fontSize: DESC_SIZE_MAP[typo?.descriptionSize || 'md'] || '16px',
              fontWeight: typo?.descriptionWeight || '400',
              color: descColor,
              textShadow: resolveTextShadow(typo?.descriptionShadow),
              ...getTextBorderStyles(typo?.descriptionStroke, 'description'),
              ...resolveFontBorder(typo?.descriptionFontBorder),
              lineHeight: typo?.descriptionLineHeight || '1.65',
              marginTop: `${splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').margin}px`,
              paddingTop: `${(typo?.descriptionPaddingTop ?? 0) + splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').padding}px`,
              textAlign: (typo?.descriptionAlignment || 'left') as React.CSSProperties['textAlign'],
            }}
          />
        )}

        {hasAccordion && (
          <div className="mt-2">
            <FaqAccordionList
              items={accordionItems}
              dividerColor={section.accordionDividerColor || (isWhiteTheme ? '#e5e7eb' : '#374151')}
              allowMultipleOpen={section.allowMultipleOpen !== false}
              isWhiteTheme={isWhiteTheme}
              iconType={section.expandIcon || 'plusMinus'}
              variant="numberedCards"
              accentColor={headingDividerColor}
            />
          </div>
        )}

        {(section.showButton || section.showSecondaryButton) && (
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <PrimaryButton section={section} />
            <SecondaryButton section={section} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex flex-col md:flex-row gap-8 lg:gap-14 items-stretch"
          style={heightStyle}
        >
          {imageSide === 'left' ? (
            <>
              {imageBlock}
              {contentBlock}
            </>
          ) : (
            <>
              {contentBlock}
              {imageBlock}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StandardSectionContent({
  section,
  isWhiteTheme,
  isFirst,
}: {
  section: Section
  isWhiteTheme: boolean
  isFirst?: boolean
}) {
  const typo = section.typography
  const images = section.images || []
  const hasImages = images.length > 0
  const isHeroBanner = section.textPosition === 'overImage' || section.imageLayout === 'fullWidth'
  const isSplitLayout = section.textPosition === 'besideImage'

  if (isSplitLayout) {
    return <SplitLayoutSection section={section} />
  }

  if (isHeroBanner && hasImages) {
    return (
      <HeroBannerSection
        section={section}
        imageUrl={images[0].url || ''}
        altText={images[0].alt}
        image={images[0]}
        preload={isFirst}
      />
    )
  }

  const isEyebrowHeader =
    section.headerStyle === 'eyebrowHeadline' ||
    Boolean(section.eyebrow) ||
    section.heading?.toLowerCase() === 'what we convert'

  const eyebrowText = section.eyebrow || (isEyebrowHeader ? section.heading : null)
  // Rendered inside an <h2> (phrasing content only), so this one always
  // flattens to plain text — unlike paragraphText below, which keeps full
  // rich text since it renders in a normal body-copy <p>.
  const mainTitleText = isEyebrowHeader ? toPlainText(section.description) : section.heading
  const paragraphText = isEyebrowHeader ? null : section.description

  const headingAlign = typo?.headingAlignment || 'left'
  const descAlign = typo?.descriptionAlignment || 'left'

  const accordionItems = section.items || section.faqItems
  const hasFaqItems = Boolean(accordionItems && accordionItems.length > 0)

  return (
    <div>
      {(section.heading || section.description || section.eyebrow) && (
        <div className="mb-8 sm:mb-12">
          {eyebrowText && (
            <p
              className={`text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 ${
                headingAlign === 'center'
                  ? 'text-center'
                  : headingAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
              } ${isWhiteTheme ? 'text-gray-700' : 'text-gray-400'}`}
            >
              {eyebrowText}
            </p>
          )}

          {mainTitleText && (
            <h2
              className={`font-extrabold tracking-tight ${
                headingAlign === 'center'
                  ? 'text-center'
                  : headingAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
              }`}
              style={{
                fontSize: HEADING_SIZE_MAP[typo?.headingSize || '2xl'] || '44px',
                fontWeight: typo?.headingWeight || '800',
                color: typo?.headingColor || (isWhiteTheme ? '#111827' : '#ffffff'),
                textShadow: resolveTextShadow(typo?.headingShadow),
                ...getTextBorderStyles(typo?.headingStroke, 'heading'),
                ...resolveFontBorder(typo?.headingFontBorder),
                marginBottom: `${splitTextSpacing(typo?.headingMarginBottom ?? 24, typo?.headingStroke, 'bottom').margin}px`,
                paddingBottom: `${(typo?.headingPaddingBottom ?? 0) + splitTextSpacing(typo?.headingMarginBottom ?? 24, typo?.headingStroke, 'bottom').padding}px`,
              }}
            >
              {mainTitleText}
            </h2>
          )}

          {paragraphText && (
            <div
              className={`max-w-5xl mx-auto ${
                descAlign === 'center'
                  ? 'text-center'
                  : descAlign === 'right'
                    ? 'text-right'
                    : 'text-left'
              }`}
              style={{
                // The border (if any) is drawn on the <p> below, not here, so
                // only the margin half of the split belongs on this wrapper —
                // the padding half has to sit on the same element as the
                // border to actually create space between the text and it.
                marginTop: `${splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').margin}px`,
                paddingTop: `${typo?.descriptionPaddingTop ?? 0}px`,
              }}
            >
              <RichText
                value={paragraphText}
                className="leading-relaxed"
                style={{
                  fontSize: DESC_SIZE_MAP[typo?.descriptionSize || 'md'] || '16px',
                  fontWeight: typo?.descriptionWeight || '400',
                  color: typo?.descriptionColor || (isWhiteTheme ? '#374151' : '#d1d5db'),
                  lineHeight: typo?.descriptionLineHeight || '1.65',
                  textShadow: resolveTextShadow(typo?.descriptionShadow),
                  paddingTop: `${splitTextSpacing(typo?.descriptionMarginTop ?? 0, typo?.descriptionStroke, 'top').padding}px`,
                  ...getTextBorderStyles(typo?.descriptionStroke, 'description'),
                  ...resolveFontBorder(typo?.descriptionFontBorder),
                }}
              />
            </div>
          )}
        </div>
      )}

      {hasFaqItems && (
        <FaqAccordionList
          items={accordionItems!}
          dividerColor={section.accordionDividerColor || '#d1d5db'}
          allowMultipleOpen={section.allowMultipleOpen !== false}
          isWhiteTheme={isWhiteTheme}
          iconType={section.expandIcon || 'plusMinus'}
        />
      )}

      {hasImages && (
        <div className="w-full">
          {images.length === 1 ? (
            <div className="max-w-6xl mx-auto">
              <SiteImage
                src={images[0].url}
                alt={images[0].alt || section.heading || 'Section Image'}
                sizes="content"
                className="w-full h-auto object-contain block mx-auto"
                style={resolveImageStyle(images[0])}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {images.map((img) => {
                const hasOverlay = Boolean(
                  img.overlayTitle || img.overlayDescription || img.linkUrl,
                )
                if (hasOverlay) {
                  return (
                    <div key={img._key} className="w-full relative" style={{minHeight: '320px'}}>
                      <BannerImageCard
                        img={img}
                        sizes="contentHalf"
                        fallbackAlt={section.heading}
                        enableHover={section.enableImageHover !== false}
                      />
                    </div>
                  )
                }
                return (
                  <div key={img._key} className="flex flex-col items-center">
                    <SiteImage
                      src={img.url}
                      alt={img.alt || ''}
                      sizes="contentHalf"
                      className="w-full h-auto object-contain"
                      style={resolveImageStyle(img)}
                    />
                    {img.alt && (
                      <span
                        className={`mt-2 font-bold text-sm uppercase text-center ${
                          isWhiteTheme ? 'text-black' : 'text-white'
                        }`}
                      >
                        {img.alt}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {section.showButton && (
        <div className="mt-10 text-center">
          <PrimaryButton section={section} />
        </div>
      )}
    </div>
  )
}

/**
 * Stable, harmless hooks on every section's wrapper, so a page's Custom CSS can aim at one section:
 *   [data-section-key="abc123"]  — this exact section
 *   .page-section--bannerSection — every section of that type
 * Nothing in the site's own styles uses these names, so adding them changes no current styling.
 * Values are reduced to safe characters (a Sanity _key/_type is already plain, this is belt and braces).
 */
function sectionHooks(section: Section, extraClass = '', doc?: SanityDoc) {
  const safe = (value?: string) => (value || '').replace(/[^A-Za-z0-9_-]/g, '')
  return {
    className: ['page-section', `page-section--${safe(section._type) || 'section'}`, extraClass]
      .filter(Boolean)
      .join(' '),
    'data-section-key': safe(section._key) || undefined,
    // Live-preview click target: clicking anywhere on the section opens its editor. Empty outside preview.
    ...dataSanity(doc, section._key ? sectionPath(section._key) : undefined),
  }
}

/**
 * Custom HTML Section — renders editor-supplied HTML after an independent
 * allowlist sanitization pass. The markup is scoped inside a dedicated wrapper
 * so it cannot style unrelated sections. Multiple instances are isolated per key.
 *
 * Like every other section, it follows the sitewide Site Theme by default and
 * takes on its own Section Theme override when enabled — both apply as CSS
 * vars on this wrapper so the editor's HTML can use them too (e.g.
 * `color: var(--theme-text)`).
 */
function CustomHtmlSection({section, doc}: {section: Section; doc?: SanityDoc}) {
  const clean = sanitizeHtml(section.htmlCode)
  if (!clean.trim()) return null
  const {config: sectionThemeConfig} = resolveSectionTheme(undefined, section)
  const sectionThemeVars = themeToCssVars(sectionThemeConfig)
  return (
    <section
      {...sectionHooks(section, 'custom-html-section w-full', doc)}
      style={{
        ...(sectionThemeVars as React.CSSProperties),
        backgroundColor: 'var(--theme-bg, transparent)',
        color: 'var(--theme-text, inherit)',
        fontFamily: 'var(--theme-body-font, inherit)',
      }}
    >
      <div className="custom-html-section__inner" dangerouslySetInnerHTML={{__html: clean}} />
    </section>
  )
}

/**
 * Google Reviews Section — embeds the Trustindex widget already used on the
 * live site to show Google reviews in a slider. Trustindex owns the review
 * data and the widget's look (both configured once in their dashboard, keyed
 * by this one ID); this only has to place the `.ti-widget[data-pid]` slot
 * their loader script scans for and fills in — not render any review content
 * itself.
 *
 * Needs `NEXT_PUBLIC_TRUSTINDEX_LOADER_SRC` set to this account's Trustindex
 * install script URL (Trustindex dashboard → Get Code — the install snippet
 * is separate from, and in addition to, the per-widget `data-pid` div).
 * Without it the slot renders but nothing fills it in, since the script that
 * would populate it was never loaded, so this renders nothing rather than an
 * empty box — only logged as a warning server-side, in development.
 */
function GoogleReviewsSection({
  widgetId,
  hooks,
}: {
  widgetId?: string
  hooks: ReturnType<typeof sectionHooks>
}) {
  if (!widgetId) return null
  const loaderSrc = process.env.NEXT_PUBLIC_TRUSTINDEX_LOADER_SRC
  if (!loaderSrc) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Google Reviews Section] NEXT_PUBLIC_TRUSTINDEX_LOADER_SRC is not set — rendering nothing. ' +
          'Set it to this account’s Trustindex install script URL to show the widget.',
      )
    }
    return null
  }
  return (
    <section {...hooks}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ti-widget" data-pid={widgetId} data-trustindex-widget="true" />
      </div>
      <Script src={loaderSrc} strategy="lazyOnload" />
    </section>
  )
}

export default function PageSection({
  section,
  isFirst,
  doc,
}: {
  section: Section
  /** True for the first section on the page — its above-the-fold image (hero banner) is preloaded. Pass it for one section per page. */
  isFirst?: boolean
  /** The page document, in preview only (from `sanityDocOf(page)`). Adds click-to-edit markers; leave out on the live site. */
  doc?: SanityDoc
}) {
  // Deactivated sections are hidden from the page (not deleted). Default on,
  // so existing content without the field keeps rendering.
  if (section.isActive === false) return null

  // Custom HTML and Google Reviews render on their own paths — neither has
  // the structured fields (features/cards/etc.) the dispatch below keys on,
  // so both must be handled first.
  if (section._type === 'customHtmlSection') {
    return <CustomHtmlSection section={section} doc={doc} />
  }
  if (section._type === 'googleReviewsSection') {
    return (
      <GoogleReviewsSection
        widgetId={section.trustindexWidgetId}
        hooks={sectionHooks(section, 'w-full py-12 sm:py-16', doc)}
      />
    )
  }
  // Placeholder only — marks where a page's own built-in content (e.g. the
  // vehicle listing grid) belongs among the CMS sections. Pages that have
  // such content pull it out of the array before mapping over PageSection
  // (see splitAroundStaticSection); on any other page it simply renders
  // nothing, since there's no built-in content to show there.
  if (section._type === 'staticSection') {
    return null
  }
  // A carousel with no matching vehicles is hidden on the live site entirely (no empty padded
  // band). In preview it stays so the editor sees a placeholder instead.
  if (
    section._type === 'vehicleCarouselSection' &&
    !section.isPreview &&
    !section.vehicles?.length
  ) {
    return null
  }
  // Testimonials with nothing to show are hidden on the live site entirely (no empty padded
  // band). In preview the section stays so the editor sees a placeholder instead.
  if (
    section._type === 'testimonialsSection' &&
    !section.isPreview &&
    visibleTestimonials(section.testimonials).length === 0
  ) {
    return null
  }

  const cont = section.container

  const isLinkList =
    section._type === 'linkListSection' ||
    Boolean(section.listItems && section.listItems.length > 0)

  // Explicit _type check, not shape-inference like its neighbors above/below
  // — `photos` doesn't collide with any other section's fields, so there's
  // no ambiguity to resolve the way isLinkList/isFeatureGrid/isCardsGrid do.
  const isPhotoGallery = section._type === 'photoGallerySection'

  // Same reasoning as isPhotoGallery: callToActionSection reuses
  // sectionHeading/sectionDescription/buttonLabel, etc. — fields several
  // other section types already have — so shape-inference would be
  // ambiguous here. _type is the only reliable signal.
  const isCallToAction = section._type === 'callToActionSection'

  // Same: explicit _type — it shares sectionHeading and the button fields with other sections.
  const isVehicleCarousel = section._type === 'vehicleCarouselSection'
  // Same: explicit _type — it shares sectionHeading/layout/columns with other section types.
  const isTestimonials = section._type === 'testimonialsSection'

  const isFeatureGrid =
    !isLinkList &&
    (section._type === 'featureGridSection' ||
      Boolean(section.features && section.features.length > 0))

  const isCardsGrid =
    !isLinkList &&
    !isFeatureGrid &&
    (section.sectionType === 'cardsGrid' ||
      (Boolean(section.cards && section.cards.length > 0) &&
        section.sectionType !== 'standard' &&
        section.sectionType !== 'faqAccordion' &&
        section.sectionType !== 'accordionSection'))

  const isSplitLayout =
    !isLinkList &&
    !isFeatureGrid &&
    !isCardsGrid &&
    !isPhotoGallery &&
    section.textPosition === 'besideImage'

  const isHeroBanner =
    !isLinkList &&
    !isFeatureGrid &&
    !isCardsGrid &&
    !isSplitLayout &&
    !isPhotoGallery &&
    (section.textPosition === 'overImage' || section.imageLayout === 'fullWidth') &&
    Boolean(section.images && section.images.length > 0)

  const isHScrollFeature = isFeatureGrid && section.featureDisplayMode === 'horizontalScroll'
  const isFullBleed = isHeroBanner || isSplitLayout || isHScrollFeature

  const isWhiteTheme =
    cont?.sectionTheme === 'light' ||
    cont?.bgColor === '#ffffff' ||
    cont?.bgColor === 'white' ||
    section.heading?.toLowerCase() === 'what we convert' ||
    section.heading?.toLowerCase().includes('frequently asked questions') ||
    section.sectionType === 'faqAccordion' ||
    section.sectionType === 'accordionSection'

  const bgColor = isWhiteTheme ? '#ffffff' : cont?.bgColor || '#121212'
  const textColor = isWhiteTheme ? '#111827' : cont?.textColor || '#ffffff'

  const borderStyles = isFullBleed ? {} : getBorderStyles(section.border)

  // Gated on the toggle, not just a truthy URL — Studio hides backgroundImage
  // (rather than clearing it) once this is switched off, so stale data must
  // not resurface on the live site.
  const bgImageUrl = cont?.enableBackgroundImage ? cont?.backgroundImage : undefined
  // Gated on the toggle for the same reason bgImageUrl is above — the
  // Overlay field is hidden (not cleared) once enableBackgroundImage is
  // off, so a stray old value must not keep darkening the section.
  const bgOverlayAlpha = cont?.enableBackgroundImage
    ? Math.max(0, Math.min(90, cont?.backgroundOverlay ?? 0)) / 100
    : 0
  const bgImagePos = cont?.backgroundImagePosition || 'center'
  // The background image is a real (optimized, lazy) image filling the section, not a CSS background-image,
  // so it goes through the same resize/format pipeline as every other picture.
  const bgImageEl = bgImageUrl ? (
    <SiteImage
      src={bgImageUrl}
      alt=""
      sizes="background"
      fill
      className="object-cover"
      style={{objectPosition: bgImagePos}}
    />
  ) : null

  // Theme resolution: a section with its own theme sets only its defined vars
  // here; everything else inherits the global theme from :root. bg/text use the
  // theme var with the existing container color as fallback (both-off behavior).
  const {config: sectionThemeConfig} = resolveSectionTheme(undefined, section)
  const sectionThemeVars = themeToCssVars(sectionThemeConfig)

  // This section's own Background/Text (the older, simpler Fallback Theme
  // panel) — when it's actually been set, or when it's forced white by one of
  // the hardcoded light-section cases above (FAQ, "what we convert", etc.) —
  // is just as much a deliberate per-section choice as Section Theme is, so
  // it gets the same precedence over the sitewide Site Theme that Section
  // Theme already has. Without this, a section like a dark FAQ/"good company"
  // panel silently turned the sitewide color the moment Site Theme was
  // switched on, discarding whatever dark/light look it was actually set to —
  // `var(--theme-bg, fallback)` only uses its fallback when nothing anywhere
  // up the tree defines `--theme-bg`, not when this *specific* section simply
  // didn't override it; Site Theme defining it at :root was enough to win
  // every time. Pinning it locally here, for this section only, fixes that
  // without touching sections that never set their own Background/Text at
  // all — those still correctly inherit the sitewide Site Theme.
  //
  // The Studio used to auto-store #111827 / #ffffff on every new section, so
  // those two exact values can't be told apart from "never touched" — treat
  // them as unset, otherwise every section pins its own colors and the Site
  // Theme never reaches it. Bg and text are pinned together once either is
  // customized, so a custom background never ends up with an unreadable
  // site-theme text color on top of it.
  const hasOwnBg = Boolean(cont?.bgColor) && cont?.bgColor?.toLowerCase() !== '#111827'
  const hasOwnText = Boolean(cont?.textColor) && cont?.textColor?.toLowerCase() !== '#ffffff'
  const fallbackThemeVars: Record<string, string> = {}
  if (hasOwnBg || hasOwnText || isWhiteTheme) {
    fallbackThemeVars['--theme-bg'] = bgColor
    fallbackThemeVars['--theme-text'] = textColor
  }

  const outerWrapperStyle: React.CSSProperties = {
    ...(fallbackThemeVars as React.CSSProperties),
    ...(sectionThemeVars as React.CSSProperties),
    backgroundColor: bgImageUrl ? undefined : `var(--theme-bg, ${bgColor})`,
    color: `var(--theme-text, ${textColor})`,
    fontFamily: 'var(--theme-body-font, inherit)',
    // Full-bleed sections have no padding; the others get theirs from `sectionPaddingClass` below.
    paddingTop: isFullBleed ? '0px' : undefined,
    paddingBottom: isFullBleed ? '0px' : undefined,
    width: '100%',
    position: 'relative',
  }

  const showBgOverlay = bgOverlayAlpha > 0
  // Section padding scales with the screen: 40px on phones, 56px on tablets, 72px from 1024px up.
  const sectionPaddingClass = isFullBleed ? '' : 'py-10 sm:py-14 lg:py-[72px]'

  const bgOverlayEl = showBgOverlay ? (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: hexToRgba(cont?.backgroundOverlayColor || '#000000', bgOverlayAlpha),
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  ) : null

  // Content needs to sit above the overlay (which is positioned, z-index 0,
  // and would otherwise paint over plain in-flow content) whenever the
  // overlay renders — not just when there's also a background image.
  const contentLayerStyle: React.CSSProperties =
    bgImageUrl || showBgOverlay ? {position: 'relative', zIndex: 1} : {}

  const containerClass = isFullBleed
    ? 'w-full'
    : cont?.containerWidth === 'narrow'
      ? 'max-w-4xl mx-auto'
      : cont?.containerWidth === 'wide'
        ? 'max-w-[1400px] mx-auto'
        : cont?.containerWidth === 'full'
          ? 'w-full'
          : 'max-w-7xl mx-auto'

  const innerStyle: React.CSSProperties = isFullBleed
    ? {}
    : {
        ...borderStyles,
        paddingLeft: isFullBleed ? '0px' : '20px',
        paddingRight: isFullBleed ? '0px' : '20px',
      }

  if (section.expandable) {
    return (
      <section {...sectionHooks(section, sectionPaddingClass, doc)} style={outerWrapperStyle}>
        {bgImageEl}
        {bgOverlayEl}
        <div className={containerClass} style={{...innerStyle, ...contentLayerStyle}}>
          <ExpandableSection
            icon={section.expandIcon}
            expandedByDefault={section.expandedByDefault}
            // stegaClean: this heading doubles as the expand/collapse
            // toggle's own clickable label (see ExpandableSection.tsx) — the
            // stega markers <VisualEditing/> needs for click-to-edit would
            // otherwise sit on the one thing already handling clicks here,
            // which the click-to-edit overlay would then intercept. A no-op
            // on published (non-draft) reads, where stega is never present.
            heading={stegaClean(section.sectionHeading || section.heading)}
          >
            {isLinkList ? (
              <LinkListSection section={section} />
            ) : isFeatureGrid ? (
              <FeatureGridSection section={section} isFirst={isFirst} />
            ) : isCardsGrid ? (
              <CardsGridSection section={section} />
            ) : isPhotoGallery ? (
              <PhotoGallerySection section={section} />
            ) : isCallToAction ? (
              <CallToActionSection section={section} />
            ) : isVehicleCarousel ? (
              <VehicleCarouselSection section={section} />
            ) : isTestimonials ? (
              <TestimonialsSection section={section} />
            ) : (
              <StandardSectionContent
                section={section}
                isWhiteTheme={isWhiteTheme}
                isFirst={isFirst}
              />
            )}
          </ExpandableSection>
        </div>
      </section>
    )
  }

  return (
    <section {...sectionHooks(section, sectionPaddingClass, doc)} style={outerWrapperStyle}>
      {bgImageEl}
      {bgOverlayEl}
      <div className={containerClass} style={{...innerStyle, ...contentLayerStyle}}>
        {isLinkList ? (
          <LinkListSection section={section} />
        ) : isFeatureGrid ? (
          <FeatureGridSection section={section} isFirst={isFirst} />
        ) : isCardsGrid ? (
          <CardsGridSection section={section} />
        ) : isPhotoGallery ? (
          <PhotoGallerySection section={section} />
        ) : isCallToAction ? (
          <CallToActionSection section={section} />
        ) : isVehicleCarousel ? (
          <VehicleCarouselSection section={section} />
        ) : isTestimonials ? (
          <TestimonialsSection section={section} />
        ) : (
          <StandardSectionContent section={section} isWhiteTheme={isWhiteTheme} isFirst={isFirst} />
        )}
      </div>
    </section>
  )
}
