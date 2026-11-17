import {defineCliConfig} from 'sanity/cli'

// Same variables (and fallbacks) as the website and sanity.config.ts. Every `sanity`
// command loads this folder's .env files first, so these come from .env.local.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'sp8bk444'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineCliConfig({
  api: {projectId, dataset},
  // `sanity build` / `sanity deploy` (the hosted Studio) only pass SANITY_STUDIO_*
  // variables to the browser, so pass these through as well (merged into Sanity's
  // own build settings). The embedded /studio gets them from Next.js instead
  // (NEXT_PUBLIC_* automatically; TRUSTED_SCRIPT_HOSTS via next.config.ts `env`).
  vite: {
    define: {
      'process.env.NEXT_PUBLIC_SANITY_PROJECT_ID': JSON.stringify(projectId),
      'process.env.NEXT_PUBLIC_SANITY_DATASET': JSON.stringify(dataset),
      'process.env.TRUSTED_SCRIPT_HOSTS': JSON.stringify(process.env.TRUSTED_SCRIPT_HOSTS ?? ''),
    },
  },
  deployment: {
    /**
     * Disabled: with auto-updates on, Studio always runs whatever `sanity`
     * version is newest on Sanity's CDN — not the version pinned in
     * package.json — so a release upstream (e.g. 6.23.0, which shipped an
     * alpha @sanity/ui that broke Presentation Tool's visual-editing
     * connection) can break Studio here with zero local change. Off means
     * Studio runs the exact version in package.json; bump it deliberately
     * when you want to move.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  },
})
