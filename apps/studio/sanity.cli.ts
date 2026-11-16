import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    // Same env vars as sanity.config.ts — see the comment there. The CLI
    // reads these from the shell/.env directly (this file isn't bundled by
    // Vite), so they must be exported/loaded the same way before running any
    // `sanity` command against a non-default project.
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'u0ztn8kn',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
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
