import type {MouseEvent} from 'react'
import {useRouter} from 'sanity/router'

/**
 * "Start here": the first thing in the sidebar. The everyday jobs as big buttons, plus four tips, so someone new to the
 * Studio is never looking at a blank screen wondering where to begin. It only links to places that already exist.
 */

/** Where the Studio lives on the site (must match `basePath` in sanity.config.ts). */
export const STUDIO_BASE = '/studio'

export interface StartTask {
  id: string
  title: string
  description: string
  /** A Studio path such as /studio/structure/pages;homePage — the first segment after /structure/ is a sidebar item id. */
  path: string
}

export const START_TASKS: StartTask[] = [
  {
    id: 'edit-home',
    title: 'Edit the home page',
    description: 'Change the banner, sections and text on your front page.',
    path: `${STUDIO_BASE}/structure/pages;homePage`,
  },
  {
    id: 'new-page',
    title: 'Add a new page',
    description: 'Start from a ready-made template, such as Model Launch or Campaign.',
    path: `${STUDIO_BASE}/structure/new-page-from-template`,
  },
  {
    id: 'blog-post',
    title: 'Write a blog post',
    description: 'Every post belongs to a landing page.',
    path: `${STUDIO_BASE}/structure/blog-posts;posts-all`,
  },
  {
    id: 'vehicles',
    title: 'Update vehicles',
    description: 'Add or edit a vehicle, or mark one as not available.',
    path: `${STUDIO_BASE}/structure/vehicles`,
  },
  {
    id: 'menu',
    title: 'Edit the menu',
    description: 'Change the links at the top and bottom of every page.',
    path: `${STUDIO_BASE}/structure/navigation`,
  },
  {
    id: 'preview',
    title: 'See the website',
    description: 'Preview your pages and click any text to edit it right there.',
    path: `${STUDIO_BASE}/preview`,
  },
]

export const START_TIPS = [
  'Your changes stay as drafts until you press Publish.',
  'Sections appear in order of their Display Order number: lower numbers show first.',
  'Turn a section off with “Section Active” to hide it without deleting it.',
  'Not sure what a section looks like? Use “Add item” and pick from the pictures.',
]

const wrap: React.CSSProperties = {maxWidth: 880, padding: '28px 24px 40px'}
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 12,
  marginTop: 18,
}
const card: React.CSSProperties = {
  display: 'block',
  padding: '16px 18px',
  borderRadius: 10,
  border: '1px solid color-mix(in srgb, currentColor 22%, transparent)',
  color: 'inherit',
  textDecoration: 'none',
}

/** The page itself. `onNavigate` is given so it can be tested; in the Studio it moves within the Studio. */
export function StartHereView({onNavigate}: {onNavigate: (path: string) => void}) {
  const open = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab and modifier clicks; a plain click moves inside the Studio without a reload.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    event.preventDefault()
    onNavigate(path)
  }
  return (
    <div style={wrap}>
      <h1 style={{fontSize: 22, margin: 0}}>Welcome</h1>
      <p style={{margin: '8px 0 0', opacity: 0.75, lineHeight: 1.5}}>
        Pick a job to get going. Everything here is also in the menu on the left.
      </p>

      <div style={grid}>
        {START_TASKS.map((task) => (
          <a key={task.id} href={task.path} style={card} onClick={open(task.path)}>
            <strong style={{display: 'block', fontSize: 15}}>{task.title}</strong>
            <span
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 13,
                opacity: 0.75,
                lineHeight: 1.45,
              }}
            >
              {task.description}
            </span>
          </a>
        ))}
      </div>

      <h2 style={{fontSize: 15, margin: '30px 0 8px'}}>Good to know</h2>
      <ul style={{margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14, opacity: 0.85}}>
        {START_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}

export default function StartHere() {
  const router = useRouter()
  return <StartHereView onNavigate={(path) => router.navigateUrl({path})} />
}
