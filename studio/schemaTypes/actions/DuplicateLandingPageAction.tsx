import {useState} from 'react'
import type {DocumentActionComponent} from 'sanity'
import {useClient} from 'sanity'
import {useRouter} from 'sanity/router'
import {randomKey} from '@sanity/util/content'
import {CopyIcon} from '@sanity/icons/Copy'

/**
 * Replaces the built-in Duplicate action for customPage ("Landing Page" in
 * the Studio UI) — registered in sanity.config.ts's document.actions
 * resolver, scoped to customPage only. A duplicated landing page always
 * starts as "{title} (copy)" with its URL slug cleared, so two pages can
 * never silently share one slug; the admin must deliberately choose a new
 * URL before the copy can be published (slug is Rule.required() on
 * customPage, so the draft is intentionally left failing that check).
 */
const DuplicateLandingPageActionComponent: DocumentActionComponent = (props) => {
  const {type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const {navigateIntent} = useRouter()
  const [isDuplicating, setIsDuplicating] = useState(false)

  const source = (draft ?? published) as Record<string, unknown> | null

  return {
    icon: CopyIcon,
    label: isDuplicating ? 'Duplicating…' : 'Duplicate',
    disabled: isDuplicating || !source,
    onHandle: async () => {
      if (!source) return
      setIsDuplicating(true)
      try {
        const {_id, _rev, _createdAt, _updatedAt, slug, title, ...rest} = source
        const newId = `customPage-${randomKey(24)}`
        await client.create({
          ...rest,
          _id: `drafts.${newId}`,
          _type: 'customPage',
          title: title ? `${title} (copy)` : 'Untitled Page (copy)',
        })
        onComplete()
        navigateIntent('edit', {id: newId, type})
      } finally {
        setIsDuplicating(false)
      }
    },
  }
}

DuplicateLandingPageActionComponent.action = 'duplicate'
DuplicateLandingPageActionComponent.displayName = 'DuplicateLandingPageAction'

export const DuplicateLandingPageAction = DuplicateLandingPageActionComponent
