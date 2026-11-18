import type { InitialValueResolverContext, Template } from 'sanity'
import { DocumentsIcon } from '@sanity/icons/Documents'
import {
  LIBRARY_TEMPLATE_ID,
  TEMPLATE_API_VERSION,
  TEMPLATE_CONTENT_QUERY,
  draftIdOf,
} from './queries'
import { buildPageFromTemplate, pickUsableTemplate, type TemplateContent } from './resolve'

/**
 * The single template Studio knows about for "a Landing Page made from the library". Studio's own template list is fixed
 * when Studio loads, so the library itself (which changes as editors add templates) is shown by the picker pane
 * (TemplatePicker.tsx); picking a card opens Studio's normal "create" flow with this template and the chosen template's id
 * as a parameter. This function then reads that template and returns its copy as the new page's starting value.
 *
 * Because it goes through Studio's normal create flow, the new page is an ordinary draft: validation, Presentation Tool,
 * Visual Editing and every existing Landing Page action behave exactly as for any other page.
 */
export const libraryTemplate: Template<{ templateId?: string }> = {
  id: LIBRARY_TEMPLATE_ID,
  title: 'From template library',
  description: 'A copy of a template from Page Templates.',
  icon: DocumentsIcon,
  schemaType: 'customPage',
  // Declaring the parameter lets Studio leave this template out of menus that can't supply it.
  parameters: [{ name: 'templateId', title: 'Template', type: 'string' }],
  value: async (
    params: { templateId?: string } | undefined,
    context: InitialValueResolverContext,
  ) => {
    const templateId = params?.templateId
    if (!templateId) {
      throw new Error('No template was chosen. Open Pages → New Template Page and pick one.')
    }
    const client = context
      .getClient({ apiVersion: TEMPLATE_API_VERSION })
      .withConfig({ perspective: 'raw', useCdn: false })
    const docs = await client.fetch<TemplateContent[]>(TEMPLATE_CONTENT_QUERY, {
      id: templateId,
      draftId: draftIdOf(templateId),
    })
    // Re-checked here, not only in the picker: the template may have been switched off or deleted since the list was shown.
    return buildPageFromTemplate(pickUsableTemplate(docs))
  },
}
