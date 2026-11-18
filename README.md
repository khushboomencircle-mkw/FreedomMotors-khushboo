# Freedom Motors — Website & Sanity Studio

The Freedom Motors website (Next.js) and its content editor (Sanity Studio) in one project.
Both run from the same Next.js server, so one command starts everything:

| What                           | Local address                |
| ------------------------------ | ---------------------------- |
| Website                        | http://localhost:3000        |
| Sanity Studio (content editor) | http://localhost:3000/studio |

## Tech stack

- **Next.js 16** (App Router, Turbopack) with **React 19** and **TypeScript**
- **Tailwind CSS 4** for styling
- **Sanity 6** for content — the Studio is embedded in the site at `/studio` through
  **next-sanity**, with live preview and click-to-edit (Presentation tool)
- **Vercel** for hosting — redirects managed in the Studio are stored in Vercel Global Config
  and applied by `src/proxy.ts`
- **ESLint 9** and **Prettier 3** for code quality

Also used: Portable Text (rich text), sanitize-html (Custom HTML sections), Lucide icons.

## Getting started

Requirements: **Node.js 22.12 or newer** and access to the Freedom Motors Sanity project.

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create your local env file and fill it in (`.env.local.example` explains every variable):

   ```bash
   cp .env.local.example .env.local
   ```

   For local work you need at least the Sanity project ID and dataset
   (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`) and `SANITY_API_READ_TOKEN`
   for the Studio's live preview.

3. Start the website and the Studio:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 for the website and http://localhost:3000/studio for the Studio,
   then log in to the Studio with your Sanity account.

The Sanity project must allow `http://localhost:3000` with **Allow credentials** under
**API → CORS origins** on sanity.io/manage, or the Studio login fails. This is already set up
for this project.

## How the website and the Studio work together

- The Studio is a page inside the Next.js app (`src/app/studio/[[...tool]]`), not a separate
  app — one server, one port and one `node_modules`.
- Website pages live in `src/app/(site)/`, which adds the site header and footer. The Studio is
  outside that folder, so it opens without them.
- Content is edited in the Studio and stored in Sanity. The website reads it with GROQ queries
  (`src/sanity/queries.ts`) and refreshes open pages when content is published.
- The Studio's **Preview** tab shows the website with unpublished changes and click-to-edit. It
  uses draft mode (`/api/draft-mode/enable`) and needs `SANITY_API_READ_TOKEN`.

## Project structure

```text
├── src/
│   ├── app/
│   │   ├── (site)/              Website pages (with the site header and footer)
│   │   ├── studio/[[...tool]]/  Sanity Studio, served at /studio
│   │   └── api/                 Draft mode (preview) and redirect sync routes
│   ├── components/              Website UI components
│   ├── lib/                     Helpers: theme, SEO, redirects, HTML sanitizer, …
│   ├── sanity/                  Sanity client and GROQ queries
│   ├── db/                      Database schema (Drizzle) — prepared, not used by the site yet
│   └── proxy.ts                 Applies the redirects managed in the Studio
├── studio/                      Studio code: content schemas, custom inputs, preview setup, page templates
│   └── scripts/                 One-off content scripts (run with npx sanity exec)
├── scripts/                     Redirect scripts (npm run redirects:sync / redirects:check)
├── drizzle/                     Database migrations (Drizzle) — prepared, not used by the site yet
├── public/                      Static files
├── sanity.config.ts             Studio configuration
├── sanity.cli.ts                Sanity CLI configuration
└── .env.local.example           Every environment variable, explained
```

## Commands

| Command                                                      | What it does                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `npm run dev`                                                | Start the website and the Studio locally                                                |
| `npm run build`                                              | Create a production build                                                               |
| `npm run start`                                              | Run the production build                                                                |
| `npm run format`                                             | Format the code with Prettier                                                           |
| `npm run eslint`                                             | Check the code with ESLint                                                              |
| `npm run redirects:sync`                                     | Push the Studio's published redirects to Vercel (a Sanity webhook does this on publish) |
| `npm run redirects:check -- /old-path/`                      | Check whether a redirect works on the live site                                         |
| `npx sanity exec studio/scripts/<file>.ts --with-user-token` | Run a one-off content script                                                            |

## Redirects

Redirects are managed in the Studio (the `redirect` document type). Publishing one syncs the full
list to Vercel Global Config, and `src/proxy.ts` applies it on every request. Set this up once:

1. In `.env.local` and in Vercel, set `SANITY_REDIRECTS_WEBHOOK_SECRET` (any long random value),
   `VERCEL_API_TOKEN`, `GLOBAL_CONFIG_ID` and, for a team project, `VERCEL_TEAM_ID`.
2. On sanity.io/manage → your project → **API → Webhooks**, create a webhook:
   - **URL:** `https://<your-live-site>/api/redirects/sync`
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **Filter:** `_type == "redirect"`
   - **HTTP method:** POST
   - **HTTP header:** `x-sanity-webhook-secret` with the same value as `SANITY_REDIRECTS_WEBHOOK_SECRET`
3. Without the secret the route answers 401; the live site keeps the last synced redirects.

To sync by hand, run `npm run redirects:sync`. To test one path on the live site, run
`npm run redirects:check -- /old-path/`.

## Responsive checklist

Every page must look intentional and be easy to use on any screen. Check a change at these sizes
(portrait and landscape for the phones and tablets), and with browser zoom at 200%:

| Device                      | Widths to check    |
| --------------------------- | ------------------ |
| Phones                      | 320, 375, 390, 430 |
| Large phone / small tablet  | 600                |
| Tablet portrait / landscape | 768 / 1024         |
| Laptop and desktop          | 1280, 1440, 1920   |
| Ultra-wide                  | 2560               |

Rules:

- **No horizontal scroll.** `document.documentElement.scrollWidth` must not exceed the viewport.
  Each page wrapper has `overflow-x-hidden` as a safety net for editor-written HTML and CSS; our own
  components must never rely on it to hide an overflow.
- **Fix it once, in the shared place:** `src/app/globals.css` (tokens and utilities), then the section
  wrapper in `PageSection.tsx`, then the single component. Mobile-first Tailwind, with the existing
  breakpoints; `clamp()` (see `fluidPx` in PageSection) instead of per-breakpoint font sizes.
- **Editor content must survive anything:** 1 to many items, long words and URLs (`min-w-0`,
  `overflow-wrap`), no image, any container width, light or dark theme. Columns step down 4 → 3 → 2 → 1.
  Never give a text box a fixed `height` (use `min-height`).
- **Touch:** every button and link has a 44×44px touch area. Add `tap-target` (small buttons and
  links) or `tap-dot` (slider dots) — they only act on touch screens, so mouse layouts don't change.
  Inputs use 16px text on touch (`text-base pointer-fine:text-sm`) so iOS doesn't zoom on focus.
  Nothing works by hover alone.
- **Keyboard:** everything is reachable and visible while focused (a default `:focus-visible` ring
  is in globals.css), nothing traps focus, Escape closes menus and dialogs.
- **Dialogs and lightboxes** use `ModalShell` (portal, `dvh` sizing, focus trap, scroll lock); never
  `position: fixed` inside a component that may be transformed.
- **Heights use `dvh`, not `vh`** (phone browser bars change the screen height).
- **Reduced motion:** autoplay and slide animations stop (`useReducedMotion`; globals.css switches
  off transitions).
- **No layout shift:** images keep their aspect ratio and reserve space; no `window.innerWidth` checks
  during render (use CSS breakpoints; `useLayoutEffect` + `ResizeObserver` where measuring is needed).

## Before pushing

Run these from the project root before every push, and fix anything they report:

```bash
npm run format   # format the code with Prettier
npm run eslint   # check the code for lint errors
npm run build    # make sure the production build works
```

## Deployment

The site is hosted on Vercel. The Vercel project's **Root Directory** must be the repository
root, and the same environment variables as in `.env.local` must be set in Vercel. The Studio is
then available at `/studio` on the live site; to log in there, add the live domain under
**API → CORS origins** in Sanity with **Allow credentials**.
