import {useState} from 'react'
import type {DocumentActionProps} from 'sanity'
import {useClient} from 'sanity'
import {isReservedSlug} from '../navConstants'

interface NavLink {
  _key: string
  href?: string
  label?: string
}

interface ActionResult {
  created: string[]
  skipped: string[]
  failed: string[]
}

/**
 * Document action for navigationSettings.
 * Fetches the latest saved draft from the API (so it always reflects the
 * most recently autosaved state), then creates a stub customPage draft for
 * every internal nav link that is not a built-in page and does not already
 * have a corresponding customPage document.
 */
export function CreateNavPagesAction(props: DocumentActionProps) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  // Use props.draft for the enabled/disabled check so the button state is reactive.
  const previewDoc = props.draft ?? props.published
  const previewLinks: NavLink[] = (previewDoc as any)?.links ?? []
  const hasNewLinks = previewLinks.some((l) => l.href?.startsWith('/') && !isReservedSlug(l.href))

  return {
    label: busy ? 'Creating pages…' : 'Create Pages',
    title: 'Create a stub Custom Page for each new navigation link',
    disabled: busy || !hasNewLinks,
    dialog: result
      ? {
          type: 'dialog' as const,
          id: 'create-pages-result',
          header: 'Create Pages — Result',
          onClose: () => setResult(null),
          content:
            result.failed.length > 0
              ? `Failed to create: ${result.failed.join(', ')}. Check the browser console for details.`
              : result.created.length > 0
                ? `Created ${result.created.length} page(s): ${result.created.join(', ')}${result.skipped.length > 0 ? `. Skipped (already exist): ${result.skipped.join(', ')}` : ''}.`
                : `All pages already exist: ${result.skipped.join(', ')}.`,
        }
      : undefined,
    onHandle: async () => {
      setBusy(true)
      const outcome: ActionResult = {created: [], skipped: [], failed: []}

      try {
        // Always read the latest saved state from the API so we pick up autosaved changes.
        const freshDoc = await client.fetch<{links?: NavLink[]} | null>(
          `*[_id in ["drafts.navigationSettings", "navigationSettings"]] | order(_updatedAt desc)[0]{links}`,
        )
        const links: NavLink[] = freshDoc?.links ?? []

        const newLinks = links.filter((l) => l.href?.startsWith('/') && !isReservedSlug(l.href))

        if (newLinks.length === 0) {
          outcome.skipped.push('(no new internal links found)')
        }

        for (const link of newLinks) {
          const slug = (link.href ?? '').replace(/^\/+/, '').toLowerCase()
          if (!slug) continue

          try {
            // Check both published and draft documents for this slug.
            const [publishedCount, draftCount] = await Promise.all([
              client.fetch<number>(
                `count(*[_type == "customPage" && lower(slug.current) == $slug])`,
                {slug},
              ),
              client.fetch<number>(`count(*[_id == $draftId])`, {
                draftId: `drafts.customPage-${slug.replace(/\//g, '-')}`,
              }),
            ])

            if (publishedCount > 0 || draftCount > 0) {
              outcome.skipped.push(slug)
              continue
            }

            const newId = `customPage-${slug.replace(/\//g, '-')}`
            await client.createOrReplace({
              _id: `drafts.${newId}`,
              _type: 'customPage',
              title: link.label || slug,
              slug: {_type: 'slug', current: slug},
              showInNavigation: false,
            })
            outcome.created.push(slug)
          } catch (err) {
            console.error(`[CreateNavPagesAction] Failed for "${link.href}":`, err)
            outcome.failed.push(slug)
          }
        }
      } catch (err) {
        console.error('[CreateNavPagesAction] Unexpected error:', err)
        outcome.failed.push('(unexpected error — see console)')
      } finally {
        setBusy(false)
        setResult(outcome)
        props.onComplete()
      }
    },
  }
}
