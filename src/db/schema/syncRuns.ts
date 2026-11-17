import {integer, pgEnum, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core'

export const syncRunStatus = pgEnum('sync_run_status', ['running', 'completed', 'failed'])

/**
 * syncRuns — one row per feed-sync execution. Job-level tracking only: how
 * long a run took, what it did in aggregate, and whether it succeeded.
 * Per-vehicle/per-photo state (what changed, retry counts, last-seen
 * timestamps) belongs on `vehicleInventory`/`vehicleImages`, not here — this
 * table doesn't reference either, on purpose, to keep it from growing into a
 * second place that per-row sync state could live.
 *
 * The actual sync job that writes these rows is out of scope for this task.
 */
export const syncRuns = pgTable('sync_runs', {
  id: uuid('id').primaryKey().defaultRandom(),

  startedAt: timestamp('started_at', {withTimezone: true}).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', {withTimezone: true}),
  status: syncRunStatus('status').notNull().default('running'),

  vehiclesProcessed: integer('vehicles_processed').notNull().default(0),
  vehiclesAdded: integer('vehicles_added').notNull().default(0),
  vehiclesRemoved: integer('vehicles_removed').notNull().default(0),

  photosDownloaded: integer('photos_downloaded').notNull().default(0),
  photosSkipped: integer('photos_skipped').notNull().default(0),
  photosFailed: integer('photos_failed').notNull().default(0),

  errorSummary: text('error_summary'),
}).enableRLS()
