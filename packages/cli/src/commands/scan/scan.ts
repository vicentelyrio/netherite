import {
  openRepo,
  type SkipReason,
  type Survey,
  settingDefaults,
  surveyRepository,
  workspaceGit,
} from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { reportFailure } from '../../errors'
import { type Env, type ExitCode, exitCodes, json } from '../../output'

export interface ScanOptions {
  readonly dir: string
  readonly out: string | undefined
  readonly nestedAgentFiles: boolean
  readonly force: boolean
  readonly json: boolean
}

const defaultOut = settingDefaults.migration.scanOutput

const typeNames = {
  adr: 'decision records',
  doc: 'docs',
  runbook: 'runbooks',
  context: 'agent and convention files',
} as const

const count = (n: number) => n.toLocaleString('en-US')

const leftOut = (survey: Survey) => {
  const lines: string[] = []
  if (survey.skipped.length > 0) {
    lines.push('', 'Left out:')
    for (const group of survey.skipped) {
      lines.push(`  ${String(group.count).padStart(4)}  ${group.label}`)
      const shown = group.examples.join(', ')
      lines.push(`        e.g. ${shown}${group.count > group.examples.length ? ', ...' : ''}`)
    }
  }
  return lines
}

const summary = (survey: Survey, out: string) => {
  const lines: string[] = []
  const by = (type: keyof typeof typeNames) => survey.entries.filter((e) => e.type === type).length
  const parts = (Object.keys(typeNames) as Array<keyof typeof typeNames>)
    .filter((t) => by(t) > 0)
    .map((t) => `${by(t)} ${typeNames[t]}`)
  lines.push(
    `Looked at ${count(survey.scanned)} files and found ${survey.entries.length} to bring in: ${parts.join(', ')}.`,
    ...leftOut(survey),
  )
  if (survey.notes.length > 0) {
    lines.push('', 'Look at these before importing:')
    for (const note of survey.notes) lines.push(`  - ${note}`)
  }
  lines.push(
    '',
    `The draft is in ${out}. It is not committed, and .netherite/local is ignored by git.`,
    'Open it, take out what you do not want, add a "title" or "fields" where you know better, then:',
    `  netherite import ${out} --dry-run`,
    '',
    'A decision record takes the status and date it states, or the date of its first commit.',
    'Nothing has been written to your documents.',
  )
  return lines
}

const skipHint: Partial<Record<SkipReason, string>> = {
  'nested-agent-file': 'Add --nested-agent-files to include them.',
}

export const scanCommand = (env: Env, options: ScanOptions) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const git = yield* workspaceGit(repo.workspace)
      const survey = yield* surveyRepository(repo.workspace, repo.index, {
        git,
        nestedAgentFiles: options.nestedAgentFiles,
      })
      const batch = { mode: 'copy', entries: survey.entries }

      if (options.json) {
        json(env.out, {
          batch,
          scanned: survey.scanned,
          skipped: survey.skipped,
          notes: survey.notes,
        })
        return exitCodes.ok as ExitCode
      }
      if (survey.entries.length === 0) {
        env.out.line(`Looked at ${count(survey.scanned)} files and found nothing to bring in.`)
        for (const line of leftOut(survey)) env.out.line(line)
        return exitCodes.ok as ExitCode
      }

      const target = options.out ?? defaultOut
      const file = path.resolve(repo.workspace.root, target)
      if ((yield* fs.exists(file)) && !options.force) {
        env.out.error(
          `${target} already exists. Pass --force to replace it, or --out to write somewhere else.`,
        )
        return exitCodes.usage as ExitCode
      }
      yield* fs.makeDirectory(path.dirname(file), { recursive: true })
      yield* fs.writeFileString(file, `${JSON.stringify(batch, null, 2)}\n`)
      const shown = path.relative(env.cwd, file).split(path.sep).join('/') || target
      for (const line of summary(survey, shown)) env.out.line(line)
      for (const group of survey.skipped) {
        const hint = skipHint[group.reason]
        if (hint !== undefined) env.out.line(`  (${group.label.split(' (')[0]}: ${hint})`)
      }
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })
