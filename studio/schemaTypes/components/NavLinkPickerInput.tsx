import {useCallback, useEffect, useState} from 'react'
import {PatchEvent, set, useClient} from 'sanity'
import type {ObjectInputProps, SanityClient} from 'sanity'
import {randomKey} from '@sanity/util/content'
import {isReservedSlug} from '../navConstants'

interface NavLink {
  label: string
  href: string
}

const NAV_DOC_ID = 'navigationSettings'

// Same comparison navigationLinkType.ts uses to reject duplicate paths.
const normalizeHref = (href: string) =>
  (href || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()

/** Label → URL-friendly slug suggestion, e.g. "Terms & Conditions" → "terms-conditions". */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Typed slug → clean form: no slashes, lowercase, spaces become hyphens. */
const cleanSlug = (text: string) =>
  text
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')

// A custom page lives at a single URL segment (/[slug]), so no slashes allowed.
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function addLinkToNavigation(client: SanityClient, label: string, slug: string) {
  const draftId = `drafts.${NAV_DOC_ID}`
  const [draft, published] = await Promise.all([
    client.getDocument(draftId),
    client.getDocument(NAV_DOC_ID),
  ])
  const base = (draft ?? published) as {links?: {href?: string; label?: string}[]} | undefined
  if (!base) {
    // Creating it here would skip the built-in links Studio seeds on first creation.
    throw new Error(
      'The Navigation document doesn’t exist yet. Open Navigation in the sidebar once, then try again.',
    )
  }

  const href = `/${slug}`
  const duplicate = (base.links ?? []).find((l) => normalizeHref(l.href ?? '') === slug)
  if (duplicate) {
    throw new Error(
      `"${href}" is already used by the "${duplicate.label || 'another'}" navigation link.`,
    )
  }

  const newLink = {
    _type: 'navigationLink',
    _key: randomKey(12),
    label,
    href,
    // Same defaults as a link added by hand in Navigation.
    openInNewTab: false,
    showMegaMenu: false,
    showInHeader: true,
    showInFooter: true,
  }

  const tx = client.transaction()
  if (!draft && published) {
    // First edit since last publish: start the draft from the published copy.
    const draftCopy: Record<string, unknown> = {...published, _id: draftId}
    delete draftCopy._rev
    delete draftCopy._createdAt
    delete draftCopy._updatedAt
    tx.createIfNotExists({...draftCopy, _id: draftId, _type: 'navigationSettings'})
  }
  tx.patch(draftId, (p) => p.setIfMissing({links: []}).append('links', [newLink]))
  await tx.commit()
}

// ── Styles ───────────────────────────────────────────────────────────────────

const pickerCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 8,
  padding: '14px 16px',
  marginBottom: 20,
}

const sectionLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 10,
}

const pickerSelect: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 5,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
  appearance: 'auto',
}

const identityCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  padding: '14px 16px',
  marginBottom: 20,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px 24px',
}

const identityFieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 4,
}

const identityFieldValue: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.75)',
  wordBreak: 'break-all',
}

const guidanceCard: React.CSSProperties = {
  background: 'rgba(255, 180, 0, 0.05)',
  border: '1px solid rgba(255, 180, 0, 0.15)',
  borderRadius: 8,
  padding: '12px 16px',
  marginBottom: 20,
}

const guidanceText: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(255, 200, 80, 0.85)',
  lineHeight: 1.5,
  margin: 0,
}

const helpText: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
  lineHeight: 1.5,
  margin: '0 0 12px',
}

const textInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  borderRadius: 5,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: 'inherit',
  fontSize: 13,
  outline: 'none',
}

const addButton: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 5,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const errorText: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255, 110, 110, 0.95)',
  lineHeight: 1.5,
  margin: '10px 0 0',
}

function AddNavLinkForm({
  heading,
  onCreated,
}: {
  heading: string
  onCreated: (label: string, slug: string) => void
}) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [label, setLabel] = useState('')
  const [slug, setSlug] = useState('')
  // Once the editor types their own slug, stop overwriting it from the label.
  const [slugEdited, setSlugEdited] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const cleanLabel = label.trim()
    const finalSlug = cleanSlug(slug)
    setError(null)

    if (!cleanLabel) return setError('Enter a label for the navigation link.')
    if (!finalSlug) return setError('Enter a URL slug.')
    if (!VALID_SLUG.test(finalSlug)) {
      return setError(
        'The slug can only use lowercase letters, numbers and hyphens (e.g. terms-and-conditions).',
      )
    }
    if (isReservedSlug(finalSlug)) {
      return setError(
        `"/${finalSlug}" is already a built-in page on the website. Please choose a different URL.`,
      )
    }

    setBusy(true)
    try {
      // Same check customPage's own slug validation makes, so we fail here
      // with a clear message instead of leaving a link with no valid page.
      const taken = await client.fetch<number>(
        `count(*[_type == "customPage" && lower(slug.current) == $slug])`,
        {slug: finalSlug},
      )
      if (taken > 0) {
        setError(`"/${finalSlug}" is already used by another page. Please choose a different URL.`)
        return
      }
      await addLinkToNavigation(client, cleanLabel, finalSlug)
      onCreated(cleanLabel, finalSlug)
    } catch (err) {
      console.error('[NavLinkPickerInput] Failed to add navigation link:', err)
      setError(
        err instanceof Error ? err.message : 'Could not add the navigation link. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div style={pickerCard}>
      <span style={sectionLabel}>{heading}</span>
      <p style={helpText}>
        The link is added to <strong>Navigation</strong> as a draft and used for this page. Publish
        Navigation for it to show on the website.
      </p>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
        <div>
          <span style={identityFieldLabel}>Nav Label</span>
          <input
            style={textInput}
            value={label}
            placeholder="Terms & Conditions"
            disabled={busy}
            onKeyDown={onEnter}
            onChange={(e) => {
              const next = e.currentTarget.value
              setLabel(next)
              if (!slugEdited) setSlug(slugify(next))
            }}
          />
        </div>
        <div>
          <span style={identityFieldLabel}>URL Slug</span>
          <input
            style={textInput}
            value={slug}
            placeholder="terms-and-conditions"
            disabled={busy}
            onKeyDown={onEnter}
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(e.currentTarget.value)
            }}
          />
        </div>
      </div>
      <button
        type="button"
        style={{...addButton, opacity: busy ? 0.6 : 1}}
        disabled={busy}
        onClick={handleSubmit}
      >
        {busy ? 'Adding…' : 'Add navigation link'}
      </button>
      {error && <p style={errorText}>{error}</p>}
    </div>
  )
}

export default function NavLinkPickerInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const [navLinks, setNavLinks] = useState<NavLink[]>([])
  const [ready, setReady] = useState(false)

  const title = (value as any)?.title as string | undefined
  const slugCurrent = (value as any)?.slug?.current as string | undefined
  const hasTitle = Boolean(title)

  useEffect(() => {
    if (hasTitle) return
    let cancelled = false

    Promise.all([
      client.fetch<NavLink[] | null>(
        `*[_id in ["drafts.navigationSettings", "navigationSettings"]] | order(_updatedAt desc)[0]
         .links[]{label, href}`,
      ),
      client.fetch<string[]>(`*[_type == "customPage" && defined(slug.current)].slug.current`),
    ])
      .then(([links, existingSlugs]) => {
        if (cancelled) return
        const taken = new Set((existingSlugs ?? []).map((s) => s.toLowerCase()))
        const available = (links ?? []).filter((l) => {
          if (!l.href?.startsWith('/')) return false
          if (isReservedSlug(l.href)) return false
          return !taken.has(l.href.replace(/^\/+/, '').toLowerCase())
        })
        setNavLinks(available)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [hasTitle, client])

  const handleSelect = useCallback(
    (href: string) => {
      const link = navLinks.find((l) => l.href === href)
      if (!link) return
      const slug = link.href.replace(/^\/+/, '').toLowerCase()
      onChange(
        PatchEvent.from([
          set(link.label, ['title']),
          set({_type: 'slug', current: slug}, ['slug']),
        ]),
      )
    },
    [navLinks, onChange],
  )

  // A nav link was just added via the form: this page takes its title + slug.
  const handleCreated = useCallback(
    (label: string, slug: string) => {
      onChange(
        PatchEvent.from([set(label, ['title']), set({_type: 'slug', current: slug}, ['slug'])]),
      )
    },
    [onChange],
  )

  return (
    <div>
      {/* State 3: title already set — show locked identity then rest of form */}
      {hasTitle && (
        <div style={identityCard}>
          <div>
            <span style={identityFieldLabel}>Page Title</span>
            <span style={identityFieldValue}>{title}</span>
          </div>
          <div>
            <span style={identityFieldLabel}>URL Slug</span>
            <span style={identityFieldValue}>/{slugCurrent}</span>
          </div>
        </div>
      )}

      {/* State 1: no title, nav links available — show picker */}
      {!hasTitle && ready && navLinks.length > 0 && (
        <div style={pickerCard}>
          <span style={sectionLabel}>Select a navigation link to create this page for</span>
          <select
            style={pickerSelect}
            defaultValue=""
            onChange={(e) => handleSelect(e.currentTarget.value)}
          >
            <option value="" disabled>
              — Choose a nav link —
            </option>
            {navLinks.map((link) => (
              <option key={link.href} value={link.href}>
                {link.label} · {link.href}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* State 1 (cont.): or add a new nav link without leaving this page */}
      {!hasTitle && ready && navLinks.length > 0 && (
        <AddNavLinkForm
          heading="Or add a new navigation link for this page"
          onCreated={handleCreated}
        />
      )}

      {/* State 2: no title, no unmatched nav links — add one right here */}
      {!hasTitle && ready && navLinks.length === 0 && (
        <>
          <div style={guidanceCard}>
            <p style={guidanceText}>
              No unmatched navigation links found. Add a navigation link below to create this page.
            </p>
          </div>
          <AddNavLinkForm heading="Add a navigation link for this page" onCreated={handleCreated} />
        </>
      )}

      {/* Always render the rest of the form (title + slug are hidden in schema) */}
      {renderDefault(props)}
    </div>
  )
}
