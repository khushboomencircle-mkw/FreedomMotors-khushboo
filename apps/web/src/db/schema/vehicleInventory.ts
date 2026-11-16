import {index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid} from 'drizzle-orm/pg-core'
import {vehicles} from './vehicles'

/** available/pending/sold, per the task spec. */
export const vehicleInventoryStatus = pgEnum('vehicle_inventory_status', [
  'available',
  'pending',
  'sold',
])

/**
 * vehicleInventory — the feed-driven live listing state for a vehicle: the
 * part that changes on every sync (price, availability, dealer/location,
 * when it was last seen in the feed), as opposed to `vehicles`' slowly-
 * changing specs.
 *
 * `vehicleId` is UNIQUE, defaulting this to a 1:1 relationship with
 * `vehicles` per the task's instruction ("default to 1:1 ... unless you find
 * a concrete reason ... flag it rather than assume"). There's no HomeNet
 * feed sample in this repo to check against, so this is the default, not a
 * confirmed decision — flagging rather than assuming a multi-row-per-vehicle
 * shape (e.g. the same vehicle listed at more than one location) is ever
 * needed. If it turns out to be, the fix is dropping this unique constraint,
 * not a schema rewrite.
 */
export const vehicleInventory = pgTable(
  'vehicle_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, {onDelete: 'cascade'}),

    status: vehicleInventoryStatus('status').notNull().default('available'),
    /** Cents, not dollars — avoids float rounding on money. $24,999.00 is stored as 2499900. */
    priceCents: integer('price_cents'),

    dealerName: text('dealer_name'),
    dealerLocation: text('dealer_location'),

    lastSeenInFeedAt: timestamp('last_seen_in_feed_at', {withTimezone: true}),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vehicle_inventory_vehicle_id_idx').on(table.vehicleId),
    index('vehicle_inventory_status_idx').on(table.status),
  ],
).enableRLS()
