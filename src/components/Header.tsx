'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {ChevronDown} from 'lucide-react'
import {useScrollLock} from '@/lib/useScrollLock'
import type {NavLink, MegaMenuConfig, MegaMenuFeature, MegaMenuLogoItem} from '@/sanity/queries'
import SiteImage from './SiteImage'

const FALLBACK_NAV_ITEMS: NavLink[] = [
  {label: 'VEHICLES', href: '/vehicles'},
  {label: 'DRIVERS', href: '/drivers'},
  {label: 'CONVERT YOUR VEHICLE', href: '/convert-your-vehicle'},
  {label: 'COMMERCIAL', href: '/commercial'},
  {label: 'OUR STORY', href: '/our-story'},
  {label: 'CONTACT', href: '/contact'},
]

interface SiteSettings {
  siteTitle?: string
  siteLogo?: string
  stickyHeader?: boolean
  headerLogoRedirect?: string
  topBarEnabled?: boolean
  businessHours?: string
  phoneLabel?: string
  phoneNumber?: string
  headerCta?: {label?: string; endpoint?: string; openInNewTab?: boolean}
}

interface CustomNavPage {
  title?: string
  navLabel?: string
  slug?: string
  navOrder?: number
  openInNewTab?: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const OVERLAY_MAP: Record<string, string> = {
  none: 'rgba(0,0,0,0)',
  light: 'rgba(0,0,0,0.25)',
  medium: 'rgba(0,0,0,0.50)',
  strong: 'rgba(0,0,0,0.72)',
}

function overlayGradient(strength?: string) {
  const alpha = OVERLAY_MAP[strength ?? 'medium'] ?? 'rgba(0,0,0,0.50)'
  return `linear-gradient(to top, ${alpha} 0%, rgba(0,0,0,0.18) 50%, transparent 100%)`
}

// ── Feature card ─────────────────────────────────────────────────────────────

function MegaFeatureCard({
  item,
  cfg,
  onClose,
}: {
  item: MegaMenuFeature
  cfg: MegaMenuConfig
  onClose: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const height = cfg.cardHeight ?? '260'
  const radius = cfg.featureCardRadius ?? 0
  const padLeft = cfg.cardContentPaddingLeft ?? 16
  const padTop = cfg.cardContentPaddingTop ?? 16
  const contentPos = cfg.cardContentPosition ?? 'bottom'
  const hoverColor = cfg.highlightColor || item.accentColor || '#b91c1c'
  const showAccent = cfg.showAccentBar !== false
  const revealDesc = cfg.descriptionOnHover !== false

  const contentStyle: React.CSSProperties =
    contentPos === 'bottom'
      ? {position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${padLeft}px 12px`}
      : {position: 'absolute', top: 0, left: 0, right: 0, padding: `${padTop}px ${padLeft}px 0`}

  const inner = (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{height: `${height}px`, borderRadius: `${radius}px`}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image */}
      {item.image ? (
        <SiteImage
          src={item.image}
          alt={item.imageAlt || item.title || ''}
          sizes="megaMenu"
          fill
          className="object-cover"
          style={{
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.35s ease',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-300" />
      )}

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: overlayGradient(cfg.cardOverlayStrength),
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Hover color overlay */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-4"
        style={{
          background: hoverColor,
          opacity: hovered ? 0.88 : 0,
          transition: 'opacity 0.25s ease',
        }}
      >
        <span className="text-white text-2xl font-light">→</span>
      </div>

      {/* Card content */}
      <div style={contentStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: hovered ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {showAccent && (
            <div
              style={{
                width: 3,
                height: 16,
                background: item.accentColor ?? '#dc2626',
                flexShrink: 0,
              }}
            />
          )}
          <p className="text-white text-sm font-bold uppercase tracking-wider leading-tight">
            {item.title}
          </p>
        </div>
        {item.description && (
          <p
            className="text-white/80 text-xs mt-1 leading-snug"
            style={{
              opacity: hovered && !revealDesc ? 0 : revealDesc && hovered ? 1 : 0,
              maxHeight: revealDesc && hovered ? '4rem' : '0',
              overflow: 'hidden',
              transition: 'opacity 0.2s ease, max-height 0.25s ease',
            }}
          >
            {item.description}
          </p>
        )}
        {/* Hovered label */}
        <p
          className="text-white text-sm font-bold uppercase tracking-wider"
          style={{
            position: 'absolute',
            bottom: 12,
            left: padLeft,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          {item.title}
        </p>
      </div>
    </div>
  )

  const href = item.linkUrl
  if (href) {
    return (
      <Link
        href={href}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        onClick={onClose}
        className="block"
      >
        {inner}
      </Link>
    )
  }
  return <div>{inner}</div>
}

// ── Mega Menu panel ───────────────────────────────────────────────────────────

function MegaMenuPanel({
  config,
  visible,
  onClose,
}: {
  config: MegaMenuConfig
  visible: boolean
  onClose: () => void
}) {
  const features = config.features ?? []
  if (!features.length && !config.showButton) return null

  const cols = parseInt(config.columns ?? '4', 10)
  const gap = parseInt(config.gridGap ?? '8', 10)
  const panelPad = parseInt(config.panelPadding ?? '24', 10)
  const bgColor = config.panelBgColor || '#ffffff'
  const isScroll = config.featureDisplayMode === 'horizontalScroll'

  // Max Width caps how wide the panel's content gets on large screens;
  // "full" (edge to edge) removes the cap entirely. Left & Right Spacing is
  // the horizontal padding inside that width. `width: 100%` + `boxSizing:
  // border-box` are what actually make this responsive — without them, a
  // fixed max-width or the padding alone would let the content overflow a
  // viewport narrower than itself instead of shrinking to fit.
  // A mega menu saved before this field existed has no value here — that
  // must still resolve to the field's own default (1280px, previously
  // hardcoded), not to "full width", or an already-published menu would
  // suddenly span edge to edge the moment this ships.
  const panelMaxWidth =
    config.panelMaxWidth === 'full'
      ? undefined
      : `${parseInt(config.panelMaxWidth ?? '1280', 10)}px`
  const panelHPad = parseInt(config.panelHorizontalPadding ?? '32', 10)

  return (
    <div
      aria-hidden={!visible}
      style={{
        background: bgColor,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        pointerEvents: visible ? 'auto' : 'none',
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 40,
        maxHeight: 'calc(100dvh - 6rem)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: panelMaxWidth,
          width: '100%',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding: `${panelPad}px ${panelHPad}px`,
        }}
      >
        {/* Feature grid / scroll */}
        {features.length > 0 &&
          (isScroll ? (
            <div
              style={{
                display: 'flex',
                gap: `${gap}px`,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 4,
              }}
            >
              {features.map((item) => (
                <div
                  key={item._key}
                  style={{
                    flexShrink: 0,
                    width:
                      config.cardWidthPreset === 'narrow'
                        ? '200px'
                        : config.cardWidthPreset === 'wide'
                          ? '340px'
                          : config.cardWidthPreset === 'full'
                            ? '100%'
                            : '260px',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <MegaFeatureCard item={item} cfg={config} onClose={onClose} />
                </div>
              ))}
            </div>
          ) : (
            <div
              // The editor's column count applies from 768px; below that at most 2 columns.
              className="grid grid-cols-[repeat(min(var(--mega-cols),2),minmax(0,1fr))] md:grid-cols-[repeat(var(--mega-cols),minmax(0,1fr))]"
              style={{['--mega-cols' as string]: cols, gap: `${gap}px`}}
            >
              {features.map((item) => (
                <MegaFeatureCard key={item._key} item={item} cfg={config} onClose={onClose} />
              ))}
            </div>
          ))}

        {/* Footer row */}
        {config.showFooter && (
          <div style={{marginTop: gap || 12}}>
            {config.footerDividerColor && (
              <div
                style={{
                  borderTop: `1px solid ${config.footerDividerColor ?? '#4b5563'}`,
                  marginBottom: 12,
                }}
              />
            )}
            {config.footerHeading && (
              <p
                className="text-sm font-semibold uppercase tracking-widest text-center"
                style={{marginBottom: 12}}
              >
                {config.footerHeading}
              </p>
            )}
          </div>
        )}

        {/* Logo strip */}
        {config.logoStrip && config.logoStrip.length > 0 && (
          <div
            style={{
              marginTop: gap || 12,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px 0',
            }}
          >
            {config.logoStrip.map((item: MegaMenuLogoItem, i: number) => {
              const inner = (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0 14px',
                    borderRight: i < config.logoStrip!.length - 1 ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  {item.logo && (
                    <SiteImage
                      src={item.logo}
                      alt={item.label ?? ''}
                      sizes="logo"
                      style={{height: 28, width: 'auto', objectFit: 'contain'}}
                    />
                  )}
                  {item.label && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#111827',
                      }}
                    >
                      {item.label.toUpperCase()}
                    </span>
                  )}
                </div>
              )
              return item.href ? (
                <Link
                  key={item._key}
                  href={item.href}
                  target={item.openInNewTab ? '_blank' : undefined}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  onClick={onClose}
                  style={{display: 'block', textDecoration: 'none'}}
                  className="hover:opacity-70 transition-opacity"
                >
                  {inner}
                </Link>
              ) : (
                <div key={item._key}>{inner}</div>
              )
            })}
          </div>
        )}

        {/* CTA button */}
        {config.showButton && config.buttonLabel && config.buttonLinkUrl && (
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 16}}>
            <Link
              href={config.buttonLinkUrl}
              onClick={onClose}
              style={{
                background: config.buttonStyle ?? '#dc2626',
                color: config.buttonTextColor ?? '#ffffff',
                borderRadius: `${config.buttonRadius ?? 0}px`,
                padding: '10px 24px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'filter 0.15s ease',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.filter = 'brightness(0.88)')
              }
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.filter = '')}
            >
              {config.buttonLabel} <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

/** Every link a mega menu contains, flattened — what the hamburger menu lists under that item. */
function megaMenuLinks(cfg: MegaMenuConfig) {
  const links: {key: string; label: string; href: string; openInNewTab?: boolean}[] = []
  for (const f of cfg.features ?? []) {
    if (f.title && f.linkUrl)
      links.push({key: f._key, label: f.title, href: f.linkUrl, openInNewTab: f.openInNewTab})
  }
  for (const l of cfg.logoStrip ?? []) {
    if (l.label && l.href)
      links.push({key: l._key, label: l.label, href: l.href, openInNewTab: l.openInNewTab})
  }
  if (cfg.showButton && cfg.buttonLabel && cfg.buttonLinkUrl)
    links.push({key: 'cta', label: cfg.buttonLabel, href: cfg.buttonLinkUrl})
  return links
}

export default function Header({
  settings,
  customNavPages,
  navLinks,
}: {
  settings: SiteSettings | null
  customNavPages?: CustomNavPage[] | null
  navLinks?: NavLink[] | null
}) {
  const pathname = usePathname()
  const homeLink = settings?.headerLogoRedirect || '/'

  const navItems: NavLink[] =
    navLinks && navLinks.length > 0
      ? navLinks
      : [
          ...FALLBACK_NAV_ITEMS,
          ...(customNavPages || [])
            .filter((page) => page.slug)
            .map((page) => ({
              label: page.navLabel || page.title || page.slug!,
              href: `/${page.slug}`,
              openInNewTab: page.openInNewTab,
            })),
        ]

  // ── Overflow detection ──────────────────────────────────────────────────────
  // The number of nav items is editor-controlled, so the bar collapses to the hamburger exactly when
  // the items stop fitting (not at a fixed breakpoint). Measured in a layout effect so the very
  // first paint already has the right bar — no frame of a clipped desktop nav on a phone.
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Which mega item's links are expanded inside the hamburger menu.
  const [mobileMega, setMobileMega] = useState<string | null>(null)

  useLayoutEffect(() => {
    const check = () => {
      const outer = outerRef.current
      const inner = innerRef.current
      if (!outer || !inner) return
      const collapsed = inner.scrollWidth > outer.clientWidth + 1
      setOverflows(collapsed)
      // The bar no longer collapses (window widened, device rotated): an open hamburger menu has
      // nothing to show, so close it — otherwise it would keep the page scroll-locked.
      if (!collapsed) setMenuOpen(false)
    }
    check()
    const ro = new ResizeObserver(check)
    if (outerRef.current) ro.observe(outerRef.current)
    // Web fonts change text widths after first paint.
    document.fonts?.ready.then(check)
    return () => ro.disconnect()
  }, [navItems.length])

  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // The nav link that opened the mega panel — focus goes back to it when the panel closes with Escape.
  const megaTriggerRef = useRef<HTMLElement | null>(null)
  // How the nav link was last pressed ('touch', 'mouse', 'pen', or '' for the keyboard), and whether
  // its mega panel was already open at that moment. A phone has no hover, so the first tap opens the
  // panel and the second tap follows the link.
  const pressRef = useRef({pointerType: '', wasOpen: false})

  // ── Mega menu state ─────────────────────────────────────────────────────────
  // activeMega = href of the item whose panel is mounted
  // visible    = whether the panel is in its "open" CSS state (drives the transition)
  const [activeMega, setActiveMega] = useState<string | null>(null)
  const [megaVisible, setMegaVisible] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Page behind the hamburger menu doesn't scroll while it is open.
  useScrollLock(menuOpen)

  // Outside tap/click and Escape close the hamburger menu and the mega panel.
  useEffect(() => {
    if (!menuOpen && !activeMega) return
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setMegaVisible(false)
        setTimeout(() => setActiveMega(null), 240)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (menuOpen) {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
      if (activeMega) {
        if (panelRef.current?.contains(document.activeElement)) megaTriggerRef.current?.focus()
        setMegaVisible(false)
        setTimeout(() => setActiveMega(null), 240)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, activeMega])

  // Close the hamburger menu and any open mega panel on route change. Done
  // during render (tracking the previous pathname) rather than in an effect,
  // so the stale open menu never paints for a frame after navigation. Sits
  // here, after both states are declared, because it sets them.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMenuOpen(false)
    setActiveMega(null)
  }

  const openMega = (href: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setActiveMega(href)
    // Defer so the panel is mounted before we flip visible → triggers CSS transition
    requestAnimationFrame(() => setMegaVisible(true))
  }

  const scheduleMegaClose = () => {
    leaveTimer.current = setTimeout(() => {
      setMegaVisible(false)
      // Unmount after transition completes
      setTimeout(() => setActiveMega(null), 240)
    }, 120)
  }

  const cancelMegaClose = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }

  // When switching between mega items, swap immediately
  const switchMega = (href: string) => {
    if (activeMega === href) return
    setActiveMega(href)
    setMegaVisible(true)
  }

  const activeMegaItem = navItems.find((item) => item.href === activeMega && item.showMegaMenu)

  return (
    <header
      ref={headerRef} // A pinned header stays pinned except on short screens (a phone held sideways), where it would take
      // a third of the visible height and leave too little room to read.
      className={
        settings?.stickyHeader
          ? 'sticky top-0 z-50 [@media(max-height:480px)]:relative'
          : 'relative'
      }
    >
      {/* Top Bar — one row on wide screens; on a phone the items wrap onto a second row instead of crowding. */}
      {settings?.topBarEnabled && (
        <div className="chrome-topbar text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5 sm:h-10 sm:flex-nowrap sm:py-0">
            <span className="font-medium">
              {settings.businessHours || 'Open Mon - Fri : 9am-6pm EST'}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
              {settings.phoneNumber && (
                <span>
                  <span className="chrome-muted">{settings.phoneLabel || 'Call Us:'}</span>{' '}
                  <a
                    href={`tel:${settings.phoneNumber.replace(/[^\d+]/g, '')}`}
                    className="tap-target inline-block pointer-coarse:inline-flex pointer-coarse:items-center font-bold chrome-link"
                  >
                    {settings.phoneNumber}
                  </a>
                </span>
              )}
              {settings.headerCta?.label && (
                <Link
                  href={settings.headerCta.endpoint || '/contact'}
                  target={settings.headerCta.openInNewTab ? '_blank' : undefined}
                  className="chrome-btn tap-target text-xs px-4 py-1.5 transition-colors flex items-center gap-1"
                >
                  {settings.headerCta.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <nav className="chrome-nav" aria-label="Main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href={homeLink} className="tap-target flex min-w-0 shrink items-center">
            {settings?.siteLogo ? (
              // `w-auto`: the height is fixed (h-10) and the width follows the logo's own proportions;
              // `max-w-full object-contain` lets it shrink (not push the menu button off-screen) when text is enlarged.
              <SiteImage
                src={settings.siteLogo}
                alt={settings.siteTitle || 'Logo'}
                sizes="logo"
                className="h-10 w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-xl font-bold">{settings?.siteTitle || 'Site'}</span>
            )}
          </Link>

          {/* Nav items */}
          <div ref={outerRef} className="flex-1 overflow-hidden min-w-0 flex justify-end">
            <div
              ref={innerRef}
              className="flex items-center gap-1 w-max"
              style={
                overflows
                  ? {visibility: 'hidden', pointerEvents: 'none', position: 'absolute'}
                  : undefined
              }
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const hasMega = !!item.showMegaMenu
                const isMegaOpen = megaVisible && activeMega === item.href

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (!hasMega) return
                      if (activeMega && activeMega !== item.href) switchMega(item.href)
                      else openMega(item.href)
                    }}
                    onMouseLeave={() => hasMega && scheduleMegaClose()}
                  >
                    <Link
                      href={item.href}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="chrome-nav-link tap-target flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors uppercase tracking-wide whitespace-nowrap"
                      aria-current={isActive ? 'page' : undefined}
                      aria-haspopup={hasMega ? 'true' : undefined}
                      aria-expanded={hasMega ? isMegaOpen : undefined}
                      onPointerDown={(e) => {
                        pressRef.current = {pointerType: e.pointerType, wasOpen: isMegaOpen}
                      }}
                      onClick={(e) => {
                        const {pointerType, wasOpen} = pressRef.current
                        pressRef.current = {pointerType: '', wasOpen: false}
                        // First tap on a mega item (touch) opens its panel; the second tap navigates.
                        if (hasMega && pointerType === 'touch' && !wasOpen) {
                          e.preventDefault()
                          megaTriggerRef.current = e.currentTarget
                          openMega(item.href)
                        }
                      }}
                      onKeyDown={(e) => {
                        // Keyboard: ArrowDown opens the panel and moves into it (Escape closes it).
                        if (hasMega && e.key === 'ArrowDown') {
                          e.preventDefault()
                          megaTriggerRef.current = e.currentTarget
                          openMega(item.href)
                          setTimeout(
                            () => panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus(),
                            80,
                          )
                        }
                      }}
                    >
                      {item.label.toUpperCase()}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Hamburger */}
          {overflows && (
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="shrink-0 flex flex-col justify-center items-center w-11 h-11 gap-1.5 rounded hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)] transition-colors"
            >
              <span
                className={`block h-0.5 w-5 bg-current transition-all duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-all duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Hamburger dropdown — scrolls inside itself when taller than the screen (e.g. a phone held sideways). */}
        {overflows && menuOpen && (
          <div
            id="mobile-menu"
            className="chrome-menu max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const subLinks =
                  item.showMegaMenu && item.megaMenuConfig ? megaMenuLinks(item.megaMenuConfig) : []
                const expanded = mobileMega === item.href
                const linkClass =
                  'chrome-nav-link px-2 py-3 text-sm font-medium uppercase tracking-wide transition-colors'

                // A plain item is one link; a mega item also gets a toggle that lists its links.
                if (subLinks.length === 0) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={`${linkClass} chrome-menu-item last:border-0`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label.toUpperCase()}
                    </Link>
                  )
                }
                return (
                  <div key={item.href} className="chrome-menu-item last:border-0">
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        target={item.openInNewTab ? '_blank' : undefined}
                        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={`${linkClass} flex-1`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label.toUpperCase()}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={`mobile-mega-${item.href}`}
                        aria-label={`${expanded ? 'Hide' : 'Show'} ${item.label} links`}
                        onClick={() => setMobileMega(expanded ? null : item.href)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </button>
                    </div>
                    {expanded && (
                      <ul id={`mobile-mega-${item.href}`} className="flex flex-col pb-2 pl-4">
                        {subLinks.map((l) => (
                          <li key={l.key}>
                            <Link
                              href={l.href}
                              target={l.openInNewTab ? '_blank' : undefined}
                              rel={l.openInNewTab ? 'noopener noreferrer' : undefined}
                              onClick={() => setMenuOpen(false)}
                              className="chrome-nav-link flex min-h-11 items-center px-2 text-sm"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Mega Menu panel — always mounted while activeMega is set, visibility controlled by CSS */}
      {activeMegaItem?.megaMenuConfig && (
        <div ref={panelRef} onMouseEnter={cancelMegaClose} onMouseLeave={scheduleMegaClose}>
          <MegaMenuPanel
            config={activeMegaItem.megaMenuConfig}
            visible={megaVisible}
            onClose={() => {
              setMegaVisible(false)
              setTimeout(() => setActiveMega(null), 240)
            }}
          />
        </div>
      )}
    </header>
  )
}
