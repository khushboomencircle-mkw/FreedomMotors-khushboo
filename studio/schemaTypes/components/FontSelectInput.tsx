import {set, unset, type StringInputProps} from 'sanity'

/**
 * Font picker that keeps the native dropdown but renders the chosen font (and
 * each option, where the browser supports it) in its own typeface, so an editor
 * can see how the font looks without a bulky custom list.
 */
export default function FontSelectInput(props: StringInputProps) {
  const {onChange, value, schemaType, elementProps} = props
  const list = ((schemaType.options?.list || []) as {title: string; value: string}[]) ?? []

  return (
    <select
      {...elementProps}
      value={value || ''}
      onChange={(e) => onChange(e.currentTarget.value ? set(e.currentTarget.value) : unset())}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 4,
        border: '1px solid var(--card-border-color, #e2e8f0)',
        background: 'var(--card-bg-color, #fff)',
        color: 'var(--card-fg-color, #0f172a)',
        fontSize: 15,
        fontFamily: value || undefined,
      }}
    >
      <option value="" style={{fontFamily: 'system-ui'}}>
        Select a font…
      </option>
      {list.map((opt) => (
        <option key={opt.value} value={opt.value} style={{fontFamily: opt.value}}>
          {opt.title}
        </option>
      ))}
    </select>
  )
}
