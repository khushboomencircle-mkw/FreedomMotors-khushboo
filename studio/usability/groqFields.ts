/**
 * Reads the field names out of a GROQ projection like `{ _key, heading, cards[]{ _key, title } }`, so a test can check
 * that every field the website asks for still exists in the schema. Pure; handles braces, brackets, quotes and the
 * `"alias": expression` form (an alias is the site's own name for something computed, so it is skipped).
 */

/** Splits the inside of a projection at the commas that are not inside braces, brackets, parentheses or quotes. */
export function splitTopLevel(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''
  for (const ch of body) {
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
    } else if ('{[('.includes(ch)) {
      depth++
      current += ch
    } else if ('}])'.includes(ch)) {
      depth--
      current += ch
    } else if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else current += ch
  }
  if (current.trim()) parts.push(current)
  return parts.map((p) => p.trim()).filter(Boolean)
}

/** The text between the first `{` and its matching `}`. */
export function innerBraces(text: string): string {
  const start = text.indexOf('{')
  if (start < 0) return ''
  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return text.slice(start + 1, i)
  }
  return text.slice(start + 1)
}

export interface ProjectedField {
  name: string
  /** The projection inside it, e.g. the card fields of `cards[]{ … }`. */
  nested?: ProjectedField[]
}

/** The real field names a projection reads (aliases like `"videoFileUrl": …` and `...` spreads are skipped). */
export function projectedFields(body: string): ProjectedField[] {
  const fields: ProjectedField[] = []
  for (const part of splitTopLevel(body)) {
    if (part.startsWith('"') || part.startsWith("'") || part.startsWith('...')) continue
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(part)?.[0]
    if (!name) continue
    const rest = part.slice(name.length)
    const nested = rest.includes('{') ? projectedFields(innerBraces(rest)) : undefined
    fields.push({name, ...(nested ? {nested} : {})})
  }
  return fields
}
