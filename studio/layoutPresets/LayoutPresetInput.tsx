import {useCallback, useContext, useEffect, useState} from 'react'
import {PatchEvent, set} from 'sanity'
import LayoutThumb from './LayoutThumb'
import {LayoutPickerContext} from './LayoutPickerContext'
import {
  activePresetId,
  changesFor,
  LAYOUT_PRESETS,
  perRowChange,
  perRowValue,
  showsPerRow,
  type FieldValues,
  type LayoutPreset,
} from './presets'

/**
 * The layout picker shown at the top of a section's Layout tab.
 *
 * It owns no data of its own: it reads the section's existing layout fields to highlight the current layout, and
 * choosing a picture writes those same fields (one undo step). Everything below it in the tab still works as before.
 */

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: 8,
}

const card = (active: boolean, disabled: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '10px 8px 8px',
  borderRadius: 8,
  border: active
    ? '2px solid var(--card-focus-ring-color, #2276fc)'
    : '1px solid color-mix(in srgb, currentColor 22%, transparent)',
  // 1px less padding when the border is thicker, so cards don't shift size on selection.
  margin: active ? 0 : 1,
  background: active ? 'color-mix(in srgb, currentColor 10%, transparent)' : 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  textAlign: 'center',
})

const label: React.CSSProperties = {fontSize: 12, fontWeight: 600, lineHeight: 1.25}
const note: React.CSSProperties = {marginTop: 10, fontSize: 12, lineHeight: 1.45, opacity: 0.75}
const perRowRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 12,
  fontSize: 13,
}
const numberInput: React.CSSProperties = {
  width: 64,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid color-mix(in srgb, currentColor 28%, transparent)',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
}

export default function LayoutPresetInput() {
  // The section this picker sits in, supplied by LayoutSectionInput (see LayoutPickerContext for why).
  const ctx = useContext(LayoutPickerContext)
  const section = ctx?.value as (FieldValues & {_type?: string}) | undefined
  const readOnly = ctx?.readOnly
  const onChange = ctx?.onChange

  const config = section?._type ? LAYOUT_PRESETS[section._type] : undefined

  const write = useCallback(
    (changes: FieldValues) => {
      const entries = Object.entries(changes)
      if (!onChange || readOnly || entries.length === 0) return
      // One patch event = one undo step. Paths are relative to the section, like any field inside it.
      onChange(PatchEvent.from(entries.map(([field, value]) => set(value, [field]))))
    },
    [onChange, readOnly],
  )

  const choose = useCallback(
    (preset: LayoutPreset) => {
      if (config) write(changesFor(config, preset, section))
    },
    [config, section, write],
  )

  // The number box: typed text is kept while editing, and only a valid whole number in range is saved.
  const shown = config ? perRowValue(config, section) : undefined
  const [typed, setTyped] = useState<string>(shown === undefined ? '' : String(shown))
  useEffect(() => {
    setTyped(shown === undefined ? '' : String(shown))
  }, [shown])

  if (!config) return null

  const activeId = activePresetId(config, section)
  const active = config.presets.find((p) => p.id === activeId)
  const perRow = config.perRow
  const values = {...section} as FieldValues

  const onType = (text: string) => {
    setTyped(text)
    if (perRow && text.trim() !== '') write(perRowChange(config, section ?? {}, Number(text)))
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Layout" style={grid}>
        {config.presets.map((preset) => {
          const selected = preset.id === activeId
          // Only the selected layout's picture follows the number; the others keep their plain picture.
          const kind = selected && preset.thumbFor ? preset.thumbFor(values) : preset.thumb
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={readOnly}
              title={preset.description}
              style={card(selected, Boolean(readOnly))}
              onClick={() => choose(preset)}
            >
              <LayoutThumb kind={kind} />
              <span style={label}>{preset.title}</span>
            </button>
          )
        })}
      </div>

      {perRow && showsPerRow(config, section) && (
        <label style={perRowRow}>
          <span>{perRow.label}</span>
          <input
            type="number"
            inputMode="numeric"
            min={perRow.min}
            max={perRow.max}
            step={1}
            value={typed}
            disabled={readOnly}
            aria-describedby="layout-per-row-hint"
            style={numberInput}
            onChange={(e) => onType(e.currentTarget.value)}
            // Leaving the box with something invalid or empty puts back the number that is really saved.
            onBlur={() => setTyped(shown === undefined ? '' : String(shown))}
          />
          <span id="layout-per-row-hint" style={{opacity: 0.65, fontSize: 12}}>
            {perRow.min} to {perRow.max}
          </span>
        </label>
      )}

      <p style={note} aria-live="polite">
        {active
          ? active.description
          : activeId === 'custom'
            ? 'Custom: the fields below are set to a combination that is not one of the layouts above. Pick a layout to replace it, or keep fine-tuning below.'
            : 'No layout chosen yet. Pick one above, or use the fields below.'}
      </p>
    </div>
  )
}
