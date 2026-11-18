/**
 * Test helper: a stand-in for Sanity's structure builder that records what was asked for, so tests can read the
 * sidebar back as plain data. Not used by the Studio itself.
 */
export type Spec = Record<string, unknown> & {kind: string}

export function builder(kind: string, init: Record<string, unknown> = {}) {
  const spec: Spec = {kind, ...init}
  const b: unknown = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === 'spec') return spec
        return (...args: unknown[]) => {
          spec[String(prop)] = args.length <= 1 ? args[0] : args
          return b
        }
      },
    },
  )
  return b as {spec: Spec}
}

export const fakeS = {
  list: () => builder('list'),
  listItem: () => builder('item'),
  divider: () => builder('divider'),
  document: () => builder('document'),
  documentTypeList: (type: string) => builder('typeList', {type}),
  documentList: () => builder('documentList'),
  component: () => builder('component'),
  initialValueTemplateItem: (id: string) => ({id}),
}

export const fakeContext = {
  schema: {get: () => ({icon: () => null})},
  getClient: () => ({fetch: async () => []}),
}
