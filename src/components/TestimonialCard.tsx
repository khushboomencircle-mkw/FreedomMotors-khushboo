import ClampedQuote from './ClampedQuote'

/** One testimonial as returned by SECTION_PROJECTION (sanity/queries.ts). */
export interface Testimonial {
  _key: string
  quote?: string
  name?: string
  role?: string
  rating?: number
  source?: string
  photo?: {url?: string; alt?: string}
}

/** Keeps only items that have both required fields — drafts with a gap never render half a card. */
export function visibleTestimonials(items?: Testimonial[]): Testimonial[] {
  return (items || []).filter((t) => t?.quote?.trim() && t?.name?.trim())
}

// Theme variables with neutral fallbacks derived from the section's own text color, so the card
// reads correctly on a light or dark section (Site Theme, Section Theme, or neither) with no
// colors pinned here.
const SURFACE = 'var(--theme-surface, color-mix(in srgb, currentColor 6%, transparent))'
const BORDER = 'var(--theme-border, color-mix(in srgb, currentColor 18%, transparent))'
const MUTED = 'var(--theme-muted, color-mix(in srgb, currentColor 70%, transparent))'
const STAR = 'var(--theme-accent, var(--theme-primary, #f59e0b))'

/** The Sanity CDN resizes on request — avatars are tiny, so never download the full original. */
function avatarSrc(url: string): string {
  return url.includes('cdn.sanity.io') ? `${url}?w=96&h=96&fit=crop&auto=format` : url
}

function Stars({rating}: {rating: number}) {
  const value = Math.min(5, Math.max(1, Math.round(rating)))
  return (
    // The visible stars are decorative; the label carries the meaning for screen readers.
    <span
      role="img"
      aria-label={`Rated ${value} out of 5`}
      className="inline-flex gap-0.5"
      style={{color: STAR}}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          aria-hidden
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill={i <= value ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinejoin="round"
          opacity={i <= value ? 1 : 0.4}
        >
          <path d="M10 1.8l2.55 5.4 5.9.75-4.35 4.1 1.1 5.85L10 15.0l-5.2 2.9 1.1-5.85L1.55 7.95l5.9-.75L10 1.8z" />
        </svg>
      ))}
    </span>
  )
}

function Avatar({name, photo}: {name: string; photo?: Testimonial['photo']}) {
  if (photo?.url) {
    return (
      <img
        src={avatarSrc(photo.url)}
        alt={photo.alt || ''}
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    )
  }
  // No photo: first letter of the name. Decorative — the name sits right beside it.
  const initial = Array.from(name.trim())[0]?.toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
      style={{background: 'color-mix(in srgb, currentColor 12%, transparent)'}}
    >
      {initial}
    </span>
  )
}

/**
 * One customer quote. Used by the Grid and Single-featured layouts directly and by
 * TestimonialsSlider (client). Has no hooks of its own, so it works in both worlds.
 */
export default function TestimonialCard({
  testimonial,
  showRatings = true,
  variant = 'card',
}: {
  testimonial: Testimonial
  showRatings?: boolean
  variant?: 'card' | 'featured'
}) {
  const {quote = '', name = '', role, rating, source, photo} = testimonial
  const featured = variant === 'featured'
  const hasRating = showRatings && typeof rating === 'number' && rating >= 1

  return (
    <figure
      className={
        featured
          ? 'm-0 mx-auto flex max-w-3xl flex-col items-center gap-5 text-center'
          : 'm-0 flex h-full flex-col gap-4 p-6 sm:p-8'
      }
      style={
        featured
          ? undefined
          : {
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 'var(--theme-card-radius, 12px)',
            }
      }
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={featured ? 'h-10 w-10' : 'h-7 w-7'}
        fill="currentColor"
        style={{color: 'var(--theme-primary, currentColor)', opacity: 0.85}}
      >
        <path d="M9.4 5C5.8 6.6 3.5 9.7 3.5 13.6V19h6.2v-6H6.6c.1-2.1 1.3-3.9 3.4-5.1L9.4 5zm10 0c-3.6 1.6-5.9 4.7-5.9 8.6V19h6.2v-6h-3.1c.1-2.1 1.3-3.9 3.4-5.1L19.4 5z" />
      </svg>

      {(hasRating || source) && (
        <div className={`flex flex-wrap items-center gap-3 ${featured ? 'justify-center' : ''}`}>
          {hasRating && <Stars rating={rating!} />}
          {source && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs"
              style={{border: `1px solid ${BORDER}`, color: MUTED}}
            >
              {source}
            </span>
          )}
        </div>
      )}

      <ClampedQuote
        text={quote}
        lines={featured ? 10 : 6}
        className={featured ? 'text-xl leading-relaxed sm:text-2xl' : 'text-base leading-relaxed'}
      />

      <figcaption
        className={`flex items-center gap-3 ${featured ? 'justify-center' : 'mt-auto pt-2'}`}
      >
        <Avatar name={name} photo={photo} />
        <span className={featured ? 'text-left' : ''}>
          <span className="block font-semibold">{name}</span>
          {role && (
            <span className="block text-sm" style={{color: MUTED}}>
              {role}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  )
}
