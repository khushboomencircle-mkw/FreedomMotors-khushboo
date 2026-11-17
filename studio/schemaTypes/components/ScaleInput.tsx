import {set, type StringInputProps} from 'sanity'

export default function ScaleInput(props: StringInputProps) {
  const {onChange, value, schemaType} = props
  const list = (schemaType.options?.list || []) as {title: string; value: string}[]
  const matchedIndex = list.findIndex((o) => o.value === value)
  const isEmpty = value == null || value === ''
  // A truly empty field defaults to the first option (same as initialValue) —
  // that's a real, valid state. A non-empty value that matches nothing in the
  // list (e.g. a legacy document with a raw number like `1` where this field
  // now expects the string "1px") is NOT the same thing and must not be drawn
  // as if "Thin" were already selected: that previously hid the exact invalid
  // value Sanity's own validation was flagging, leaving an error with no
  // visible cause. Nothing highlighted here means "pick one to fix this."
  const activeIndex = matchedIndex >= 0 ? matchedIndex : isEmpty ? 0 : -1

  return (
    <div style={{display: 'flex', gap: '3px', width: '100%', alignItems: 'center'}}>
      {list.map((opt, i) => {
        const filled = activeIndex >= 0 && i <= activeIndex
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            onClick={() => onChange(set(opt.value))}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              background: filled ? '#2563eb' : '#e2e8f0',
              opacity: filled ? 1 - (activeIndex - i) * 0.15 : 1,
            }}
          />
        )
      })}
    </div>
  )
}
