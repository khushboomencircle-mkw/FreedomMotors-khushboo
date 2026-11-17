import {defineConfig} from 'drizzle-kit'

/**
 * drizzle-kit config — generates migration SQL from the schema in
 * src/db/schema (see that folder's index.ts) into ./drizzle, and (if ever
 * run) applies it.
 *
 * Reads DIRECT_URL, not DATABASE_URL: `drizzle-kit generate` doesn't need a
 * database at all (it diffs the TypeScript schema against the last generated
 * migration's snapshot), but `drizzle-kit migrate` does, and DDL/schema
 * introspection against Supabase's pooled "Transaction" connection
 * (DATABASE_URL, used by src/db/client.ts for the app's own runtime queries)
 * is unreliable — PgBouncer's transaction mode doesn't support the session-
 * level behavior migrations need. DIRECT_URL is Supabase's direct (non-
 * pooled) connection string, for migrations only.
 *
 * Nothing here is hardcoded: every environment (local/staging/production)
 * sets its own DIRECT_URL, so which database a migration runs against is
 * decided entirely by which environment's env vars are active, never by this
 * file.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: requireEnv('DIRECT_URL'),
  },
})

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. See .env.local.example for where to find it ` +
        "(Supabase project → Connect → the 'Direct connection' connection string).",
    )
  }
  return value
}
