/**
 * The HomeNet inventory feed, column by column.
 *
 * HomeNet gives the client's vehicles as a CSV with the headers below, in this order. This file says, for each header,
 * which table and column it is stored in and how its text has to be turned into that column's type. The sync job reads
 * from this one list, and columns.test.ts fails if a header is missing, appears twice, or points at a column that does
 * not exist in the schema, so the feed and the database cannot drift apart.
 *
 * `table` and `column` use the Drizzle property names (src/db/schema), for example `bodyStyle`, not `body_style`.
 */

export type HomenetKind =
  /** Text, kept as written (trimmed). An empty value becomes NULL. */
  | 'text'
  /** A whole number. An empty value becomes NULL. */
  | 'int'
  /** A price written in dollars ("84586" or "24999.00"), stored as whole cents. The feed's "0" means "no price" → NULL. */
  | 'cents'
  /** "True" / "False". */
  | 'bool'
  /** A date written M/D/YYYY. */
  | 'date'
  /** The flat options list: split at the commas, in feed order, empty items dropped. */
  | 'optionList'
  /** `Category@Item~Category@Item …` → `{ Category: [Item, …] }`. */
  | 'categorizedOptions'
  /** Comma-separated photo URLs → one `vehicle_images` row each, in order (the first is the main photo). */
  | 'imageUrlList'

export type HomenetTable = 'vehicles' | 'vehicleInventory' | 'vehicleImages'

export interface HomenetColumn {
  /** The header exactly as the CSV writes it. */
  header: string
  table: HomenetTable
  /** The Drizzle property on that table. */
  column: string
  kind: HomenetKind
}

/** The 71 headers, in the feed's order. */
export const HOMENET_HEADERS = [
  'Type',
  'Stock',
  'VIN',
  'Year',
  'Make',
  'Model',
  'Body',
  'Trim',
  'ModelNumber',
  'Doors',
  'ExteriorColor',
  'InteriorColor',
  'EngineCylinders',
  'EngineDisplacement',
  'Transmission',
  'Miles',
  'SellingPrice',
  'MSRP',
  'BookValue',
  'Invoice',
  'Certified',
  'DateInStock',
  'Description',
  'Options',
  'Categorized Options',
  'Dealer Name',
  'Dealer Address',
  'Dealer City',
  'Dealer State',
  'Dealer Zip',
  'Dealer Phone',
  'Dealer Fax',
  'Dealer Email',
  'Comment 1',
  'Comment 2',
  'Comment 3',
  'Comment 4',
  'Comment 5',
  'Style_Description',
  'Ext_Color_Generic',
  'Ext_Color_Code',
  'Int_Color_Generic',
  'Int_Color_Code',
  'Int_Upholstery',
  'Engine_Block_Type',
  'Engine_Aspiration_Type',
  'Engine_Description',
  'Transmission_Speed',
  'Transmission_Description',
  'Drivetrain',
  'Fuel_Type',
  'CityMPG',
  'HighwayMPG',
  'EPAClassification',
  'Wheelbase_Code',
  'Internet_Price',
  'Misc_Price1',
  'Misc_Price2',
  'Misc_Price3',
  'Factory_Codes',
  'MarketClass',
  'PassengerCapacity',
  'ExtColorHexCode',
  'IntColorHexCode',
  'EngineDisplacementCubicInches',
  'ImageList',
  'ConversionWarranty',
  'Comment 6',
  'Comment 7',
  'Comment 8',
  'Comment 9',
] as const

export type HomenetHeader = (typeof HOMENET_HEADERS)[number]

const v = (header: HomenetHeader, column: string, kind: HomenetKind): HomenetColumn => ({
  header,
  table: 'vehicles',
  column,
  kind,
})
const inv = (header: HomenetHeader, column: string, kind: HomenetKind): HomenetColumn => ({
  header,
  table: 'vehicleInventory',
  column,
  kind,
})

/** Every header → its home. One entry per header (the test checks). */
export const HOMENET_COLUMNS: HomenetColumn[] = [
  // identity
  v('Type', 'stockType', 'text'),
  v('Stock', 'stockNumber', 'text'),
  v('VIN', 'vin', 'text'),

  // what it is
  v('Year', 'year', 'int'),
  v('Make', 'make', 'text'),
  v('Model', 'model', 'text'),
  v('Body', 'bodyStyle', 'text'),
  v('Trim', 'trim', 'text'),
  v('ModelNumber', 'modelNumber', 'text'),
  v('Doors', 'doors', 'int'),
  v('Style_Description', 'styleDescription', 'text'),
  v('MarketClass', 'marketClass', 'text'),
  v('PassengerCapacity', 'passengerCapacity', 'int'),
  v('Factory_Codes', 'factoryCodes', 'text'),

  // colours
  v('ExteriorColor', 'exteriorColor', 'text'),
  v('Ext_Color_Generic', 'extColorGeneric', 'text'),
  v('Ext_Color_Code', 'extColorCode', 'text'),
  v('ExtColorHexCode', 'extColorHex', 'text'),
  v('InteriorColor', 'interiorColor', 'text'),
  v('Int_Color_Generic', 'intColorGeneric', 'text'),
  v('Int_Color_Code', 'intColorCode', 'text'),
  v('IntColorHexCode', 'intColorHex', 'text'),
  v('Int_Upholstery', 'interiorUpholstery', 'text'),

  // engine
  v('EngineCylinders', 'engineCylinders', 'int'),
  v('EngineDisplacement', 'engineDisplacement', 'text'),
  v('EngineDisplacementCubicInches', 'engineDisplacementCubicInches', 'int'),
  v('Engine_Block_Type', 'engineBlockType', 'text'),
  v('Engine_Aspiration_Type', 'engineAspirationType', 'text'),
  v('Engine_Description', 'engine', 'text'),

  // drivetrain
  v('Transmission', 'transmission', 'text'),
  v('Transmission_Speed', 'transmissionSpeed', 'int'),
  v('Transmission_Description', 'transmissionDescription', 'text'),
  v('Drivetrain', 'drivetrain', 'text'),
  v('Fuel_Type', 'fuelType', 'text'),
  v('CityMPG', 'cityMpg', 'int'),
  v('HighwayMPG', 'highwayMpg', 'int'),
  v('EPAClassification', 'epaClassification', 'text'),
  v('Wheelbase_Code', 'wheelbaseCode', 'text'),

  // condition
  v('Miles', 'mileage', 'int'),
  v('Certified', 'certified', 'bool'),

  // descriptions and options
  v('Description', 'description', 'text'),
  v('Options', 'options', 'optionList'),
  v('Categorized Options', 'categorizedOptions', 'categorizedOptions'),
  v('ConversionWarranty', 'conversionWarranty', 'text'),

  // the dealer's own free-text fields
  v('Comment 1', 'comment1', 'text'),
  v('Comment 2', 'comment2', 'text'),
  v('Comment 3', 'comment3', 'text'),
  v('Comment 4', 'comment4', 'text'),
  v('Comment 5', 'comment5', 'text'),
  v('Comment 6', 'comment6', 'text'),
  v('Comment 7', 'comment7', 'text'),
  v('Comment 8', 'comment8', 'text'),
  v('Comment 9', 'comment9', 'text'),

  // live listing state → vehicle_inventory
  inv('DateInStock', 'dateInStock', 'date'),
  inv('SellingPrice', 'sellingPriceCents', 'cents'),
  inv('MSRP', 'msrpCents', 'cents'),
  inv('BookValue', 'bookValueCents', 'cents'),
  inv('Invoice', 'invoiceCents', 'cents'),
  inv('Internet_Price', 'internetPriceCents', 'cents'),
  inv('Misc_Price1', 'miscPrice1Cents', 'cents'),
  inv('Misc_Price2', 'miscPrice2Cents', 'cents'),
  inv('Misc_Price3', 'miscPrice3Cents', 'cents'),
  inv('Dealer Name', 'dealerName', 'text'),
  inv('Dealer Address', 'dealerAddress', 'text'),
  inv('Dealer City', 'dealerCity', 'text'),
  inv('Dealer State', 'dealerState', 'text'),
  inv('Dealer Zip', 'dealerZip', 'text'),
  inv('Dealer Phone', 'dealerPhone', 'text'),
  inv('Dealer Fax', 'dealerFax', 'text'),
  inv('Dealer Email', 'dealerEmail', 'text'),

  // photos → vehicle_images (a separate table: one row per URL)
  {header: 'ImageList', table: 'vehicleImages', column: 'sourceUrl', kind: 'imageUrlList'},
]
