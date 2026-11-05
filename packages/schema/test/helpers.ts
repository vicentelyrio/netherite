import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fixturePath } from '@netherite/testing'
import { Effect, Schema } from 'effect'
import { parse } from 'yaml'
import { Config } from '../src/index'

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )

const root = fixturePath('basic')

export const fixtureConfig = Schema.decodeUnknownSync(Config)(
  parse(readFileSync(join(root, '.netherite', 'config.yml'), 'utf8')),
)

/** Frontmatter of every item file in `fixtures/basic`, keyed by path relative to the fixture. */
export const fixtureItems = walk(join(root, 'netherite')).map((path) => {
  const text = readFileSync(path, 'utf8')
  const front = text.slice(4, text.indexOf('\n---\n', 4))
  return { path: path.slice(root.length + 1), data: parse(front) as unknown }
})

/** Runs an effect that is expected to fail and returns its error. */
export const failure = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(Effect.flip(effect))
export const success = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect)
