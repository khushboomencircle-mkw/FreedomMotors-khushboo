import {useCallback, useEffect, useMemo, useState} from 'react'
import {PatchEvent, useClient, type ArrayOfObjectsInputProps, type FormPatch} from 'sanity'
import {
  LANDING_PAGE_SLUGS_QUERY,
  NavLinkProtectionContext,
  protectedKeysOf,
  toLandingHrefs,
  withoutProtectedRemovals,
  type NavLinkValue,
} from '../navLinkProtection'

/**
 * Input for the navigation `links` list. Works out which links are protected (see
 * navLinkProtection.ts), shares that with the rows and the href field through context, and
 * refuses to remove a protected link even if something other than the menu asks for it.
 */
export default function ProtectedNavLinksInput(props: ArrayOfObjectsInputProps) {
  const {value, onItemRemove, onChange, renderDefault} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const [landingHrefs, setLandingHrefs] = useState<Set<string>>(() => new Set())

  // Protection is decided from the list as it was when opened, not from live edits, so typing a
  // new link's href can never lock the field mid-keystroke. New links protect once reopened.
  const [snapshot, setSnapshot] = useState<NavLinkValue[] | undefined>(
    () => value as NavLinkValue[] | undefined,
  )
  useEffect(() => {
    if (!snapshot?.length && value?.length) setSnapshot(value as NavLinkValue[])
  }, [snapshot, value])

  // Landing Pages are created in other documents, so refresh when the editor returns to this tab.
  useEffect(() => {
    let alive = true
    const load = () =>
      client
        .withConfig({perspective: 'raw'})
        .fetch<string[]>(LANDING_PAGE_SLUGS_QUERY)
        .then((slugs) => alive && setLandingHrefs(toLandingHrefs(slugs)))
        .catch(() => undefined) // built-in links stay protected even if this lookup fails
    load()
    window.addEventListener('focus', load)
    return () => {
      alive = false
      window.removeEventListener('focus', load)
    }
  }, [client])

  const protectedKeys = useMemo(() => protectedKeysOf(snapshot, landingHrefs), [snapshot, landingHrefs])
  const contextValue = useMemo(() => ({protectedKeys}), [protectedKeys])

  const guardedItemRemove = useCallback(
    (itemKey: string) => {
      if (!protectedKeys.has(itemKey)) onItemRemove(itemKey)
    },
    [onItemRemove, protectedKeys],
  )

  const guardedChange = useCallback(
    (patch: FormPatch | FormPatch[] | PatchEvent) => {
      const patches = withoutProtectedRemovals(PatchEvent.from(patch).patches, protectedKeys)
      if (patches.length > 0) onChange(PatchEvent.from(patches))
    },
    [onChange, protectedKeys],
  )

  return (
    <NavLinkProtectionContext.Provider value={contextValue}>
      {renderDefault({...props, onItemRemove: guardedItemRemove, onChange: guardedChange})}
    </NavLinkProtectionContext.Provider>
  )
}
