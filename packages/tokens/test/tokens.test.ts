import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  adrStatuses,
  color,
  contrast,
  edgeColor,
  edgeKinds,
  edgeStyle,
  freshnessStates,
  glyphPath,
  glyphShape,
  hexToRgb,
  itemTypeNames,
  layout,
  libraryVariables,
  mantineTheme,
  mix,
  nodeRadius,
  prefix,
  type Scheme,
  scaleOf,
  schemeVariables,
  stateCategories,
  staticVariables,
  stylesheet,
  textStyle,
} from '../src/index'

const schemes: Scheme[] = ['dark', 'light']
const hex = /^#[0-9a-f]{6}$/i

const leaves = (value: unknown, path: string[] = []): Array<[string, unknown]> =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([k, v]) => leaves(v, [...path, k]))
    : [[path.join('.'), value]]

describe('the contrast helper', () => {
  test('matches the known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#777777', '#777777')).toBe(1)
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1)
    expect(contrast('#ffffff', '#000000')).toBe(contrast('#000000', '#ffffff'))
  })

  test('refuses anything but #rrggbb', () => {
    expect(() => hexToRgb('red')).toThrow()
    expect(() => hexToRgb('#fff')).toThrow()
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0])
  })
})

describe.each(schemes)('colours (%s)', (scheme) => {
  const c = color[scheme]
  const surfaces = Object.entries({
    canvas: c.bg.canvas,
    surface: c.bg.surface,
    raised: c.bg.raised,
    overlay: c.bg.overlay,
  })

  test('every colour is a #rrggbb', () => {
    for (const [path, value] of leaves(c)) expect(value, path).toMatch(hex)
  })

  test.each(surfaces)('text is readable on %s (4.5:1)', (_name, bg) => {
    for (const key of ['primary', 'secondary', 'muted'] as const) {
      expect(contrast(c.text[key], bg), `text.${key}`).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(c.accent.fg, bg), 'accent.fg').toBeGreaterThanOrEqual(4.5)
  })

  test.each(surfaces)('code and links are readable on %s (4.5:1)', (_name, bg) => {
    for (const [name, value] of Object.entries(c.syntax)) {
      expect(contrast(value, bg), `syntax.${name}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  test.each(surfaces)(
    'types, states, statuses and freshness stand out on %s (3:1)',
    (_name, bg) => {
      for (const group of ['type', 'state', 'adr', 'freshness', 'status', 'diff'] as const) {
        for (const [name, value] of Object.entries(c[group])) {
          expect(contrast(value, bg), `${group}.${name}`).toBeGreaterThanOrEqual(3)
        }
      }
      expect(contrast(c.focus, bg), 'focus ring').toBeGreaterThanOrEqual(3)
    },
  )

  test('text on a solid accent is readable, including when hovered', () => {
    expect(contrast(c.text.onAccent, c.accent.solid)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(c.text.onAccent, c.accent.solidHover)).toBeGreaterThanOrEqual(4.5)
  })

  test('borders can be seen against the surfaces they separate', () => {
    expect(contrast(c.border.strong, c.bg.surface)).toBeGreaterThanOrEqual(2)
    expect(contrast(c.border.default, c.bg.surface)).toBeGreaterThan(
      contrast(c.border.subtle, c.bg.surface),
    )
  })

  test('the layers of the page are told apart', () => {
    const order = [c.bg.canvas, c.bg.surface, c.bg.raised]
    for (let i = 1; i < order.length; i++) {
      expect(contrast(order[i] as string, order[i - 1] as string)).toBeGreaterThan(1.05)
    }
  })

  test('the seven item types have seven different colours', () => {
    expect(new Set(Object.values(c.type)).size).toBe(itemTypeNames.length)
  })
})

describe('colours across schemes', () => {
  test('dark and light define exactly the same roles', () => {
    expect(leaves(color.dark).map(([k]) => k)).toEqual(leaves(color.light).map(([k]) => k))
  })

  test('every type, state category, ADR status and freshness state has a colour', () => {
    for (const scheme of schemes) {
      expect(Object.keys(color[scheme].type)).toEqual([...itemTypeNames])
      expect(Object.keys(color[scheme].state)).toEqual([...stateCategories])
      expect(Object.keys(color[scheme].adr)).toEqual([...adrStatuses])
      expect(Object.keys(color[scheme].freshness)).toEqual([...freshnessStates])
    }
  })

  test('the accent scale has ten steps, light to dark', () => {
    for (const scheme of schemes) {
      const scale = color[scheme].accent.scale
      expect(scale).toHaveLength(10)
      const brightness = scale.map((s) => hexToRgb(s).reduce((a, b) => a + b, 0))
      expect([...brightness].sort((a, b) => b - a)).toEqual(brightness)
    }
  })
})

describe('shapes', () => {
  test('every type has its own shape, so colour is never the only difference', () => {
    expect(Object.keys(glyphShape)).toEqual([...itemTypeNames])
    expect(new Set(Object.values(glyphShape)).size).toBe(itemTypeNames.length)
  })

  test('paths are closed and stay inside the box', () => {
    for (const shape of new Set(Object.values(glyphShape))) {
      for (const size of [16, 24]) {
        const d = glyphPath(shape, size)
        expect(d.startsWith('M '), shape).toBe(true)
        expect(d.endsWith(' Z'), shape).toBe(true)
        const numbers = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
        // Arc flags are 0 or 1; every other number is a coordinate or radius.
        for (const n of numbers) {
          expect(n, `${shape} ${size}`).toBeGreaterThanOrEqual(0)
          expect(n, `${shape} ${size}`).toBeLessThanOrEqual(size)
        }
      }
    }
  })

  test('polygons have the right number of corners and point up', () => {
    const corners = (d: string) => d.split(' L ').length
    expect(corners(glyphPath('triangle'))).toBe(3)
    expect(corners(glyphPath('diamond'))).toBe(4)
    expect(corners(glyphPath('square'))).toBe(4)
    expect(corners(glyphPath('pentagon'))).toBe(5)
    expect(corners(glyphPath('hexagon'))).toBe(6)
    expect(corners(glyphPath('octagon'))).toBe(8)
    // The first corner of a triangle is straight up from the centre.
    expect(glyphPath('triangle', 24).startsWith('M 12 ')).toBe(true)
  })

  test('a square is axis-aligned and a diamond is not', () => {
    const xs = (d: string) => (d.match(/(?<=[ML] )-?\d+(\.\d+)?/g) ?? []).map(Number)
    expect(new Set(xs(glyphPath('square'))).size).toBe(2)
    expect(new Set(xs(glyphPath('diamond'))).size).toBe(3)
  })
})

describe('the graph', () => {
  test('goals draw biggest and tasks smallest', () => {
    expect(Object.keys(nodeRadius)).toEqual(expect.arrayContaining([...itemTypeNames]))
    expect(Math.max(...Object.values(nodeRadius))).toBe(nodeRadius.goal)
    expect(Math.min(...Object.values(nodeRadius))).toBe(nodeRadius.task)
  })

  test('every kind of edge has a style, and the ones that point have an arrow', () => {
    expect(Object.keys(edgeStyle)).toEqual([...edgeKinds])
    for (const kind of ['supersedes', 'depends_on', 'implements', 'explains'] as const) {
      expect(edgeStyle[kind].arrow, kind).toBe(true)
    }
    expect(edgeStyle.belongs_to.arrow).toBe(false)
  })

  test('text references are fainter than typed relations, and git hints are dashed', () => {
    expect(edgeStyle.reference.opacity).toBeLessThan(edgeStyle.belongs_to.opacity)
    expect(edgeStyle.co_changes.dash.length).toBeGreaterThan(0)
    expect(edgeStyle.supersedes.width).toBeGreaterThan(edgeStyle.reference.width)
  })

  test('edges can be seen on the page in both schemes', () => {
    for (const scheme of schemes) {
      for (const kind of edgeKinds) {
        // Faint lines are faint on purpose; the colour itself must not vanish into the surface.
        expect(
          contrast(edgeColor(scheme, kind), color[scheme].bg.canvas),
          `${scheme} ${kind}`,
        ).toBeGreaterThanOrEqual(2)
      }
    }
  })
})

describe('type', () => {
  test('body text is 14px and code is monospace', () => {
    expect(textStyle.body.size).toBe(14)
    expect(textStyle.code.family).toBe('mono')
    expect(textStyle.overline).toMatchObject({ uppercase: true })
  })

  test('line heights leave room: at least 1.1 times the size, and on a 2px grid', () => {
    for (const [name, style] of Object.entries(textStyle)) {
      expect(style.lineHeight, name).toBeGreaterThanOrEqual(style.size * 1.1)
      expect(style.lineHeight % 2, name).toBe(0)
    }
  })

  test('a row is tall enough for body text', () => {
    expect(layout.rowHeight).toBeGreaterThanOrEqual(textStyle.body.lineHeight + 8)
  })
})

describe('CSS variables', () => {
  const dark = schemeVariables('dark')
  const light = schemeVariables('light')
  const shared = staticVariables()

  test('dark and light define the same variables', () => {
    expect(Object.keys(dark)).toEqual(Object.keys(light))
  })

  test('shared variables do not overlap with either scheme', () => {
    for (const name of Object.keys(shared)) expect(name in dark, name).toBe(false)
  })

  test('every name starts with the prefix and is lowercase kebab-case', () => {
    for (const name of [...Object.keys(dark), ...Object.keys(shared)]) {
      expect(name.startsWith(prefix), name).toBe(true)
      expect(name, name).toMatch(/^--[a-z0-9-]+$/)
    }
  })

  test('no value is empty or a leftover of a bug', () => {
    for (const [name, value] of [
      ...Object.entries(dark),
      ...Object.entries(light),
      ...Object.entries(shared),
    ]) {
      expect(value, name).not.toMatch(/undefined|NaN|\[object|null/)
      expect(value.trim(), name).not.toBe('')
    }
  })

  test('has the variables the app and components rely on', () => {
    expect(dark['--nt-color-bg-canvas']).toBe(color.dark.bg.canvas)
    expect(light['--nt-color-bg-canvas']).toBe(color.light.bg.canvas)
    expect(dark['--nt-color-type-adr']).toBe(color.dark.type.adr)
    expect(dark['--nt-color-freshness-stale']).toBe(color.dark.freshness.stale)
    expect(dark['--nt-color-syntax-wikilink']).toBe(color.dark.syntax.wikilink)
    expect(dark['--nt-color-accent-scale-4']).toBe(color.dark.accent.scale[4])
    expect(dark['--nt-edge-supersedes-width']).toBe('2px')
    expect(dark['--nt-edge-belongs-to-dash']).toBe('none')
    expect(dark['--nt-edge-related-dash']).toBe('2 2')
    expect(shared['--nt-text-body-size']).toBe('14px')
    expect(shared['--nt-text-overline-transform']).toBe('uppercase')
    expect(shared['--nt-space-1']).toBe('4px')
    expect(shared['--nt-space-0-5']).toBe('2px')
    expect(shared['--nt-space-0']).toBe('0')
    expect(shared['--nt-radius-md']).toBe('6px')
    expect(shared['--nt-layout-rail-width']).toBe('56px')
    expect(shared['--nt-duration-base']).toBe('160ms')
    expect(shared['--nt-node-radius-goal']).toBe('11px')
  })

  test('points the library’s variables at ours', () => {
    const lib = libraryVariables()
    expect(lib['--mantine-color-body']).toBe('var(--nt-color-bg-canvas)')
    for (const value of Object.values(lib)) expect(value).toMatch(/^var\(--nt-[a-z0-9-]+\)$/)
    const defined = new Set([...Object.keys(dark), ...Object.keys(shared)])
    for (const value of Object.values(lib)) {
      expect(defined.has(value.slice(4, -1)), value).toBe(true)
    }
  })

  test('the stylesheet has shared variables, dark as the default, and light when asked', () => {
    const css = stylesheet()
    expect(css).toContain(':root {')
    expect(css).toContain(':root, :root[data-mantine-color-scheme="dark"] {')
    expect(css).toContain(':root[data-mantine-color-scheme="light"] {')
    expect(css).toContain('color-scheme: dark;')
    expect(css).toContain('color-scheme: light;')
    // Each variable is declared once per block.
    for (const block of css.split('\n}\n')) {
      const names = [...block.matchAll(/^\s+(--[a-z0-9-]+):/gm)].map((m) => m[1])
      expect(new Set(names).size).toBe(names.length)
    }
    expect(css.indexOf('data-mantine-color-scheme="light"')).toBeGreaterThan(css.indexOf('="dark"'))
  })

  test.skipIf(!existsSync(new URL('../dist/tokens.css', import.meta.url)))(
    'the built tokens.css is the same stylesheet',
    () => {
      expect(readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8')).toBe(
        stylesheet(),
      )
    },
  )
})

describe('the library theme', () => {
  test('is plain data: this package does not depend on the library', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      dependencies?: Record<string, string>
    }
    expect(Object.keys(pkg.dependencies ?? {}).filter((d) => d.startsWith('@mantine'))).toEqual([])
    expect(JSON.parse(JSON.stringify(mantineTheme))).toEqual(
      JSON.parse(JSON.stringify(mantineTheme)),
    )
  })

  test('every colour is a ten-step scale, and the primary colour exists', () => {
    for (const [name, scale] of Object.entries(mantineTheme.colors)) {
      expect(scale, name).toHaveLength(10)
      for (const step of scale) expect(step).toMatch(hex)
    }
    expect(mantineTheme.colors[mantineTheme.primaryColor]).toBeDefined()
  })

  test('with the shades it picks, each scale gives exactly our dark and light colours', () => {
    const { light, dark } = mantineTheme.primaryShade
    for (const type of itemTypeNames) {
      expect(mantineTheme.colors[type]?.[dark], `${type} dark`).toBe(color.dark.type[type])
      expect(mantineTheme.colors[type]?.[light], `${type} light`).toBe(color.light.type[type])
    }
    for (const status of ['success', 'warning', 'danger', 'info'] as const) {
      expect(mantineTheme.colors[status]?.[dark]).toBe(color.dark.status[status])
      expect(mantineTheme.colors[status]?.[light]).toBe(color.light.status[status])
    }
    expect(mantineTheme.colors.copper?.[dark]).toBe(color.dark.accent.solid)
    expect(mantineTheme.colors.copper?.[light]).toBe(color.light.accent.solid)
  })

  test('scales run from light to dark', () => {
    for (const [name, scale] of Object.entries(mantineTheme.colors)) {
      const brightness = scale.map((s) => hexToRgb(s).reduce((a, b) => a + b, 0))
      expect(brightness[0], name).toBeGreaterThan(brightness[9] as number)
    }
  })

  test('sizes match the scales', () => {
    expect(mantineTheme.fontSizes.md).toBe('14px')
    expect(mantineTheme.spacing.sm).toBe('8px')
    expect(mantineTheme.radius.md).toBe('6px')
    expect(mantineTheme.defaultRadius).toBe('md')
    expect(mantineTheme.headings.sizes.h1.fontSize).toBe('24px')
    expect(mantineTheme.fontFamily).toContain('Source Sans 3')
    expect(mantineTheme.fontFamilyMonospace).toContain('Source Code Pro')
  })

  test('mixing is exact at the ends', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(scaleOf('#102030', '#405060')[4]).toBe('#102030')
  })
})
