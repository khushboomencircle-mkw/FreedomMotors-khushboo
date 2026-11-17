import {sql} from 'drizzle-orm'
import {
  boolean,
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

/**
 * A photo only counts toward "this vehicle can go live" once it's `ready`.
 * `pending` → not yet downloaded/processed; `processing` → download/resize in
 * flight; `ready` → safe to serve; `failed` → the sync job's retry logic
 * (out of scope here) gave up on it. The actual sync job that moves a row
 * through these states is a separate, later task — this column is the hook
 * it writes into.
 */
export const vehicleImageStatus = pgEnum('vehicle_image_status', [
  'pending',
  'processing',
  'ready',
  'failed',
])

/**
 * vehicleImages — one row per photo. `storagePath` is a path, not a full URL
 * (per the earlier decision to build URLs in one place, not store them
 * per-row), so the storage provider/CDN can change without a data migration.
 *
 * `checksum` lets the twice-daily sync tell a photo is unchanged without
 * re-downloading it: compare the feed's photo hash (or a hash computed from
 * the downloaded bytes, depending on what the sync job ends up doing) against
 * this column before doing any work.
 *
 * Deliberately NOT included: alt text. Confirm before adding it — it's
 * unclear whether the HomeNet feed provides per-photo alt text at all, or
 * whether it should instead be generated from the vehicle's own
 * year/make/model/trim at render time (in which case it doesn't belong on
 * this row at all). Flagging rather than guessing either way.
 *
 * Also deliberately NOT included: per-photo retry count/last-attempt
 * timestamp. The task scopes per-photo sync bookkeeping to live on this
 * table (not a separate queue table), but the actual retry behavior is part
 * of the sync job itself, which is out of scope for this task — add those
 * columns alongside whichever retry strategy the sync job actually ends up
 * needing, rather than guessing the shape now.
 */
export const vehicleImages = pgTable(
  'vehicle_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, {onDelete: 'cascade'}),

    storagePath: text('storage_path').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isMain: boolean('is_main').notNull().default(false),
    status: vehicleImageStatus('status').notNull().default('pending'),
    checksum: text('checksum'),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    index('vehicle_images_vehicle_id_idx').on(table.vehicleId),
    index('vehicle_images_status_idx').on(table.status),
    // At most one main photo per vehicle — a partial unique index rather
    // than a plain unique constraint, since `is_main = false` must be
    // allowed on every other row for the same vehicle.
    uniqueIndex('vehicle_images_one_main_per_vehicle_idx')
      .on(table.vehicleId)
      // `eq(table.isMain, true)` would bind `true` as a query parameter
      // ($1) instead of inlining it — invalid in a migration's raw DDL.
      // Writing `true` as a literal in the template (not interpolated)
      // generates a real `WHERE ... = true` clause.
      .where(sql`${table.isMain} = true`),
  ],
).enableRLS()
