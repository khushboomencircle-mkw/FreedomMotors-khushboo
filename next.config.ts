import type {NextConfig} from 'next'
import {buildImagesConfig} from './src/lib/imageConfig'

const nextConfig: NextConfig = {
  /* config options here */
  // Dev-server only (stripped from production builds): `next dev` blocks
  // cross-origin requests to /_next/* assets and the HMR websocket by
  // default, allowing only localhost and whatever's listed here. Visiting
  // the dev server by its LAN IP (e.g. to test on a phone or another
  // machine on the network) is a different origin from "localhost" as far
  // as that check is concerned, so every JS chunk request gets a silent 403
  // — the page still server-renders fine, but no client script ever loads,
  // which is why accordions/scroll/sliders (all client-side interactivity)
  // stop working there while plain content keeps looking fine. Add your
  // machine's LAN IP here if it changes.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ['192.168.10.37', 'localhost:3333'],
  // Image optimizer: which hosts it may fetch, widths, formats and cache lifetime — all in src/lib/imageConfig.ts.
  images: buildImagesConfig(process.env),
  // The embedded Studio (/studio) reads these in the browser. Next only exposes
  // NEXT_PUBLIC_* there by default, so forward them here. TRUSTED_SCRIPT_HOSTS is
  // shared with the website's sanitizer (one list for both; hostnames, not a secret).
  env: {
    SANITY_STUDIO_TITLE: process.env.SANITY_STUDIO_TITLE ?? '',
    SANITY_STUDIO_PREVIEW_URL: process.env.SANITY_STUDIO_PREVIEW_URL ?? '',
    TRUSTED_SCRIPT_HOSTS: process.env.TRUSTED_SCRIPT_HOSTS ?? '',
    // The Supabase project URL and bucket NAME are public (they appear in every photo URL), so they are shared
    // with browser code that builds photo URLs (src/lib/imageUrl.ts). The service-role key is NEVER exposed here.
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET ?? '',
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
