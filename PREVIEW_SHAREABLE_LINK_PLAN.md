# Plan — Admin-built preview with a shareable link

**Goal:** an admin/editor can open any page in Sanity Studio's Presentation
Tool, see it live with click-to-edit, and generate a link that lets anyone —
logged into Studio or not — view that same unpublished preview, without
touching the live published site that real visitors see.

**Where this stands:** the engineering for this is already built and
verified (Presentation Tool, draft-mode routes, click-to-edit overlay, and the
share-link mechanism are all wired — see [REMAINING_POINTS.md](REMAINING_POINTS.md)
item 1). What's left is entirely non-code: one credential only a project
admin can create, then verifying and governing the feature. Nothing below
requires another engineering change unless a step's verification fails.

---

## Phase 1 — Unlock it (admin, ~5 minutes)

Only someone with admin access to the Sanity project can do this step; it
can't be scripted or done on their behalf.

1. Go to **sanity.io/manage** → project `u0ztn8kn` → **API** → **Tokens** → **Add API token**.
2. Name it something identifiable (e.g. "Web app — preview read access").
3. Role: **Viewer**. (Read-only — the web app never writes to Sanity, so a higher role is unnecessary exposure.)
4. Copy the generated token — Sanity shows it once.
5. In `apps/web`, copy `.env.local.example` to `.env.local` and set:
   ```
   SANITY_API_READ_TOKEN=<paste the token Sanity just showed you — it's only shown once>
   ```
6. Restart the web app (`npm run dev` in `apps/web`, or redeploy if already in production).

**Done when:** visiting `http://localhost:3000/api/draft-mode/enable` (with no secret) returns **401 "Invalid secret"** rather than the earlier 500 "token is missing" message — that flip confirms the token is live.

## Phase 2 — Verify the preview itself (anyone, ~5 minutes)

1. Open Studio (`http://localhost:3333`) → the **Preview** item in the left nav.
2. Pick any page (e.g. Home Page).
3. Confirm: the live site loads in the right-hand pane, and clicking a piece of text on it jumps you to that field in the document panel.
4. Edit a field without publishing — confirm the preview pane updates to show the unpublished change, while a normal browser tab at the same URL (no preview cookie) still shows the old, published content.

**Done when:** both halves of step 4 hold — preview shows the draft, a plain tab doesn't.

## Phase 3 — Verify the shareable link (anyone, ~5 minutes)

1. In the Presentation Tool, open the **Share** menu (only visible once Phase 1 is done) and turn sharing **on**. This generates a link containing a one-time secret.
2. Copy that link.
3. Open it in a fully separate, logged-out browser (incognito/private window works) — confirm the preview loads and shows the same unpublished content as Phase 2, without ever prompting for a Studio login.
4. Back in Studio, turn sharing **off**, then try the same link again — confirm it now fails. (Turning sharing on again later issues a *new* link; the old one stays dead.)

**Done when:** the link works for a logged-out viewer while sharing is on, and stops working the moment it's turned off.

## Phase 4 — Decide who can do this (admin, one conversation)

Sanity's default permission model for this feature (documented in
`@sanity/preview-url-secret`'s own README):

| Action | Default minimum role |
|---|---|
| Generate a shared preview link (turn Share on) | Editor |
| View a shared link once one exists | Viewer |
| Create a preview at all (non-shared, just the Presentation Tool) | Contributor |

Decide with the client whether these Sanity defaults match who they actually
want doing this (e.g. "only our marketing lead should be able to share a
link externally"). If not, Sanity supports custom roles scoped specifically
to this (see the README section "Restricting access to who can enable/disable
preview sharing") — flag this to the project's Sanity admin if a custom role
is wanted; it's a project-settings change, not a code change.

**Done when:** there's an explicit answer on record (even "defaults are
fine"), not an assumption.

## Phase 5 — Production rollout (when hosting is chosen)

Everything above was verified against `localhost`. Before anyone relies on
this against the real domain:

1. Add the production domain to Sanity's CORS origins: `npx sanity cors add https://<production-domain> --no-credentials` (run from `apps/studio`).
2. Set `SANITY_STUDIO_PREVIEW_URL=https://<production-domain>` wherever the deployed Studio's environment is configured (`apps/studio/.env.example` has the exact variable name — it must be `SANITY_STUDIO_`-prefixed to reach Studio's bundle).
3. Set `SANITY_API_READ_TOKEN` in the hosting platform's environment variables for the web app (same token from Phase 1, or a fresh one scoped to production if the client wants separate tokens per environment).
4. Repeat Phases 2 and 3 against the production URL.

**Done when:** Phase 2 and 3's checks both pass against the real domain, not just localhost.

## Phase 6 — Hand it to the team (admin/editors, one short walkthrough)

Once Phases 1–4 are done, the day-to-day workflow for a non-technical editor
is just:

1. Open the page you're editing in Studio's **Preview** tool.
2. Edit as usual — the preview updates live.
3. To get a second opinion before publishing: Presentation Tool → **Share** →
   copy link → send it. Turn Share off again once review is done, if the
   team wants each round of feedback scoped to a fresh link.

Worth a 2-minute live walkthrough with whoever reviews content most often,
rather than written instructions alone — the "click text to edit it" part is
easier shown than described.
