import {useCallback} from 'react'
import {set, type ObjectInputProps} from 'sanity'

type ShadowValue = {
  enabled?: boolean
  offsetX?: number
  offsetY?: number
  blur?: number
  color?: string
  opacity?: number
}

const HEX6 = /^#[0-9a-f]{6}$/i

function Field({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', flex: 1}}>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--card-muted-fg-color, #64748b)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: '13px',
          textAlign: 'center',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          background: 'transparent',
          outline: 'none',
          color: 'inherit',
        }}
      />
    </div>
  )
}

export default function TextShadowInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const val = (value as ShadowValue) || {}

  const update = useCallback(
    (patch: Partial<ShadowValue>) => {
      onChange(set({...val, ...patch}))
    },
    [onChange, val],
  )

  const enabled = Boolean(val.enabled)
  const color = HEX6.test(val.color || '') ? val.color! : '#000000'

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
      {/* Enable toggle row */}
      <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => update({enabled: e.target.checked})}
        />
        <span style={{fontSize: '13px'}}>Enable shadow</span>
      </label>

      {enabled && (
        <div style={{display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap'}}>
          <Field
            label="Offset X"
            value={val.offsetX ?? 0}
            min={-50}
            max={50}
            onChange={(n) => update({offsetX: n})}
          />
          <Field
            label="Offset Y"
            value={val.offsetY ?? 2}
            min={-50}
            max={50}
            onChange={(n) => update({offsetY: n})}
          />
          <Field
            label="Blur"
            value={val.blur ?? 4}
            min={0}
            max={60}
            onChange={(n) => update({blur: n})}
          />
          <Field
            label="Opacity (0–9)"
            value={val.opacity ?? 5}
            min={0}
            max={9}
            onChange={(n) => update({opacity: Math.max(0, Math.min(9, n))})}
          />
          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--card-muted-fg-color, #64748b)',
                fontWeight: 500,
              }}
            >
              Color
            </span>
            <label
              title={color}
              style={{
                position: 'relative',
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: color,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => update({color: e.target.value})}
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
          </div>
        </div>
      )}
    </div>
  )
}
