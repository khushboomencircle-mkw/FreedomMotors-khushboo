import { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { IntentLink } from 'sanity/router'
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui'
import {
  LIBRARY_TEMPLATE_ID,
  TEMPLATE_API_VERSION,
  TEMPLATE_CATEGORIES,
  TEMPLATE_LIST_QUERY,
} from './queries'
import { activeTemplateCards, type TemplateCard } from './resolve'

/** The always-available empty page (a hardcoded Studio template, registered in sanity.config.ts). */
const BLANK_TEMPLATE_ID = 'blank'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; templates: TemplateCard[] }

const LINK_STYLE: React.CSSProperties = { display: 'block', color: 'inherit', textDecoration: 'none' }

function CreateLink({
  template,
  templateId,
  children,
}: {
  template: string
  templateId?: string
  children: React.ReactNode
}) {
  // [intent params, template parameters]: the second object is handed to the template's value function.
  const params = templateId
    ? ([{ type: 'customPage', template }, { templateId }] as [
      Record<string, string>,
      Record<string, string>,
    ])
    : { type: 'customPage', template }
  return (
    <IntentLink intent="create" params={params} style={LINK_STYLE}>
      {children}
    </IntentLink>
  )
}

function TemplateCardView({ template }: { template: TemplateCard }) {
  const category = TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.title
  const count = template.sectionCount ?? 0
  return (
    <CreateLink template={LIBRARY_TEMPLATE_ID} templateId={template._id}>
      <Card border radius={2} padding={0} style={{ overflow: 'hidden', height: '100%' }}>
        {template.previewUrl ? (
          // A Studio preview thumbnail from Sanity's own image CDN — not part of the website.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${template.previewUrl}?w=480&h=270&fit=crop&auto=format`}
            alt=""
            style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
          />
        ) : (
          <Card tone="transparent" style={{ aspectRatio: '16 / 9' }}>
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Text size={1} muted>
                No preview image
              </Text>
            </Flex>
          </Card>
        )}
        <Box padding={3}>
          <Stack gap={3}>
            <Text weight="semibold">{template.title || 'Untitled Template'}</Text>
            {template.description && (
              <Text size={1} muted>
                {template.description}
              </Text>
            )}
            <Text size={0} muted>
              {[category, `${count} section${count === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
            </Text>
          </Stack>
        </Box>
      </Card>
    </CreateLink>
  )
}

/**
 * "New Template Page" — a Studio pane listing the ACTIVE templates from Page Templates (name, description, preview image).
 * Choosing one opens a new Landing Page (a normal draft) that starts as a copy of that template. Fetched once when the pane opens;
 * "Refresh" re-reads it. If the library is empty or can't be read, a Blank page is still offered.
 */
export default function TemplatePicker() {
  const client = useClient({ apiVersion: TEMPLATE_API_VERSION }).withConfig({
    perspective: 'raw',
    useCdn: false,
  })
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    client
      .fetch<TemplateCard[]>(TEMPLATE_LIST_QUERY)
      .then((docs) => setState({ status: 'ready', templates: activeTemplateCards(docs) }))
      .catch((error: unknown) =>
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      )
    // `client` is rebuilt on every render; the API version and perspective never change, so loading on mount is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Flex align="center" justify="space-between" gap={3}>
          <Heading as="h2" size={2}>
            New Template Page
          </Heading>
          <Button
            text="Refresh"
            mode="ghost"
            fontSize={1}
            onClick={load}
            disabled={state.status === 'loading'}
          />
        </Flex>
        <Text size={1} muted>
          Choose a starting point. The new page gets its own copy of the template, so changing or
          removing the template later never changes it.
        </Text>

        {state.status === 'loading' && (
          <Flex align="center" gap={3}>
            <Spinner muted />
            <Text size={1} muted>
              Loading templates…
            </Text>
          </Flex>
        )}

        {state.status === 'error' && (
          <Card tone="critical" border padding={3} radius={2}>
            <Stack gap={3}>
              <Text size={1}>
                Templates could not be loaded ({state.message}). You can still start with a blank
                page, or try again.
              </Text>
            </Stack>
          </Card>
        )}

        {state.status === 'ready' && state.templates.length === 0 && (
          <Card tone="caution" border padding={3} radius={2}>
            <Text size={1}>
              No active templates yet. Add or switch on a template in Page Templates, or start with
              a blank page.
            </Text>
          </Card>
        )}

        {state.status === 'ready' && state.templates.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {state.templates.map((template) => (
              <TemplateCardView key={template._id} template={template} />
            ))}
          </div>
        )}

        {state.status !== 'loading' &&
          (state.status === 'error' || state.templates.length === 0) && (
            <Box>
              <CreateLink template={BLANK_TEMPLATE_ID}>
                <Card border radius={2} padding={3}>
                  <Stack gap={2}>
                    <Text weight="semibold">Blank page</Text>
                    <Text size={1} muted>
                      An empty landing page — add sections yourself.
                    </Text>
                  </Stack>
                </Card>
              </CreateLink>
            </Box>
          )}
      </Stack>
    </Box>
  )
}
