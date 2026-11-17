import {integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid} from 'drizzle-orm/pg-core'

/**
 * vehicles — canonical vehicle identity/specs. One row per vehicle. This is
 * the slowly-changing part of a vehicle's record; anything that changes on
 * every feed sync (price, availability, dealer/location) lives on
 * `vehicleInventory` instead, not here.
 *
 * `vin` and `stockNumber` are both nullable: the task describes the row key
 * as "VIN or stock#", which reads as either one may be the identifier a
 * given vehicle actually has (e.g. an incoming vehicle without a decoded VIN
 * yet), not that both are always present. Both get a unique index — Postgres
 * unique indexes allow multiple NULLs, so this doesn't force every vehicle
 * to have both.
 *
 * NOTE: there is no HomeNet feed integration in this repo yet, so the exact
 * set of spec fields it provides is unconfirmed — the columns below are a
 * representative common set (year/make/model/trim plus the usual spec
 * fields), and `rawFeedData` holds the complete raw payload for this vehicle
 * from its last sync as a catch-all. Once a real feed sample exists, fields
 * worth querying/indexing on their own can be promoted out of `rawFeedData`
 * into typed columns without losing anything already captured.
 */
export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    vin: text('vin'),
    stockNumber: text('stock_number'),

    year: integer('year'),
    make: text('make'),
    model: text('model'),
    trim: text('trim'),
    bodyStyle: text('body_style'),
    exteriorColor: text('exterior_color'),
    interiorColor: text('interior_color'),
    mileage: integer('mileage'),
    transmission: text('transmission'),
    drivetrain: text('drivetrain'),
    fuelType: text('fuel_type'),
    engine: text('engine'),

    /** Full raw feed payload for this vehicle as of its last sync — see the catch-all note above. */
    rawFeedData: jsonb('raw_feed_data'),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vehicles_vin_idx').on(table.vin),
    uniqueIndex('vehicles_stock_number_idx').on(table.stockNumber),
  ],
).enableRLS()
