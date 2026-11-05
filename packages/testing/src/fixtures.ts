import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const fixturesRoot = fileURLToPath(new URL('../../../fixtures', import.meta.url))

export const fixturePath = (name: string) => join(fixturesRoot, name)

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
