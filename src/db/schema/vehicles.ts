import {sql} from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * vehicles — one row per vehicle: its identity and specifications, exactly as the HomeNet inventory feed describes them.
 * Everything that is about the vehicle itself lives here. What changes on every sync (price, status, dealer, when it
 * was last seen) lives on `vehicleInventory`; the photos live on `vehicleImages`, a separate table, because a vehicle
 * has many of them and they have their own life cycle (download, retry, replace).
 *
 * THE FEED → COLUMNS. The HomeNet CSV has 71 columns. src/db/homenet/columns.ts lists every header and says which table
 * and column it lands in, and a test fails if a header is unmapped or a column does not exist, so this file and the feed
 * cannot drift apart. Each column here keeps the feed's own wording (a feed column "Ext_Color_Generic" is
 * `ext_color_generic`), so a value can be traced from the CSV to the database at a glance.
 *
 * KEYS. A vehicle is identified by its VIN or its stock number: the feed gives both, but either may be missing for a
 * vehicle that has just arrived, so both are nullable, both are unique (Postgres allows many NULLs in a unique index),
 * and a check makes sure at least one is present.
 *
 * TYPES. The feed is text. Numbers (year, doors, miles, mpg …) are integers, "True"/"False" is a boolean and the stock
 * date is a date. Money lives on `vehicleInventory` as whole cents. A value the feed leaves empty is NULL, never "".
 *
 * NOTHING IS LOST. `rawFeedData` keeps the complete row from the last sync, so a field can be promoted into its own
 * column later without going back to the feed. `feedChecksum` is a hash of that row, so a sync can skip a vehicle
 * whose row has not changed.
 */
export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ── Identity ──
    /** Feed "Type": New / Used. Text, not an enum, so an unexpected value from the feed never fails a sync. */
    stockType: text('stock_type'),
    /** Feed "Stock". */
    stockNumber: text('stock_number'),
    vin: text('vin'),

    // ── What it is ──
    year: integer('year'),
    make: text('make'),
    model: text('model'),
    /** Feed "Body". */
    bodyStyle: text('body_style'),
    trim: text('trim'),
    modelNumber: text('model_number'),
    doors: integer('doors'),
    styleDescription: text('style_description'),
    marketClass: text('market_class'),
    passengerCapacity: integer('passenger_capacity'),
    /** Feed "Factory_Codes": the manufacturer's option codes, as one space-separated string. */
    factoryCodes: text('factory_codes'),

    // ── Colours ──
    exteriorColor: text('exterior_color'),
    extColorGeneric: text('ext_color_generic'),
    extColorCode: text('ext_color_code'),
    /** Feed "ExtColorHexCode": six hex digits, no "#". */
    extColorHex: text('ext_color_hex'),
    interiorColor: text('interior_color'),
    intColorGeneric: text('int_color_generic'),
    intColorCode: text('int_color_code'),
    /** Feed "IntColorHexCode": six hex digits, no "#". */
    intColorHex: text('int_color_hex'),
    /** Feed "Int_Upholstery". */
    interiorUpholstery: text('interior_upholstery'),

    // ── Engine ──
    engineCylinders: integer('engine_cylinders'),
    /** Feed "EngineDisplacement", as written ("2.5L"). */
    engineDisplacement: text('engine_displacement'),
    engineDisplacementCubicInches: integer('engine_displacement_cubic_inches'),
    engineBlockType: text('engine_block_type'),
    engineAspirationType: text('engine_aspiration_type'),
    /** Feed "Engine_Description". */
    engine: text('engine'),

    // ── Drivetrain ──
    transmission: text('transmission'),
    transmissionSpeed: integer('transmission_speed'),
    transmissionDescription: text('transmission_description'),
    drivetrain: text('drivetrain'),
    fuelType: text('fuel_type'),
    cityMpg: integer('city_mpg'),
    highwayMpg: integer('highway_mpg'),
    epaClassification: text('epa_classification'),
    wheelbaseCode: text('wheelbase_code'),

    // ── Condition ──
    /** Feed "Miles". */
    mileage: integer('mileage'),
    certified: boolean('certified').notNull().default(false),

    // ── Descriptions and options ──
    description: text('description'),
    /** Feed "Options": the flat list, split at the commas, in feed order. */
    options: text('options').array(),
    /**
     * Feed "Categorized Options": `Category@Item~Category@Item …` turned into `{"Exterior": [...], "Interior": [...]}`.
     */
    categorizedOptions: jsonb('categorized_options').$type<Record<string, string[]>>(),
    conversionWarranty: text('conversion_warranty'),

    /**
     * Feed "Comment 1" … "Comment 9": free-text fields the dealer's software uses for its own purposes (for example the
     * conversion type). Their meaning is the client's convention, not the feed's, so they keep their positional names
     * here and the application decides what each one means.
     */
    comment1: text('comment_1'),
    comment2: text('comment_2'),
    comment3: text('comment_3'),
    comment4: text('comment_4'),
    comment5: text('comment_5'),
    comment6: text('comment_6'),
    comment7: text('comment_7'),
    comment8: text('comment_8'),
    comment9: text('comment_9'),

    // ── Sync bookkeeping ──
    /** The complete feed row for this vehicle as of its last sync: the catch-all that makes the typed columns safe to change. */
    rawFeedData: jsonb('raw_feed_data'),
    /** Hash of that row, so an unchanged vehicle can be skipped. */
    feedChecksum: text('feed_checksum'),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vehicles_vin_idx').on(table.vin),
    uniqueIndex('vehicles_stock_number_idx').on(table.stockNumber),
    // The filters the vehicle listing uses.
    index('vehicles_make_model_idx').on(table.make, table.model),
    index('vehicles_year_idx').on(table.year),
    index('vehicles_stock_type_idx').on(table.stockType),
    index('vehicles_body_style_idx').on(table.bodyStyle),

    check(
      'vehicles_has_identity',
      sql`${table.vin} IS NOT NULL OR ${table.stockNumber} IS NOT NULL`,
    ),
    check('vehicles_year_range', sql`${table.year} IS NULL OR ${table.year} BETWEEN 1900 AND 2100`),
    check('vehicles_mileage_not_negative', sql`${table.mileage} IS NULL OR ${table.mileage} >= 0`),
    check(
      'vehicles_ext_color_hex_format',
      sql`${table.extColorHex} IS NULL OR ${table.extColorHex} ~ '^[0-9A-Fa-f]{6}$'`,
    ),
    check(
      'vehicles_int_color_hex_format',
      sql`${table.intColorHex} IS NULL OR ${table.intColorHex} ~ '^[0-9A-Fa-f]{6}$'`,
    ),
  ],
).enableRLS()
