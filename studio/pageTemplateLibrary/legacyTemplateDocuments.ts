import {pageTemplates} from '../pageTemplates'
import {TEMPLATE_DOCUMENT_TYPE} from './queries'

/**
 * The four original, hardcoded templates (studio/pageTemplates.ts: Blank, Model Launch, Campaign, Offer / Promotion),
 * turned into `pageTemplate` documents. The sections, text, Display Order, SEO and header/footer switches are taken
 * straight from each template's own `value()`, so nothing about their content is re-typed or changed.
 *
 * Each gets a fixed id (`pageTemplate-<legacy id>`), which makes the migration safe to re-run: it only creates what is missing
 * and never overwrites a template an editor has since changed. (Ids use dashes, not dots: an id containing a dot is private.)
 */

const CATEGORY_BY_LEGACY_ID: Record<string, string> = {
  blank: 'general',
  'model-launch': 'vehicle',
  campaign: 'campaign',
  'offer-promotion': 'offer',
}

interface LegacyValue {
  sections?: unknown[]
  seo?: unknown
  showHeader?: boolean
  showFooter?: boolean
}

export interface PageTemplateDocument {
  _id: string
  _type: typeof TEMPLATE_DOCUMENT_TYPE
  isActive: boolean
  title: string
  description?: string
  category: string
  sections: unknown[]
  seo?: unknown
  showHeader: boolean
  showFooter: boolean
}

export function legacyTemplateDocuments(): PageTemplateDocument[] {
  return pageTemplates.map((template) => {
    // Each legacy `value` is a function (called fresh so its keys are new), never a static object.
    const value = (
      typeof template.value === 'function' ? template.value(undefined, {} as never) : template.value
    ) as LegacyValue
    return {
      _id: `pageTemplate-${template.id}`,
      _type: TEMPLATE_DOCUMENT_TYPE,
      isActive: true,
      title: template.title,
      ...(template.description ? {description: template.description} : {}),
      category: CATEGORY_BY_LEGACY_ID[template.id] ?? 'other',
      sections: value.sections ?? [],
      ...(value.seo ? {seo: value.seo} : {}),
      showHeader: value.showHeader !== false,
      showFooter: value.showFooter !== false,
    }
  })
}
