import type {ReactNode} from 'react'
import {useFormValue} from 'sanity'
import type {FieldProps, StringInputProps} from 'sanity'
import {previewUrlFor} from '../sectionLibrary/library'
import {positionOnPage, SECTION_GUIDE} from './sectionGuide'

/**
 * Two DISPLAY-ONLY pieces for the top of a section's Content tab. Neither stores anything: they draw from the section's
 * type and from where it sits in the page, and never write a value.
 *
 *   SectionIntroInput     the section's picture, what it is for, and one tip
 *   SectionPositionInput  "#3 of 12": where the section sits on the page
 */

const card: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 148px) minmax(0, 1fr)',
  gap: 16,
  padding: 14,
  borderRadius: 10,
  border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--card-focus-ring-color, #2276fc) 14%, transparent), transparent 140%)',
}

/** The section the field sits in: its value, and the sections around it. */
function useSection(path: StringInputProps['path']) {
  const section = useFormValue(path.slice(0, -1)) as {_type?: string; _key?: string} | undefined
  const siblings = useFormValue(path.slice(0, -2)) as
    {_key?: string; sequence?: number}[] | undefined
  return {section, siblings}
}

export function SectionIntroInput(props: StringInputProps) {
  const {section} = useSection(props.path)
  const guide = section?._type ? SECTION_GUIDE[section._type] : undefined
  if (!guide || !section?._type) return null
  return (
    <div style={card}>
      <img
        src={previewUrlFor(section._type)}
        alt=""
        style={{width: '100%', height: 'auto', display: 'block', borderRadius: 8}}
      />
      <div style={{minWidth: 0}}>
        <div
          style={{fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', opacity: 0.65}}
        >
          Section type
        </div>
        <div style={{fontSize: 16, fontWeight: 600, marginTop: 2}}>{guide.name}</div>
        <p style={{margin: '6px 0 0', fontSize: 13, opacity: 0.75, lineHeight: 1.5}}>
          {guide.description}
        </p>
        <p style={{margin: '6px 0 0', fontSize: 13, lineHeight: 1.5}}>
          <strong style={{color: 'var(--card-focus-ring-color, #2276fc)', marginRight: 6}}>
            Tip
          </strong>
          {guide.tip}
        </p>
      </div>
    </div>
  )
}

export function SectionPositionInput(props: StringInputProps) {
  const {section, siblings} = useSection(props.path)
  const where = positionOnPage(siblings, section?._key)
  return (
    <div style={{fontSize: 14, lineHeight: '36px'}}>
      {where ? (
        <>
          <strong>#{where.position}</strong> of {where.total}
        </>
      ) : (
        <span style={{opacity: 0.6}}>Not placed yet</span>
      )}
    </div>
  )
}

/** A field wrapper that shows only the input: no label or description above the intro card. */
export function BareField(props: FieldProps): ReactNode {
  return <div>{props.children}</div>
}
