import {useEffect, useRef} from 'react'
import {PatchEvent, set, unset} from 'sanity'
import type {ObjectInputProps} from 'sanity'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function NavLinkItemInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const item = value as {label?: string; href?: string} | undefined
  const label = item?.label ?? ''
  const href = item?.href ?? ''

  // Latest path, readable inside the effect without re-running it on path edits.
  const hrefRef = useRef(href)
  hrefRef.current = href
  // The last path this component wrote — what "still auto-filled" means.
  const lastAutoHref = useRef<string | null>(null)
  // Starts at the label's value on open, so merely opening a link changes nothing.
  const prevLabel = useRef(label)

  useEffect(() => {
    if (label === prevLabel.current) return
    prevLabel.current = label

    const isEmpty = hrefRef.current === ''
    const isStillAuto = lastAutoHref.current !== null && hrefRef.current === lastAutoHref.current
    if (!isEmpty && !isStillAuto) return

    const slug = slugify(label)
    const nextHref = slug ? `/${slug}` : ''
    lastAutoHref.current = nextHref || null
    onChange(PatchEvent.from(nextHref ? set(nextHref, ['href']) : unset(['href'])))
  }, [label, onChange])

  return renderDefault(props)
}
