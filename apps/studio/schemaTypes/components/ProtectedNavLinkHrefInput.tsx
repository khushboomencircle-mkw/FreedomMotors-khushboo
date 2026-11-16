import {useContext} from 'react'
import {Stack, Text} from '@sanity/ui'
import type {StringInputProps} from 'sanity'
import {NavLinkProtectionContext, PROTECTED_LINK_NOTE} from '../navLinkProtection'

/**
 * Link Path field. Read-only for a protected link, so renaming it can't break the page behind
 * it. Label, Show in Header and Show in Footer stay editable.
 */
export default function ProtectedNavLinkHrefInput(props: StringInputProps) {
  const context = useContext(NavLinkProtectionContext)
  // This field's path looks like ['links', {_key}, 'href'].
  const linkKey = props.path.find(
    (segment): segment is {_key: string} =>
      typeof segment === 'object' && segment !== null && '_key' in segment,
  )?._key
  const locked = Boolean(linkKey && context?.protectedKeys.has(linkKey))

  if (!locked) return props.renderDefault(props)

  return (
    <Stack gap={2}>
      {props.renderDefault({...props, readOnly: true})}
      <Text size={1} muted>
        {PROTECTED_LINK_NOTE}
      </Text>
    </Stack>
  )
}
