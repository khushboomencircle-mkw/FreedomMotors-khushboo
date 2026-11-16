import {useCallback} from 'react'
import {set, unset, type NumberInputProps} from 'sanity'

interface RangeOptions {
  range?: {min?: number; max?: number; step?: number; labels?: string[]}
}

const DEFAULT_LABELS = ['None', 'Snug', 'Comfortable', 'Roomy', 'Max']

export default function RangeInput(props: NumberInputProps) {
  const {onChange, value, schemaType, elementProps} = props
  const rangeOptions = schemaType.options as RangeOptions | undefined
  const min = rangeOptions?.range?.min ?? 0
  const max = rangeOptions?.range?.max ?? 100
  const step = rangeOptions?.range?.step ?? 1
  const labels = rangeOptions?.range?.labels ?? DEFAULT_LABELS

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      onChange(Number.isNaN(val) ? unset() : set(val))
    },
    [onChange],
  )

  const current = value ?? min
  const pct = max > min ? ((current - min) / (max - min)) * 100 : 0
  const labelIndex = Math.min(labels.length - 1, Math.floor((pct / 100) * labels.length))
  const label = labels[labelIndex]

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
      <input
        {...elementProps}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={handleChange}
        style={{
          flex: 1,
          height: '6px',
          appearance: 'none',
          borderRadius: '3px',
          outline: 'none',
          cursor: 'pointer',
          background: `linear-gradient(to right, #2563eb ${pct}%, #e2e8f0 ${pct}%)`,
        }}
      />
      <span style={{minWidth: '92px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: '#64748b'}}>
        {label}
      </span>
    </div>
  )
}
