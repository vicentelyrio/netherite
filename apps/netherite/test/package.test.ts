import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>
  bin: Record<string, string>
  files: string[]
}

const importsOf = (code: string) => [
  ...[...code.matchAll(/^(?:import|export)\b[^\n]*?\bfrom\s*["']([^"'.][^"']*)["']/gm)].map(
    (m) => m[1] as string,
  ),
  ...[...code.matchAll(/\bimport\(\s*["']([^"'.][^"']*)["']\s*\)/g)].map((m) => m[1] as string),
]

const bundles = () => readdirSync(dist).filter((f) => f.endsWith('.mjs'))
const text = (file: string) => readFileSync(join(dist, file), 'utf8')

const packageOf = (specifier: string) =>
  specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : (specifier.split('/')[0] as string)

describe('the published package', () => {
  test('has the program, with a shebang, and the worker module the parser threads import', () => {
    expect(pkg.bin.netherite).toBe('./dist/bin.mjs')
    expect(text('bin.mjs').startsWith('#!/usr/bin/env node')).toBe(true)
    expect(existsSync(join(dist, 'markdown.mjs'))).toBe(true)
    expect(text('markdown.mjs')).toContain('outlineMarkdown')
  })

  test('carries the built app, which `netherite serve` finds next to the program', () => {
    expect(existsSync(join(dist, 'app/index.html'))).toBe(true)
    expect(readdirSync(join(dist, 'app/assets')).some((f) => f.endsWith('.js'))).toBe(true)
    expect(pkg.files).toContain('dist')
  })

  test('imports only what it declares: the workspace packages are bundled, the rest are dependencies', () => {
    const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]))
    const imported = new Set<string>()
    for (const file of bundles()) {
      for (const specifier of importsOf(text(file))) {
        if (!builtins.has(specifier) && !specifier.startsWith('node:'))
          imported.add(packageOf(specifier))
      }
    }
    expect([...imported].filter((name) => name.startsWith('@netherite/'))).toEqual([])
    const missing = [...imported].filter((name) => pkg.dependencies[name] === undefined)
    expect(missing).toEqual([])
  })

  test('declares no dependency it does not need', () => {
    const imported = new Set<string>()
    for (const file of bundles()) {
      for (const specifier of importsOf(text(file))) imported.add(packageOf(specifier))
    }
    const unused = Object.keys(pkg.dependencies).filter((name) => !imported.has(name))
    expect(unused).toEqual([])
  })
})
