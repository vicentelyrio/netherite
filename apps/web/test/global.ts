import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanWorkspaceFiles, emptyGitConfig } from '@netherite/testing'
import type { TestProject } from 'vitest/node'

const bin = join(dirname(fileURLToPath(import.meta.url)), '../../../packages/cli/dist/bin.mjs')

declare module 'vitest' {
  export interface ProvidedContext {
    server: { url: string; token: string; dir: string }
  }
}

/**
 * Starts a real `netherite serve` over a small workspace, once for all tests, so the app is tried
 * against the real API and event stream. The workspace is a clean sample (see @netherite/testing).
 */
export default async function setup(project: TestProject) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-web-')))
  for (const [path, text] of Object.entries(cleanWorkspaceFiles(dir))) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: emptyGitConfig,
    GIT_CONFIG_SYSTEM: emptyGitConfig,
  }
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, env, stdio: 'ignore' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.name', 'Ada Lovelace')
  git('config', 'user.email', 'ada@example.com')
  git('add', '-A')
  git('commit', '-q', '-m', 'initial')

  const child = spawn('node', [bin, 'serve', '--no-open', '--port', '0', '--no-watch', '-C', dir], {
    env,
  })
  let out = ''
  const started = await new Promise<{ url: string; token: string }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`serve did not start: ${out}`)), 15_000)
    child.stdout.on('data', (chunk) => {
      out += chunk
      const url = /running at (http:\/\/\S+)/.exec(out)?.[1]
      const token = /Bearer ([0-9a-f]{64})/.exec(out)?.[1]
      if (url && token) {
        clearTimeout(timer)
        resolve({ url, token })
      }
    })
    child.on('exit', (code) => reject(new Error(`serve exited ${code}: ${out}`)))
  })
  project.provide('server', { ...started, dir })

  return () => {
    child.kill('SIGINT')
    rmSync(dir, { recursive: true, force: true })
  }
}
