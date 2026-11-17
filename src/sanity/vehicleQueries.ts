/**
 * Vehicle rules shared by every query that lists vehicles — the /vehicles page (getAllVehicles)
 * and the Vehicle Carousel section — so they can't disagree about what "available" means. Plain
 * strings (no imports) so they can be tested alone. Evaluated per `vehicle` document.
 */

/** A vehicle is shown publicly unless it was explicitly switched off ("Available" in Studio). */
export const VEHICLE_AVAILABLE = `isAvailable != false`

/** Only what a carousel card shows — no `...` spread, and just the one image URL. */
const VEHICLE_CAROUSEL_CARD = `{
  _id,
  "slug": slug.current,
  year, make, model, trim,
  sellingPrice, internetPrice, msrp,
  miles, conversionType,
  "image": coalesce(mainImage.image.asset->url, gallery[0].image.asset->url)
}`

/**
 * Spread into SECTION_PROJECTION. A Vehicle Carousel stores references to the vehicles the editor
 * picked; this follows them in the picked order and keeps only the ones that still exist and are
 * available (a removed or unavailable vehicle never matches, so its photos are never requested).
 * In a draft read a picked-but-unpublished vehicle still resolves, so editors can preview it.
 */
export const VEHICLE_CAROUSEL_PROJECTION = `
  // $preview is true only for draft reads (see client.ts): lets an empty carousel show a placeholder in preview.
  _type == "vehicleCarouselSection" => {
    "isPreview": $preview,
    "vehicles": (vehicles[]->)[defined(_id) && ${VEHICLE_AVAILABLE}]${VEHICLE_CAROUSEL_CARD}
  },`
