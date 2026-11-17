export const LANDING_PAGE_VISIBLE = `($preview || isActive == true)`

export const NAV_LINK_HAS_PAGE = `(
  href in $builtIn
  || string::startsWith(href, "http")
  || count(*[_type == "customPage" && "/" + slug.current == ^.href && ${LANDING_PAGE_VISIBLE}]) > 0
)`
