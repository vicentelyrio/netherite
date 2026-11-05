import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanWorkspaceFiles, emptyGitConfig } from '@netherite/testing'
import { test as base } from '@playwright/test'

const here = dirname(fileURLToPath(import.meta.url))
const bin = join(here, '../../../packages/cli/dist/bin.mjs')
const app = join(here, '../dist')

/** A context item the clean sample workspace does not have, so the include switch can be tried. */
const context = (root: string) => ({
  [`${root}/netherite/context/CTX-00001-rules.md`]:
    '---\nid: CTX-00001\naliases: [CTX-00001]\ntype: context\ntitle: House rules\ninclude_in_context: false\n---\n\n# House rules\n\nKeep it short.\n',
})

export interface Workspace {
  readonly url: string
  readonly dir: string
  /** A file's text, from the workspace folder. */
  readonly read: (path: string) => string
  /** `git diff` of the working tree: what the app changed since the fixture was committed. */
  readonly diff: (path?: string) => string
  /** Runs `git` in the workspace; `date` sets both the author and committer date of a commit. */
  readonly git: (args: string[], date?: string) => string
}

/**
 * Every test gets its own workspace and server: the clean sample workspace in a git repository,
 * committed, with `netherite serve` over it serving the built app. Tests then drive the browser
 * and look at what changed on disk.
 */
export const test = base.extend<{ workspace: Workspace }>({
  workspace: async ({ page: _page }, use) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-e2e-')))
    for (const [path, text] of Object.entries({ ...cleanWorkspaceFiles(dir), ...context(dir) })) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, text)
    }
    const env = {
      ...process.env,
      GIT_CONFIG_GLOBAL: emptyGitConfig,
      GIT_CONFIG_SYSTEM: emptyGitConfig,
    }
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' })
    git('init', '-q', '-b', 'main')
    git('config', 'user.name', 'Ada Lovelace')
    git('config', 'user.email', 'ada@example.com')
    git('add', '-A')
    git('commit', '-q', '-m', 'initial')

    const child = spawn(
      'node',
      [bin, 'serve', '--no-open', '--port', '0', '--no-watch', '--app', app, '-C', dir],
      { env },
    )
    let out = ''
    const url = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`serve did not start: ${out}`)), 20_000)
      child.stdout.on('data', (chunk) => {
        out += chunk
        const found = /running at (http:\/\/\S+)/.exec(out)?.[1]
        if (found) {
          clearTimeout(timer)
          resolve(found)
        }
      })
      child.on('exit', (code) => reject(new Error(`serve exited ${code}: ${out}`)))
    })

    await use({
      url,
      dir,
      read: (path) => readFileSync(join(dir, path), 'utf8'),
      diff: (path) => git('diff', '--no-color', '-U0', ...(path ? ['--', path] : [])),
      git: (args, date) =>
        execFileSync('git', args, {
          cwd: dir,
          env: {
            ...env,
            ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}),
          },
          encoding: 'utf8',
        }),
    })

    child.kill('SIGINT')
    rmSync(dir, { recursive: true, force: true })
  },
})

export { expect } from '@playwright/test'
