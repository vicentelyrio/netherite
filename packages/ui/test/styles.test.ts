// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stylesheet, variables } from '@netherite/tokens'
import { describe, expect, test } from 'vitest'
import { classNames } from '../src/index'

const root = join(import.meta.dirname, '..')
const css = readFileSync(join(root, 'components.css'), 'utf8')
const entry = readFileSync(join(root, 'styles.css'), 'utf8')
const preview = readFileSync(join(root, 'src/preview.tsx'), 'utf8')

const usedClasses = () => {
  const names = new Set<string>()
  const fromTheme = (value: unknown) => {
    if (typeof value === 'string') names.add(value)
    else if (typeof value === 'object' && value !== null)
      for (const v of Object.values(value)) fromTheme(v)
  }
  fromTheme(classNames)
  for (const file of [
    'components/domain.tsx',
    'components/controls.tsx',
    'rail.tsx',
    'preview.tsx',
  ]) {
    const text = readFileSync(join(root, 'src', file), 'utf8')
    for (const m of text.matchAll(/["'`]((?:nt-[a-z0-9-]+)(?: nt-[a-z0-9-]+)*)["'`]/g)) {
      for (const name of (m[1] as string).split(' ')) names.add(name)
    }
    for (const m of text.matchAll(/className=["'`]([^"'`]*nt-[^"'`]*)["'`]/g)) {
      for (const name of (m[1] as string).split(' ')) if (name.startsWith('nt-')) names.add(name)
    }
  }
  return names
}

describe('components.css', () => {
  test('every nt- class the components use has a rule (fonts.css owns nt-icon)', () => {
    const fonts = readFileSync(join(root, 'fonts.css'), 'utf8')
    const missing = [...usedClasses()].filter(
      (name) => !css.includes(`.${name}`) && !fonts.includes(`.${name}`),
    )
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
  test('loads tokens, fonts, the library (in a layer) and ours, in that order', () => {
    const order = [...entry.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1])
    expect(order).toEqual([
      '@netherite/tokens/tokens.css',
      './fonts.css',
      '@mantine/core/styles.layer.css',
      './components.css',
    ])
  })

  test('the token stylesheet it relies on is one dark :root block', () => {
    const tokens = stylesheet()
    expect(tokens).toContain(':root {')
    expect(tokens).toContain('color-scheme: dark;')
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
