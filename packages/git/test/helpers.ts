import { execFileSync } from 'node:child_process'
import { NodeServices } from '@effect/platform-node'
import { basicHistory, createGitRepo, type GitRepo } from '@netherite/testing'
import { Effect, Layer } from 'effect'
import { ChildProcessSpawner } from 'effect/process'

export const services = NodeServices.layer

/** Every git command line started through the spawner, subcommand first. */
export interface Recorder {
  readonly commands: Array<ReadonlyArray<string>>
  readonly layer: Layer.Layer<ChildProcessSpawner.ChildProcessSpawner, never, never>
}

export const recorder = (): Recorder => {
  const commands: Array<ReadonlyArray<string>> = []
  const layer = Layer.effect(
    ChildProcessSpawner.ChildProcessSpawner,
    Effect.gen(function* () {
      const real = yield* ChildProcessSpawner.ChildProcessSpawner
      return ChildProcessSpawner.make((command) => {
        if (command._tag === 'StandardCommand') {
          const args = command.args.map(String)
          // Drop the global options git is started with; keep subcommand and arguments.
          const at = args.findIndex((a) => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '-c')
          commands.push(args.slice(at))
        }
        return real.spawn(command)
      })
    }),
  ).pipe(Layer.provide(NodeServices.layer)) as Layer.Layer<ChildProcessSpawner.ChildProcessSpawner>
  return { commands, layer }
}

export const withRepo = async <A>(
  use: (repo: GitRepo) => Promise<A>,
  options: Parameters<typeof createGitRepo>[0] = { fixture: 'basic', history: basicHistory },
) => {
  const repo = await createGitRepo(options)
  try {
    return await use(repo)
  } finally {
    await repo.cleanup()
  }
}

export const sh = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    // GIT_OPTIONAL_LOCKS=0 keeps the test's own `git status` from refreshing the index it inspects.
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
      GIT_OPTIONAL_LOCKS: '0',
    },
  }).trim()
