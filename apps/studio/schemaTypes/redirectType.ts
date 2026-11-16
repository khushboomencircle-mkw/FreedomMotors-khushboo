/**
 * Redirect — Document
 *
 * Studio-editable URL redirects. Publishing/unpublishing one of these fires
 * a Sanity webhook (configured by hand in manage.sanity.io, not in code —
 * see apps/web/.env.local.example for the shared secret it must send) that
 * hits apps/web's `/api/redirects/sync` route, which re-reads every active
 * redirect here and writes the flattened map to Vercel's Global Config —
 * see apps/web/src/lib/redirects.ts. This document only has to stay
 * internally consistent; it never talks to Vercel itself.
 *
 * The four validation rules below exist to keep every redirect a single,
 * direct hop (old → new, nothing in between) at save time, so the sync job
 * never has to guess what an editor meant by a chain — it only has to
 * defend against data that predates this validation (see flattenRedirects
 * in apps/web/src/lib/redirects.ts).
 */
import {defineField, defineType} from 'sanity'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'

/**
 * Keep this in sync with apps/web/src/lib/redirects.ts's `normalizePath` —
 * same algorithm, duplicated because Studio and the web app are separate,
 * independently-deployed packages with no shared module between them.
 * Lowercases, forces a leading slash, strips any query/hash, and drops a
 * trailing slash (except on the root path) so "/Old-Page/" and "/old-page"
 * are recognized as the same address everywhere this runs.
 */
export function normalizePath(raw?: string | null): string {
  const value = (raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '')
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const withoutQueryOrHash = withLeadingSlash.split(/[?#]/)[0]
  const lower = withoutQueryOrHash.toLowerCase()
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower
}

type RedirectDoc = {
  _id?: string
  source?: string
  destination?: string
}

export const redirectType = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  icon: ArrowRightIcon,
  fields: [
    defineField({
      name: 'source',
      title: 'Old Address',
      type: 'string',
      description:
        'The path visitors currently land on, e.g. "/old-page". Case, a ' +
        'trailing slash, and the leading slash are all normalized ' +
        'automatically, so "Old-Page/" and "/old-page" are treated as the ' +
        'same address.',
      placeholder: '/old-page',
      validation: (Rule) =>
        Rule.required()
          .error('Enter the old address to redirect from.')
          .custom((value?: string) => {
            if (value && /^https?:\/\//i.test(value)) {
              return 'The old address must be a path on this site (e.g. "/old-page"), not a full URL.'
            }
            return true
          }),
    }),
    defineField({
      name: 'destination',
      title: 'New Address',
      type: 'string',
      description:
        'Where visitors should land instead — a path on this site (e.g. ' +
        '"/new-page") or a full URL (e.g. "https://example.com") to send ' +
        'them somewhere external.',
      placeholder: '/new-page',
      validation: (Rule) => Rule.required().error('Enter the new address to redirect to.'),
    }),
    defineField({
      name: 'permanent',
      title: 'Permanent Redirect',
      type: 'boolean',
      description:
        'On: 308 Permanent — tells browsers and search engines to update ' +
        'their records and stop checking the old address. Off: 307 ' +
        'Temporary — for a short-lived redirect you expect to remove later.',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description:
        'Off: this redirect is ignored everywhere — treated as if it ' +
        "didn't exist by both the live site and the sync job. Use this to " +
        'pause a redirect without deleting it.',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
      description: 'Optional — why this redirect exists, for other editors.',
    }),
  ],
  preview: {
    select: {
      source: 'source',
      destination: 'destination',
      permanent: 'permanent',
      isActive: 'isActive',
    },
    prepare({source, destination, permanent, isActive}) {
      const bits = [
        permanent === false ? '307 Temporary' : '308 Permanent',
        isActive === false ? 'Inactive' : null,
      ].filter(Boolean)
      return {
        title: `${source || '(no old address)'} → ${destination || '(no new address)'}`,
        subtitle: bits.join(' · '),
      }
    },
  },
  validation: (Rule) =>
    Rule.custom(async (doc: RedirectDoc | undefined, context) => {
      if (!doc) return true

      const source = normalizePath(doc.source)
      const destination = normalizePath(doc.destination)
      // Emptiness is already reported by each field's own required() above.
      if (!source || !destination) return true

      if (source === destination) {
        return 'The old and new addresses are the same — this would redirect a page to itself.'
      }

      const rawId = (context.document?._id as string) || ''
      const id = rawId.replace(/^drafts\./, '')
      const client = context.getClient({apiVersion: '2024-01-01'})
      const others = await client.fetch<{source: string; destination: string}[]>(
        `*[_type == "redirect" && !(_id in [$draft, $published]) && defined(source) && defined(destination)]{source, destination}`,
        {draft: `drafts.${id}`, published: id},
      )

      const duplicate = others.some((o) => normalizePath(o.source) === source)
      if (duplicate) {
        return `"${doc.source}" is already used as the old address on another redirect. Each old address can only redirect to one place.`
      }

      const chainsIntoAnother = others.some((o) => normalizePath(o.source) === destination)
      if (chainsIntoAnother) {
        return `"${doc.destination}" is itself the old address of another redirect — that would chain two redirects together. Point this one straight at the final address instead.`
      }

      // Belt-and-braces loop check: with the two rules above enforced on
      // every save, a destination can never already be someone else's
      // source, so a multi-hop loop shouldn't be constructible in the first
      // place. This still walks the chain in case that invariant was
      // broken by data saved before this validation existed, or by the
      // bulk CSV import script.
      const graph = new Map(others.map((o) => [normalizePath(o.source), normalizePath(o.destination)]))
      graph.set(source, destination)
      let current = destination
      for (let hop = 0; hop < others.length + 1; hop++) {
        if (current === source) {
          return 'This redirect is part of a loop — following the chain of redirects eventually leads back to the old address.'
        }
        const next = graph.get(current)
        if (!next) break
        current = next
      }

      return true
    }),
})
