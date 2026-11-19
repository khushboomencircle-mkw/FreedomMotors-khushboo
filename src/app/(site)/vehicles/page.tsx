import type {Metadata} from 'next'
import Link from 'next/link'
import {getVehiclesPage, getAllVehicles} from '@/sanity/queries'
import {Suspense} from 'react'
import PageSection, {Section} from '@/components/PageSection'
import {sanityDocOf} from '@/lib/sanityDoc'
import PageCss from '@/components/PageCss'
import {pageCssId} from '@/lib/cssPolicy'
import {splitAroundStaticSection} from '@/lib/staticSection'
import RichText from '@/components/RichText'
import SiteImage from '@/components/SiteImage'
import {seoToMetadata} from '@/lib/seo'
import VehicleSearchBar, {type ActiveFilter} from '@/components/VehicleSearchBar'
import VehicleFilterSidebar from '@/components/VehicleFilterSidebar'
import VehiclePagination, {PAGE_SIZE_OPTIONS} from '@/components/VehiclePagination'
import LoadingOverlay from '@/components/LoadingOverlay'
import {CONVERSION_LABEL, getVehiclePrice, vehicleName} from '@/lib/vehicleDisplay'
import {Video, Banknote, ArrowRight} from 'lucide-react'

// Default items per page — the visitor can change this (see VehiclePagination's
// "Show: 10 25 50 100 per page"), which updates the real ?perPage= URL param.
const DEFAULT_PAGE_SIZE = 10

/** The querystring for this page with some params overridden (page/perPage), preserving everything else (e.g. active filters). */
function buildVehiclesHref(
  params: {[key: string]: string | string[] | undefined},
  overrides: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams()
  for (const [key, raw] of Object.entries(params)) {
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value) sp.set(key, value)
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) sp.delete(key)
    else sp.set(key, value)
  }
  const qs = sp.toString()
  return qs ? `/vehicles?${qs}` : '/vehicles'
}

// Recognized filter query params, matching the sidebar's categories
// (VehicleFilterSidebar) — e.g. /vehicles?make=Kia&drivetrain=FWD. Another
// page can link here with these pre-set; this only displays them as active
// filter chips (VehicleSearchBar) and lets each be removed, it doesn't yet
// filter the list itself — see the note on VehicleListing.
const FILTER_PARAM_LABELS: Record<string, string> = {
  make: 'Make',
  model: 'Models',
  price: 'Price',
  year: 'Year',
  bodyType: 'Body Type',
  conversionLocation: 'Conversion Location',
  rampOperation: 'Ramp Operation',
  rampWidth: 'Ramp Width',
  driverOptions: 'Driver Options',
  fuelType: 'Fuel Type',
  drivetrain: 'Drivetrain',
}

function parseActiveFilters(searchParams: {
  [key: string]: string | string[] | undefined
}): ActiveFilter[] {
  const filters: ActiveFilter[] = []
  for (const [key, label] of Object.entries(FILTER_PARAM_LABELS)) {
    const raw = searchParams[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value) filters.push({key, label, value})
  }
  return filters
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getVehiclesPage()

  if (!page) return {title: 'Vehicles'}

  return seoToMetadata(page.seo)
}

interface VehicleCard {
  slug?: string
  year?: number
  make?: string
  model?: string
  trim?: string
  body?: string
  stock?: string
  vin?: string
  sellingPrice?: number
  internetPrice?: number
  msrp?: number
  miles?: number
  exteriorColor?: string
  conversionType?: string
  drivetrain?: string
  transmission?: string
  transmissionDescription?: string
  conversionWarranty?: string
  doors?: number
  isFeatured?: boolean
  mainImage?: string
}

function SpecRow({label, value}: {label: string; value: string}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[var(--theme-muted,#6b7280)]">
        {label}
      </dt>
      <dd className="font-medium text-[var(--theme-text,#ffffff)]">{value}</dd>
    </div>
  )
}

/** Visual only, by design — see the note on VehicleSearchBar. */
function StaticPillButton({icon: Icon, children}: {icon: typeof Video; children: React.ReactNode}) {
  return (
    <button
      type="button"
      className="tap-target inline-flex items-center gap-1.5 rounded-[var(--theme-button-radius,9999px)] border border-[var(--theme-border,rgba(255,255,255,0.15))] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text,#e5e7eb)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

function VehicleCardRow({v}: {v: VehicleCard}) {
  const name = vehicleName(v)
  const {price, msrp, showStruckMsrp} = getVehiclePrice(v)
  const conversionLabel = v.conversionType ? CONVERSION_LABEL[v.conversionType] : undefined
  const transLabel = v.transmissionDescription || v.transmission

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.1))] bg-[var(--theme-surface,rgba(255,255,255,0.02))] p-4 sm:flex-row sm:p-5">
      <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden rounded-lg bg-gray-800 sm:w-64">
        {v.mainImage ? (
          <SiteImage
            src={v.mainImage}
            alt={name}
            sizes="vehicleListing"
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-800" />
        )}
        {v.isFeatured && (
          // Text color is the theme's own "text that sits on a colored
          // surface" pairing (--theme-button-text), not a hardcoded white —
          // if a theme sets a light accent color, white text here would be
          // unreadable against it.
          <span className="absolute left-2 top-2 rounded bg-[var(--theme-primary,#dc2626)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-button-text,#ffffff)]">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div>
          <h3 className="text-lg font-bold leading-tight text-[var(--theme-text,#ffffff)]">
            {name}
          </h3>
          <div className="mt-1.5 h-0.5 w-10 bg-[var(--theme-primary,#dc2626)]" aria-hidden />
        </div>

        {(v.vin || v.stock) && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--theme-muted,#9ca3af)]">
            {v.vin && <span>VIN: {v.vin}</span>}
            {v.stock && <span>Stock #: {v.stock}</span>}
          </div>
        )}

        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {conversionLabel && <SpecRow label="Conversion Type" value={conversionLabel} />}
          {v.drivetrain && <SpecRow label="Drivetrain" value={v.drivetrain} />}
          {v.miles != null && <SpecRow label="Mileage" value={`${v.miles.toLocaleString()} mi`} />}
          {transLabel && <SpecRow label="Trans" value={transLabel} />}
          {v.conversionWarranty && (
            <SpecRow label="Conversion Warranty" value={v.conversionWarranty} />
          )}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <StaticPillButton icon={Video}>Request a Virtual Demo</StaticPillButton>
          <StaticPillButton icon={Banknote}>Value Your Trade</StaticPillButton>
        </div>

        <div className="mt-4 flex flex-1 items-end justify-between gap-4 border-t border-[var(--theme-border,rgba(255,255,255,0.1))] pt-4">
          <div>
            {price != null ? (
              <div className="flex items-baseline gap-2">
                {showStruckMsrp && (
                  <span className="text-sm text-[var(--theme-muted,#6b7280)] line-through">
                    ${msrp!.toLocaleString()}
                  </span>
                )}
                <span className="text-xl font-bold text-[var(--theme-primary,#ef4444)]">
                  ${price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[var(--theme-muted,#9ca3af)]">Call for price</span>
            )}
          </div>

          {/* The one real link on this card — everything else above is static. */}
          {v.slug ? (
            <Link
              href={`/vehicles/${v.slug}`}
              className="tap-target btn-border inline-flex items-center gap-1.5 rounded-[var(--theme-button-radius,9999px)] bg-[var(--theme-button-bg,#dc2626)] px-4 py-2 text-sm font-bold text-[var(--theme-button-text,#ffffff)] transition-opacity hover:opacity-90"
            >
              Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="btn-border inline-flex items-center gap-1.5 rounded-[var(--theme-button-radius,9999px)] bg-[var(--theme-button-bg,#dc2626)]/50 px-4 py-2 text-sm font-bold text-[var(--theme-button-text,#ffffff)]/70">
              Details
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Vehicle inventory listing — static design matching the reference layout
 * (freedommotors.com/handicap-vehicles-for-sale). Sanity is the data source
 * for now; Postgres is planned to replace it later, which is why the layout
 * and card markup are kept independent of how the data is fetched.
 *
 * Deliberately not wired up yet: the sidebar filters, search, sort, and
 * pagination are all visual placeholders (see their own components for why).
 * The two exceptions, both requested explicitly: Reset actually clears the
 * search box, and Details actually links to the vehicle's own page.
 *
 * Colors throughout (here and in the components this renders) follow the
 * Site Theme via var(--theme-*, fallback) — the same pattern PageSection
 * uses for editor-built sections. Each falls back to this page's own static
 * dark design when no Site Theme is enabled, so nothing changes for a site
 * that hasn't set one up.
 */
function VehicleListing({
  vehicles,
  activeFilters,
  currentPage,
  perPage,
  rawParams,
}: {
  vehicles: VehicleCard[]
  activeFilters: ActiveFilter[]
  currentPage: number
  perPage: number
  rawParams: {[key: string]: string | string[] | undefined}
}) {
  if (!vehicles.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--theme-muted,#9ca3af)]">
          No vehicles available right now. Check back soon.
        </p>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(vehicles.length / perPage))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const pageItems = vehicles.slice((safePage - 1) * perPage, safePage * perPage)
  const rangeStart = pageItems.length ? (safePage - 1) * perPage + 1 : 0
  const rangeEnd = (safePage - 1) * perPage + pageItems.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--theme-text,#6b7280)]/70">
        <Link
          href="/"
          className="tap-target inline-block pointer-coarse:inline-flex pointer-coarse:items-center hover:text-[var(--theme-primary,#ef4444)]"
        >
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--theme-text,#d1d5db)]">
          Wheelchair Accessible Vehicles for Sale
        </span>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row">
        <VehicleFilterSidebar />

        <div className="min-w-0 flex-1">
          <VehicleSearchBar
            totalCount={vehicles.length}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            activeFilters={activeFilters}
          />

          <div className="mt-6 flex flex-col gap-5">
            {pageItems.map((v, i) => (
              <VehicleCardRow key={v.slug || i} v={v} />
            ))}
          </div>

          <VehiclePagination
            currentPage={safePage}
            totalPages={totalPages}
            perPage={perPage}
            getPageHref={(p) => buildVehiclesHref(rawParams, {page: String(p)})}
            getPerPageHref={(size) =>
              buildVehiclesHref(rawParams, {perPage: String(size), page: undefined})
            }
          />
        </div>
      </div>
    </div>
  )
}

async function PageContent({
  searchParams,
}: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  const [page, vehicles, params] = await Promise.all([
    getVehiclesPage(),
    getAllVehicles(),
    searchParams,
  ])
  const activeFilters = parseActiveFilters(params)

  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page
  const currentPage = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const rawPerPage = Array.isArray(params.perPage) ? params.perPage[0] : params.perPage
  const requestedPerPage = parseInt(rawPerPage ?? '', 10)
  const perPage = PAGE_SIZE_OPTIONS.includes(requestedPerPage)
    ? requestedPerPage
    : DEFAULT_PAGE_SIZE

  const {before, after, showStatic} = splitAroundStaticSection<Section>(page?.sections)

  return (
    <div className="w-full">
      <PageCss id="vehicles" css={page?.customCss} />
      {page?.pageTitle && (
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-10 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--theme-text,#ffffff)] sm:text-5xl">
            {page.pageTitle}
          </h1>
          {page.pageDescription && (
            <RichText
              value={page.pageDescription}
              className="mx-auto mt-4 max-w-3xl text-lg text-[var(--theme-text,#d1d5db)]"
            />
          )}
        </div>
      )}

      {/* Editor-built sections, split around the Static Section placeholder
          (if any) so the built-in vehicle listing renders at the position —
          and only when active — an editor chose in Sanity. */}
      {before.map((section: Section, i: number) => (
        <PageSection
          key={section._key}
          section={section}
          isFirst={i === 0}
          doc={sanityDocOf(page)}
        />
      ))}

      {showStatic && (
        <VehicleListing
          vehicles={(vehicles as VehicleCard[]) || []}
          activeFilters={activeFilters}
          currentPage={currentPage}
          perPage={perPage}
          rawParams={params}
        />
      )}

      {after.map((section: Section) => (
        <PageSection key={section._key} section={section} doc={sanityDocOf(page)} />
      ))}
    </div>
  )
}

export default function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  return (
    <div
      data-page-css={pageCssId('vehicles')}
      className="min-h-dvh overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<LoadingOverlay />}>
        <PageContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
