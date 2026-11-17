import {set, type StringInputProps} from 'sanity'

const BARS: Record<'left' | 'center' | 'right', number[]> = {
  left: [100, 65, 85],
  center: [100, 65, 85],
  right: [100, 65, 85],
}

function AlignIcon({type}: {type: 'left' | 'center' | 'right'}) {
  const widths = BARS[type]
  const justify = type === 'left' ? 'flex-start' : type === 'right' ? 'flex-end' : 'center'
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '3px', width: '28px'}}>
      {widths.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            height: '2.5px',
            width: `${w}%`,
            background: 'currentColor',
            borderRadius: '2px',
            alignSelf:
              justify === 'center' ? 'center' : justify === 'flex-end' ? 'flex-end' : 'flex-start',
          }}
        />
      ))}
    </div>
  )
}

export default function AlignInput(props: StringInputProps) {
  const {onChange, value, schemaType} = props
  const list = (schemaType.options?.list || []) as {title: string; value: string}[]
  const order: ('left' | 'center' | 'right')[] = ['left', 'center', 'right']
  const available = order.filter((v) => list.some((o) => o.value === v))

  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {available.map((align) => {
        const selected = value === align
        const label = list.find((o) => o.value === align)?.title || align
        return (
          <button
            key={align}
            type="button"
            title={label}
            onClick={() => onChange(set(align))}
            style={{
              width: '48px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              borderRight: align !== 'right' ? '1px solid #e2e8f0' : 'none',
              background: selected ? '#2563eb' : '#fff',
              color: selected ? '#ffffff' : '#64748b',
            }}
          >
            <AlignIcon type={align} />
          </button>
        )
      })}
    </div>
  )
}
