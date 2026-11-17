import {useCallback} from 'react'
import {set, type ObjectInputProps} from 'sanity'

type PaddingValue = {top?: number; right?: number; bottom?: number; left?: number}

const MAX = 120

function Cell({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  const pct = (value / MAX) * 100
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}}>
      <span
        style={{
          width: '48px',
          fontSize: '13px',
          color: 'var(--card-muted-fg-color, #64748b)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        style={{
          flex: 1,
          height: '4px',
          appearance: 'none',
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
          background: `linear-gradient(to right, #2563eb ${pct}%, #e2e8f0 ${pct}%)`,
        }}
      />
      <input
        type="number"
        min={0}
        max={MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        style={{
          width: '52px',
          padding: '4px 6px',
          fontSize: '13px',
          textAlign: 'center',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          background: 'transparent',
          outline: 'none',
          flexShrink: 0,
          color: 'inherit',
        }}
      />
    </div>
  )
}

export default function PaddingInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const val = (value as PaddingValue) || {}

  const handleChange = useCallback(
    (side: keyof PaddingValue, newVal: number) => {
      const clamped = Math.max(0, Math.min(MAX, newVal || 0))
      onChange(set({...val, [side]: clamped}))
    },
    [onChange, val],
  )

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
      {/* Row 1: Left + Right */}
      <div style={{display: 'flex', gap: '16px'}}>
        <Cell label="Left" value={val.left ?? 0} onChange={(n) => handleChange('left', n)} />
        <Cell label="Right" value={val.right ?? 0} onChange={(n) => handleChange('right', n)} />
      </div>

      {/* Row 2: Top + Bottom */}
      <div style={{display: 'flex', gap: '16px'}}>
        <Cell label="Top" value={val.top ?? 0} onChange={(n) => handleChange('top', n)} />
        <Cell label="Bottom" value={val.bottom ?? 0} onChange={(n) => handleChange('bottom', n)} />
      </div>
    </div>
  )
}
