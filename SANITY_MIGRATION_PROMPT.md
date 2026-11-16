# Sanity Project Migration — Reusable Runbook Prompt

Run this when the Sanity project needs to move from the company's Sanity
account to the client's own Sanity account. Written to be re-run later,
as-is, when that migration actually happens — not applied now.

VERIFIED STARTING STATE (checked directly in this working copy):
- Current project: `projectId: "u0ztn8kn"`, `dataset: "production"` —
  confirmed in apps/studio/sanity.cli.ts, which already defaults to these
  if the SANITY_STUDIO_PROJECT_ID/SANITY_STUDIO_DATASET env vars are unset.
  Both apps already read these as overridable env vars, not hardcoded
  anywhere else that matters — confirmed via apps/studio/.env.example and
  apps/web/.env.local.example, both of which already have comments
  anticipating exactly this move ("set both when pointing this Studio/site
  at a different project, e.g. the client's own, once created at
  sanity.io/manage").
- The root `.gitignore` already references this plan directly: it excludes
  `/production.tar.gz` and `/exports/` with the comment "the dev project's
  original seed export and the fresh export of its current content (for
  import into the real client project) both live here" — someone has
  already started this groundwork. Check `exports/` before starting (two
  tarballs currently present: a production export and a pre-migration
  backup) — a recent export may already exist and be reusable rather than
  re-exporting from scratch; confirm its date/recency first.
- Env vars that reference the Sanity project/dataset, and must change
  together, in lockstep, when the project moves:
  - apps/studio/.env (SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET)
  - apps/web/.env.local (NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET, SANITY_API_READ_TOKEN — this token is
    project-scoped, a token from the old project does NOT work against a
    new one and must be freshly generated)
  - apps/web/.env.local's SANITY_STUDIO_URL and apps/studio/.env's
    SANITY_STUDIO_PREVIEW_URL if Studio's deployed hostname also changes
    (see step on `sanity deploy` below)
  - The two TRUSTED_SCRIPT_HOSTS / SANITY_STUDIO_TRUSTED_SCRIPT_HOSTS pairs
    are NOT project-specific — they don't need to change for this
    migration, only re-confirm they stay in sync with each other per their
    existing comments.

CONFIRM BEFORE RUNNING (don't guess — ask, since this determines which path
below to use):
1. Does the client already have, or is willing to create, their own Sanity
   organization/account? Sanity requires a destination org to move or
   create a project under.
2. Does the company's Sanity org and the client's Sanity org both allow a
   native project transfer between organizations (Sanity's own "Move
   project to another organization" / project-transfer feature, under that
   project's Settings in sanity.io/manage — confirm it's still offered
   under that name, Sanity's UI changes over time)? If yes, that path
   preserves the project ID, all assets, webhooks, and members as-is — NO
   env var changes needed anywhere, and is strictly simpler than export/
   import. Try this path first if both sides can do it.
3. If a direct transfer isn't possible (e.g. the client wants a completely
   fresh project under their own brand-new org, or the transfer feature
   isn't available), fall back to the export/import path below, which
   creates a NEW project ID and therefore DOES require updating every env
   var listed above.

STEPS — PATH A: NATIVE PROJECT TRANSFER (preferred if available)
1. In sanity.io/manage, open the project (u0ztn8kn) → Settings → look for
   a transfer/move-to-another-organization option. Confirm the client's org
   is listed as a transfer target (requires the client's org to have
   already added the company account as a member, or vice versa, depending
   on Sanity's current permission model — check Sanity's own docs for the
   current exact requirement rather than assuming company-side admin alone
   is sufficient).
2. Complete the transfer.
3. Confirm billing: transfers typically require the destination org to
   accept billing responsibility for the project's plan — flag this to the
   client before transferring, don't surprise them with it after.
4. Verify: project ID stays `u0ztn8kn`, dataset stays `production`, no env
   vars anywhere need to change. Re-deploy nothing — just confirm Studio
   and the web app still connect (they will, since nothing about the
   project/dataset identity changed).
5. Done — skip Path B entirely.

STEPS — PATH B: EXPORT / IMPORT INTO A NEW PROJECT (fallback)
1. Create a new Sanity project under the client's account at
   sanity.io/manage (client does this, or is invited as owner of a project
   the company creates — confirm which per the questions above). Note its
   new project ID.
2. Export the current dataset if `exports/` doesn't already have a recent
   enough tarball: `sanity dataset export production
   exports/<timestamped-name>.tar.gz` from apps/studio (this exports
   documents AND referenced assets together — don't separately handle
   image files).
3. Import into the new project's dataset: `sanity dataset import
   <the-tarball> production --project <new-project-id>` (create the
   `production` dataset in the new project first if it doesn't auto-create
   — check with `sanity dataset list --project <new-project-id>`).
4. In the NEW project's sanity.io/manage → API → CORS origins, add every
   origin that needs to read from it: the Studio dev URL
   (http://localhost:3333), the web app dev URL (http://localhost:3000),
   and both apps' deployed production URLs. The old project's CORS entries
   do not carry over.
5. In the NEW project's API → Tokens, create a fresh read token (role
   "Viewer", per the existing comment in apps/web/.env.local.example
   explaining why not a higher role) — this becomes the new
   SANITY_API_READ_TOKEN. The old token is scoped to the old project and
   will not work.
6. Update env vars in both apps to the new project ID/dataset/token, per
   the "Env vars that reference..." list above. Update BOTH apps together
   — they must agree, per the existing comments in each .env.example file
   cross-referencing the other.
7. Re-deploy Studio under the new project: `sanity deploy` from
   apps/studio — this creates a new `<name>.sanity.studio` hostname tied
   to the new project ID; the old deployed Studio URL (if any) stays
   pointed at the old project until/unless it's torn down separately.
   Update SANITY_STUDIO_URL (apps/web) and SANITY_STUDIO_PREVIEW_URL
   (apps/studio) to the new deployed Studio URL if Studio runs somewhere
   other than localhost in this setup.
8. Verify: open the new deployed (or local) Studio, confirm the migrated
   content is present and editable; load the web app pointed at the new
   project and confirm published content renders; test the Presentation
   Tool preview connection end to end (click-to-edit round trip), since
   that depends on the token + CORS + preview URL all being correctly
   re-pointed together.
9. Only after verifying the new project fully works: decide with the
   client/company whether the OLD project should be archived/deleted —
   that's a separate, explicit decision, not an automatic last step here.

DO NOT:
- Delete or archive the old Sanity project as part of this prompt's steps
  — flag it as a follow-up decision, don't do it automatically.
- Reuse the old project's API token against the new project — tokens are
  project-scoped and this will simply fail, but don't try other
  workarounds (e.g. a broader-scoped token) without re-confirming the
  Viewer-role-only policy the existing code comments establish.
- Touch any schema file, section, or document structure as part of this —
  this is purely an infrastructure/account move; the schema travels with
  the dataset unchanged in both paths.

FINISH BY
Report: which path was used (transfer vs export/import) and why, the new
project ID (if Path B), every env var that changed and in which file,
confirmation the Presentation Tool preview was tested end-to-end, and
explicit next-step ownership for the old project's eventual
archival/deletion.
