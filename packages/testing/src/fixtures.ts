import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Absolute path of the repository's `fixtures/` folder. */
export const fixturesRoot = fileURLToPath(new URL('../../../fixtures', import.meta.url))

/** Absolute path of one fixture workspace, such as `basic`. */
export const fixturePath = (name: string) => join(fixturesRoot, name)

/**
 * Copies a fixture into a fresh temporary directory, runs `use`, then deletes the copy.
 * Without a fixture name it creates an empty directory.
 */
export const withTempDir = async <A>(
  fixture: string | undefined,
  use: (dir: string) => Promise<A>,
): Promise<A> => {
  const dir = await mkdtemp(join(tmpdir(), 'netherite-'))
  try {
    if (fixture) await cp(fixturePath(fixture), dir, { recursive: true })
    return await use(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
