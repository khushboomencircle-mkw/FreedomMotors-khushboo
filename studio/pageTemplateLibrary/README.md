# Page Template Library

Editors manage landing-page starting points in Studio (**Page Templates**) and pick one in **Pages → New Template Page**.
A new page gets its own **copy** of the template's sections, SEO and header/footer switches (fresh `_key`s); nothing links it back.

## How it works

- `pageTemplateType.ts` — the `pageTemplate` document. Its `sections` use the same section types as a Landing Page, not drag-sortable: sections are ordered by **Display Order** (`sequence`), as on a page.
- `queries.ts` — constants and the GROQ queries (raw perspective; the draft wins over the published copy, "latest version including drafts").
- `resolve.ts` — pure logic: latest version, active-only list, usable-template check, building the new page, Display Order warning.
- `cloneWithFreshKeys.ts` — deep copy with fresh keys (keeps rich-text links, references and `sequence` intact).
- `libraryTemplate.ts` — the one Studio template (`customPage-from-library`) whose async `value` reads the chosen template and returns the copy.
- `TemplatePicker.tsx` — the picker pane (active templates only; Blank is offered if the library is empty or unreadable).
- `legacyTemplateDocuments.ts` + `migrateLegacyTemplates.ts` — turn the four hardcoded templates (`studio/pageTemplates.ts`) into documents (`npm run templates:migrate`, dry run by default; `-- --write` creates only what is missing).
- `index.ts` — `LEGACY_TEMPLATES_IN_CREATE_MENU` switch (see below).

## Tests

`npm run test:templates`

## Switching over after migration

1. `npm run templates:migrate` (dry run), then `npm run templates:migrate -- --write` (needs `SANITY_API_WRITE_TOKEN`; try a non-production `--dataset=` first).
2. Check the four templates in Studio, publish/activate as needed, and try New Template Page.
3. `LEGACY_TEMPLATES_IN_CREATE_MENU` in `index.ts` is already `false`: the "+" menu offers only Blank (permanent fallback, opens a blank page directly). Set it to `true` to show all four hardcoded templates there again. `studio/pageTemplates.ts` stays as the migration source.

## Reverting this feature

- Delete this folder (`studio/pageTemplateLibrary/`).
- `sanity.config.ts`: restore `import {pageTemplates} from './studio/pageTemplates'`, use `pageTemplates` again in the Landing Page(s) `initialValueTemplates` and in `schema.templates`, and remove the "New Template Page" and "Page Templates" sidebar items.
- `studio/schemaTypes/index.ts`: remove the `pageTemplateType` import and its entry.
- `package.json`: remove the `test:templates` and `templates:migrate` scripts.
- Existing pages are unaffected either way; template documents already created in a dataset can be deleted in Studio or left in place.
