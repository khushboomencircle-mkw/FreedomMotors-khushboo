import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import {getVehicleBySlug, getVehicleDetailPage} from '@/sanity/queries'
import PageSection, {Section} from '@/components/PageSection'
import {splitAroundStaticSection} from '@/lib/staticSection'
import RichText from '@/components/RichText'
import {seoToMetadata} from '@/lib/seo'
import VehicleImageGallery from '@/components/VehicleImageGallery'

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>
}): Promise<Metadata> {
  const {slug} = await params
  const vehicle = await getVehicleBySlug(slug)

  if (!vehicle) return {}

  return seoToMetadata(vehicle.seo)
}

// Colors here read the Site Theme's CSS vars (set on :root in layout.tsx
// whenever Site Settings' Theme is enabled), with a fallback matching this
// block's original hardcoded dark look for when it isn't — same pattern
// PageSection.tsx already uses for CMS-authored sections. This block is the
// one piece of a Vehicle Detail page that isn't CMS-authored (it's the
// Static Section placeholder's built-in content), so it never went through
// that mechanism until now.
function Spec({label, value}: {label: string; value?: string | number | null}) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex flex-col">
      <span
        className="text-xs uppercase tracking-wider"
        style={{color: 'var(--theme-muted, #6b7280)'}}
      >
        {label}
      </span>
      <span className="text-sm font-medium" style={{color: 'var(--theme-text, #ffffff)'}}>
        {value}
      </span>
    </div>
  )
}

async function VehicleContent({slug}: {slug: string}) {
  const [vehicle, detailPage] = await Promise.all([
    getVehicleBySlug(slug),
    getVehicleDetailPage(),
  ])

  if (!vehicle) {
    notFound()
  }

  const name =
    [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') ||
    'Vehicle'
  const price = vehicle.sellingPrice ?? vehicle.internetPrice ?? vehicle.msrp

  const {before, after, showStatic} = splitAroundStaticSection<Section>(detailPage?.sections)

  return (
    <div className="w-full">
      {/* Editor-built sections placed before the vehicle specs (Static Section
          placeholder), if an editor chose to position any there. */}
      {before.map((section: Section) => (
        <PageSection key={section._key} section={section} />
      ))}

      {/* Header */}
      {showStatic && (
      <div style={{backgroundColor: 'var(--theme-bg, #0a0a0a)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Image */}
          <VehicleImageGallery mainImage={vehicle.mainImage} mainImageAlt={name} gallery={vehicle.gallery} />

          {/* Summary */}
          <div>
            {vehicle.stockType && (
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--theme-button-bg, #dc2626)',
                  color: 'var(--theme-button-text, #ffffff)',
                }}
              >
                {vehicle.stockType}
              </span>
            )}
            <h1
              className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{color: 'var(--theme-text, #ffffff)'}}
            >
              {name}
            </h1>

            {price != null && (
              // theme-text, not theme-primary: textColor is the field actually
              // paired with backgroundColor in this theme system (clean()/
              // resolveGlobalTheme() don't enforce contrast between any other
              // two fields) — primaryColor has no guaranteed relationship to
              // the background this sits on, and can coincide with it.
              <p className="mt-3 text-3xl font-bold" style={{color: 'var(--theme-text, #ef4444)'}}>
                ${Number(price).toLocaleString()}
              </p>
            )}

            {vehicle.description && (
              <RichText
                value={vehicle.description}
                className="mt-4 leading-relaxed"
                style={{color: 'var(--theme-muted, #d1d5db)'}}
              />
            )}

            {/* Key specs */}
            <div
              className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t pt-6"
              style={{borderColor: 'var(--theme-border, rgba(255,255,255,0.1))'}}
            >
              <Spec label="Stock #" value={vehicle.stock} />
              <Spec label="VIN" value={vehicle.vin} />
              <Spec label="Miles" value={vehicle.miles != null ? Number(vehicle.miles).toLocaleString() : undefined} />
              <Spec label="Body" value={vehicle.body} />
              <Spec label="Trim" value={vehicle.trim} />
              <Spec label="Doors" value={vehicle.doors} />
              <Spec label="Transmission" value={vehicle.transmission} />
              <Spec label="Drivetrain" value={vehicle.drivetrain} />
              <Spec label="Fuel" value={vehicle.fuelType} />
              <Spec label="Ext. Color" value={vehicle.exteriorColor} />
              <Spec label="Int. Color" value={vehicle.interiorColor} />
              <Spec label="City / Hwy MPG" value={vehicle.cityMpg && vehicle.highwayMpg ? `${vehicle.cityMpg} / ${vehicle.highwayMpg}` : undefined} />
            </div>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* Shared sections from the Vehicle Detail Page template, after the
          vehicle specs (or from the top, if the Static Section placeholder
          was positioned before them above). */}
      <div className="w-full">
        {after.map((section: Section) => (
          <PageSection key={section._key} section={section} />
        ))}
      </div>
    </div>
  )
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{slug: string}>
}) {
  const {slug} = await params

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<p className="text-gray-400 text-center py-24">Loading...</p>}>
        <VehicleContent slug={slug} />
      </Suspense>
    </div>
  )
}
