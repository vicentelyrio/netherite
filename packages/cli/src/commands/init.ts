import { configFile } from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { type Env, type ExitCode, exitCodes, json } from '../output'
import { ensureRuleset, type RulesetReport, rulesetTitle } from '../ruleset'
import { installSkills, type SkillsReport } from './skills-install'

const folders = [
  'goals',
  'projects',
  'tasks',
  'adr',
  'docs',
  'context',
  'runbooks',
  'assets',
] as const

const configText = (content: string) =>
  [
    '# Netherite workspace. Only `version` is required; the commented values are the defaults.',
    'version: 1',
    content === 'netherite' ? '# content: netherite' : `content: ${content}`,
    '# id_padding: 5',
    '# states:',
    '#   - { name: backlog, category: todo }',
    '#   - { name: doing, category: active }',
    '#   - { name: blocked, category: blocked }',
    '#   - { name: done, category: done }',
    '# freshness:',
    '#   drifting: 1   # commits since review before an item drifts',
    '#   stale: 10     # and before it is stale',
    '# context:',
    '#   budget: 8000',
    '#   targets: [claude, agents]',
    '',
  ].join('\n')

export const ignoreEntry = '.netherite/local/'

export interface InitOptions {
  readonly dir: string
  readonly content: string
  readonly json: boolean
  /** Refresh the installed skills and the AGENTS.md section to this version. */
  readonly update?: boolean
  /** Do not install the agent skills, the AGENTS.md section or the agent ruleset. */
  readonly noSkills?: boolean
}

export interface InitReport {
  readonly root: string
  readonly created: ReadonlyArray<string>
  readonly existed: ReadonlyArray<string>
  /** What happened to the agent skills and AGENTS.md section. Absent with `--no-skills`. */
  readonly skills?: SkillsReport
  /** The ruleset every agent reads. Absent with `--no-skills`. */
  readonly ruleset?: RulesetReport
}

/**
 * Sets a repository up for Netherite: the config file, the content folders (with a `.gitkeep` so
 * git keeps them), and a `.gitignore` line for per-user state. Safe to run again: it only adds
 * what is missing and never overwrites.
 */
export const init = (env: Env, options: InitOptions) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const root = path.resolve(env.cwd, options.dir)

    const content = options.content.replace(/\/+$/, '')
    const resolved = path.resolve(root, content)
    const relative = path.relative(root, resolved)
    if (
      content === '' ||
      relative === '' ||
      relative.startsWith('..') ||
      path.isAbsolute(relative)
    ) {
      env.out.error(`--content must be a folder inside the repository, not "${options.content}"`)
      return exitCodes.usage as ExitCode
    }
    if (!(yield* fs.exists(root))) {
      env.out.error(`${root} does not exist`)
      return exitCodes.usage as ExitCode
    }

    const created: string[] = []
    const existed: string[] = []
    const rel = (p: string) => path.relative(root, p).split(path.sep).join('/')

    // Config.
    const config = path.join(root, configFile)
    if (yield* fs.exists(config)) existed.push(rel(config))
    else {
      yield* fs.makeDirectory(path.dirname(config), { recursive: true })
      yield* fs.writeFileString(config, configText(relative.split(path.sep).join('/')))
      created.push(rel(config))
    }

    // Content folders. Read the content folder from the existing config, if there is one.
    const contentDir = existed.length > 0 ? resolved : resolved
    for (const name of folders) {
      const dir = path.join(contentDir, name)
      if (yield* fs.exists(dir)) {
        existed.push(rel(dir))
        continue
      }
      yield* fs.makeDirectory(dir, { recursive: true })
      yield* fs.writeFileString(path.join(dir, '.gitkeep'), '')
      created.push(rel(dir))
    }

    // .gitignore.
    const ignore = path.join(root, '.gitignore')
    const current = (yield* fs.exists(ignore)) ? yield* fs.readFileString(ignore) : undefined
    const has = current
      ?.split(/\r?\n/)
      .some((line) => line.trim() === ignoreEntry || line.trim() === '.netherite/local')
    if (has) existed.push('.gitignore')
    else {
      const eol = current?.includes('\r\n') ? '\r\n' : '\n'
      const lead = current === undefined || current === '' || current.endsWith('\n') ? '' : eol
      yield* fs.writeFileString(ignore, `${current ?? ''}${lead}${ignoreEntry}${eol}`)
      created.push('.gitignore')
    }

    const installed =
      options.noSkills === true
        ? undefined
        : yield* installSkills(root, { update: options.update === true })

    // The ruleset is a context item, so it needs the folders and config above.
    const ruleset = options.noSkills === true ? undefined : yield* ensureRuleset(root)

    if (options.json) {
      json(env.out, {
        root,
        created,
        existed,
        ...(installed === undefined ? {} : { skills: installed }),
        ...(ruleset === undefined ? {} : { ruleset }),
      } satisfies InitReport)
    } else {
      for (const item of created) env.out.line(`created  ${item}`)
      for (const item of existed) env.out.line(`exists   ${item}`)
      const changed = installed?.skills.filter((s) => s.status !== 'unchanged') ?? []
      for (const s of changed) env.out.line(`${s.status.padEnd(8)} ${s.path}`)
      if (installed !== undefined && installed.agents !== 'unchanged') {
        env.out.line(
          installed.agents === 'damaged'
            ? 'skipped  AGENTS.md (its netherite markers are damaged; fix them by hand)'
            : `${installed.agents.padEnd(8)} AGENTS.md`,
        )
      }
      if (ruleset?.status === 'created') {
        env.out.line(`created  ${ruleset.id}  ${rulesetTitle}`)
        for (const file of ruleset.synced) env.out.line(`synced   ${file}`)
      }
      if (changed.some((s) => s.status === 'outdated')) {
        env.out.line('Some skills are older than this version. Run `netherite init --update`.')
      }
      if (changed.some((s) => s.status === 'edited')) {
        env.out.error('Skills you edited were left alone.')
      }
      const nothingNew =
        created.length === 0 &&
        !changed.some((s) => s.status === 'created' || s.status === 'updated') &&
        (installed === undefined || ['unchanged', 'damaged'].includes(installed.agents)) &&
        ruleset?.status !== 'created'
      env.out.line(
        nothingNew
          ? 'Already set up.'
          : `Set up Netherite in ${root}. Next: netherite new task "My first task" --set project=PRJ-00001`,
      )
    }
    return exitCodes.ok as ExitCode
  })
