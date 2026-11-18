import type {StructureBuilder, StructureResolverContext} from 'sanity/structure'
import {pickSingletonId, SINGLETON_PAGES} from './singletonPages'

/**
 * The fixed pages as sidebar entries. Each opens its ONE document directly — there is no list in between, so there is
 * no "+" to add another. Which document it opens is looked up when it is clicked, so this keeps working in any
 * dataset (and creates the page with a stable id the first time if it does not exist yet).
 */
export function singletonStructureItems(S: StructureBuilder, context: StructureResolverContext) {
  return SINGLETON_PAGES.map((page) =>
    S.listItem()
      .id(page.type)
      .title(page.title)
      .icon(context.schema.get(page.type)?.icon as never)
      .child(async () => {
        const documents = await context
          .getClient({apiVersion: '2025-02-19'})
          .fetch<{_id: string; _createdAt?: string}[]>(`*[_type == $type]{_id, _createdAt}`, {
            type: page.type,
          })
        return S.document()
          .schemaType(page.type)
          .documentId(pickSingletonId(documents, page.type))
          .title(page.title)
      }),
  )
}
