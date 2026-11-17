import {defineLive} from 'next-sanity/live'
import {client} from './client'

/**
 * Connection to Sanity's Live Content API.
 *
 * Only `<SanityLive />` is used. Pages here render at request time (no
 * `use cache` around the Sanity reads), so when a document is published the
 * component just needs to call `router.refresh()` — see `action="refresh"` in
 * the root layout — and the page re-renders with fresh data. The open tab
 * updates in place; no manual reload.
 *
 * The browser connects straight to Sanity, so every origin that serves the site
 * must be listed in the project's CORS origins (`sanity cors add <origin>`),
 * including http://localhost:3000 for local development. If an origin is
 * missing, <SanityLive /> logs a console warning with a link to add it.
 *
 * Tokens are disabled: the dataset is public and only published content is read.
 */
export const {SanityLive} = defineLive({
  client,
  serverToken: false,
  browserToken: false,
})
