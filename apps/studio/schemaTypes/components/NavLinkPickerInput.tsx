import {useCallback, useEffect, useState} from 'react'
import {PatchEvent, set, useClient} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {isReservedSlug} from '../navConstants'

interface NavLink {
  label: string
  href: string
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

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Document-level custom input for customPage.
 *
 * Title and URL slug are set exclusively via the nav link picker — they are
 * hidden from the default form (hidden: true in schema) and shown here as
 * read-only display fields once selected. This ensures page identity always
 * comes from a navigation link entry, never from free-form user input.
 *
 * States:
 *  1. No title + nav links available  → show picker dropdown
 *  2. No title + no nav links        → show guidance to add a nav link first
 *  3. Has title                       → show read-only identity card + rest of form
 */
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
      client.fetch<string[]>(
        `*[_type == "customPage" && defined(slug.current)].slug.current`,
      ),
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
                {link.label}  ·  {link.href}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* State 2: no title, no nav links — guide the editor */}
      {!hasTitle && ready && navLinks.length === 0 && (
        <div style={guidanceCard}>
          <p style={guidanceText}>
            No unmatched navigation links found. To create a custom page, first add a new link
            under <strong>Navigation</strong> in the sidebar, then return here to create its page.
          </p>
        </div>
      )}

      {/* Always render the rest of the form (title + slug are hidden in schema) */}
      {renderDefault(props)}
    </div>
  )
}
