import {loadEnvConfig} from '@next/env'
import {defineConfig} from 'drizzle-kit'

// Load .env.local the same way Next.js does, so `npm run db:migrate` finds DIRECT_URL
// without exporting it by hand. (drizzle-kit itself only reads a plain `.env`.)
loadEnvConfig(process.cwd())

/**
 * drizzle-kit config — generates migration SQL from the schema in
 * src/db/schema (see that folder's index.ts) into ./drizzle, and applies it.
 *
 * Two Supabase connection strings are used, each for one job (both are the
 * pooler on the same host; only the port, and so the pooling mode, differs):
 *   - DATABASE_URL — "Transaction" mode, port 6543. The app's own queries
 *     (src/db/client.ts). Built for many short-lived serverless connections.
 *   - DIRECT_URL   — "Session" mode, port 5432. Migrations only (this file).
 *     Transaction mode does not support the session-level behavior DDL and
 *     schema introspection need, so migrations must not use DATABASE_URL.
 *
 * `drizzle-kit generate` doesn't need a database at all (it diffs the
 * TypeScript schema against the last migration's snapshot); `drizzle-kit
 * migrate` does.
 *
 * Nothing here is hardcoded: every environment (development, staging,
 * production — each is its own Supabase project) sets its own pair, so which
 * database a migration runs against is decided entirely by which
 * environment's variables are active, never by this file.
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
      `${name} is not set. Add it to .env.local (see .env.local.example): the Supabase ` +
        "project → Connect → the 'Session pooler' connection string, port 5432.",
    )
  }
  return value
}
