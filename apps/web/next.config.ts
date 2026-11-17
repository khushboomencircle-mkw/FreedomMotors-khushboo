import type {NextConfig} from 'next'

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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.freedommotors.com',
        pathname: '/wp-content/**',
      },
    ],
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
