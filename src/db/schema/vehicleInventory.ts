import {sql} from 'drizzle-orm'
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import {vehicles} from './vehicles'

/** available / pending / sold. The feed has no status column: a vehicle in the feed is available, one that leaves it is sold. */
export const vehicleInventoryStatus = pgEnum('vehicle_inventory_status', [
  'available',
  'pending',
  'sold',
])

/**
 * vehicleInventory — the live listing state of a vehicle: the part that changes on every sync (prices, status, the
 * dealer it is listed by, when it was last seen in the feed), as opposed to `vehicles`' slowly changing specifications.
 *
 * ONE ROW PER VEHICLE: `vehicleId` is unique. If the same vehicle is ever listed at more than one location, dropping
 * that unique index is the change needed, not a schema rewrite.
 *
 * MONEY IS WHOLE CENTS. $24,999.00 is stored as 2499900, which avoids rounding errors. The feed writes "0" for a price
 * it does not have; the sync turns that into NULL, so "no price" and "free" are never confused.
 *
 * THE PRICES (feed → column): SellingPrice → selling_price_cents, MSRP → msrp_cents, BookValue → book_value_cents,
 * Invoice → invoice_cents, Internet_Price → internet_price_cents, Misc_Price1/2/3 → misc_price_1/2/3_cents.
 * Which price the website shows is a display decision, made in the application, not here.
 *
 * THE DEALER is kept as the feed gives it (name, address, city, state, zip, phone, fax, email), one set per vehicle.
 */
export const vehicleInventory = pgTable(
  'vehicle_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, {onDelete: 'cascade'}),

    status: vehicleInventoryStatus('status').notNull().default('available'),
    /** Feed "DateInStock" (written M/D/YYYY): the day the vehicle arrived. */
    dateInStock: date('date_in_stock'),

    // ── Prices, in whole cents ──
    sellingPriceCents: integer('selling_price_cents'),
    msrpCents: integer('msrp_cents'),
    bookValueCents: integer('book_value_cents'),
    invoiceCents: integer('invoice_cents'),
    internetPriceCents: integer('internet_price_cents'),
    miscPrice1Cents: integer('misc_price_1_cents'),
    miscPrice2Cents: integer('misc_price_2_cents'),
    miscPrice3Cents: integer('misc_price_3_cents'),

    // ── Dealer ──
    dealerName: text('dealer_name'),
    dealerAddress: text('dealer_address'),
    dealerCity: text('dealer_city'),
    dealerState: text('dealer_state'),
    dealerZip: text('dealer_zip'),
    dealerPhone: text('dealer_phone'),
    dealerFax: text('dealer_fax'),
    dealerEmail: text('dealer_email'),

    lastSeenInFeedAt: timestamp('last_seen_in_feed_at', {withTimezone: true}),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vehicle_inventory_vehicle_id_idx').on(table.vehicleId),
    index('vehicle_inventory_status_idx').on(table.status),
    // "Available vehicles, cheapest first" and price-range filters.
    index('vehicle_inventory_status_price_idx').on(table.status, table.sellingPriceCents),

    check(
      'vehicle_inventory_prices_not_negative',
      sql`COALESCE(${table.sellingPriceCents}, 0) >= 0
        AND COALESCE(${table.msrpCents}, 0) >= 0
        AND COALESCE(${table.bookValueCents}, 0) >= 0
        AND COALESCE(${table.invoiceCents}, 0) >= 0
        AND COALESCE(${table.internetPriceCents}, 0) >= 0
        AND COALESCE(${table.miscPrice1Cents}, 0) >= 0
        AND COALESCE(${table.miscPrice2Cents}, 0) >= 0
        AND COALESCE(${table.miscPrice3Cents}, 0) >= 0`,
    ),
  ],
).enableRLS()
