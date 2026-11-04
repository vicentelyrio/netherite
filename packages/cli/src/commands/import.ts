import {
  type EntryResult,
  gitHandle,
  type ImportReport,
  importBatch,
  openRepo,
  workspaceGit,
} from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { reportFailure } from '../errors'
import { type Env, type ExitCode, exitCodes, json } from '../output'

export interface ImportCommandOptions {
  readonly dir: string
  /** The batch file: JSON, a list of entries or `{ "mode": "copy", "entries": [...] }`. */
  readonly file: string
  readonly update: boolean
  readonly dryRun: boolean
  readonly stub: boolean
  readonly createdBy: string | undefined
  readonly json: boolean
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const describe = (r: EntryResult, dryRun: boolean) => {
  const where = r.source ?? `entry ${r.entry}`
  switch (r.status) {
    case 'created':
      return `${dryRun ? 'would create' : 'created'}  ${r.id ?? '(next ID)'}  ${where}${r.path ? ` -> ${r.path}` : ''}${
        r.original === 'removed'
          ? '  (original removed)'
          : r.original === 'stub'
            ? '  (original replaced by a note)'
            : ''
      }`
    case 'updated':
      return `${dryRun ? 'would update' : 'updated'}  ${r.id}  ${where}`
    case 'skipped':
      return `skipped  ${where}  ${r.reason ?? ''}`.trimEnd()
    case 'failed':
      return `failed   ${where}  ${r.reason ?? ''}`.trimEnd()
  }
}

const summary = (report: ImportReport) => {
  const { counts } = report
  const parts = [
    `${counts.created} ${report.dryRun ? 'to create' : 'created'}`,
    ...(counts.updated > 0 ? [`${counts.updated} ${report.dryRun ? 'to update' : 'updated'}`] : []),
    `${counts.skipped} skipped`,
    `${counts.failed} failed`,
  ]
  return parts.join(', ')
}

/**
 * Applies an accepted batch of candidates: `netherite import batch.json`. The agent decided what
 * each file is; this writes the items through the same validated operations as every other write,
 * records where each came from, and never commits. Exit code 1 when an entry failed.
 */
export const importCommand = (env: Env, options: ImportCommandOptions) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const file = path.resolve(env.cwd, options.file)
    const read = yield* Effect.result(fs.readFileString(file))
    if (read._tag === 'Failure') {
      env.out.error(`Cannot read ${options.file}: ${read.failure.message}`)
      return exitCodes.usage as ExitCode
    }
    let batch: unknown
    try {
      batch = JSON.parse(read.success)
    } catch (error) {
      env.out.error(`${options.file} is not valid JSON: ${(error as Error).message}`)
      return exitCodes.usage as ExitCode
    }
    const entries = Array.isArray(batch) ? batch : isObject(batch) ? batch.entries : undefined
    if (!Array.isArray(entries)) {
      env.out.error(
        `${options.file} must be a list of entries, or an object with an "entries" list`,
      )
      return exitCodes.usage as ExitCode
    }
    const mode = isObject(batch) ? batch.mode : undefined
    if (mode !== undefined && mode !== 'copy' && mode !== 'move') {
      env.out.error('"mode" is copy or move')
      return exitCodes.usage as ExitCode
    }

    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const createdBy = options.createdBy ?? (yield* gitHandle(yield* workspaceGit(repo.workspace)))
      const report = yield* importBatch(repo, entries, {
        update: options.update,
        dryRun: options.dryRun,
        stub: options.stub,
        ...(createdBy === undefined ? {} : { createdBy }),
        ...(mode === undefined ? {} : { mode }),
      })
      if (options.json) {
        json(env.out, report)
      } else {
        if (report.dryRun) env.out.line('Dry run: nothing was written.')
        for (const r of report.results) env.out.line(describe(r, report.dryRun))
        env.out.line(summary(report))
        if (!report.dryRun && report.counts.created + report.counts.updated > 0) {
          env.out.line(
            'Nothing is committed. Run `netherite lint`, then review the changes in git.',
          )
        }
      }
      return (report.counts.failed > 0 ? exitCodes.findings : exitCodes.ok) as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })
