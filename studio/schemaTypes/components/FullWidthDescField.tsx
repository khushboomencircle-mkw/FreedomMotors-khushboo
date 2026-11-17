import type {FieldProps} from 'sanity'

/**
 * Field wrapper for fields inside column fieldsets.
 * Sanity's switch input renders description inside the switch card — we just
 * pass through to renderDefault and let Sanity handle layout naturally.
 * This eliminates the duplicate-description bug that appeared with manual rendering.
 */
export default function FullWidthDescField(props: FieldProps) {
  return <>{props.renderDefault(props)}</>
}
