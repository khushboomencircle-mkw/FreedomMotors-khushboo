/**
 * Keep these two maps in sync with src/lib/theme.ts's
 * LIGHT_DEFAULTS/DARK_DEFAULTS — same values, duplicated because Studio and
 * the web app are separate, independently-deployed packages with no shared
 * module between them (same reasoning as redirectType.ts's normalizePath).
 *
 * Used only to show a mode-correct preview swatch in ColorPaletteInput
 * before an admin has set a color — never written to a document; the real,
 * authoritative defaults live in the web app and are what actually renders.
 */
export const LIGHT_THEME_DEFAULTS: Record<string, string> = {
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

export const DARK_THEME_DEFAULTS: Record<string, string> = {
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
