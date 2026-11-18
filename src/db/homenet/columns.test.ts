import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {describe, it} from 'node:test'
import {getTableColumns} from 'drizzle-orm'
import {vehicleImages, vehicleInventory, vehicles} from '../schema'
import {HOMENET_COLUMNS, HOMENET_HEADERS, type HomenetKind, type HomenetTable} from './columns'

// Run with: npm run test:db

/** The header row of the HomeNet CSV the client sent, exactly as received. */
const CSV_HEADER_LINE =
  '"Type","Stock","VIN","Year","Make","Model","Body","Trim","ModelNumber","Doors","ExteriorColor","InteriorColor","EngineCylinders","EngineDisplacement","Transmission","Miles","SellingPrice","MSRP","BookValue","Invoice","Certified","DateInStock","Description","Options","Categorized Options","Dealer Name","Dealer Address","Dealer City","Dealer State","Dealer Zip","Dealer Phone","Dealer Fax","Dealer Email","Comment 1","Comment 2","Comment 3","Comment 4","Comment 5","Style_Description","Ext_Color_Generic","Ext_Color_Code","Int_Color_Generic","Int_Color_Code","Int_Upholstery","Engine_Block_Type","Engine_Aspiration_Type","Engine_Description","Transmission_Speed","Transmission_Description","Drivetrain","Fuel_Type","CityMPG","HighwayMPG","EPAClassification","Wheelbase_Code","Internet_Price","Misc_Price1","Misc_Price2","Misc_Price3","Factory_Codes","MarketClass","PassengerCapacity","ExtColorHexCode","IntColorHexCode","EngineDisplacementCubicInches","ImageList","ConversionWarranty","Comment 6","Comment 7","Comment 8","Comment 9"'

const TABLES = {vehicles, vehicleInventory, vehicleImages} as const
const columnsOf = (table: HomenetTable) =>
  getTableColumns(TABLES[table]) as Record<string, {columnType: string; name: string}>

describe('the feed header row', () => {
  it('is exactly the header row the client sent (same headers, same order)', () => {
    const fromCsv = CSV_HEADER_LINE.slice(1, -1).split('","')
    assert.deepEqual([...HOMENET_HEADERS], fromCsv)
  })

  it('has 71 unique headers', () => {
    assert.equal(HOMENET_HEADERS.length, 71)
    assert.equal(new Set(HOMENET_HEADERS).size, 71)
  })
})

describe('every feed column has exactly one home', () => {
  it('each header is mapped once, and nothing is mapped that the feed does not have', () => {
    const mapped = HOMENET_COLUMNS.map((c) => c.header).sort()
    assert.deepEqual(mapped, [...HOMENET_HEADERS].sort())
  })

  it('every mapped column really exists in its table', () => {
    for (const c of HOMENET_COLUMNS) {
      assert.ok(columnsOf(c.table)[c.column], `${c.header} → ${c.table}.${c.column} does not exist`)
    }
  })

  it('no two headers share one column (except the photo list, which fills a table of its own)', () => {
    const seen = new Set<string>()
    for (const c of HOMENET_COLUMNS) {
      const key = `${c.table}.${c.column}`
      assert.ok(!seen.has(key), `${key} is fed by two headers`)
      seen.add(key)
    }
  })
})

describe('each column can hold what the feed gives it', () => {
  const expected: Record<HomenetKind, (column: {columnType: string; name: string}) => boolean> = {
    text: (c) => c.columnType === 'PgText',
    int: (c) => c.columnType === 'PgInteger',
    cents: (c) => c.columnType === 'PgInteger' && c.name.endsWith('_cents'),
    bool: (c) => c.columnType === 'PgBoolean',
    date: (c) => c.columnType === 'PgDateString',
    optionList: (c) => c.columnType === 'PgArray',
    categorizedOptions: (c) => c.columnType === 'PgJsonb',
    imageUrlList: (c) => c.columnType === 'PgText',
  }

  it('the stored type matches how the text is converted', () => {
    for (const c of HOMENET_COLUMNS) {
      const column = columnsOf(c.table)[c.column]
      assert.ok(
        expected[c.kind](column),
        `${c.header}: ${c.kind} cannot be stored in ${c.table}.${c.column} (${column.columnType})`,
      )
    }
  })

  it('all eight prices are stored as whole cents, never as decimals', () => {
    const prices = HOMENET_COLUMNS.filter((c) => c.kind === 'cents')
    assert.deepEqual(prices.map((c) => c.header).sort(), [
      'BookValue',
      'Internet_Price',
      'Invoice',
      'MSRP',
      'Misc_Price1',
      'Misc_Price2',
      'Misc_Price3',
      'SellingPrice',
    ])
    for (const c of prices) assert.equal(c.table, 'vehicleInventory', c.header)
  })
})

describe('no column is an orphan', () => {
  /** Columns the sync or the database maintains itself; no feed header fills them. */
  const SYSTEM = new Set([
    'id',
    'vehicleId',
    'status',
    'lastSeenInFeedAt',
    'createdAt',
    'updatedAt',
    'rawFeedData',
    'feedChecksum',
  ])

  for (const table of ['vehicles', 'vehicleInventory'] as const) {
    it(`every ${table} column is fed by a header, or is bookkeeping`, () => {
      const fed = new Set(HOMENET_COLUMNS.filter((c) => c.table === table).map((c) => c.column))
      const orphans = Object.keys(columnsOf(table)).filter(
        (name) => !fed.has(name) && !SYSTEM.has(name),
      )
      assert.deepEqual(orphans, [], `${table} has columns no feed header fills`)
    })
  }
})

describe('photos live in their own table', () => {
  it('the feed’s photo list fills vehicle_images, and no photo column is on vehicles or inventory', () => {
    const photo = HOMENET_COLUMNS.find((c) => c.header === 'ImageList')!
    assert.equal(photo.table, 'vehicleImages')
    for (const table of ['vehicles', 'vehicleInventory'] as const) {
      const names = Object.keys(columnsOf(table))
      assert.deepEqual(
        names.filter((n) => /image|photo|picture|storage/i.test(n)),
        [],
        `${table} must not hold photo data`,
      )
    }
  })

  it('a photo row knows where it came from, where our copy is, and how far along it is', () => {
    const columns = Object.keys(columnsOf('vehicleImages'))
    for (const needed of [
      'vehicleId',
      'sourceUrl',
      'storagePath',
      'checksum',
      'status',
      'sortOrder',
      'isMain',
    ]) {
      assert.ok(columns.includes(needed), `vehicle_images.${needed} is missing`)
    }
  })

  it('the stored path is nullable (it is only known after the download) and the URL is not stored as a link to our bucket', () => {
    const cols = vehicleImages as unknown as Record<string, {notNull: boolean}>
    assert.equal(cols.storagePath.notNull, false)
    assert.equal(cols.sourceUrl.notNull, false)
    assert.equal(cols.vehicleId.notNull, true)
  })
})

describe('the migration carries the safety rules', () => {
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'drizzle', '0001_vehicle_schema_homenet.sql'),
    'utf8',
  )

  it('adds the rules that keep photo paths and vehicles valid', () => {
    for (const name of [
      'vehicles_has_identity',
      'vehicles_year_range',
      'vehicles_ext_color_hex_format',
      'vehicle_inventory_prices_not_negative',
      'vehicle_images_ready_has_file',
      'vehicle_images_storage_path_shape',
      'vehicle_images_vehicle_source_url_idx',
      'vehicle_images_one_main_per_vehicle_idx',
    ]) {
      assert.ok(
        sql.includes(name) ||
          fs
            .readFileSync(path.join(process.cwd(), 'drizzle', '0000_cheerful_husk.sql'), 'utf8')
            .includes(name),
        `${name} is missing`,
      )
    }
  })

  it('repairs existing photo rows BEFORE adding the rules that would reject them', () => {
    const repair = sql.indexOf('Repair existing photo rows')
    const firstRule = sql.indexOf('ADD CONSTRAINT "vehicle_images_ready_has_file"')
    assert.ok(repair > 0 && firstRule > repair, 'the repair steps must come first')
  })

  it('every table keeps row-level security on (the migrations never turn it off)', () => {
    const all = fs
      .readdirSync('drizzle')
      .filter((f) => f.endsWith('.sql'))
      .map((f) => fs.readFileSync(path.join('drizzle', f), 'utf8'))
      .join('\n')
    for (const table of ['vehicles', 'vehicle_inventory', 'vehicle_images', 'sync_runs']) {
      assert.ok(all.includes(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`), table)
    }
    assert.doesNotMatch(all, /DISABLE ROW LEVEL SECURITY/)
  })
})
