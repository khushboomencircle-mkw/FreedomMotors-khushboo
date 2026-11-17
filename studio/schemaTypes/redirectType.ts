import {defineField, defineType} from 'sanity'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'

export function normalizePath(raw?: string | null): string {
  const value = (raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '')
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const withoutQueryOrHash = withLeadingSlash.split(/[?#]/)[0]
  const lower = withoutQueryOrHash.toLowerCase()
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower
}

export function splitDestination(raw?: string | null): {key: string; full: string} {
  const value = (raw || '').trim()
  const key = normalizePath(value)
  // Full URLs: normalizePath only trims a trailing slash and keeps the rest.
  if (!key || /^https?:\/\//i.test(value)) return {key, full: key}
  const suffixAt = value.search(/[?#]/)
  return {key, full: suffixAt === -1 ? key : key + value.slice(suffixAt)}
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

      const graph = new Map(
        others.map((o) => [normalizePath(o.source), normalizePath(o.destination)]),
      )
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
