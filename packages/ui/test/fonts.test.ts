// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fontFamily, fontWeight } from '@netherite/tokens'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const root = join(import.meta.dirname, '..')
const fontsCss = readFileSync(join(root, 'fonts.css'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>
  files: string[]
  dependencies: Record<string, string>
}

/** Where a font package is installed. */
const packageDir = (name: string) => dirname(require.resolve(`${name}/package.json`))

const imports = [...fontsCss.matchAll(/@import\s+["']([^"']+)["'];/g)].map((m) => m[1] as string)

/** The CSS file an `@import` names, and its text. */
const load = (specifier: string) => {
  const [scope, name, ...rest] = specifier.split('/')
  const dir = packageDir(`${scope}/${name}`)
  const file = join(dir, ...rest)
  return { file, dir, text: readFileSync(file, 'utf8') }
}

const urls = (css: string) =>
  [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => (m[1] as string).replace(/^['"]|['"]$/g, ''))
const families = (css: string) =>
  new Set([...css.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1] as string))

describe('what fonts.css brings in', () => {
  test('imports the text fonts, italics for text, code, and the icon font', () => {
    expect(imports).toEqual([
      '@fontsource-variable/source-sans-3/wght.css',
      '@fontsource-variable/source-sans-3/wght-italic.css',
      '@fontsource-variable/source-code-pro/wght.css',
      '@fontsource-variable/material-symbols-rounded/fill.css',
    ])
  })

  test('the imports come first, as CSS requires', () => {
    const firstRule = fontsCss.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    expect(firstRule.startsWith('@import')).toBe(true)
    const lastImport = fontsCss.lastIndexOf('@import')
    expect(fontsCss.slice(0, lastImport)).not.toMatch(/\{/)
  })

  test('every imported file is installed, and every font file it points at exists', () => {
    for (const specifier of imports) {
      const { file, dir, text } = load(specifier)
      expect(existsSync(file), specifier).toBe(true)
      const files = urls(text)
      expect(files.length, specifier).toBeGreaterThan(0)
      for (const url of files) {
        expect(url, specifier).toMatch(/\.woff2$/)
        expect(existsSync(join(dir, url)), `${specifier} -> ${url}`).toBe(true)
      }
    }
  })

  test('nothing is fetched from the network, so the app works offline', () => {
    const everything = [fontsCss, ...imports.map((i) => load(i).text)]
    for (const css of everything) {
      expect(css).not.toMatch(/https?:\/\//)
      expect(css).not.toMatch(/url\(\s*['"]?\/\//)
      expect(css).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
    }
  })

  test('the font names match the names in the tokens, so the theme finds them', () => {
    const declared = new Set(imports.flatMap((i) => [...families(load(i).text)]))
    expect([...declared].sort()).toEqual([
      'Material Symbols Rounded Variable',
      'Source Code Pro Variable',
      'Source Sans 3 Variable',
    ])
    expect(fontFamily.sans.startsWith("'Source Sans 3 Variable'")).toBe(true)
    expect(fontFamily.mono.startsWith("'Source Code Pro Variable'")).toBe(true)
    expect(fontFamily.icon.startsWith("'Material Symbols Rounded Variable'")).toBe(true)
  })

  test('the weights the design uses are inside each font’s range', () => {
    const range = (specifier: string) => {
      const m = /font-weight:\s*(\d+)\s+(\d+)/.exec(load(specifier).text)
      return [Number(m?.[1]), Number(m?.[2])] as const
    }
    for (const specifier of imports.slice(0, 3)) {
      const [min, max] = range(specifier)
      expect(min).toBeLessThanOrEqual(fontWeight.regular)
      expect(max).toBeGreaterThanOrEqual(fontWeight.bold)
    }
    const [iconMin, iconMax] = range(imports[3] as string)
    expect(iconMin).toBeLessThanOrEqual(400)
    expect(iconMax).toBeGreaterThanOrEqual(400)
  })

  test('text fonts are split by script, so a page downloads only what it uses', () => {
    for (const specifier of imports.slice(0, 3)) {
      const text = load(specifier).text
      expect(text).toContain('unicode-range')
      expect(urls(text).some((u) => u.includes('-latin-wght-'))).toBe(true)
    }
  })

  test('the icon font is the weight-and-fill file the design needs, not the 5 MB one with every axis', () => {
    const { dir, text } = load(imports[3] as string)
    const files = urls(text)
    expect(files).toHaveLength(1)
    expect(files[0]).toContain('-fill-')
    expect(statSync(join(dir, files[0] as string)).size).toBeLessThan(1_600_000)
  })

  test('each font is licensed for bundling and ships its licence', () => {
    for (const name of [
      '@fontsource-variable/source-sans-3',
      '@fontsource-variable/source-code-pro',
      '@fontsource-variable/material-symbols-rounded',
    ]) {
      const dir = packageDir(name)
      const info = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
        license: string
      }
      expect(['OFL-1.1', 'Apache-2.0'], name).toContain(info.license)
      expect(existsSync(join(dir, 'LICENSE')), name).toBe(true)
    }
  })
})

describe('the icon class', () => {
  const rule = /\.nt-icon\s*\{([^}]*)\}/.exec(fontsCss)?.[1] ?? ''

  test('turns a name into an icon with ligatures, at a fixed size, and does not wrap', () => {
    expect(rule).toMatch(/font-feature-settings: ["']liga["']/)
    // The design pairs FILL 1 with warnings and weights 300 to 500 with sizes.
    expect(rule).toContain('FILL')
    expect(rule).toContain('wght')
    expect(rule).toContain('line-height: 1')
    expect(rule).toContain('white-space: nowrap')
    expect(rule).toContain('text-transform: none')
    expect(rule).toContain('user-select: none')
  })

  test('uses the icon font from the tokens, with a fallback if they are not loaded', () => {
    expect(rule).toMatch(
      /font-family: var\(--nt-font-icon, ["']?Material Symbols Rounded Variable["']?\)/,
    )
    expect(rule).toContain('var(--nt-icon-switcher-size, 20px)')
  })
})

describe('the package', () => {
  test('exports fonts.css and ships it', () => {
    expect(pkg.exports['./fonts.css']).toBe('./fonts.css')
    expect(pkg.files).toContain('fonts.css')
  })

  test('depends on the three font packages at exact versions', () => {
    for (const name of ['source-sans-3', 'source-code-pro', 'material-symbols-rounded']) {
      expect(pkg.dependencies[`@fontsource-variable/${name}`]).toBe('catalog:')
    }
    const catalog = readFileSync(join(root, '../../pnpm-workspace.yaml'), 'utf8')
    expect(catalog).toMatch(/"@fontsource-variable\/source-sans-3": \d+\.\d+\.\d+\n/)
  })
})
