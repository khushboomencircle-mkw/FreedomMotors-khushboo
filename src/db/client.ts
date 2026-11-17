import {drizzle} from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Drizzle client factory — reads its connection from `DATABASE_URL` only
 * (see .env.local.example). No host/project values are hardcoded
 * here: switching dev → staging → production, or even Postgres providers
 * later, is an env var change wherever this app is deployed, not a code
 * change.
 *
 * CONNECTION STRING: use Supabase's pooled "Transaction" connection string
 * here, not the direct one. This app runs as Next.js server code (including
 * on serverless/edge-adjacent runtimes when deployed), which can spin up many
 * short-lived connections under load; Supabase's direct connection has a low,
 * fixed connection limit that a serverless deployment can exhaust quickly,
 * while the Transaction pooler (PgBouncer) is built for exactly this. The
 * tradeoff: PgBouncer in transaction mode doesn't support session-level
 * features or prepared statements, which is why `prepare: false` is set
 * below — without it, queries can fail or silently misbehave against the
 * pooler. Migrations are a different story — see drizzle.config.ts, which
 * intentionally uses a separate `DIRECT_URL` instead.
 *
 * ROLE: this must be the `postgres` user from Supabase's own connection
 * string (Project Settings → Database → Connection string) — a real
 * Postgres role, and a superuser in Supabase's setup, which is what actually
 * bypasses Row Level Security here. This is NOT the same thing as the
 * Supabase "service_role" API key: that key only authenticates requests made
 * through Supabase's REST API (PostgREST)/supabase-js, which this app isn't
 * using for its own queries — a direct Postgres connection string (what
 * Drizzle needs) isn't a JWT and doesn't accept that key as a value. See
 * SUPABASE_SERVICE_ROLE_KEY in .env.local.example for where that key
 * actually applies.
 */
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. See .env.local.example for where to find it ' +
      "(Supabase project → Connect → the 'Transaction' pooler connection string).",
  )
}

const queryClient = postgres(connectionString, {prepare: false})

export const db = drizzle(queryClient, {schema})
