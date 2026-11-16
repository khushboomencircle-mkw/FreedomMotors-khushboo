import {useCallback} from 'react'
import {set, unset, type StringInputProps} from 'sanity'
import {LIGHT_THEME_DEFAULTS, DARK_THEME_DEFAULTS} from '../objects/themeDefaults'

const HEX6 = /^#[0-9a-f]{6}$/i

interface PaletteOptions {
  allowTransparent?: boolean
  list?: {value: string}[]
}

/**
 * When this field is one of themeConfig's color fields nested directly
 * under a `lightTheme`/`darkTheme` field (site-level or section-level —
 * the path shape is identical either way, just nested deeper for a
 * section), look up that mode's built-in default for a preview swatch.
 * For any other field that has a plain-hex `initialValue` on its schema
 * (e.g. featureCardItem.accentColor = #dc2626), that value is used as
 * the preview hint so the swatch matches what the live site renders when
 * nothing is explicitly stored — avoids the confusing "blank swatch but
 * red bar on web" mismatch for per-card accent colors.
 */
function modeDefaultFor(
  path: StringInputProps['path'],
  schemaInitialValue?: unknown,
): string | undefined {
  const fieldName = path[path.length - 1]
  const parentKey = path[path.length - 2]
  if (typeof fieldName !== 'string' || typeof parentKey !== 'string') return undefined
  if (parentKey === 'lightTheme') return LIGHT_THEME_DEFAULTS[fieldName]
  if (parentKey === 'darkTheme') return DARK_THEME_DEFAULTS[fieldName]
  // Field-level initialValue as preview hint (e.g. featureCardItem.accentColor).
  if (typeof schemaInitialValue === 'string' && HEX6.test(schemaInitialValue)) {
    return schemaInitialValue
  }
  return undefined
}

export default function ColorPaletteInput(props: StringInputProps) {
  const {onChange, value, schemaType, path} = props
  const opts = schemaType.options as PaletteOptions | undefined
  const allowsTransparent =
    opts?.allowTransparent === true ||
    (opts?.list || []).some((o) => o?.value === 'transparent')

  const modeDefault = modeDefaultFor(path, schemaType.initialValue)
  const current = value || ''
  // What the swatch should actually show: the admin's own value, or —
  // only when nothing is set — the mode-correct default so Studio's
  // preview matches what the live site will actually render.
  const previewValue = current || modeDefault || ''
  const isPreviewTransparent = previewValue === 'transparent'
  // The toggle button's own state tracks only what's actually SET, not the
  // preview — otherwise, when a mode default happens to be "transparent",
  // the button would show as already-pressed with nothing stored, and
  // clicking it (toggling an already-"transparent" state off) could never
  // explicitly set the value rather than just matching the default.
  const isSetTransparent = current === 'transparent'
  const pickerValue = HEX6.test(current) ? current : HEX6.test(modeDefault || '') ? (modeDefault as string) : '#ffffff'

  const commit = useCallback(
    (next: string) => {
      if (!next) {
        onChange(unset())
        return
      }
      onChange(set(next))
    },
    [onChange],
  )

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0'}}>
      <label
        title={
          isPreviewTransparent
            ? isSetTransparent
              ? 'Transparent — click to pick a color'
              : `Default: transparent — click to pick a color`
            : current || (modeDefault ? `Default: ${modeDefault} — click to pick a color` : 'Pick a color')
        }
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          cursor: 'pointer',
          border: current ? '1px solid rgba(0,0,0,0.15)' : '1px dashed rgba(0,0,0,0.3)',
          display: 'inline-block',
          overflow: 'hidden',
          background: isPreviewTransparent
            ? 'repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 10px 10px'
            : previewValue || '#ffffff',
        }}
      >
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => commit(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            border: 'none',
            padding: 0,
          }}
        />
      </label>

      {allowsTransparent && (
        <button
          type="button"
          onClick={() => (isSetTransparent ? onChange(unset()) : onChange(set('transparent')))}
          title={isSetTransparent ? 'Clear transparent' : 'Set to transparent'}
          aria-pressed={isSetTransparent}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: isSetTransparent ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.15)',
            background: 'repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 10px 10px',
            padding: 0,
          }}
        />
      )}
      {/* Clear button — only appears when a hex color is explicitly stored.
          Lets admins unset a section-level override (e.g. accentBarColor)
          and return to per-card colors, which is otherwise impossible once
          a hex value is stored (the transparent toggle only toggles
          transparent on/off; it can't unset a hex value in one click). */}
      {HEX6.test(current) && (
        <button
          type="button"
          onClick={() => onChange(unset())}
          title="Clear — remove override and use built-in default"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: '1px solid rgba(0,0,0,0.15)',
            background: '#f9fafb',
            fontSize: '16px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            color: '#6b7280',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
