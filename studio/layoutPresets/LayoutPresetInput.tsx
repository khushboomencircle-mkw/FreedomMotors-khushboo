import {useCallback} from 'react'
import {PatchEvent, set, useFormCallbacks, useFormValue} from 'sanity'
import type {StringInputProps} from 'sanity'
import LayoutThumb from './LayoutThumb'
import {
  activePresetId,
  changesFor,
  LAYOUT_PRESETS,
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
const note: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  lineHeight: 1.45,
  opacity: 0.75,
}

export default function LayoutPresetInput(props: StringInputProps) {
  const {path, readOnly} = props
  // The section this picker sits in (the picker field is a child of it).
  const sectionPath = path.slice(0, -1)
  const section = useFormValue(sectionPath) as (FieldValues & {_type?: string}) | undefined
  const {onChange} = useFormCallbacks()

  const config = section?._type ? LAYOUT_PRESETS[section._type as string] : undefined

  const choose = useCallback(
    (preset: LayoutPreset) => {
      if (!config || readOnly) return
      const changes = changesFor(config, preset, section)
      const entries = Object.entries(changes)
      if (entries.length === 0) return
      // One patch event = one undo step. Paths are from the document root, so the section's siblings are reachable.
      onChange(
        PatchEvent.from(entries.map(([field, value]) => set(value, [...sectionPath, field]))),
      )
    },
    [config, readOnly, section, onChange, sectionPath],
  )

  if (!config) return null

  const activeId = activePresetId(config, section)
  const active = config.presets.find((p) => p.id === activeId)

  return (
    <div>
      <div role="radiogroup" aria-label="Layout" style={grid}>
        {config.presets.map((preset) => {
          const selected = preset.id === activeId
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
              <LayoutThumb kind={preset.thumb} />
              <span style={label}>{preset.title}</span>
            </button>
          )
        })}
      </div>

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
