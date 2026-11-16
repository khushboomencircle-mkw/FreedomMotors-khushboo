# Platform Compliance Audit — Reusable Maintenance Prompt

Run this periodically (e.g. after a batch of schema changes, or before a
release) to check the existing Sanity schema still follows the rules in
`PROMPT_TEMPLATE.md`. It produces a findings report rather than a blind
rewrite — some fixes are safe to apply immediately, others touch fields with
live content and need a migration plan + explicit approval first.

```
PLATFORM COMPLIANCE AUDIT — align the existing Sanity schema with the rules
in PROMPT_TEMPLATE.md (repo root). Read that file first and use its 5 rules
as the checklist — don't restate them here, that would itself violate rule 1
(reuse, don't duplicate).

GOAL
Audit apps/studio/schemaTypes/** (and the paired security files
apps/studio/schemaTypes/sections/htmlValidation.ts + apps/web/src/lib/
sanitizeHtml.ts) against every rule in PROMPT_TEMPLATE.md, and produce a
findings report — don't silently rewrite the codebase. Split findings into
SAFE TO APPLY NOW vs. NEEDS APPROVAL, per the distinction below, and only
apply the SAFE TO APPLY NOW ones directly.

SAFE TO APPLY NOW (no stored-document shape changes, purely additive or
code-organization — apply directly):
- Rule 3 (admin/customer simplicity): any field missing a sensible
  `initialValue` where one should obviously exist. Adding or changing an
  `initialValue` never affects already-saved documents — it only affects
  what a brand-new, empty field shows before an editor touches it. Safe.
- Rule 4 (compact structure): any `group` that has become one long flat
  list of fields with no `fieldset` sub-grouping. Groups and fieldsets are
  presentational only in Sanity Studio — reorganizing them does not change
  how any field's value is stored. Safe to split into fieldsets directly,
  same as featureGridSection.ts / cardsGridSection.ts already do.
- Rule 1 (paired security logic): confirm htmlValidation.ts (Studio
  guardrail) and sanitizeHtml.ts (frontend sanitizer) haven't drifted out of
  sync with each other. If they have, bring them back in line — this is
  code-only, no document shape involved.
- Rule 5 (naming/placement): any new-ish file that doesn't follow the
  established naming/folder convention (sections/ vs objects/ vs fields/)
  but has zero existing content depending on its current shape.

NEEDS APPROVAL — report, don't touch (flag only, with the specific files and
the migration implication, then stop and ask before doing anything further):
- Rule 1 (normalization) applied to any field that ALREADY HAS LIVE CONTENT.
  Extracting a shared object type for a shape that's currently inlined
  changes the stored document structure for every existing document using
  that field — it is NOT a drop-in replacement, it requires a dataset
  migration (reshaping already-saved array/object values), tested on a
  dataset copy first. Report each such case as a finding with an estimate of
  which document types/fields are affected; do not write or run a migration
  as part of this audit unless explicitly asked to in a separate, dedicated
  task.
- Rule 2 (scope discipline) violations already baked into older files (e.g.
  one-off duplicated fields that predate a shared-builder pattern). Report
  it as a candidate for extracting a shared builder (code-only, safe), but
  changing the actual field names/shape on a type that already has saved
  content is a separate, approval-needed step.
- Any other case where fixing "cleanly" would require renaming a field
  name/key that live documents currently use, or changing an array's member
  type such that already-saved items would no longer parse under the new
  schema (Studio would show them as "Unknown type" until migrated).

OUTPUT FORMAT
For each finding: file + line reference, which rule it violates, whether
it's SAFE TO APPLY NOW or NEEDS APPROVAL, and (for NEEDS APPROVAL items) what
a migration would have to do before the schema change could ship. Apply the
SAFE TO APPLY NOW fixes directly and say what was changed; list the NEEDS
APPROVAL ones and wait for a decision on each before touching them.
```
