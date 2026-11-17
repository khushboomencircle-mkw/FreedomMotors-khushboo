/**
 * How a vehicle is named, priced and labelled on the public site. One place, so the /vehicles
 * listing and the Vehicle Carousel can never disagree about what a vehicle costs or is called.
 * (These rules used to live inside the /vehicles page; they were moved here unchanged.)
 */

export const CONVERSION_LABEL: Record<string, string> = {
  'rear-entry': 'Rear Entry',
  'side-entry': 'Side Entry',
}

/** A dealer feed sometimes uses 0 to mean "not set" rather than leaving the field empty. */
export function moneyOrNull(value?: number): number | null {
  return value != null && value > 0 ? value : null
}

/**
 * Price shown to customers: Selling Price, else Internet Price, else MSRP. The MSRP is shown
 * struck through only when it is higher than the price shown.
 */
export function getVehiclePrice(v: {sellingPrice?: number; internetPrice?: number; msrp?: number}) {
  const price = moneyOrNull(v.sellingPrice) ?? moneyOrNull(v.internetPrice) ?? moneyOrNull(v.msrp)
  const msrp = moneyOrNull(v.msrp)
  const showStruckMsrp = msrp != null && price != null && msrp > price
  return {price, msrp, showStruckMsrp}
}

/** "2025 Toyota Sienna XLE Hybrid" — year, make, model, trim, whichever exist. */
export function vehicleName(v: {year?: number; make?: string; model?: string; trim?: string}) {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ') || 'Vehicle'
}
