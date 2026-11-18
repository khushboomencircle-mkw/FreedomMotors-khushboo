# Studio usability

Everything here makes the Studio easier to use. None of it changes what is stored in a document or how the website
reads it.

## The strict rule

> **No existing field is ever removed, and no field's key (its `name`) ever changes.**

The website's GROQ queries (`src/sanity/queries.ts`, e.g. `SECTION_PROJECTION`) read content by those names, and every
saved document stores its values under them. Everything in this folder may change how a field is **titled, ordered,
grouped, hidden or drawn**. It may never change what a field **is** (name, type, options, validation, initial value).

Two tests enforce it. Do not weaken them to make a change pass:

| Test                    | What it checks                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fieldLock.test.ts`     | every field in `fieldLock.json` still exists with the same type; every section field keeps an identical name, type, options, validation and default; every field the website queries still exists |
| `contentLayout.test.ts` | no tab is shown empty, every field is still in a visible tab                                                                                                                                      |

### Adding a field

1. Add it to the section as usual.
2. Run `npm run schema:lock`.
3. Read the diff of `fieldLock.json`. It must contain **only added lines**. A removed line means a field was removed or
   renamed: stop and put it back.

### If the site needs a field the schema no longer has

Old keys that the website still reads but the schema no longer has are listed in `LEGACY_QUERIED` in
`fieldLock.test.ts`. That list must never grow.

## What is in here

| Module                                                            | What it does                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `structure.ts`, `StartHere.tsx`                                   | the sidebar (grouped by task) and the "Start here" page                                 |
| `contentLayout.ts`                                                | the standard Content tab: Status row, "Heading & intro", "Main button", "Second button" |
| `withSectionGuide.ts`, `sectionGuide.ts`, `SectionIntroInput.tsx` | the intro card and "Position on the page" (display-only fields)                         |
| `rows.ts`, `withAddButtons.ts`, `AddRowButton.tsx`                | row summaries and the "Add card" / "Add question" buttons                               |
| `tabs.ts`                                                         | plain tab names, no "All fields" tab                                                    |
| `hiddenBadge.ts`                                                  | "Hidden ·" in the Page Sections list                                                    |
| `readiness.ts`                                                    | plain-language warnings (never errors)                                                  |
| `previewPaths.ts`, `OpenInPreviewAction.tsx`                      | "Preview on site" in the document menu                                                  |
| `fieldIntegrity.ts`, `groqFields.ts`, `generateFieldLock.ts`      | the field lock and its helpers                                                          |

Every change is applied **once, where the schema types are registered** (`applyStudioUsability` in `index.ts`, called
from `studio/schemaTypes/index.ts`). No section or page file is edited, so a new section only needs registering as usual.

## Switches

`index.ts` has one switch per feature. Set it to `false` to put that one thing back exactly as it was. No content is
involved, so nothing else needs to change.

`CALM_TABS_ENABLED`, `STANDARD_CONTENT_ENABLED`, `SECTION_GUIDE_ENABLED`, `FRIENDLY_ROWS_ENABLED`,
`HIDDEN_BADGE_ENABLED`, `READINESS_CHECKS_ENABLED`.

## Adding a new section type

1. Create the section and register it (`studio/schemaTypes/sections/index.ts`).
2. Add it to a group in `studio/sectionLibrary/library.ts` and draw its picture in `previews.ts`
   (`npm run sections:previews`).
3. Add its name, description and tip to `SECTION_GUIDE` in `sectionGuide.ts`.
4. Optional: add checks in `readiness.ts` and an Add label in `rows.ts`.
5. `npm run schema:lock`, then run the tests.

The tests tell you what you missed: every section must be in exactly one group, have a picture and have a guide.

## Tests

```bash
npm run test:usability   # everything in this folder
npm run test:library     # the section library
npm run test:pages       # fixed pages
npm run test:layouts     # layout picker
```
