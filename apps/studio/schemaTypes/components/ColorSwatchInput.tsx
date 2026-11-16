import {set, type StringInputProps} from 'sanity'

export default function ColorSwatchInput(props: StringInputProps) {
  const {onChange, value, schemaType} = props
  const list = (schemaType.options?.list || []) as {title: string; value: string; swatch?: string}[]
  const LIGHT_SWATCHES = ['#ffffff', 'transparent', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db']

  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '2px 0'}}>
      {list.map((opt) => {
        const selected = value === opt.value
        const swatchColor = opt.swatch || opt.value
        const isLight = LIGHT_SWATCHES.includes(swatchColor)
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            onClick={() => onChange(set(opt.value))}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              cursor: 'pointer',
              background:
                swatchColor === 'transparent'
                  ? 'repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 10px 10px'
                  : swatchColor,
              border: selected ? '2px solid #2563eb' : isLight ? '1px solid #d1d5db' : '1px solid transparent',
              boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px #2563eb' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {selected && (
              <span
                style={{
                  color: isLight ? '#2563eb' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
