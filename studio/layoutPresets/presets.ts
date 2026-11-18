/**
 * Named layout presets for page sections — the "which layout?" picker shown at the top of a section's Layout tab.
 *
 * A preset is only a shortcut: choosing one fills in fields the section ALREADY has (columns, display mode, text
 * position …), exactly as if the editor had set them by hand. Nothing new is stored and the website keeps reading
 * the same fields. Which preset is highlighted is worked out from the section's current values, so old pages show
 * the right choice without being touched.
 *
 * This file is pure data + pure functions (no Studio or React imports) so it can be unit-tested on its own.
 */

/** The layout-related field values of one section (only the keys that section's presets care about). */
export type FieldValues = Record<string, string | boolean | undefined>

/** Which small wireframe picture to draw for a preset (see LayoutThumb). */
export type ThumbKind =
  | 'grid2'
  | 'grid3'
  | 'grid4'
  | 'mosaic'
  | 'list'
  | 'slider'
  | 'scroller'
  | 'overImage'
  | 'aboveImage'
  | 'belowImage'
  | 'boxLayout'
  | 'besideImage'
  | 'imageLeft'
  | 'imageRight'

export interface LayoutPreset {
  id: string
  title: string
  description: string
  thumb: ThumbKind
  /** True when `values` (already filled with the website's own defaults) is this layout. */
  matches: (values: FieldValues) => boolean
  /** The values this layout needs, given the current ones. May return more keys than will actually change. */
  apply: (values: FieldValues) => FieldValues
}

export interface SectionPresetConfig {
  /** The section's schema type name. */
  sectionType: string
  /** Every field this section's presets read or write (and nothing else). */
  fields: string[]
  /**
   * What the website does when a field is empty. Old pages often have a field unset; treating "unset" as this value
   * (the same fallback the renderer and the Studio's initial value use) is what lets them show the right preset.
   * A field with NO entry here is genuinely "not chosen" (e.g. Banner Text Position) and shows no preset.
   */
  defaults: FieldValues
  presets: LayoutPreset[]
}

/** Gap-free helper: a preset that sets one field to one value. */
const single = (
  field: string,
  value: string,
  title: string,
  description: string,
  thumb: ThumbKind,
): LayoutPreset => ({
  id: value,
  title,
  description,
  thumb,
  matches: (v) => v[field] === value,
  apply: () => ({[field]: value}),
})

// ── Cards Grid ─────────────────────────────────────────────────────────────
// Layout lives in three fields: Columns, Mosaic View and (for one column) Display as.
const cardsGrid: SectionPresetConfig = {
  sectionType: 'cardsGridSection',
  fields: ['columns', 'mosaicView', 'oneColumnDisplayMode'],
  defaults: {columns: '3', mosaicView: false, oneColumnDisplayMode: 'stack'},
  presets: [
    {
      id: 'slider',
      title: 'Slider',
      description: 'One card at a time with arrows. Sets Columns to 1 and Display as Slider.',
      thumb: 'slider',
      matches: (v) => v.columns === '1' && v.oneColumnDisplayMode === 'slider',
      apply: () => ({columns: '1', oneColumnDisplayMode: 'slider'}),
    },
    {
      id: 'list',
      title: 'Vertical list',
      description:
        'Cards stacked one under another. Sets Columns to 1 and Display as Vertical Stack.',
      thumb: 'list',
      matches: (v) => v.columns === '1' && v.mosaicView !== true,
      apply: () => ({columns: '1', oneColumnDisplayMode: 'stack', mosaicView: false}),
    },
    {
      id: 'mosaic',
      title: 'Mosaic',
      description: 'Cards of mixed sizes in a tiled pattern. Turns Mosaic View on.',
      thumb: 'mosaic',
      matches: (v) => v.mosaicView === true && v.columns !== '1',
      // Mosaic needs more than one column; keep the editor's choice unless it was 1.
      apply: (v) => ({mosaicView: true, columns: v.columns === '1' ? '3' : v.columns}),
    },
    ...(['2', '3', '4'] as const).map((n): LayoutPreset => ({
      id: `grid${n}`,
      title: `Grid · ${n} columns`,
      description: `Cards in rows, ${n} across on desktop. Sets Columns to ${n}.`,
      thumb: `grid${n}` as ThumbKind,
      matches: (v) => v.columns === n && v.mosaicView !== true,
      apply: () => ({columns: n, mosaicView: false}),
    })),
  ],
}

// ── Feature Grid ───────────────────────────────────────────────────────────
const featureGrid: SectionPresetConfig = {
  sectionType: 'featureGridSection',
  fields: ['featureDisplayMode', 'columns', 'mosaicView'],
  defaults: {featureDisplayMode: 'grid', columns: '3', mosaicView: false},
  presets: [
    {
      id: 'scroller',
      title: 'Scroller',
      description: 'One draggable row of cards. Sets Display Mode to Horizontal Scroll.',
      thumb: 'scroller',
      matches: (v) => v.featureDisplayMode === 'horizontalScroll',
      apply: () => ({featureDisplayMode: 'horizontalScroll'}),
    },
    {
      id: 'mosaic',
      title: 'Mosaic',
      description: 'Cards of mixed sizes in a tiled pattern. Turns Mosaic View on.',
      thumb: 'mosaic',
      matches: (v) => v.featureDisplayMode === 'grid' && v.mosaicView === true,
      apply: () => ({featureDisplayMode: 'grid', mosaicView: true}),
    },
    ...(['2', '3', '4'] as const).map((n): LayoutPreset => ({
      id: `grid${n}`,
      title: `Grid · ${n} columns`,
      description: `Cards in rows, ${n} across on desktop. Sets Display Mode to Grid and Columns to ${n}.`,
      thumb: `grid${n}` as ThumbKind,
      matches: (v) => v.featureDisplayMode === 'grid' && v.mosaicView !== true && v.columns === n,
      apply: () => ({featureDisplayMode: 'grid', columns: n, mosaicView: false}),
    })),
  ],
}

// ── Banner ─────────────────────────────────────────────────────────────────
// Only Text Position. There is deliberately no default: an unset Text Position is "not chosen".
const banner: SectionPresetConfig = {
  sectionType: 'bannerSection',
  fields: ['textPosition'],
  defaults: {},
  presets: [
    single(
      'textPosition',
      'overImage',
      'Over image',
      'Text sits on top of the image.',
      'overImage',
    ),
    single(
      'textPosition',
      'aboveImage',
      'Above image',
      'Text first, then the image.',
      'aboveImage',
    ),
    single(
      'textPosition',
      'belowImage',
      'Below image',
      'Image first, then the text.',
      'belowImage',
    ),
    single(
      'textPosition',
      'boxLayout',
      'Boxed',
      'Title, then the image, then the text, in a box.',
      'boxLayout',
    ),
    single(
      'textPosition',
      'besideImage',
      'Side by side',
      'Text and image in two columns.',
      'besideImage',
    ),
  ],
}

// ── Link List ──────────────────────────────────────────────────────────────
const linkList: SectionPresetConfig = {
  sectionType: 'linkListSection',
  fields: ['imageSide'],
  defaults: {imageSide: 'left'},
  presets: [
    single(
      'imageSide',
      'left',
      'Image left',
      'The picture sits to the left of the list.',
      'imageLeft',
    ),
    single(
      'imageSide',
      'right',
      'Image right',
      'The picture sits to the right of the list.',
      'imageRight',
    ),
  ],
}

// ── Photo Gallery ──────────────────────────────────────────────────────────
const photoGallery: SectionPresetConfig = {
  sectionType: 'photoGallerySection',
  fields: ['layout', 'columns'],
  defaults: {layout: 'grid', columns: '3'},
  presets: [
    ...(['2', '3', '4'] as const).map((n): LayoutPreset => ({
      id: `grid${n}`,
      title: `Grid · ${n} columns`,
      description: `Photos in rows, ${n} across on desktop. Sets Layout to Grid and Columns to ${n}.`,
      thumb: `grid${n}` as ThumbKind,
      matches: (v) => v.layout === 'grid' && v.columns === n,
      apply: () => ({layout: 'grid', columns: n}),
    })),
    single('layout', 'mosaic', 'Mosaic', 'Photos of mixed sizes in a tiled pattern.', 'mosaic'),
    single('layout', 'slider', 'Slider', 'One photo at a time that slides.', 'slider'),
  ],
}

/** Every section that gets a picker, by schema type name. */
export const LAYOUT_PRESETS: Record<string, SectionPresetConfig> = Object.fromEntries(
  [cardsGrid, featureGrid, banner, linkList, photoGallery].map((c) => [c.sectionType, c]),
)

/** The section's layout fields with the website's fallback filled in for anything left empty. */
export function effectiveValues(config: SectionPresetConfig, raw: FieldValues = {}): FieldValues {
  const out: FieldValues = {}
  for (const name of config.fields) {
    const value = raw[name]
    out[name] = value === undefined || value === null ? config.defaults[name] : value
  }
  return out
}

/** The id of the preset matching these values, `'custom'` when none does, or `'unset'` when nothing was chosen. */
export function activePresetId(
  config: SectionPresetConfig,
  raw: FieldValues = {},
): string | 'custom' | 'unset' {
  const values = effectiveValues(config, raw)
  const found = config.presets.find((p) => p.matches(values))
  if (found) return found.id
  // Nothing matched. If the section has no layout value at all, that is "not chosen", not "custom".
  const anyChosen = Object.values(values).some((v) => v !== undefined)
  return anyChosen ? 'custom' : 'unset'
}

/**
 * The fields to write to switch to `preset`: only those whose value would actually change, so choosing the layout
 * that is already showing (even through defaults) writes nothing.
 */
export function changesFor(
  config: SectionPresetConfig,
  preset: LayoutPreset,
  raw: FieldValues = {},
): FieldValues {
  const current = effectiveValues(config, raw)
  const target = preset.apply(current)
  const changes: FieldValues = {}
  for (const [field, value] of Object.entries(target)) {
    if (value !== current[field]) changes[field] = value
  }
  return changes
}
