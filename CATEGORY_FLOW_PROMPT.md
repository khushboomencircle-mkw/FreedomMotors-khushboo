# Category Flow — End to End (Sanity + Web)

```
PLATFORM STANDING RULES — apply these to the request below (or above),
regardless of what the feature/section is: reuse first and keep schema
normalized (PROMPT_TEMPLATE.md's rule 1), only touch what's asked (rule 2),
minimal admin input with a sensible default (rule 3), compact group/
fieldset structure (rule 4), match existing conventions exactly (rule 5).
Read PROMPT_TEMPLATE.md at the repo root before starting.

――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
DEVELOPER'S REQUEST GOES HERE:
――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

BUILD THE CATEGORY FLOW END TO END: create categories in Studio → attach
one or more to an Educational Article → show them as clickable tags on
that article's web page → clicking one opens that category's own page
listing every article tagged with it. Do not apply code changes yet —
this is a spec to build from.

VERIFIED CURRENT STATE (don't re-derive, build on this):
- apps/studio/schemaTypes/pages/educationalArticle.ts already exists. It
  has a single free-text `eyebrow` field ("Short category label shown
  above the title") — this is NOT a category system, just a label, and it
  predates this task. DO NOT remove, rename, or repurpose it — it may
  already have real content, and changing its shape is exactly the kind
  of live-data risk this platform's rules flag as needing approval, not
  something to do silently. This task adds categories ALONGSIDE it.
- apps/web/src/app/educational/[slug]/page.tsx already exists and renders
  an article's image/eyebrow/title/description. It has no category tags
  today — you're adding that block, not replacing anything in this file.
- apps/web/src/sanity/queries.ts already has getEducationalArticleBySlug
  and getAllEducationalArticleSlugs for this document type — extend the
  first, don't duplicate it.
- A generic, already-wired `redirect` document type exists
  (apps/studio/schemaTypes/redirectType.ts) — Studio-editable old→new path
  mappings, synced to Vercel's edge config via a webhook + the existing
  /api/redirects/sync route. Any URL redirect this task needs MUST be a
  `redirect` document, not a new in-code redirect() call — that would
  duplicate a mechanism that already exists and is already wired up.
- NAMING NOTE: `eyebrow` as a field name already exists in THREE unrelated
  places in this schema (sections/cardItem.ts, this educationalArticle.ts,
  and the section-level eyebrow on bannerSection.ts/faqAccordionSection.ts)
  — same naming convention, different fields on different types. Don't
  confuse them; this task touches none of the other two.

PART 1 — SANITY SCHEMA

1. New document type apps/studio/schemaTypes/category.ts (placed at the
   schemaTypes root, same level as vehicleType.ts/siteSettingsType.ts —
   a standalone content type, not a page-builder section):
   - `title` (string, required).
   - `slug` (type: 'slug', options: {source: 'title', maxLength: 96,
     isUnique: <a SlugIsUniqueValidator scoped to `_type == "category"`,
     mirroring the exact pattern already in educationalArticle.ts's
     `isUniqueAcrossArticles`, including excluding the current draft/
     published pair>}, required).
   - `description` (type: 'text', optional — shown at the top of the
     category's page).
   - `seo` (type: 'seo' — reuse the existing shared seo object type,
     don't build a second one).
   Keep this type small — it's a label with a URL, not a page an admin
   designs. No groups/fieldsets needed at this size.

2. Register it: add to apps/studio/schemaTypes/index.ts's types array,
   and give it its own top-level entry in sanity.config.ts's structure
   (same pattern as the existing standalone "Vehicle Listing" list item —
   NOT nested inside "Pages," since a category isn't a page):
     S.listItem().title('Categories').child(
       S.documentTypeList('category').title('Categories'),
     ),

3. Add ONE new field to educationalArticle.ts, additive only, placed near
   the existing `eyebrow` field in the 'content' group:
     defineField({
       name: 'categories',
       title: 'Categories',
       type: 'array',
       group: 'content',
       description: 'Shown as clickable tags at the end of the article;
         each links to that category\'s own page.',
       of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
     })
   Do not touch the `eyebrow` field above it.

PART 2 — QUERIES (apps/web/src/sanity/queries.ts)

4. Extend the existing getEducationalArticleBySlug query (additive — find
   its current field list and add this one line, don't restructure the
   rest of it):
     categories[]->{title, "slug": slug.current},

5. New function, one combined query (category + its articles in one
   round trip):
     export async function getCategoryBySlug(slug: string) {
       return sanityFetch(
         `*[_type == "category" && slug.current == $slug][0]{
           title,
           description,
           seo,
           "articles": *[
             _type == "educationalArticle" &&
             isActive != false &&
             references(^._id)
           ]{
             title,
             "slug": slug.current,
             eyebrow,
             image{"url": image.asset->url, "alt": alt}
           }
         }`,
         {slug},
       )
     }
   Adjust the inner article field list to whatever getEducationalArticleBySlug
   actually exposes for a teaser — don't invent field names that don't exist.

6. New function:
     export async function getAllCategorySlugs() {
       return sanityFetch<{slug: string}[]>(
         `*[_type == "category" && defined(slug.current)]{"slug": slug.current}`,
       )
     }

PART 3 — WEB ROUTES

7. New route apps/web/src/app/category/[slug]/page.tsx. Mirror the exact
   structure already used by apps/web/src/app/educational/[slug]/page.tsx
   (generateStaticParams from getAllCategorySlugs, generateMetadata via
   seoToMetadata(category.seo), a PageContent async component with the
   same try/catch + SanityErrorState + notFound() pattern already used
   there — match it exactly, don't invent a different error-handling
   style for this one route). Render: category title, optional
   description, then a grid of article teaser cards (image + eyebrow +
   title), each linking to `/educational/${article.slug}`.
   WHY THIS PATH AND NOT /educational/category/[slug]: `/category/<slug>`
   is a two-segment path. The root catch-all (/[slug], for customPage)
   only ever matches ONE segment, so this never collides with it or with
   anything else — confirmed by how Next.js route matching works, not
   assumed. Using this exact shape also matches the live WordPress site's
   own category URLs (e.g. /category/accessiblesuvs/) byte-for-byte,
   which is what makes step 9 below possible.

8. Edit apps/web/src/app/educational/[slug]/page.tsx: add a new block
   AFTER the existing `<RichText value={article.description} ... />` line,
   still inside the closing `</article>`, rendering one tag per category:
     {article.categories && article.categories.length > 0 && (
       <div className="mt-8 flex flex-wrap gap-2">
         {article.categories.map((cat) => (
           <Link
             key={cat.slug}
             href={`/category/${cat.slug}`}
             className="text-xs font-semibold uppercase tracking-wider
               text-gray-300 border border-gray-600 rounded-full px-3 py-1
               hover:text-white hover:border-gray-400"
           >
             {cat.title}
           </Link>
         ))}
       </div>
     )}
   This is additive — everything above it in this file (image, eyebrow,
   title, description) is untouched. Import `Link` from 'next/link' if
   not already imported in this file.

PART 4 — MATCHING THE LIVE SITE'S URLS (no redirect needed, if done right)

9. When creating each category in Studio, use the SAME slug text the live
   WordPress site already uses wherever practical (e.g. "Accessible SUVs"
   → accessiblesuvs; "Accessible Vans" → accessible-vans; "Vehicle
   Maintenance" → vehicle-maintenance — confirmed from the live site
   directly, inconsistent hyphenation and all). Matching exactly means
   `/category/<slug>` on the new site is byte-identical to the old one —
   zero redirects needed for category pages specifically.
10. If a cleaner slug is deliberately chosen instead for any category,
    create ONE `redirect` document (existing type, Part 1 of this repo's
    schema, not new code) with Old Address = the WordPress path (e.g.
    `/category/accessiblesuvs`) and New Address = the new one. Don't
    build any other redirect mechanism — this type already handles it.
11. Individual article URL redirects are a separate, already-flagged
    concern (handled the same way, via `redirect` documents) — not part
    of this task, don't rebuild that here.

DO NOT:
- Change, rename, or remove educationalArticle.ts's existing `eyebrow`
  field.
- Touch apps/web/src/app/[slug]/page.tsx (customPage), apps/web/src/app/
  educational/page.tsx (the curated flexible page), or any Cards Grid
  Section feature (mosaic/filter/eyebrow-on-cardItem) — unrelated, already
  built, not in scope here.
- Write a new redirect() call in code, or a new redirect-storage mechanism
  — reuse the existing `redirect` document type and its sync job.
- Build a second "what does an article teaser look like" markup if one
  already exists to reuse (check educational/page.tsx and the Cards Grid
  card rendering before writing new teaser JSX from scratch).

FINISH BY
Create 2-3 categories, attach more than one to at least one article
(proving the array, not a single reference, actually works). Confirm: the
category page lists the right articles; clicking a category tag on an
article page opens the right category page; an existing article's eyebrow
label is unchanged; /[slug] and /educational still work exactly as
before. List every file created vs. modified.
```
