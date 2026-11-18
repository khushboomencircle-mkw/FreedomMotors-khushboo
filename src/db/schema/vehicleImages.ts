import {sql} from 'drizzle-orm'
import {
  boolean,
  check,
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
 * Where a photo is in its life. A photo only counts toward "this vehicle can go live" once it is `ready`.
 *  pending     → known from the feed, not downloaded yet
 *  processing  → being downloaded and stored
 *  ready       → in the Supabase bucket and safe to serve
 *  failed      → the sync gave up after its retries (see `attempts` and `lastError`)
 */
export const vehicleImageStatus = pgEnum('vehicle_image_status', [
  'pending',
  'processing',
  'ready',
  'failed',
])

/**
 * vehicleImages — one row per photo of a vehicle. It is a separate table from `vehicles` on purpose: a vehicle has
 * many photos, and a photo has its own life cycle (download, retry, replace, reorder).
 *
 * TWO LOCATIONS, ONE ROW.
 *   sourceUrl    where HomeNet serves the photo (one URL per entry of the feed's "ImageList"). It identifies the photo
 *                to the sync, so re-running a sync never creates a second row for the same URL.
 *   storagePath  where our copy lives in the Supabase Storage bucket, once downloaded.
 *
 * THE STORED PATH IS CONTENT-ADDRESSED: `vehicles/<vehicle id>/<sha256 of the file>.<jpg|png|webp>`. It is a path, never
 * a full URL: the host and bucket come from configuration in one place (src/lib/imageUrl.ts), so moving the storage to
 * another account or provider needs no data change. Because the name is the file's own hash, the path is only known
 * after the download, which is why `storagePath` is empty while a photo is pending, and why the database enforces:
 *   - a `ready` photo always has a path and a checksum;
 *   - the path always has exactly the shape the site and the upload helper (src/lib/photoUpload.ts) write, and always
 *     belongs to this vehicle and to this checksum, so a wrong or malformed path cannot be saved.
 * Only original files are stored, untouched; the Next.js image optimizer makes the smaller sizes on demand.
 *
 * Deliberately NOT included: alt text. Confirm with the client before adding it, since the feed has none to import.
 */
export const vehicleImages = pgTable(
  'vehicle_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, {onDelete: 'cascade'}),

    /** The HomeNet URL this photo came from. Empty for a photo added another way. */
    sourceUrl: text('source_url'),
    /** The path inside the bucket. Empty until the photo has been downloaded. */
    storagePath: text('storage_path'),

    /** Position in the feed's list (0 is first). */
    sortOrder: integer('sort_order').notNull().default(0),
    /** The photo shown first. At most one per vehicle (see the unique index below). */
    isMain: boolean('is_main').notNull().default(false),

    status: vehicleImageStatus('status').notNull().default('pending'),
    /**
     * SHA-256 of the file's bytes, in lowercase hex. The sync compares it to tell an unchanged photo without storing
     * it again, and the stored path is built from it.
     */
    checksum: text('checksum'),
    contentType: text('content_type'),
    byteSize: integer('byte_size'),
    width: integer('width'),
    height: integer('height'),

    /** Download attempts so far, and why the last one failed. */
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    downloadedAt: timestamp('downloaded_at', {withTimezone: true}),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    index('vehicle_images_vehicle_id_idx').on(table.vehicleId),
    index('vehicle_images_status_idx').on(table.status),
    // Exactly one main photo per vehicle, at most.
    uniqueIndex('vehicle_images_one_main_per_vehicle_idx')
      .on(table.vehicleId)
      .where(sql`${table.isMain} = true`),
    // The same HomeNet URL is one row per vehicle, however many times it is synced.
    uniqueIndex('vehicle_images_vehicle_source_url_idx')
      .on(table.vehicleId, table.sourceUrl)
      .where(sql`${table.sourceUrl} IS NOT NULL`),
    // A stored file is one row.
    uniqueIndex('vehicle_images_storage_path_idx')
      .on(table.storagePath)
      .where(sql`${table.storagePath} IS NOT NULL`),

    check('vehicle_images_sort_order_not_negative', sql`${table.sortOrder} >= 0`),
    check(
      'vehicle_images_checksum_format',
      sql`${table.checksum} IS NULL OR ${table.checksum} ~ '^[0-9a-f]{64}$'`,
    ),
    // A photo that is ready can be served: it must have its file and its hash.
    check(
      'vehicle_images_ready_has_file',
      sql`${table.status} <> 'ready' OR (${table.storagePath} IS NOT NULL AND ${table.checksum} IS NOT NULL)`,
    ),
    // The stored path always has the one shape the site and the upload helper use, and always belongs to this vehicle
    // and this checksum: vehicles/<vehicle id>/<checksum>.<jpg|png|webp>
    check(
      'vehicle_images_storage_path_shape',
      sql`${table.storagePath} IS NULL OR (
        ${table.checksum} IS NOT NULL
        AND ${table.storagePath} ~ ('^vehicles/' || ${table.vehicleId}::text || '/' || ${table.checksum} || '\\.(jpg|png|webp)$')
      )`,
    ),
  ],
).enableRLS()
