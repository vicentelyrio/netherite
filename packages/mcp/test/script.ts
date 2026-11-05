import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { type Diagnostic, lintWorkspace, openRepo } from '@netherite/core'
import { expect } from 'vitest'
import { provide, type Session } from './helpers'

export type Tree = Record<string, string>

export const snapshot = (dir: string, sub = ''): Tree => {
  const out: Tree = {}
  for (const name of readdirSync(join(dir, sub))) {
    const rel = sub === '' ? name : `${sub}/${name}`
    if (rel === '.git' || rel === '.netherite/local') continue
    if (statSync(join(dir, rel)).isDirectory()) Object.assign(out, snapshot(dir, rel))
    else out[rel] = readFileSync(join(dir, rel), 'utf8')
  }
  return out
}

export const lineDiff = (a: string, b: string): string[] => {
  const x = a.split('\n')
  const y = b.split('\n')
  const w = y.length + 1
  const table = new Int32Array((x.length + 1) * w)
  const at = (i: number, j: number) => table[i * w + j] ?? 0
  for (let i = x.length - 1; i >= 0; i--) {
    for (let j = y.length - 1; j >= 0; j--) {
      table[i * w + j] = x[i] === y[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
    }
  }
  const out: string[] = []
  let i = 0
  let j = 0
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      i++
      j++
    } else if (i < x.length && (j === y.length || at(i + 1, j) >= at(i, j + 1))) {
      out.push(`-${x[i++]}`)
    } else {
      out.push(`+${y[j++]}`)
    }
  }
  return out
}

export type TreeChange = { created: string } | 'deleted' | string[]
export type TreeChanges = Record<string, TreeChange>

const stamp = (text: string) =>
  text.replace(/^created: \d{4}-\d\d-\d\dT[\d:.]+Z$/m, 'created: <now>')

export const diffTrees = (before: Tree, after: Tree): TreeChanges => {
  const out: TreeChanges = {}
  for (const path of Object.keys({ ...before, ...after }).sort()) {
    const was = before[path]
    const now = after[path]
    if (was === now) continue
    if (was === undefined) out[path] = { created: stamp(now as string) }
    else if (now === undefined) out[path] = 'deleted'
    else out[path] = lineDiff(was, now)
  }
  return out
}

export const today = () => new Date().toISOString().slice(0, 10)

const fill = (value: TreeChanges): TreeChanges =>
  JSON.parse(JSON.stringify(value).replaceAll('{{today}}', today()))

const key = (d: Diagnostic) => `${d.rule}|${d.path}|${d.message}`

export const lintDisk = async (dir: string) => {
  const repo = await provide(openRepo(dir))
  return provide(lintWorkspace(repo.workspace))
}

export interface StepOptions {
  readonly args?: Record<string, unknown>
  readonly files: TreeChanges
  readonly result?: unknown
  readonly introduces?: ReadonlyArray<string>
  readonly refused?: boolean
}

export const script = async (s: Session, allowed: ReadonlyArray<string> = []) => {
  const baseline = new Set((await lintDisk(s.dir)).filter((d) => d.severity !== 'info').map(key))
  for (const k of allowed) baseline.add(k)
  let tree = snapshot(s.dir)

  return {
    baseline,
    step: async (tool: string, options: StepOptions) => {
      const { isError, data } = await s.call(tool, options.args ?? {})
      expect(isError, JSON.stringify(data)).toBe(options.refused === true)
      if (options.result !== undefined) expect(data).toMatchObject(options.result as object)

      const next = snapshot(s.dir)
      expect(diffTrees(tree, next), `${tool} file changes`).toEqual(fill(options.files))
      tree = next

      const disk = await lintDisk(s.dir)
      const added = disk.filter((d) => d.severity !== 'info' && !baseline.has(key(d)))
      expect(added.map((d) => d.rule).sort(), `${tool} introduced problems`).toEqual(
        [...(options.introduces ?? [])].sort(),
      )
      for (const d of added) baseline.add(key(d))

      const served = (await s.call('lint')).data
      const count = (list: ReadonlyArray<Diagnostic>, severity: string) =>
        list.filter((d) => d.severity === severity).length
      expect(served.summary.error, 'server lint errors').toBe(count(disk, 'error'))
      expect(served.summary.warning, 'server lint warnings').toBe(count(disk, 'warning'))
      return data
    },
  }
}
