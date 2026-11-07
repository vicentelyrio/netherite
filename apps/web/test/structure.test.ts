// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'

const src = join(import.meta.dirname, '../src')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

const read = (path: string) => readFileSync(path, 'utf8')
const files = walk(src)
const cssFiles = files.filter((f) => f.endsWith('.css'))
const code = files.filter(
  (f) => /\.tsx?$/.test(f) && !f.includes('.test.') && !f.includes('/i18n/'),
)
const components = code.filter((f) => f.endsWith('.tsx'))

const classesIn = (css: string) =>
  new Set(
    [...css.replace(/\{[^{}]*\}/g, '{}').matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(
      (m) => m[1] as string,
    ),
  )

describe('the structure of the app', () => {
  test('no stylesheet is shared between components', () => {
    expect(cssFiles.filter((f) => f.endsWith('/shared.css')).map((f) => relative(src, f))).toEqual(
      [],
    )
  })

  test('a class is styled in one file only', () => {
    const owners = new Map<string, string[]>()
    for (const file of cssFiles) {
      for (const name of classesIn(read(file))) {
        owners.set(name, [...(owners.get(name) ?? []), relative(src, file)])
      }
    }
    expect([...owners].filter(([, where]) => where.length > 1)).toEqual([])
  })

  test('app stylesheets do not reach into the classes of the UI package', () => {
    const reaching = cssFiles
      .filter((f) => /\.nt-[a-z]/.test(read(f).replace(/\{[^{}]*\}/g, '{}')))
      .map((f) => relative(src, f))
    expect(reaching).toEqual([])
  })

  test('a component imports only the stylesheet in its own folder', () => {
    const crossing = code.flatMap((file) =>
      [...read(file).matchAll(/import '([^']+\.css)'/g)]
        .map((m) => m[1] as string)
        .filter((css) => !css.startsWith('./') && !file.endsWith('src/main.tsx'))
        .map((css) => `${relative(src, file)} -> ${css}`),
    )
    expect(crossing).toEqual([])
  })

  test('colours come from the theme, never as hex in code or stylesheets', () => {
    const hex = /#[0-9a-fA-F]{6}\b/
    const found = [...code, ...cssFiles]
      .filter((f) => hex.test(read(f)))
      .map((f) => relative(src, f))
    expect(found).toEqual([])
  })

  test('a file defines one component', () => {
    const many = components
      .map((file) => ({
        file: relative(src, file),
        count: [
          ...read(file).matchAll(
            /^(?:export )?(?:default )?(?:function [A-Z]|const [A-Z]\w* = (?:forwardRef|memo)\b)/gm,
          ),
        ].length,
      }))
      .filter((c) => c.count > 1)
    expect(many).toEqual([])
  })

  test('every folder of components has its entry point', () => {
    const folders = new Set(
      components
        .filter((f) => relative(src, f).split('/')[0] === 'components')
        .map((f) => dirname(f)),
    )
    for (const folder of folders) expect(readdirSync(folder), folder).toContain('index.ts')
  })
})
