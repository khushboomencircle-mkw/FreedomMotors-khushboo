import {useCallback} from 'react'
import {set, unset, type TextInputProps} from 'sanity'

/**
 * Lightweight monospace editor for the Custom HTML Section's `htmlCode` field.
 * A full-width textarea that preserves whitespace/line breaks and integrates
 * with Sanity's form state via set/unset patches. Field-level validation
 * (from the schema's validation rule) is rendered by the field wrapper.
 */
export default function HtmlCodeInput(props: TextInputProps) {
  const {onChange, value = '', elementProps} = props

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.currentTarget.value
      onChange(next ? set(next) : unset())
    },
    [onChange],
  )

  return (
    <textarea
      {...elementProps}
      value={value}
      onChange={handleChange}
      rows={20}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        fontSize: 13,
        lineHeight: 1.55,
        padding: 12,
        borderRadius: 4,
        border: '1px solid var(--card-border-color, #e2e8f0)',
        background: 'var(--card-code-bg-color, var(--card-bg-color, #ffffff))',
        color: 'var(--card-code-fg-color, var(--card-fg-color, #0f172a))',
        tabSize: 2,
        resize: 'vertical',
        whiteSpace: 'pre',
        overflowWrap: 'normal',
        overflowX: 'auto',
        minHeight: 320,
      }}
    />
  )
}
