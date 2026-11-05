import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fixturePath } from './fixtures'
import { emptyGitConfig } from './git-config'

export interface Commit {
  readonly message: string
  readonly date: string
  readonly author?: { readonly name: string; readonly email: string }
  readonly write?: Readonly<Record<string, string>>
  readonly remove?: readonly string[]
}

export interface GitRepoOptions {
  readonly fixture?: string
  readonly initial?: { readonly message: string; readonly date: string }
  readonly history?: readonly Commit[]
  readonly uncommitted?: Readonly<Record<string, string>>
}

export interface GitRepo {
  readonly root: string
  readonly git: (...args: string[]) => string
  readonly cleanup: () => Promise<void>
}

const defaultAuthor = { name: 'Ada Lovelace', email: 'ada@example.com' }

const isolatedEnv = (
  author: { name: string; email: string },
  date?: string,
): NodeJS.ProcessEnv => ({
  ...process.env,
  GIT_CONFIG_GLOBAL: emptyGitConfig,
  GIT_CONFIG_SYSTEM: emptyGitConfig,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: author.name,
  GIT_AUTHOR_EMAIL: author.email,
  GIT_COMMITTER_NAME: author.name,
  GIT_COMMITTER_EMAIL: author.email,
  ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}),
})

const writeFiles = async (root: string, files: Readonly<Record<string, string>>) => {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content)
  }
}

export const createGitRepo = async (options: GitRepoOptions = {}): Promise<GitRepo> => {
  const root = await mkdtemp(join(tmpdir(), 'netherite-git-'))

  const run = (author: { name: string; email: string }, date: string | undefined, args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      env: isolatedEnv(author, date),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

  const git = (...args: string[]) => run(defaultAuthor, undefined, args)

  try {
    git('init', '--quiet', '--initial-branch=main')
    git('config', 'commit.gpgsign', 'false')

    if (options.fixture) {
      await cp(fixturePath(options.fixture), root, { recursive: true })
    }
    const initial = options.initial ?? {
      message: 'chore: initial commit',
      date: '2026-01-01T09:00:00Z',
    }
    git('add', '--all')
    run(defaultAuthor, initial.date, ['commit', '--quiet', '--allow-empty', '-m', initial.message])

    for (const commit of options.history ?? []) {
      await writeFiles(root, commit.write ?? {})
      for (const path of commit.remove ?? []) await rm(join(root, path), { force: true })
      git('add', '--all')
      run(commit.author ?? defaultAuthor, commit.date, [
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        commit.message,
      ])
    }

    await writeFiles(root, options.uncommitted ?? {})
  } catch (error) {
    await rm(root, { recursive: true, force: true })
    throw error
  }

  return { root, git, cleanup: () => rm(root, { recursive: true, force: true }) }
}
