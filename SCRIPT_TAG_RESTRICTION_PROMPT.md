PLATFORM STANDING RULES — apply these to the request below (or above),
regardless of what the feature/section is:

1. REUSE FIRST, DON'T DUPLICATE — AND KEEP IT NORMALIZED
   Before writing anything new, check what already exists for the same job.
   Never duplicate security-relevant logic in two places — keep paired
   implementations in sync or share a constant between them.

2. SCOPE DISCIPLINE
   Only touch what the request actually asks for. Don't add, remove, or
   "clean up" unrelated fields, sections, or files as a side effect.

3. CODE A FUTURE DEVELOPER CAN FOLLOW
   Match existing naming, file placement, and conventions exactly. List
   exactly which files get created vs. modified.

――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
DEVELOPER'S REQUEST GOES HERE:
――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

BLOCK `<script>` TAGS ON EVERY PLAIN `string` AND `text` FIELD, PLATFORM-WIDE
— no field anywhere in the schema may be missed, including every field added
in the future. Do not apply code changes yet — this is a spec to build from.

VERIFIED CURRENT SCOPE (counted directly, don't re-derive by hand):
- 289 `type: 'string'` fields across 36 files in apps/studio/schemaTypes/**
- 23 `type: 'text'` fields across 8 files
- Full file list (re-run `grep -rln "type: *'string'"` /
  `grep -rln "type: *'text'"` under apps/studio/schemaTypes to reconfirm
  before starting, in case a field was added since this was counted):
  convertVehicle2Type.ts, customPage.ts, fields/richText.ts,
  fields/sectionFields.ts, fields/sectionTheme.ts, footerSectionType.ts,
  headerSectionType.ts, megaMenuConfigType.ts, navigationLinkType.ts,
  objects/borderConfig.ts, objects/cardStyleConfig.ts,
  objects/containerConfig.ts, objects/linkEndpointType.ts,
  objects/photoWithAlt.ts, objects/seoType.ts, objects/textShadowConfig.ts,
  objects/themeConfig.ts, objects/typographyConfig.ts,
  pages/commercialPage.ts, pages/contactPage.ts,
  pages/convertVehicle2Page.ts, pages/driver.ts, pages/homePage.ts,
  pages/ourStoryPage.ts, pages/vehicleDetailPage.ts, pages/vehiclesPage.ts,
  sections/bannerSection.ts, sections/cardItem.ts,
  sections/cardsGridSection.ts, sections/faqAccordionSection.ts,
  sections/faqItem.ts, sections/featureCardItem.ts,
  sections/featureGridSection.ts, sections/googleReviewsSection.ts,
  sections/linkListItem.ts, sections/linkListSection.ts,
  sections/photoGallerySection.ts, siteSettingsType.ts, vehicleType.ts,
  plus sections/customHtmlSection.ts (text field — SEE EXEMPTION below).

ONE DELIBERATE EXEMPTION — DO NOT TOUCH:
sections/customHtmlSection.ts's raw-HTML `text` field already runs through
htmlValidation.ts's `validateHtmlContent`, which is deliberately stricter
in some ways (blocks a long list of dangerous tags/attributes/URL schemes)
and deliberately more permissive in exactly one narrow way (a
`<script src="...">` pointing at a host on TRUSTED_SCRIPT_HOSTS is allowed,
since that section's whole purpose is embedding approved third-party
widgets). Do not add the new blanket rule on top of this field and do not
weaken htmlValidation.ts to match the new blanket rule — they are two
different, intentionally different, policies for two different kinds of
field (one holds raw markup by design, everything else should never
contain markup at all).

FRONTEND CONTEXT (already checked, for your situational awareness — not
something this task needs to fix): `dangerouslySetInnerHTML` is used in
exactly two places in apps/web/src — app/layout.tsx (computed CSS variable
string, not sourced from any editor-entered field) and PageSection.tsx's
Custom HTML Section (already passed through apps/web/src/lib/
sanitizeHtml.ts before rendering). Every other string/text field value is
rendered through ordinary JSX interpolation, which React escapes by
default — so there is no currently-exploitable gap this closes on the
Next.js frontend specifically. This task is still worth doing as defense in
depth: Sanity's content is also readable via its API/GROQ by anything else
that might consume it later (another site, an integration, a webhook) which
may not auto-escape the way React does — blocking the dangerous value at
the source (Studio, on save) protects every future consumer, not just this
one frontend.

RECOMMENDED APPROACH — ONE GLOBAL ENFORCEMENT POINT, NOT 312 MANUAL EDITS:
Manually adding `.validation(...)` to all 312 existing fields one file at a
time is exactly the kind of thing that WILL eventually miss one (and
guarantees nothing about fields added after this task ships — the core
requirement is "no field missed," which has to include the future). Build
this instead as a single schema-level post-processor:

1. Create ONE new shared, reusable validator — e.g.
   apps/studio/schemaTypes/fields/noScriptValidation.ts — exporting:
   - A small regex/constant that detects a `<script` tag (opening or
     closing, case-insensitive, tolerant of attributes/whitespace) —
     name this constant clearly (e.g. `SCRIPT_TAG_PATTERN`) so
     htmlValidation.ts's own tag-matching logic could reference the same
     literal pattern for `<script` detection if useful, rather than two
     independently-written regexes for "does this text contain a script
     tag" silently drifting apart over time. The two files' overall POLICY
     stays different (htmlValidation.ts allows one narrow exception; this
     new validator never does) — only the low-level "is there a <script
     tag in this string" detection should be shared.
   - A `Rule.custom`-compatible function, e.g. `rejectScriptTag(value)`,
     returning `true` for safe values and a clear editor-facing error
     string when a script tag is found (e.g. "Script tags are not allowed
     in this field."). Use `Rule.error()` severity, not `Rule.warning()` —
     this is a security boundary, not a content-quality nudge (contrast
     with the placeholder-text check from the page-templates work, which
     was correctly a warning; this is not that kind of check).
2. In apps/studio/sanity.config.ts, use the `schema.types` option (a
   function receiving the full array of already-defined types) to walk
   every type's `fields` array — and, for an array-type field, its `of`
   member types too — recursively, since object types nest (e.g. a page's
   `sections` array of section objects, each with its own fields, some of
   which are themselves arrays of objects like `cardItem`/`faqItem`).
   For every field definition found whose `type` is exactly `'string'` or
   `'text'`, attach `rejectScriptTag` to its validation:
   - If the field already has a `validation` function (e.g.
     `Rule.required().max(140)`), COMPOSE both — run the existing rule(s)
     AND the new script check, don't replace one with the other.
   - Skip the one named exemption above (sections/customHtmlSection.ts's
     `html`/raw-content field — confirm its exact field `name` before
     writing the skip condition) by an explicit, commented exclusion (e.g.
     matching on the parent type's name plus the field's name), not a
     blanket "skip anything inside a section called custom" guess.
   - Verify empirically that Sanity's `schema.types` hook in the exact
     Sanity version this repo pins (check apps/studio/package.json)
     supports this kind of deep, recursive post-processing cleanly without
     breaking Studio's type registration — this is the right architecture,
     but confirm it works as intended in this Sanity version before relying
     on it, and report back if it doesn't and the fallback below is needed
     instead.
3. If (and only if) step 2 turns out not to be feasible in this Sanity
   version: fall back to adding `.validation(Rule => Rule.custom(
   rejectScriptTag))` by hand to every field in the file list above,
   chained onto whatever validation each field already has (never
   replacing it) — treat this as the explicit, exhaustive checklist if
   you end up here, and don't declare it done until every file in the list
   has been visited.

VERIFICATION
After implementing (whichever path was used), re-run
`grep -rln "type: *'string'"` and `grep -rln "type: *'text'"` under
apps/studio/schemaTypes and confirm every match is covered — either by the
global post-processor (one place, provably covers all of them) or, if the
manual fallback was used, by spot-checking a sample of the 312 fields
directly in Studio: try saving a value like `<script>alert(1)</script>` in
a title field and a few others across different files, and confirm Studio
blocks the save with the new error message, while a normal string like
"Our Story" or an existing saved value still saves fine. Also confirm the
Custom HTML Section's own field still behaves exactly as it did before (a
trusted-host `<script src="...">` still allowed there, nowhere else).

DO NOT:
- Touch or weaken sections/customHtmlSection.ts or htmlValidation.ts's
  existing logic — read-only reference, not a file this task modifies.
- Change the check to `Rule.warning()` — this must block publishing, not
  just flag it.
- Expand scope into validating URLs/hrefs inside rich text link
  annotations (fields/richText.ts) — that's a related but separate risk
  (javascript: URIs in a link mark, not a literal `<script>` tag in plain
  text); flag it as a worth-doing follow-up if you notice it, don't fix it
  as part of this task.

FINISH BY
Report which approach was used (global post-processor vs. manual
per-field), the exact file(s) created/modified, confirmation every field in
the verified list above is covered, and the result of testing a rejected
`<script>` value plus a normal value in at least three different files
(one page type, one section, one shared object type) to prove the rule
actually reaches nested/reused field definitions, not just top-level ones.
