/**
 * Test helper: read a real setting from the environment (.env.local, loaded by the test scripts), so a
 * test never keeps its own literal copy of a project id, URL or bucket name. A missing or empty value
 * stops the test with a clear message instead of silently testing something else.
 */
export function testEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set in .env.local to run this test.`)
  return value
}
