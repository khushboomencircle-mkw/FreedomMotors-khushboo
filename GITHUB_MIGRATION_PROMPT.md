# GitHub Migration — Reusable Runbook Prompt

Run this when the whole codebase (apps/web, apps/studio, and the root-level
`.md` planning/reference files) needs to move from wherever the company
currently keeps it into a GitHub account/org the client owns. Written to be
re-run later, as-is, when that migration actually happens — not applied now.

VERIFIED STARTING STATE (checked directly in this working copy, don't
re-assume the opposite):
- There is NO `.git` folder anywhere in this repo right now — not at the
  root, not in apps/web, not in apps/studio. This working copy itself has
  never been committed or pushed anywhere from here.
- This is NOT a unified monorepo today: there is no root `package.json`,
  no `pnpm-workspace.yaml`/`turbo.json`/etc. tying apps/web and apps/studio
  together — they're two independent npm projects (each with its own
  package-lock.json) that simply live as sibling folders on disk.
- Root-level files that exist today and would need to go into the new repo:
  `PROMPT_TEMPLATE.md`, `MAINTENANCE_AUDIT_PROMPT.md`, `REMAINING_WORK.md`,
  `REMAINING_POINTS.md`, `PREVIEW_SHAREABLE_LINK_PLAN.md`, `scripts/`
  (contains `audit-page-builder-commitments.mjs`, referenced by
  REMAINING_WORK.md).
- Root also currently has `production.tar.gz`, `exports/` (two dataset
  export tarballs), and `image.png` — all three are already listed in the
  root `.gitignore` with a comment explaining why ("large binaries, not
  code" / "stray dev-time screenshot"). Keep them ignored; don't let a
  careless `git add -A` sweep them into the new repo — `production.tar.gz`
  and the `exports/` tarballs may contain real content data, not just
  structure.
- No hosting-provider config file (no `vercel.json`, no `netlify.toml`, etc.)
  was found in apps/web — confirm with whoever currently deploys this where
  it's actually hosted before assuming a provider; that account/project also
  needs to move or be reconnected to the new GitHub repo, separately from
  the steps below.

CONFIRM BEFORE RUNNING (don't guess at these — ask):
1. Does a company-owned GitHub repo for this project already exist
   SOMEWHERE ELSE (a different machine/account) that actually needs a
   GitHub-to-GitHub transfer/mirror? Or is this local working copy the only
   copy, meaning the real first step is "initialize git here for the first
   time and push to a brand-new client-owned repo" (which is what the
   verified state above indicates)? Don't run a "transfer" flow against a
   repo that doesn't exist yet.
2. One client GitHub repo containing both apps/web and apps/studio as
   subfolders (matching today's on-disk layout), or two separate client
   repos (one per app)? This repo has no workspace tooling joining them, so
   either is structurally fine — this is a client/process preference, not a
   technical constraint.
3. Who creates the destination: does the client provide an empty GitHub
   repo under their own org/account, or does the company create it and then
   transfer ownership via GitHub's own "Transfer ownership" repo setting?
   Transfer preserves issues/stars/etc. if a company repo with real history
   already exists; a fresh push does not need any of that.

STEPS (fresh-push path — use this if #1 above confirms there's no existing
pushed repo to transfer):
1. From the repo root, `git init` (if following the "one repo" choice from
   #2) or `git init` separately inside apps/web and apps/studio (if "two
   repos"). Confirm the chosen `.gitignore` files are in place FIRST
   (already present at root, apps/web, and apps/studio) before the first
   `git add`, so node_modules/.next/dist/tsconfig.tsbuildinfo/.env* never
   get staged.
2. Review `git status` after the first `git add` before committing —
   confirm nothing in `production.tar.gz`, `exports/`, `.env.local`,
   `.env`, `node_modules/`, `.next/`, `dist/`, or `.DS_Store` is staged.
   If anything unexpected shows up, stop and fix `.gitignore` rather than
   manually excluding files commit-by-commit.
3. Make the initial commit(s).
4. Create (or have the client create) the destination GitHub repo(s) per
   the answer to confirm-item #3. Do not make it public unless explicitly
   told to — this is a client's commercial codebase.
5. Add the new repo as a remote and push:
   `git remote add origin <new-repo-url>` then `git push -u origin main`
   (or whatever the default branch is named here — check with
   `git branch --show-current` after init, don't assume `main`).
6. If there's a CI/deploy pipeline connected to the OLD remote (GitHub
   Actions workflow files, a Vercel/Netlify GitHub App installation, etc.),
   it needs to be reconnected to the NEW repo as a separate step — pushing
   code alone does not move a deploy integration. Check for
   `.github/workflows/` in both apps before assuming there's none to
   reconnect.
7. Confirm env vars are NOT part of this migration — `.env`/`.env.local`
   are gitignored everywhere in this repo and must be re-created directly
   on whatever the client's hosting provider is, not copied via git. Cross-
   reference SANITY_MIGRATION_PROMPT.md for which Sanity-related env vars
   change value once the Sanity project itself moves too — those two
   migrations are linked (the web app's env vars must point at wherever
   Sanity ends up) but are run as separate, sequenced steps, not merged
   into one.
8. Verify after push: clone the new repo fresh into a scratch folder,
   run `npm install` in each app, and confirm both `apps/web` and
   `apps/studio` build (`npm run build` in each) from that clean clone
   before considering this done — a push that "looks complete" in the
   GitHub UI can still be missing a file an incomplete `.gitignore` excluded
   by accident.

DO NOT:
- Force-push, rewrite history, or delete the old remote/repo as part of
  this — if an old copy exists elsewhere, leave it alone unless the client
  or company explicitly asks for it to be removed.
- Commit `.env`, `.env.local`, `production.tar.gz`, or anything under
  `exports/` — all contain either secrets or large data exports, never
  code.
- Rename `customPage`, any section file, or any other schema/source file
  as part of "cleaning up for handoff" — out of scope for a migration task;
  file renames inside apps/studio have the same live-data risk flagged in
  MAINTENANCE_AUDIT_PROMPT.md regardless of which repo the code lives in.

FINISH BY
Report: which repo-layout option was used (one repo vs two), the new
repo URL(s), confirmation the clean-clone build check passed for both apps,
and an explicit list of anything NOT migrated (env vars, CI/deploy
integration, hosting account) with who's responsible for moving each.
