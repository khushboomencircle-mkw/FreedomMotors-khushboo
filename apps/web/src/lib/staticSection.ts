/**
 * Splits a page's CMS `sections` array around its "Static Section"
 * placeholder (see the `staticSection` Studio schema) — the entry an editor
 * adds to position and toggle the page's own built-in, code-rendered
 * content (e.g. the vehicle listing grid) among the other sections.
 *
 * If no placeholder exists, `defaultShow` decides whether the built-in
 * content shows anyway. Pages whose built-in content predates this
 * placeholder (Vehicles, Vehicle Detail) keep `defaultShow = true` — the
 * content always showed before the placeholder existed, so an older
 * document without one must keep showing it. A page whose built-in content
 * is opt-in from the start (e.g. Educational's Filter & Search bar) passes
 * `defaultShow = false` so it only appears once an editor explicitly adds
 * the placeholder.
 */
export function splitAroundStaticSection<T extends {_type?: string; isActive?: boolean}>(
  sections: T[] | null | undefined,
  defaultShow = true,
): {before: T[]; after: T[]; showStatic: boolean} {
  const list = sections ?? []
  const index = list.findIndex((s) => s._type === 'staticSection')

  if (index === -1) {
    return {before: list, after: [], showStatic: defaultShow}
  }

  return {
    before: list.slice(0, index),
    after: list.slice(index + 1),
    showStatic: list[index].isActive !== false,
  }
}
