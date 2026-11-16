import type {FieldProps} from 'sanity'

/**
 * Custom field wrapper that renders a Sanity-styled "Title (Value)" label
 * above the input (replacing Sanity's default field header). All ScaleField
 * fields in a row then share the same label Y-position, so headers and
 * progress bars line up across columns.
 */
export default function ScaleField(props: FieldProps) {
  const inputProps = (props as any).inputProps
  const value = inputProps?.value
  const schemaType = inputProps?.schemaType
  const list = schemaType?.options?.list as {title: string; value: string}[] | undefined
  const selectedLabel = list?.find((o) => o.value === value)?.title || ''

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
      <label
        htmlFor={props.inputId}
        style={{
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
          color: 'var(--card-fg-color, #0f172a)',
        }}
      >
        {props.title}
        {selectedLabel && (
          <span style={{color: 'var(--card-muted-fg-color, #64748b)', fontWeight: 400}}>
            {' '}
            ({selectedLabel})
          </span>
        )}
      </label>
      {props.children}
    </div>
  )
}
