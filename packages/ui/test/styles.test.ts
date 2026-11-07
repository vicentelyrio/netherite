// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { stylesheet, variables } from '@netherite/tokens'
import { describe, expect, test } from 'vitest'
import { classNames } from '../src/index'

const root = join(import.meta.dirname, '..')
const src = join(root, 'src')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path.split(sep).join('/')]
  })

const read = (path: string) => readFileSync(path, 'utf8')
const files = walk(src)
const cssFiles = files.filter((f) => f.endsWith('.css'))
const css = cssFiles.map(read).join('\n')
const code = files.filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.'))
const entry = read(join(src, 'styles.css'))
const preview = walk(join(src, 'components/UiPreview'))
  .filter((f) => f.endsWith('.tsx'))
  .map(read)
  .join('\n')

const usedClasses = () => {
  const names = new Set<string>()
  const fromTheme = (value: unknown) => {
    if (typeof value === 'string') names.add(value)
    else if (typeof value === 'object' && value !== null)
      for (const v of Object.values(value)) fromTheme(v)
  }
  fromTheme(classNames)
  for (const file of code) {
    const text = read(file)
    for (const m of text.matchAll(/["'`]((?:nt-[a-z0-9-]+)(?: nt-[a-z0-9-]+)*)["'`]/g)) {
      for (const name of (m[1] as string).split(' ')) names.add(name)
    }
    for (const m of text.matchAll(/className=["'`]([^"'`]*nt-[^"'`]*)["'`]/g)) {
      for (const name of (m[1] as string).split(' ')) if (name.startsWith('nt-')) names.add(name)
    }
  }
  return names
}

const classesIn = (text: string) =>
  new Set(
    [...text.replace(/\{[^{}]*\}/g, '{}').matchAll(/\.(nt-[a-z0-9-]+)/g)].map(
      (m) => m[1] as string,
    ),
  )

describe('the component stylesheets', () => {
  test('every nt- class the components use has a rule', () => {
    const missing = [...usedClasses()].filter((name) => !css.includes(`.${name}`))
    expect(missing).toEqual([])
  })

  test('has no colour written out: every colour is a token variable', () => {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(withoutComments).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(withoutComments).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/)
    expect(withoutComments).not.toMatch(/:\s*(white|black|red|blue|green|gray|grey)\b/)
  })

  test('uses only variables the tokens define', () => {
    const defined = new Set(Object.keys(variables()))
    const used = new Set([...css.matchAll(/var\((--nt-[a-z0-9-]+)/g)].map((m) => m[1] as string))
    const local = new Set([
      '--nt-pill-color',
      '--nt-pill-bg',
      '--nt-badge-color',
      '--nt-banner-color',
      '--nt-icon-fill',
      '--nt-icon-weight',
    ])
    const unknown = [...used].filter((v) => !defined.has(v) && !local.has(v))
    expect(unknown).toEqual([])
  })

  test('hover and selected states exist for cards, rail items and tabs', () => {
    expect(css).toMatch(/\.nt-card\[data-interactive\]:hover/)
    expect(css).toMatch(/\.nt-card\[data-selected\]/)
    expect(css).toMatch(/\.nt-card\[data-drop-target\]/)
    expect(css).toMatch(/\.nt-rail-item\[data-active\]/)
    expect(css).toMatch(/\.nt-tab\[data-active\]/)
  })

  test('shows a focus ring for the keyboard, and respects reduced motion', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline/)
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})

describe('styles.css', () => {
  test('loads tokens, fonts, the library (in a layer), the base and the components, in that order', () => {
    const order = [...entry.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1])
    expect(order).toEqual([
      '@netherite/tokens/tokens.css',
      './theme/fonts.css',
      '@mantine/core/styles.layer.css',
      './theme/base.css',
      './components/index.css',
    ])
  })

  test('the token stylesheet it relies on is one dark :root block', () => {
    const tokens = stylesheet()
    expect(tokens).toContain(':root {')
    expect(tokens).toContain('color-scheme: dark;')
  })
})

describe('the structure', () => {
  const components = readdirSync(join(src, 'components')).filter((name) =>
    statSync(join(src, 'components', name)).isDirectory(),
  )

  test('nothing but the entry points sits at the root of src', () => {
    const loose = readdirSync(src).filter((name) => statSync(join(src, name)).isFile())
    expect(loose.sort()).toEqual(['index.ts', 'styles.css'])
    const folders = readdirSync(src).filter((name) => statSync(join(src, name)).isDirectory())
    expect(folders.sort()).toEqual(['components', 'theme'])
  })

  test('every component is a folder with an entry, and only folders live in components', () => {
    const loose = readdirSync(join(src, 'components')).filter((name) => !components.includes(name))
    expect(loose).toEqual(['index.css'])
    for (const name of components) {
      expect(readdirSync(join(src, 'components', name)), name).toContain('index.ts')
    }
  })

  test('a class is styled in one file only, the one of the component it belongs to', () => {
    const owners = new Map<string, string[]>()
    for (const file of cssFiles) {
      for (const name of classesIn(read(file))) {
        owners.set(name, [...(owners.get(name) ?? []), relative(src, file)])
      }
    }
    const shared = [...owners].filter(([, where]) => where.length > 1)
    expect(shared).toEqual([])
  })

  test('every stylesheet of a component is loaded, and none is written in TypeScript', () => {
    const index = read(join(src, 'components/index.css'))
    for (const file of cssFiles.filter(
      (f) => f.includes('/components/') && !f.endsWith('index.css'),
    )) {
      const name = file.split('/').pop() as string
      expect(index, name).toContain(`/${name}"`)
    }
    for (const file of code) expect(read(file), file).not.toMatch(/import ['"].*\.css['"]/)
  })
})

describe('the preview page', () => {
  test('shows every component the task lists', () => {
    for (const name of [
      'Button',
      'ActionIcon',
      'Chip',
      'Avatar',
      'Card',
      'Progress',
      'ProgressRing',
      'SegmentedControl',
      'Tabs',
      'Switch',
      'Tooltip',
      'Menu',
      'Modal',
      'Drawer',
      'TypeBadge',
      'StatusPill',
      'FreshnessLabel',
      'Banner',
      'EmptyState',
      'Rail',
    ]) {
      expect(preview, name).toMatch(new RegExp(`<${name}[\\s>]`))
    }
    expect(preview).toContain('selected=')
    expect(preview).toContain('dropTarget')
    expect(preview).toContain('interactive')
  })
})
