// Installs the packed `netherite` into an empty folder, as a user would with npx, and runs it
// against a fresh git repository: the version, `init`, `lint`, and `serve` answering with the app.
// Needs the network for the package's dependencies. Run `pnpm build` first.
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-smoke-')))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32', ...options })

const fail = (message) => {
  console.error(`smoke: ${message}`)
  rmSync(work, { recursive: true, force: true })
  process.exit(1)
}

try {
  // 1. Pack and install it somewhere that has none of our workspace.
  const packed = run(pnpm, ['pack', '--pack-destination', work], { cwd: root })
    .trim()
    .split(/\r?\n/)
    .at(-1)
    .split(/[\\/]/)
    .at(-1)
  const install = join(work, 'install')
  mkdirSync(install)
  writeFileSync(join(install, 'package.json'), '{"private":true}\n')
  run(npm, ['install', '--no-audit', '--no-fund', join(work, packed)], {
    cwd: install,
    stdio: 'inherit',
  })
  const bin = join(install, 'node_modules', '@vicentelyrio', 'netherite', 'dist', 'bin.mjs')
  const netherite = (...args) => run('node', [bin, ...args], { cwd: repo, env })

  // 2. A clean repository.
  const repo = join(work, 'repo')
  mkdirSync(repo)
  const env = { ...process.env, GIT_CONFIG_GLOBAL: devNull, GIT_CONFIG_SYSTEM: devNull }
  const git = (...args) => run('git', args, { cwd: repo, env })
  git('init', '-q', '-b', 'main')
  git('config', 'user.name', 'Smoke')
  git('config', 'user.email', 'smoke@example.com')

  const version = netherite('--version').trim()
  console.log(`netherite ${version}`)
  netherite('init')
  netherite('lint')
  console.log('init and lint ran')

  // 3. The server answers, with the app.
  const child = spawn('node', [bin, 'serve', '--no-open', '--port', '0'], { cwd: repo, env })
  let out = ''
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`serve did not start: ${out}`)), 30_000)
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
  const page = await (await fetch(url)).text()
  if (!page.includes('id="root"') || !page.includes('netherite-token'))
    fail(`the app was not served: ${page.slice(0, 200)}`)
  const health = await (await fetch(`${url}/api/health`)).json()
  if (health.name !== 'netherite') fail('the API did not answer')
  child.kill('SIGINT')
  console.log(`serve answered at ${url} with the app and the API`)
} catch (error) {
  fail(String(error?.stack ?? error))
}
rmSync(work, { recursive: true, force: true })
console.log('smoke: ok')
