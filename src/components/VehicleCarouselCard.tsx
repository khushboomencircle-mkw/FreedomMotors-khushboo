import Link from 'next/link'
import {Gauge} from 'lucide-react'
import {CONVERSION_LABEL, getVehiclePrice, vehicleName} from '@/lib/vehicleDisplay'

/** One vehicle as returned by the Vehicle Carousel part of SECTION_PROJECTION (sanity/vehicleQueries.ts). */
export interface CarouselVehicle {
  _id: string
  slug?: string
  year?: number
  make?: string
  model?: string
  trim?: string
  sellingPrice?: number
  internetPrice?: number
  msrp?: number
  miles?: number
  conversionType?: string
  image?: string
}

// Theme variables with neutral fallbacks drawn from the section's own text color, so the card
// reads on a light or dark section (Site Theme, Section Theme, or neither) with nothing pinned.
const SURFACE = 'var(--theme-surface, color-mix(in srgb, currentColor 5%, transparent))'
const BORDER = 'var(--theme-border, color-mix(in srgb, currentColor 15%, transparent))'
const MUTED = 'var(--theme-muted, color-mix(in srgb, currentColor 65%, transparent))'

/** The Sanity CDN resizes on request — a card is never wider than ~640px, so don't send the original. */
function cardImageSrc(url: string): string {
  return url.includes('cdn.sanity.io') ? `${url}?w=640&auto=format` : url
}

/**
 * A vehicle card for the carousel. Name, price and MSRP-strike rules come from the same helpers
 * as the /vehicles listing (lib/vehicleDisplay.ts). The whole card is one link, so a tap or click
 * anywhere on it opens the vehicle. No hooks, so it works inside the client-side carousel.
 */
export default function VehicleCarouselCard({
  vehicle: v,
  fallbackImageUrl,
}: {
  vehicle: CarouselVehicle
  fallbackImageUrl: string
}) {
  const name = vehicleName(v)
  const {price, msrp, showStruckMsrp} = getVehiclePrice(v)
  const saving = showStruckMsrp ? msrp! - price! : null
  const conversionLabel = v.conversionType ? CONVERSION_LABEL[v.conversionType] : undefined

  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/10">
        <img
          src={v.image ? cardImageSrc(v.image) : fallbackImageUrl}
          // The vehicle's name is right below as the link text, so the photo adds nothing for
          // screen readers.
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {conversionLabel && (
          // A badge on top of a photo needs contrast against any photo, so it is a dark
          // translucent chip with white text rather than a theme color.
          <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {conversionLabel}
          </span>
        )}
        {saving != null && (
          // Same "text that sits on a colored surface" pairing the /vehicles Featured badge uses.
          <span className="absolute right-2 top-2 rounded bg-[var(--theme-primary,#16a34a)] px-2 py-1 text-[11px] font-bold text-[var(--theme-button-text,#ffffff)]">
            Save ${saving.toLocaleString()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug">{name}</h3>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex flex-col">
            {price != null ? (
              <>
                {showStruckMsrp && (
                  <span className="text-xs line-through" style={{color: MUTED}}>
                    ${msrp!.toLocaleString()}
                  </span>
                )}
                <span className="text-lg font-bold text-[var(--theme-primary,currentColor)]">
                  ${price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-sm" style={{color: MUTED}}>
                Call for price
              </span>
            )}
          </div>

          {v.miles != null && (
            <span className="inline-flex items-center gap-1 text-xs" style={{color: MUTED}}>
              <Gauge className="h-3.5 w-3.5" aria-hidden />
              {v.miles.toLocaleString()} mi
            </span>
          )}
        </div>
      </div>
    </>
  )

  const cardClass =
    'group flex h-full flex-col overflow-hidden rounded-[var(--theme-card-radius,12px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary,currentColor)]'
  const cardStyle = {background: SURFACE, border: `1px solid ${BORDER}`}

  // A vehicle without a slug has nowhere to link (same as the listing's disabled "Details").
  return v.slug ? (
    <Link href={`/vehicles/${v.slug}`} draggable={false} className={cardClass} style={cardStyle}>
      {body}
    </Link>
  ) : (
    <div className={cardClass} style={cardStyle}>
      {body}
    </div>
  )
}
