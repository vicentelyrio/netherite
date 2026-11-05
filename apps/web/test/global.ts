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
async function start(project: TestProject) {
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
  // Vitest cannot print the stack of an error thrown from here on some runners (a source map
  // problem in its own error printer), and then the cause is lost. So the cause is written first.
  const fail = (what: string, error: unknown): never => {
    const detail = error instanceof Error ? error.message : String(error)
    const stderr = (error as { stderr?: Buffer | string }).stderr?.toString() ?? ''
    process.stderr.write(`\n[web test setup] ${what} failed: ${detail}\n${stderr}\n`)
    throw error
  }
  const git = (...args: string[]) => {
    try {
      execFileSync('git', args, { cwd: dir, env, stdio: ['ignore', 'ignore', 'pipe'] })
    } catch (error) {
      fail(`git ${args.join(' ')}`, error)
    }
  }
  git('init', '-q', '-b', 'main')
  git('config', 'user.name', 'Ada Lovelace')
  git('config', 'user.email', 'ada@example.com')
  git('add', '-A')
  git('commit', '-q', '-m', 'initial')

  const child = spawn('node', [bin, 'serve', '--no-open', '--port', '0', '--no-watch', '-C', dir], {
    env,
  })
  let out = ''
  let err = ''
  let ready = false
  const started = await new Promise<{ url: string; token: string }>((resolve, reject) => {
    const timer = setTimeout(() => {
      process.stderr.write(`\n[web test setup] serve did not start in 15 s:\n${out}\n${err}\n`)
      reject(new Error(`serve did not start: ${out}`))
    }, 15_000)
    child.stderr.on('data', (chunk) => {
      err += chunk
    })
    child.stdout.on('data', (chunk) => {
      out += chunk
      const url = /running at (http:\/\/\S+)/.exec(out)?.[1]
      const token = /Bearer ([0-9a-f]{64})/.exec(out)?.[1]
      if (url && token) {
        clearTimeout(timer)
        ready = true
        resolve({ url, token })
      }
    })
    child.on('exit', (code) => {
      // After startup this is the server being stopped at the end, which is not a failure.
      if (ready) return
      process.stderr.write(`\n[web test setup] serve exited with ${code}:\n${out}\n${err}\n`)
      reject(new Error(`serve exited ${code}: ${out}`))
    })
  })
  project.provide('server', { ...started, dir })

  return () => {
    child.kill('SIGINT')
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * Anything thrown from here stops the whole run before its first test, and on some runs vitest then
 * cannot print the error: its own source map code throws instead (`code.charCodeAt is not a
 * function`), and what is left says only "No test files found". So the cause is written first.
 */
export default async function setup(project: TestProject) {
  try {
    return await start(project)
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    process.stderr.write(
      `\n[web test setup] failed${code ? ` (${code})` : ''}: ${error instanceof Error ? error.message : String(error)}\n`,
    )
    throw error
  }
}
