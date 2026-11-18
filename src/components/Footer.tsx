import Link from 'next/link'
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaPinterest,
} from 'react-icons/fa6'

interface NavLink {
  label: string
  href: string
  openInNewTab?: boolean
}

interface SiteSettings {
  footerLogo?: string
  footerBackgroundImage?: string
  footerBackgroundOverlay?: number
  footerContactTitle?: string
  addressLine1?: string
  addressLine2?: string
  addressMapUrl?: string
  footerPhoneLabel?: string
  footerPhone?: string
  footerTextLabel?: string
  footerTextNumber?: string
  footerEmail?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  pinterestUrl?: string
  copyright?: string
}

export default function Footer({
  settings,
  navLinks,
}: {
  settings: SiteSettings | null
  navLinks?: NavLink[] | null
}) {
  if (!settings) return null

  const hasContact =
    settings.footerContactTitle ||
    settings.addressLine1 ||
    settings.footerPhone ||
    settings.footerEmail

  const addressLines = (
    <>
      {settings.addressLine1 && <p className="font-semibold">{settings.addressLine1}</p>}
      {settings.addressLine2 && <p className="font-semibold">{settings.addressLine2}</p>}
    </>
  )

  // Optional background picture. The theme background color is laid over it (default 60%) so text stays readable.
  const bgOverlay = Math.max(0, Math.min(95, settings.footerBackgroundOverlay ?? 60))

  return (
    <footer className="chrome-footer relative isolate overflow-hidden">
      {settings.footerBackgroundImage && (
        <>
          <SiteImage
            src={settings.footerBackgroundImage}
            alt=""
            sizes="background"
            fill
            className="object-cover -z-20"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: `color-mix(in srgb, var(--theme-bg, #1a1a1a) ${bgOverlay}%, transparent)`,
            }}
          />
        </>
      )}
      {/* Main footer content */}
      {(hasContact || settings.footerLogo) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Logo + Contact Info */}
            <div>
              {settings.footerLogo && (
                <img src={settings.footerLogo} alt="Logo" className="h-12 mb-8" />
              )}

              {settings.footerContactTitle && (
                <h3 className="chrome-strong chrome-heading text-lg tracking-wide mb-6">
                  {settings.footerContactTitle}
                </h3>
              )}

              {(settings.addressLine1 || settings.addressLine2) && (
                <div className="mb-4">
                  {/* With a map link set, the address text itself is the link; the URL is never shown. */}
                  {settings.addressMapUrl ? (
                    <a
                      href={settings.addressMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chrome-strong chrome-link block w-fit hover:underline"
                    >
                      {addressLines}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <div className="chrome-strong">{addressLines}</div>
                  )}
                </div>
              )}

              {settings.footerPhone && (
                <p className="mb-1">
                  <span className="chrome-muted">
                    {settings.footerPhoneLabel || 'Call us Today:'}
                  </span>{' '}
                  <a
                    href={`tel:${settings.footerPhone.replace(/[^\d+]/g, '')}`}
                    className="chrome-strong chrome-link font-semibold"
                  >
                    {settings.footerPhone}
                  </a>
                </p>
              )}

              {settings.footerTextNumber && (
                <p className="mb-4">
                  <span className="chrome-muted">{settings.footerTextLabel || 'Text us Now:'}</span>{' '}
                  <a
                    href={`sms:${settings.footerTextNumber.replace(/[^\d+]/g, '')}`}
                    className="chrome-strong chrome-link font-semibold"
                  >
                    {settings.footerTextNumber}
                  </a>
                </p>
              )}

              {settings.footerEmail && (
                <a href={`mailto:${settings.footerEmail}`} className="chrome-strong chrome-link">
                  {settings.footerEmail}
                </a>
              )}
            </div>

            {/* Right: reserved for newsletter form (added later) */}
            <div />
          </div>
        </div>
      )}

      {/* Social Links — each platform renders only when its own URL is set; no shared fallback icon/character. */}
      {(settings.facebookUrl ||
        settings.instagramUrl ||
        settings.twitterUrl ||
        settings.linkedinUrl ||
        settings.youtubeUrl ||
        settings.tiktokUrl ||
        settings.pinterestUrl) && (
        <div className="chrome-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center gap-4">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebook size={20} />
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram size={20} />
                </a>
              )}
              {settings.twitterUrl && (
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="Twitter / X"
                >
                  <FaXTwitter size={20} />
                </a>
              )}
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={20} />
                </a>
              )}
              {settings.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <FaYoutube size={20} />
                </a>
              )}
              {settings.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="TikTok"
                >
                  <FaTiktok size={20} />
                </a>
              )}
              {settings.pinterestUrl && (
                <a
                  href={settings.pinterestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-social w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="Pinterest"
                >
                  <FaPinterest size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar — nav links + copyright */}
      {(navLinks?.length || settings.copyright) && (
        <div className="chrome-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {navLinks && navLinks.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 flex-wrap">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="chrome-muted-link text-sm transition-colors uppercase tracking-wide"
                  >
                    {link.label.toUpperCase()}
                  </Link>
                ))}
              </div>
            )}
            {settings.copyright && (
              <p className="chrome-subtle text-center text-xs mt-4">{settings.copyright}</p>
            )}
          </div>
        </div>
      )}
    </footer>
  )
}
