import { configFile } from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { type Env, type ExitCode, exitCodes, json } from '../output'

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
}

export interface InitReport {
  readonly root: string
  readonly created: ReadonlyArray<string>
  readonly existed: ReadonlyArray<string>
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

    if (options.json) {
      json(env.out, { root, created, existed } satisfies InitReport)
    } else {
      for (const item of created) env.out.line(`created  ${item}`)
      for (const item of existed) env.out.line(`exists   ${item}`)
      env.out.line(
        created.length === 0
          ? 'Already set up.'
          : `Set up Netherite in ${root}. Next: netherite new task "My first task" --set project=PRJ-00001`,
      )
    }
    return exitCodes.ok as ExitCode
  })
