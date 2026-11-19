/**
 * Settings the app cannot run without have NO fallback value: a missing one stops the app with a clear
 * message, instead of silently pointing it at a default project or dataset.
 *
 * Pass the variable as a literal `process.env.NAME` (next to its name), never `process.env[name]`: Next.js
 * and the Studio bundler only replace the literal form inside browser code.
 * An empty value is allowed (e.g. an empty TRUSTED_SCRIPT_HOSTS means "no trusted hosts"); only a variable
 * that is not set at all is an error.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined) {
    throw new Error(
      `Missing environment variable ${name}. Set it in .env.local (and in the hosting environment).`,
    )
  }
  return value
}
