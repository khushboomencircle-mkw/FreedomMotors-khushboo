/**
 * Schema registry — every Drizzle table/enum, re-exported from one place.
 * Mirrors the role of studio/schemaTypes/sections/index.ts: anything
 * that needs the DB schema (the Drizzle client, drizzle.config.ts, the
 * future sync job) imports from here, not from an individual schema file.
 *
 * To add a new table: create its file in this folder, then re-export it
 * below.
 */
export {vehicles} from './vehicles'
export {vehicleInventory, vehicleInventoryStatus} from './vehicleInventory'
export {vehicleImages, vehicleImageStatus} from './vehicleImages'
export {syncRuns, syncRunStatus} from './syncRuns'
