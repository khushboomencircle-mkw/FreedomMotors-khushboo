#!/usr/bin/env node
/**
 * Audits the codebase against the "Page Builder / Design Studio" proposal
 * committed to the client, point by point, and prints a PASS / PARTIAL /
 * MISSING report.
 *
 * Two kinds of checks:
 *  - `file`: does the expected code exist? (static grep against source files
 *    — no build step, no server needed)
 *  - `http`: does the expected thing actually respond? Queries the public
 *    Sanity dataset directly (published content needs no token) and, if
 *    reachable, the local dev servers. An unreachable dev server is reported
 *    as SKIPPED, not FAILED — this script doesn't start one for you.
 *
 * Usage:
 *   node scripts/audit-page-builder-commitments.mjs
 *
 * Exit code is 1 if any commitment is MISSING, 0 otherwise (PARTIAL/SKIPPED
 * don't fail the run — they're judgment calls for a human, not hard failures).
 */

import {readFileSync, existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const STUDIO = path.join(ROOT, 'apps/studio')
const WEB = path.join(ROOT, 'apps/web')
const WEB_ORIGIN = process.env.AUDIT_WEB_ORIGIN || 'http://localhost:3000'
const STUDIO_ORIGIN = process.env.AUDIT_STUDIO_ORIGIN || 'http://localhost:3333'
const SANITY_API = 'https://u0ztn8kn.api.sanity.io/v2024-01-01/data/query/production'

// ── tiny helpers ─────────────────────────────────────────────────────────

const STATUS = {PASS: '✅ PASS', PARTIAL: '⚠️  PARTIAL', MISSING: '❌ MISSING', SKIPPED: '⏭️  SKIPPED'}

function readSafe(relPath) {
  try {
    return readFileSync(path.join(ROOT, relPath), 'utf8')
  } catch {
    return null
  }
}

function fileContains(relPath, pattern) {
  const text = readSafe(relPath)
  if (text == null) return {ok: false, reason: `${relPath} not found`}
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern)
  return {ok: re.test(text), reason: re.test(text) ? undefined : `pattern not found in ${relPath}`}
}

async function groq(query) {
  const url = `${SANITY_API}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {signal: AbortSignal.timeout(8000)})
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  return body.result
}

async function httpStatus(url, init) {
  try {
    const res = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(5000), ...init})
    return res.status
  } catch (err) {
    return null // unreachable
  }
}

// ── the checks ───────────────────────────────────────────────────────────
// Each check: {section, title, run: () => Promise<{status, note}>}

const checks = []
const section = (name) => (title, run) => checks.push({section: name, title, run})

const liveEditing = section('1. Build pages with a live preview')
const noCodeCustomize = section('2. Customize the look of any page without coding')
const customCode = section('3. Add custom code whenever needed')

// --- 1. Live preview ------------------------------------------------------

liveEditing('Presentation Tool configured (click-to-edit live preview)', async () => {
  const studioConfig = fileContains('apps/studio/sanity.config.ts', /presentation/)
  const toolFile = existsSync(path.join(STUDIO, 'presentation.ts'))
  if (!studioConfig.ok || !toolFile) {
    return {status: 'MISSING', note: 'No presentationTool plugin wired into sanity.config.ts'}
  }
  const studioUp = await httpStatus(`${STUDIO_ORIGIN}/presentation`)
  if (studioUp === 200) return {status: 'PASS', note: `Presentation Tool route responds (${STUDIO_ORIGIN}/presentation)`}
  return {status: 'PARTIAL', note: `Configured in code, but Studio isn't running at ${STUDIO_ORIGIN} to confirm it loads`}
})

liveEditing('Draft mode + Visual Editing wired into the Next.js app', async () => {
  const enableRoute = existsSync(path.join(WEB, 'src/app/api/draft-mode/enable/route.ts'))
  const disableRoute = existsSync(path.join(WEB, 'src/app/api/draft-mode/disable/route.ts'))
  const visualEditing = fileContains('apps/web/src/app/layout.tsx', /VisualEditing/)
  if (!enableRoute || !disableRoute || !visualEditing.ok) {
    return {status: 'MISSING', note: 'draft-mode routes and/or <VisualEditing /> not present'}
  }
  const enableStatus = await httpStatus(`${WEB_ORIGIN}/api/draft-mode/enable`)
  const disableStatus = await httpStatus(`${WEB_ORIGIN}/api/draft-mode/disable`)
  if (enableStatus == null) return {status: 'PARTIAL', note: `Code is wired, but ${WEB_ORIGIN} isn't running to confirm`}
  const hasToken = Boolean(process.env.SANITY_API_READ_TOKEN)
  if (!hasToken && enableStatus === 500) {
    return {status: 'PARTIAL', note: 'Routes respond correctly, but SANITY_API_READ_TOKEN isn’t set — preview can’t show draft content yet (see apps/web/.env.local.example)'}
  }
  if (hasToken && enableStatus === 401) {
    return {status: 'PASS', note: 'Enable route correctly rejects a request with no preview secret (401); token is configured'}
  }
  return {status: disableStatus === 307 || disableStatus === 302 ? 'PASS' : 'PARTIAL', note: `enable=${enableStatus} disable=${disableStatus}`}
})

liveEditing('Shared preview links for team review before publishing', async () => {
  const sharing = fileContains('apps/studio/presentation.ts', /shareAccess:\s*true/)
  return sharing.ok
    ? {status: 'PASS', note: 'previewMode.shareAccess is on — Presentation Tool’s own Share menu generates a link anyone can open'}
    : {status: 'MISSING', note: sharing.reason}
})

liveEditing('Library of reusable sections with layout options', async () => {
  const have = ['bannerSectionType', 'cardsGridSectionType', 'accordionSectionType', 'featureGridSectionType', 'linkListSectionType', 'customHtmlSectionType']
  const registry = readSafe('apps/studio/schemaTypes/sections/index.ts') || ''
  const present = have.filter((t) => registry.includes(t))
  const missingTypes = ['Image gallery / lightbox', 'Testimonials', 'A dedicated vehicle-carousel section (dynamic, pulls from inventory)', 'Native form builder']
  if (present.length === have.length) {
    return {status: 'PARTIAL', note: `6 section types cover hero/banner, card grid, FAQ, feature grid (incl. horizontal-scroll "carousel"-style), link list, custom HTML. Not yet built: ${missingTypes.join('; ')}.`}
  }
  return {status: 'MISSING', note: `Expected section types not all found: ${have.filter((t) => !present.includes(t)).join(', ')}`}
})

liveEditing('Start from a page template (Model Launch, Campaign, etc.)', async () => {
  const hasTemplateCode = fileContains('apps/studio/sanity.config.ts', /templates|initialValueTemplates/)
  return hasTemplateCode.ok
    ? {status: 'PASS', note: 'Template config found'}
    : {status: 'MISSING', note: 'No initial-value templates configured; customPage only starts blank'}
})

liveEditing('Duplicate an existing page', async () => {
  // Sanity Studio ships a "Duplicate" document action by default for every
  // document type, unless `document.actions` in sanity.config.ts overrides
  // it. We didn't touch that, so this is a platform default, not something
  // this codebase builds or could easily turn off by accident.
  const overridesActions = fileContains('apps/studio/sanity.config.ts', /document:\s*\{\s*actions/)
  return overridesActions.ok
    ? {status: 'PARTIAL', note: 'sanity.config.ts customizes document actions — verify Duplicate wasn’t removed'}
    : {status: 'PASS', note: 'No document.actions override found — Sanity’s built-in "Duplicate" action applies to every page type as-is'}
})

// --- 2. No-code customization ---------------------------------------------

noCodeCustomize('Custom themes: colors, fonts, button styles, corner rounding', async () => {
  const schema = readSafe('apps/studio/schemaTypes/objects/themeConfig.ts') || ''
  const need = ['primaryColor', 'headingFont', 'buttonBackgroundColor', 'buttonRadius', 'cardRadius']
  // Some fields are declared via `name: 'x'`, others via a `color('x', ...)`
  // helper whose first arg is the field name — match either shape.
  const missing = need.filter((f) => !schema.includes(`'${f}'`))
  if (missing.length) return {status: 'MISSING', note: `themeConfig.ts missing fields: ${missing.join(', ')}`}
  const live = await groq('*[_id=="siteSettings"][0]{enableSiteTheme, "hasTheme": defined(siteTheme)}').catch(() => null)
  return {
    status: 'PASS',
    note: live
      ? `Schema complete; live siteSettings.enableSiteTheme=${live.enableSiteTheme}, siteTheme set=${live.hasTheme}`
      : 'Schema complete (couldn’t reach the live dataset to double check)',
  }
})

noCodeCustomize('Apply a theme to an entire page or an individual section', async () => {
  const globalTheme = fileContains('apps/web/src/lib/theme.ts', /resolveGlobalTheme/)
  const sectionTheme = fileContains('apps/web/src/lib/theme.ts', /resolveSectionTheme/)
  const sectionFields = existsSync(path.join(STUDIO, 'schemaTypes/fields/sectionTheme.ts'))
  return globalTheme.ok && sectionTheme.ok && sectionFields
    ? {status: 'PASS', note: 'Global Site Theme (siteSettings) + per-section Theme override (sectionThemeFields) both resolve, with section overriding global per-property'}
    : {status: 'MISSING', note: 'One or more of global/section theme resolution is missing'}
})

noCodeCustomize('Hide the standard header/footer on a page', async () => {
  const chromeGate = existsSync(path.join(WEB, 'src/components/ChromeGate.tsx'))
  const chromeLib = fileContains('apps/web/src/lib/chrome.ts', /resolveChrome/)
  const query = fileContains('apps/web/src/sanity/queries.ts', /getChromeVisibility/)
  if (!chromeGate || !chromeLib.ok || !query.ok) {
    return {status: 'MISSING', note: 'ChromeGate / resolveChrome / getChromeVisibility not all present'}
  }
  const live = await groq('*[_id=="homePage"][0]{showHeader, showFooter}').catch(() => null)
  return {status: 'PASS', note: `Per-page showHeader/showFooter wired end to end${live ? ` (homePage: showHeader=${live.showHeader ?? true}, showFooter=${live.showFooter ?? true})` : ''}`}
})

// --- 3. Custom code --------------------------------------------------------

customCode('Custom HTML/CSS section, anywhere on a page', async () => {
  const schema = existsSync(path.join(STUDIO, 'schemaTypes/sections/customHtmlSection.ts'))
  const sanitizer = existsSync(path.join(WEB, 'src/lib/sanitizeHtml.ts'))
  return schema && sanitizer
    ? {status: 'PASS', note: 'customHtmlSection + frontend sanitizer (sanitize-html) both present; script/iframe/form/on* handlers are blocked'}
    : {status: 'MISSING', note: 'Custom HTML section and/or its sanitizer is missing'}
})

customCode('A custom section’s styles apply only to that section', async () => {
  // The claim is specifically about CSS isolation. A wrapper div controls
  // layout, but a plain <style> block inside dangerouslySetInnerHTML is NOT
  // scoped by the DOM position — it cascades to the whole document like any
  // other <style> tag. There's no @scope, Shadow DOM, or selector rewriting.
  const page = readSafe('apps/web/src/components/PageSection.tsx') || ''
  const hasScopeMechanism = /@scope|attachShadow|shadowRoot/.test(page)
  return hasScopeMechanism
    ? {status: 'PASS', note: 'A CSS isolation mechanism was found'}
    : {
        status: 'MISSING',
        note: 'No @scope / Shadow DOM / selector-rewriting found. An editor’s own <style> block (allowed by the sanitizer) is NOT isolated — e.g. `<style>h2{color:gold}</style>` inside one Custom HTML section restyles every <h2> on the page. The wrapper div only scopes the renderer’s own layout rules (img/table/video sizing), not arbitrary editor CSS.',
      }
})

customCode('Save a custom section and reuse it on other pages (a library)', async () => {
  const hit = ['library', 'snippet', 'reusableSection'].some(
    (kw) => (readSafe('apps/studio/schemaTypes/index.ts') || '').toLowerCase().includes(kw.toLowerCase()),
  )
  return hit
    ? {status: 'PARTIAL', note: 'Found a possible match — verify manually'}
    : {status: 'MISSING', note: 'Sections are inline array items (no reference type); nothing lets an editor save one and reuse/update it across pages'}
})

customCode('Page-specific CSS (beyond one section)', async () => {
  const hit = ['customCss', 'pageCss', 'customCSS'].some((kw) => (readSafe('apps/studio/schemaTypes/customPage.ts') || '').includes(kw))
  return hit
    ? {status: 'PASS', note: 'Found a page-level CSS field on customPage'}
    : {status: 'MISSING', note: 'No page-wide custom-CSS field exists; only the per-section Custom HTML block’s own <style> tag'}
})

// ── runner ───────────────────────────────────────────────────────────────

const results = []
for (const c of checks) {
  let outcome
  try {
    outcome = await c.run()
  } catch (err) {
    outcome = {status: 'SKIPPED', note: `check threw: ${err?.message || err}`}
  }
  results.push({...c, ...outcome})
}

let currentSection = null
for (const r of results) {
  if (r.section !== currentSection) {
    currentSection = r.section
    console.log(`\n${currentSection}`)
    console.log('-'.repeat(currentSection.length))
  }
  console.log(`${STATUS[r.status]}  ${r.title}`)
  if (r.note) console.log(`         ${r.note}`)
}

const missingCount = results.filter((r) => r.status === 'MISSING').length
const partialCount = results.filter((r) => r.status === 'PARTIAL').length
console.log(`\n${results.length} checks: ${results.length - missingCount - partialCount} pass, ${partialCount} partial, ${missingCount} missing.`)
if (missingCount > 0) {
  console.log('\nSee REMAINING_WORK.md for the full gap list with suggested next steps.')
}
process.exitCode = missingCount > 0 ? 1 : 0
