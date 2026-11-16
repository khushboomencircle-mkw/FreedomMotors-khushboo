# Platform Standing Rules — Prompt Template

Paste the block below above (or below) any developer-written feature/section
request for this platform. It applies regardless of what the feature or
section is, to existing schema being updated and to new schema being built.

```
PLATFORM STANDING RULES — apply these to the request below (or above),
regardless of what the feature/section is:

1. REUSE FIRST, DON'T DUPLICATE — AND KEEP IT NORMALIZED
   Before writing anything new, check what already exists for the same job:
   - Section registry: apps/studio/schemaTypes/sections/index.ts
     (`sectionObjectTypes` + `allSectionMembers`, plus the narrower
     `driverSections`) — adding a new section here makes it available on
     every page automatically; don't edit individual page files.
   - Shared field builders: apps/studio/schemaTypes/fields/sectionFields.ts
     (sequenceField, activeField, sectionHeaderFields, buttonFields,
     expandableFields, sectionsArrayValidation).
   - Shared "Look" building blocks: fields/sectionTheme.ts
     (sectionThemeFields()) + objects/containerConfig.ts (background/width) +
     objects/borderConfig.ts — the same trio already used identically in
     cardsGridSection.ts and featureGridSection.ts under a `sectionStyles`
     group.
   - All schema — existing and future — must be normalized: a repeated shape
     (same fields, same job) gets defined once as its own reusable object
     type and referenced everywhere it's needed, never copy-pasted inline
     again. If the file you're touching already has the same inline shape
     duplicated elsewhere (e.g. `image` + nested `alt` currently appears
     separately in cardItem.ts, featureCardItem.ts, bannerSection.ts, and
     vehicleType.ts instead of one shared type), flag it and propose
     extracting a shared type instead of adding another copy — even if that
     wasn't explicitly asked for. Don't over-normalize single-use shapes just
     for the sake of it — normalize repeated structures, not everything.
   - Never duplicate security-relevant logic (e.g. htmlValidation.ts /
     sanitizeHtml.ts) independently in two places — keep paired
     implementations in sync or share a constant between them.
   - If the thing you need doesn't exist yet as a shared piece, build ONE
     small reusable version of it (not an inline one-off), so the next
     request can reuse it too. Say explicitly when you had to create
     something new versus when you reused something that already existed.

2. SCOPE DISCIPLINE
   Only touch what the request actually asks for. Don't add, remove, or
   "clean up" unrelated fields, sections, or files as a side effect.

3. ADMIN/CUSTOMER SIMPLICITY (two platform users: non-technical Admin,
   site-visiting Customer)
   - Required fields = the true minimum. Don't cut a real necessity (e.g.
     image alt text) just to shrink the form.
   - Every stylistic/layout field needs a sensible `initialValue`, so the
     result looks finished the instant Admin adds content — zero required
     configuration for a good default.
   - Styling/theme controls go in their own group/tab, separate from
     Content, so Admin sees a simple content-only view by default and only
     finds styling controls if they go looking for them.
   - Prefer explicit, plain-language named choices (a few radio options)
     over hidden "smart" automatic behavior — visible and predictable beats
     clever but unexplainable.
   - "Most attractive customer-facing render" is a frontend concern
     (apps/web/src/components/PageSection.tsx) — flag it as a tracked
     follow-up rather than assuming the schema alone guarantees it, unless
     the request explicitly includes frontend rendering work too.

4. COMPACT, CLEAN SCHEMA STRUCTURE
   - Group related fields under the same Studio `group` (tab).
   - Within a group, further group related fields into a `fieldset`
     (a titled, collapsible sub-section) — group and fieldset are two
     different mechanisms, use both together, don't let any group become one
     long flat list. Mirror the pattern already in featureGridSection.ts
     (layout group → displaySetup/scrollNav/cardSizing/cardStyle/playBtn/
     contentPos fieldsets) or cardsGridSection.ts (layout → display/
     sliderOptions).

5. CODE A FUTURE DEVELOPER CAN FOLLOW
   - Match existing naming, file placement, and conventions exactly —
     no parallel pattern for something a shared one already covers.
   - List exactly which files get created vs. modified, and what in the
     registry needs updating, so nothing is left half-wired.

――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
DEVELOPER'S REQUEST GOES HERE:
――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
```
