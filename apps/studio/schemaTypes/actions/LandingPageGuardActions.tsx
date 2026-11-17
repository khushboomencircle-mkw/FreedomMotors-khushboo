import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {
  CHECKING_REASON,
  LOOKUP_FAILED_REASON,
  POSTS_FOR_LANDING_PAGE_QUERY,
  blockedReason,
  countDistinctPosts,
  type GuardedAction,
} from './landingPageGuard'

/**
 * Wraps one of Sanity's built-in document actions (delete, unpublish, unpublishVersion) for
 * Landing Pages so it is disabled, with a short reason, while any Blog Post is attached.
 * The built-in actions aren't exported by name, so sanity.config.ts passes in the one from `prev`.
 *
 * Fails closed: while the count is loading, or if the lookup fails, the action stays disabled.
 * The count is checked again when the button is clicked, in case the state above is stale.
 */

type GuardState = {status: 'checking'} | {status: 'failed'} | {status: 'ready'; count: number}

const API_VERSION = '2024-01-01'

// One wrapper per built-in action, so the component identity stays stable across renders.
const wrappers = new WeakMap<DocumentActionComponent, DocumentActionComponent>()

export function guardLandingPageAction(
  original: DocumentActionComponent,
  guardedAction: GuardedAction,
): DocumentActionComponent {
  const existing = wrappers.get(original)
  if (existing) return existing

  const Guarded: DocumentActionComponent = (props) => {
    const client = useClient({apiVersion: API_VERSION})
    const [state, setState] = useState<GuardState>({status: 'checking'})
    const [notice, setNotice] = useState<string | null>(null)

    // `props.id` is the published id, which is what a post's reference holds.
    const countPosts = () =>
      client
        .withConfig({perspective: 'raw'})
        .fetch<string[]>(POSTS_FOR_LANDING_PAGE_QUERY, {landingPageId: props.id})
        .then(countDistinctPosts)

    useEffect(() => {
      let alive = true
      const load = () =>
        countPosts().then(
          (count) => alive && setState({status: 'ready', count}),
          () => alive && setState({status: 'failed'}),
        )
      load()
      // Posts are created in other documents, so refresh when the editor returns to this tab.
      window.addEventListener('focus', load)
      return () => {
        alive = false
        window.removeEventListener('focus', load)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, props.id])

    // Always run the built-in action so its own hooks, dialog and shortcuts keep working.
    const builtIn = original(props)
    if (!builtIn) return builtIn

    const reason =
      state.status === 'checking'
        ? CHECKING_REASON
        : state.status === 'failed'
          ? LOOKUP_FAILED_REASON
          : state.count > 0
            ? blockedReason(state.count, guardedAction)
            : null

    return {
      ...builtIn,
      disabled: builtIn.disabled || reason !== null,
      title: reason ?? builtIn.title,
      dialog: notice
        ? {
            type: 'dialog' as const,
            id: 'landing-page-guard-notice',
            header:
              guardedAction === 'delete'
                ? "Can't delete this landing page"
                : "Can't unpublish this landing page",
            content: notice,
            onClose: () => setNotice(null),
          }
        : builtIn.dialog,
      onHandle: async () => {
        try {
          const count = await countPosts()
          if (count > 0) {
            setState({status: 'ready', count})
            setNotice(blockedReason(count, guardedAction))
            return
          }
        } catch {
          setState({status: 'failed'})
          setNotice(LOOKUP_FAILED_REASON)
          return
        }
        builtIn.onHandle?.()
      },
    }
  }

  Guarded.action = original.action
  Guarded.displayName = `Guarded(${original.displayName ?? original.action ?? 'action'})`
  wrappers.set(original, Guarded)
  return Guarded
}
