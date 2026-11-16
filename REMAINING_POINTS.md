# Remaining Points — one line each

Consolidated, up-to-date list of everything still outstanding across the whole
engagement so far (supersedes the longer write-up in [REMAINING_WORK.md](REMAINING_WORK.md),
which goes into the "why" behind each of these). Re-run
`node scripts/audit-page-builder-commitments.mjs` anytime to re-check the
page-builder items against the live code and dataset.

1. **Set `SANITY_API_READ_TOKEN`** (Viewer role, from sanity.io/manage) — live preview is fully wired but can't show draft content until this exists; see `apps/web/.env.local.example`.
2. **Run the border-width migration** — `npx sanity exec scripts/fixLegacyBorderWidths.ts --with-user-token -- --write` — 26 fields across 6 pages still hold invalid legacy values that block Publish on those documents.
3. **Build missing page-builder sections** — image gallery/lightbox, testimonials, a dynamic vehicle-carousel section, and a native form builder don't exist yet.
4. **Build ready-made page templates** (e.g. "Model Launch", "Campaign") so a new page can start pre-filled instead of blank.
5. **Fix Custom HTML section CSS isolation** — an editor's own `<style>` block currently restyles the whole site, not just that section, contradicting what was promised.
6. **Build a reusable section library** — there's no way yet for an editor to save one configured section and reuse/update it across multiple pages.
7. **Add a page-level custom CSS field** — today only a per-section Custom HTML block can carry `<style>`; there's no page-wide equivalent.
8. **Review the Share-preview permission model** against this client's actual Studio roles (who can create a share link vs. toggle sharing on/off — see [the shareable-link plan](PREVIEW_SHAREABLE_LINK_PLAN.md)).
9. **Configure production once hosting is chosen** — add the live domain to Sanity's CORS origins, and set `SANITY_STUDIO_PREVIEW_URL` / `SANITY_API_READ_TOKEN` for that environment.
10. *(optional, low priority)* Card Border still defaults to visible when never explicitly set — intentionally left as-is to avoid changing how existing cards look; revisit only if that default should change.
