import {useCallback} from 'react'
import {set, unset, type NumberInputProps} from 'sanity'

const MAX = 60

export default function RadiusInput(props: NumberInputProps) {
  const {onChange, value} = props
  const current = typeof value === 'number' ? value : 0

  const commit = useCallback(
    (n: number) => {
      const clamped = Math.max(0, Math.min(MAX, n))
      if (clamped === 0) onChange(unset())
      else onChange(set(clamped))
    },
    [onChange],
  )

  return (
    <input
      type="number"
      min={0}
      max={MAX}
      step={1}
      value={current}
      onChange={(e) => commit(parseInt(e.target.value, 10) || 0)}
      style={{
        width: '100px',
        padding: '6px 8px',
        fontSize: '13px',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        background: 'transparent',
        outline: 'none',
        color: 'inherit',
      }}
    />
  )
}
