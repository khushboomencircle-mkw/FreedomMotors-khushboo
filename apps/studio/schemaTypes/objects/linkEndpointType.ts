import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'

export const linkEndpointType = defineType({
  name: 'linkEndpoint',
  title: 'Navigation Title & Endpoint Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Navigation title (e.g. Home, About, Contact, Profile, Setting)',
    }),
    defineField({
      name: 'label',
      title: 'Label (legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'endpoint',
      title: 'Navigation Endpoint Link',
      type: 'string',
      description: 'Path or URL for this link (e.g. /about/ or https://example.com/).',
      placeholder: '/about/',
    }),
    defineField({
      name: 'internalPath',
      title: 'Internal Path (legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL (legacy)',
      type: 'url',
      hidden: true,
    }),
    defineField({
      name: 'linkType',
      title: 'Endpoint Type (legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'internalReference',
      title: 'Document Reference (Optional)',
      type: 'reference',
      to: [{type: 'convertVehicle2Page'}],
      description: 'Optional: Reference an existing Sanity document instead of entering a path',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab / window',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      label: 'label',
      endpoint: 'endpoint',
      internalPath: 'internalPath',
      externalUrl: 'externalUrl',
      refName: 'internalReference.name',
    },
    prepare({title, label, endpoint, internalPath, externalUrl, refName}) {
      const displayTitle = title || label || 'Untitled Link'
      const destination =
        endpoint || internalPath || externalUrl || (refName ? `Doc: ${refName}` : '/')
      return {
        title: displayTitle,
        subtitle: `Endpoint: ${destination}`,
      }
    },
  },
})
