import {
  applyFixes,
  type Diagnostic,
  type FixReport,
  lintWorkspace,
  openRepo,
  type Severity,
  summarize,
  workspaceGit,
} from '@netherite/core'
import { Effect, Path } from 'effect'
import { unifiedDiff } from '../../diff'
import { reportFailure } from '../../errors'
import { type Env, type ExitCode, exitCodes, json } from '../../output'

export type FailOn = 'error' | 'warning' | 'info' | 'never'

export interface LintCommandOptions {
  readonly dir: string
  readonly paths: ReadonlyArray<string>
  readonly json: boolean
  readonly fix: boolean
  readonly dryRun: boolean
  readonly failOn: FailOn
  readonly noGit: boolean
}

const rank: Record<Severity, number> = { error: 0, warning: 1, info: 2 }

export const formatDiagnostics = (diagnostics: ReadonlyArray<Diagnostic>): string[] => {
  const lines: string[] = []
  let current: string | undefined
  for (const d of diagnostics) {
    if (d.path !== current) {
      if (current !== undefined) lines.push('')
      lines.push(d.path)
      current = d.path
    }
    const label = d.severity.padEnd(7)
    lines.push(`  ${`${d.line}:${d.column}`.padEnd(7)} ${label} ${d.rule.padEnd(20)} ${d.message}`)
  }
  return lines
}

export const summaryLine = (diagnostics: ReadonlyArray<Diagnostic>) => {
  const { error, warning, info } = summarize(diagnostics)
  if (diagnostics.length === 0) return '✔ No problems'
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  return `✖ ${plural(diagnostics.length, 'problem')} (${plural(error, 'error')}, ${plural(warning, 'warning')}, ${info} info)`
}

const exceeds = (diagnostics: ReadonlyArray<Diagnostic>, failOn: FailOn) =>
  failOn !== 'never' && diagnostics.some((d) => rank[d.severity] <= rank[failOn])

const describeFixes = (report: FixReport, dryRun: boolean) => {
  if (!dryRun) return []
  const renames = new Map(
    report.applied.flatMap((fix) =>
      fix.kind === 'rename-file' ? [[fix.path, fix.to] as const] : [],
    ),
  )
  const lines: string[] = []
  const handled = new Set<string>()
  for (const change of report.changes) {
    if (handled.has(change.path)) continue
    const to = renames.get(change.path)
    const moved = to === undefined ? undefined : report.changes.find((c) => c.path === to)
    if (to !== undefined && moved !== undefined && change.after === null) {
      handled.add(to)
      lines.push(
        `rename from ${change.path}`,
        `rename to ${to}`,
        unifiedDiff(to, change.before, moved.after).replace(/^--- .*\n\+\+\+ .*\n?/, ''),
      )
      continue
    }
    lines.push(unifiedDiff(change.path, change.before, change.after))
  }
  return lines.filter((line) => line !== '')
}

export const lintCommand = (env: Env, options: LintCommandOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    if (options.dryRun && !options.fix) {
      env.out.error('--dry-run only works with --fix.')
      return exitCodes.usage as ExitCode
    }

    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const git = options.noGit ? undefined : yield* workspaceGit(repo.workspace)

      const only =
        options.paths.length === 0
          ? undefined
          : resolveFilter(path, env.cwd, repo.workspace.root, options.paths)
      const check = (): Effect.Effect<Diagnostic[], unknown, never> =>
        Effect.map(
          lintWorkspace(repo.workspace, {
            git,
            ...(options.fix ? {} : {}),
          }),
          (all) => (only === undefined ? all : all.filter(only)),
        ) as never

      let diagnostics = yield* check()
      let fixed: FixReport | undefined
      if (options.fix) {
        fixed = yield* applyFixes(repo, diagnostics, { dryRun: options.dryRun })
        if (!options.dryRun && fixed.changes.length > 0) diagnostics = yield* check()
      }

      const exit: ExitCode = exceeds(diagnostics, options.failOn)
        ? exitCodes.findings
        : exitCodes.ok
      if (options.json) {
        json(env.out, {
          diagnostics,
          summary: summarize(diagnostics),
          ...(fixed === undefined
            ? {}
            : {
                fix: {
                  dryRun: options.dryRun,
                  applied: fixed.applied,
                  skipped: fixed.skipped,
                  changes: fixed.changes,
                },
              }),
        })
        return exit
      }

      if (fixed !== undefined) {
        const verb = options.dryRun ? 'Would fix' : 'Fixed'
        for (const line of describeFixes(fixed, options.dryRun)) env.out.line(line)
        for (const skip of fixed.skipped) env.out.error(`Skipped: ${skip.reason}`)
        env.out.line(
          fixed.applied.length === 0
            ? 'Nothing to fix.'
            : `${verb} ${fixed.applied.length} problem${fixed.applied.length === 1 ? '' : 's'} in ${fixed.changes.length} file${fixed.changes.length === 1 ? '' : 's'}.`,
        )
        if (options.dryRun) {
          env.out.line('')
        }
      }
      for (const line of formatDiagnostics(diagnostics)) env.out.line(line)
      if (diagnostics.length > 0) env.out.line('')
      env.out.line(summaryLine(diagnostics))
      return exit
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })

const resolveFilter = (
  path: Path.Path,
  cwd: string,
  root: string,
  inputs: ReadonlyArray<string>,
): ((d: Diagnostic) => boolean) => {
  const wanted = inputs.map((input) =>
    path.relative(root, path.resolve(cwd, input)).split(path.sep).join('/'),
  )
  return (d) => wanted.some((w) => w === '' || d.path === w || d.path.startsWith(`${w}/`))
}
