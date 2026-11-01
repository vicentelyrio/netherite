import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fixturePath } from './fixtures'

/** One scripted commit. File paths are relative to the repository root. */
export interface Commit {
  readonly message: string
  /** ISO 8601 date, used for author and committer so hashes are reproducible. */
  readonly date: string
  readonly author?: { readonly name: string; readonly email: string }
  /** Files to write, replacing existing content. */
  readonly write?: Readonly<Record<string, string>>
  /** Files to delete. */
  readonly remove?: readonly string[]
}

export interface GitRepoOptions {
  /** Fixture folder name to copy into the first commit. Omit for an empty repository. */
  readonly fixture?: string
  /** Message and date of the first commit, which holds the whole fixture. */
  readonly initial?: { readonly message: string; readonly date: string }
  /** Commits made after the first one, in order. */
  readonly history?: readonly Commit[]
  /** Files written after the last commit and left uncommitted. */
  readonly uncommitted?: Readonly<Record<string, string>>
}

export interface GitRepo {
  readonly root: string
  /** Runs `git` in the repository and returns trimmed standard output. */
  readonly git: (...args: string[]) => string
  /** Deletes the repository. */
  readonly cleanup: () => Promise<void>
}

const defaultAuthor = { name: 'Ada Lovelace', email: 'ada@example.com' }

const isolatedEnv = (
  author: { name: string; email: string },
  date?: string,
): NodeJS.ProcessEnv => ({
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
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

/**
 * Creates a temporary git repository with a scripted, reproducible history.
 * The first commit holds the fixture; `history` adds commits on top; `uncommitted`
 * leaves working-tree changes behind. Call `cleanup` when done.
 */
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
