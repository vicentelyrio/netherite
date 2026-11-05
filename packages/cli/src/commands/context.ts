import { openRepo, syncContext, type TargetReport } from '@netherite/core'
import { Effect, Path } from 'effect'
import { reportFailure } from '../errors'
import { type Env, type ExitCode, exitCodes, json } from '../output'

export interface ContextSyncOptions {
  readonly dir: string
  /** Write nothing; exit 1 if a file is out of date. */
  readonly check: boolean
  readonly json: boolean
}

const count = (n: number) => n.toLocaleString('en-US')

const describe = (t: TargetReport, check: boolean) => {
  const state = check ? (t.stale ? 'out of date' : 'up to date') : t.status
  return `${t.path.padEnd(10)} ${state.padEnd(11)} ≈${count(t.tokens)} of ${count(t.budget)} tokens, ${t.included.length} ${t.included.length === 1 ? 'item' : 'items'}`
}

/** Renders the context items into `CLAUDE.md` and `AGENTS.md`, or with `--check` only compares. */
export const contextSync = (env: Env, options: ContextSyncOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const report = yield* syncContext(repo, { check: options.check })

      if (options.json) {
        json(env.out, report)
      } else {
        for (const t of report.targets) env.out.line(describe(t, options.check))
        if (report.targets.length === 0) env.out.line('No context targets are configured.')
      }
      for (const t of report.targets) {
        if (t.omitted.length === 0) continue
        env.out.error(
          `${t.path}: ${t.omitted.length} ${t.omitted.length === 1 ? 'item does' : 'items do'} not fit in the ${count(t.budget)}-token budget:`,
        )
        for (const o of t.omitted) {
          env.out.error(
            `  ${o.id || o.path}  ${o.title}  (${o.priority}, ≈${count(o.tokens)} tokens)`,
          )
        }
      }
      if (options.check && report.stale) {
        env.out.error('Context is out of date. Run `netherite context sync` and commit the result.')
        return exitCodes.findings as ExitCode
      }
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })
