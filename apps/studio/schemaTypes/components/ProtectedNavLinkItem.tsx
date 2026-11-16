import {useContext} from 'react'
import {Box, Stack, Text} from '@sanity/ui'
import type {ObjectItemProps} from 'sanity'
import {NavLinkProtectionContext, PROTECTED_LINK_NOTE} from '../navLinkProtection'

/**
 * Row for one nav link. A protected link keeps its drag handle and Edit, but its Remove and
 * Duplicate menu entries are hidden (a row-level `readOnly` would also lock dragging), and a
 * short note explains why. A row removes itself through the Studio's own form callbacks, not
 * through the list input, so `onRemove` is also made inert here: this row is the real gate.
 */
export default function ProtectedNavLinkItem(props: ObjectItemProps) {
  const context = useContext(NavLinkProtectionContext)
  if (!context?.protectedKeys.has(props.value._key)) return props.renderDefault(props)

  const {parentSchemaType} = props
  return (
    <Stack gap={2}>
      {props.renderDefault({
        ...props,
        onRemove: () => undefined,
        parentSchemaType: {
          ...parentSchemaType,
          options: {...parentSchemaType.options, disableActions: ['remove', 'duplicate']},
        },
      })}
      <Box paddingX={3}>
        <Text size={0} muted>
          {PROTECTED_LINK_NOTE}
        </Text>
      </Box>
    </Stack>
  )
}
