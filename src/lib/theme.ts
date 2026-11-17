/**
 * Theme resolution — centralized logic for the global Site Theme and per-section
 * Theme overrides. Priority: Section Theme > Global Site Theme > existing styling.
 *
 * Both the site level and the section level store two genuinely separate
 * palettes — `lightTheme` and `darkTheme` — rather than one palette plus a
 * mode flag. `defaultMode`/`sectionThemeMode` only selects which palette is
 * read; the other is never consulted, so a color set in one mode can never
 * leak into the other. Each palette independently falls back to that same
 * mode's built-in color defaults (LIGHT_DEFAULTS/DARK_DEFAULTS) for any
 * field the admin left blank — an admin-set value always wins over its own
 * mode's default, but never substitutes for the other mode's.
 *
 * Fallback is property-level and is realized through the CSS cascade:
 *   - Global theme vars are set on :root (when the global theme is enabled).
 *   - A section with its own theme sets only its *defined* vars on its wrapper;
 *     any property it doesn't define inherits the global value from :root.
 * So a section that sets a background but not a font keeps its background and
 * inherits the global font automatically.
 */

export type ThemeMode = 'light' | 'dark'

export interface ThemeConfig {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  surfaceColor?: string
  textColor?: string
  mutedTextColor?: string
  borderColor?: string
  headingFont?: string
  bodyFont?: string
  buttonFont?: string
  headingFontSize?: string
  bodyFontSize?: string
  headingFontWeight?: string
  bodyFontWeight?: string
  lineHeight?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonBorderColor?: string
  buttonBorderWidth?: string
  buttonFontWeight?: string
  buttonFontSize?: string
  buttonPaddingX?: string
  buttonPaddingY?: string
  buttonRadius?: string
  cardRadius?: string
  inputRadius?: string
}

export interface SiteThemeSettings {
  enableSiteTheme?: boolean
  defaultMode?: ThemeMode
  lightTheme?: ThemeConfig | null
  darkTheme?: ThemeConfig | null
}

export interface SectionThemeSettings {
  enableSectionTheme?: boolean
  sectionThemeMode?: ThemeMode
  lightTheme?: ThemeConfig | null
  darkTheme?: ThemeConfig | null
}

const CSS_VAR: Record<keyof ThemeConfig, string> = {
  primaryColor: '--theme-primary',
  accentColor: '--theme-accent',
  backgroundColor: '--theme-bg',
  surfaceColor: '--theme-surface',
  textColor: '--theme-text',
  mutedTextColor: '--theme-muted',
  borderColor: '--theme-border',
  headingFont: '--theme-heading-font',
  bodyFont: '--theme-body-font',
  buttonFont: '--theme-button-font',
  headingFontSize: '--theme-heading-size',
  bodyFontSize: '--theme-body-size',
  headingFontWeight: '--theme-heading-weight',
  bodyFontWeight: '--theme-body-weight',
  lineHeight: '--theme-line-height',
  buttonBackgroundColor: '--theme-button-bg',
  buttonTextColor: '--theme-button-text',
  buttonBorderColor: '--theme-button-border',
  buttonBorderWidth: '--theme-button-border-width',
  buttonFontWeight: '--theme-button-weight',
  buttonFontSize: '--theme-button-size',
  buttonPaddingX: '--theme-button-px',
  buttonPaddingY: '--theme-button-py',
  buttonRadius: '--theme-button-radius',
  cardRadius: '--theme-card-radius',
  inputRadius: '--theme-input-radius',
}

// In Studio these fields are plain numbers (e.g. "28", not "28px") — the unit
// is implicit per field and applied here, not typed by the editor. This also
// matters for correctness, not just convenience: a CSS custom property set to
// a number with no unit is NOT ignored the way an empty value would be. It's a
// defined value that fails to parse as a <length>, which makes the whole
// declaration invalid at computed-value time and drops it to its initial
// value (usually 0) instead of falling back to the var()'s own default. So an
// unrecognized value for Button Padding X doesn't just skip the override — it
// silently removes all horizontal padding. Pulling out the numeric part and
// always reattaching this field's fixed unit keeps that from happening
// regardless of what the editor actually typed (a plain number, a number with
// a leftover unit, or something stray).
const PX_LENGTH_KEYS = new Set<keyof ThemeConfig>([
  'buttonPaddingX',
  'buttonPaddingY',
  'buttonBorderWidth',
])
const REM_LENGTH_KEYS = new Set<keyof ThemeConfig>([
  'headingFontSize',
  'bodyFontSize',
  'buttonFontSize',
])
const LEADING_NUMBER = /-?\d+(\.\d+)?/

function normalizeLengthValue(key: keyof ThemeConfig, value: string): string {
  const unit = PX_LENGTH_KEYS.has(key) ? 'px' : REM_LENGTH_KEYS.has(key) ? 'rem' : null
  if (!unit) return value
  const match = value.match(LEADING_NUMBER)
  // No number found at all — nothing sane to normalize; leave as typed.
  return match ? `${match[0]}${unit}` : value
}

/** Keep only defined, non-empty values, normalizing unitless lengths. */
function clean(cfg?: ThemeConfig | null): ThemeConfig {
  const out: ThemeConfig = {}
  if (!cfg) return out
  for (const key of Object.keys(CSS_VAR) as (keyof ThemeConfig)[]) {
    const v = cfg[key]
    const trimmed = v != null ? String(v).trim() : ''
    if (trimmed !== '') out[key] = normalizeLengthValue(key, trimmed)
  }
  return out
}

/**
 * Built-in colors for whichever of the 10 color fields (both the 'colors'
 * fieldset and the 'buttons' one — button colors are colors too) an
 * admin-edited palette leaves blank, so picking Light or Dark always
 * produces a coherent, correctly-lit result instead of just whatever
 * happened to be filled in for that specific palette. Font/size/weight/
 * radius fields aren't inherently light or dark, so an unset one is left
 * for the existing per-component var() fallback or the CSS cascade, same
 * as before this fix — these two maps only ever define the 10 color keys.
 *
 * Starting values, not authoritative brand colors — there's no brand
 * guideline doc in this repo to check them against; `buttonBackgroundColor`
 * (#dc2626) and `buttonTextColor` (#ffffff) do match the fallback literals
 * already hardcoded at every existing `var(--theme-button-bg/text, ...)`
 * call site, confirmed by grep, not guessed. An admin-edited value in
 * either palette always overrides its own mode's default here — Light's
 * defaults are never used to fill a gap in Dark, or vice versa, because
 * `resolveGlobalTheme`/`resolveSectionTheme` below read `lightTheme` and
 * `darkTheme` as two completely separate objects, never falling through
 * from one to the other.
 */
const LIGHT_DEFAULTS: Partial<ThemeConfig> = {
  primaryColor: '#dc2626',
  accentColor: '#991b1b',
  backgroundColor: '#ffffff',
  surfaceColor: '#f3f4f6',
  textColor: '#111827',
  mutedTextColor: '#6b7280',
  borderColor: '#e5e7eb',
  buttonBackgroundColor: '#dc2626',
  buttonTextColor: '#ffffff',
  buttonBorderColor: 'transparent',
}

const DARK_DEFAULTS: Partial<ThemeConfig> = {
  primaryColor: '#ef4444',
  accentColor: '#f87171',
  backgroundColor: '#0a0a0a',
  surfaceColor: '#1a1a1a',
  textColor: '#ffffff',
  mutedTextColor: '#9ca3af',
  borderColor: 'rgba(255,255,255,0.1)',
  buttonBackgroundColor: '#dc2626',
  buttonTextColor: '#ffffff',
  buttonBorderColor: 'transparent',
}

function resolveMode(mode: ThemeMode | undefined): ThemeMode {
  return mode === 'light' ? 'light' : 'dark'
}

/** The palette + built-in defaults for a given mode — never mixes the two modes. */
function resolvePalette(mode: ThemeMode, palette: ThemeConfig | null | undefined): ThemeConfig {
  const defaults = mode === 'light' ? LIGHT_DEFAULTS : DARK_DEFAULTS
  return {...defaults, ...clean(palette)}
}

/**
 * The active global theme config (empty when the global theme is disabled).
 * Reads ONLY the palette matching `defaultMode` (`lightTheme` or
 * `darkTheme` — two genuinely separate stored objects, not one object with
 * mode-conditional reads), so a color set in one mode's palette can never
 * leak into the other. Always returns a background/text/border/etc. value
 * when enabled — built-in defaults fill anything the active palette leaves
 * blank, so :root's CSS vars are never silently absent (what makes the
 * page-wrapper `var(--theme-bg)`/`var(--theme-text)` reads safe with no
 * embedded fallback of their own). Anything the admin DID set in the
 * active palette always wins over that mode's default.
 */
export function resolveGlobalTheme(site?: SiteThemeSettings | null): ThemeConfig {
  if (!site?.enableSiteTheme) return {}
  const mode = resolveMode(site.defaultMode)
  return resolvePalette(mode, mode === 'light' ? site.lightTheme : site.darkTheme)
}

/**
 * The section's own override config and whether any theme applies to it.
 * When a section enables its own theme, its `config` is resolved the same
 * way as the global one — only the palette matching its OWN
 * `sectionThemeMode` is read (independent of both the site's mode and the
 * section's other palette), with that mode's built-in defaults filling any
 * gaps — so an enabled section is a self-contained, correctly-lit theme in
 * its own right, not a partial patch that can clash with the global mode's
 * colors. When section theme is off, `config` stays empty and every
 * property inherits the global vars through the CSS cascade, unchanged
 * from before — priority (section > site > fallback) is unchanged.
 */
export function resolveSectionTheme(
  site: SiteThemeSettings | null | undefined,
  section: SectionThemeSettings | null | undefined,
): {config: ThemeConfig; applies: boolean; sectionOverride: boolean} {
  const sectionOn = !!section?.enableSectionTheme
  const siteOn = !!site?.enableSiteTheme

  if (sectionOn) {
    const mode = resolveMode(section!.sectionThemeMode)
    const config = resolvePalette(mode, mode === 'light' ? section!.lightTheme : section!.darkTheme)
    return {config, applies: true, sectionOverride: true}
  }
  // No section override: global applies (if on) via the :root cascade; the
  // wrapper sets no vars of its own.
  return {config: {}, applies: siteOn, sectionOverride: false}
}

/** Map a theme config to CSS custom properties. */
export function themeToCssVars(cfg: ThemeConfig): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(cfg) as (keyof ThemeConfig)[]) {
    const v = cfg[key]
    if (v != null && String(v).trim() !== '') out[CSS_VAR[key]] = String(v)
  }
  return out
}

/** Serialize CSS vars for a `style` string (e.g. for a <style> block). */
export function cssVarsToString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}
