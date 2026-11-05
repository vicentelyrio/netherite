import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  adrStatuses,
  badgeGlyph,
  baseShade,
  color,
  contrast,
  edgeKinds,
  edgeStyle,
  freshnessStates,
  glyphBox,
  grid,
  hexToRgb,
  itemTypeNames,
  layout,
  libraryVariables,
  mantineTheme,
  mix,
  nodeSpec,
  prefix,
  radius,
  scaleOf,
  space,
  stateCategories,
  statusGlyph,
  statusNames,
  statusOfCategory,
  stylesheet,
  textStyle,
  tint,
  variables,
} from '../src/index'

const hex = /^#[0-9a-f]{6}$/i

const leaves = (value: unknown, path: string[] = []): Array<[string, unknown]> =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([k, v]) => leaves(v, [...path, k]))
    : [[path.join('.'), value]]

/** The colour as written, apart from the two translucent ones. */
const solid = leaves(color).filter(([, v]) => typeof v === 'string' && hex.test(v)) as Array<
  [string, string]
>

describe('the contrast helper', () => {
  test('matches the known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#777777', '#777777')).toBe(1)
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1)
  })

  test('refuses anything but #rrggbb', () => {
    expect(() => hexToRgb('red')).toThrow()
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0])
  })
})

describe('colours match the design sheets', () => {
  test('the surfaces, from T1', () => {
    expect(color.bg).toMatchObject({
      shell: '#1E2032',
      canvas: '#282A3F',
      card: '#212336',
      cardHover: '#25273C',
      column: '#2E3148',
      sunken: '#18192A',
      track: '#34374F',
    })
    expect(color.border).toMatchObject({ subtle: '#2F3250', strong: '#474B6E' })
  })

  test('text, accent and status, from T1', () => {
    expect(color.text).toMatchObject({
      primary: '#E8E9F3',
      secondary: '#B9BCD3',
      muted: '#969AB8',
      faint: '#6E7292',
      lineNumber: '#8A8FAD',
    })
    expect(color.accent).toMatchObject({ fg: '#A5A7FF', solid: '#7F82EA', subtle: '#34365A' })
    expect(color.status).toMatchObject({
      success: '#2CC27E',
      warning: '#E2AE4C',
      danger: '#F0717E',
    })
  })

  test('the type colours: graph nodes from T1, knowledge types from T2', () => {
    expect(color.type).toEqual({
      goal: '#8F91F2',
      project: '#3BA474',
      task: '#D9A646',
      adr: '#D2A8F0',
      doc: '#8FC3F2',
      context: '#7ED6C8',
      runbook: '#F0B397',
    })
  })

  test('ADR status colours, from T2', () => {
    expect(color.adr).toEqual({
      proposed: '#A5A7FF',
      accepted: '#2CC27E',
      deprecated: '#F0717E',
      superseded: '#B9BCD3',
    })
  })

  test('syntax and gutter colours, from T1', () => {
    expect(color.syntax).toEqual({
      key: '#F29AA5',
      string: '#A6DCAE',
      date: '#E8C07A',
      mention: '#A5A7FF',
      punct: '#8A8FAD',
      text: '#D4D6E8',
    })
    expect(color.diff).toMatchObject({ added: '#2CC27E', modified: '#E2AE4C', deleted: '#F0717E' })
  })

  test('every colour is a #rrggbb, except the one translucent label ground', () => {
    const others = leaves(color).filter(([, v]) => !(typeof v === 'string' && hex.test(v)))
    expect(others.map(([k]) => k)).toEqual(['graph.labelBg'])
  })

  test('every type, state category, ADR status and freshness state has a colour', () => {
    expect(Object.keys(color.type)).toEqual([...itemTypeNames])
    expect(Object.keys(color.state)).toEqual([...stateCategories])
    expect(Object.keys(color.adr)).toEqual([...adrStatuses])
    expect(Object.keys(color.freshness)).toEqual([...freshnessStates])
  })

  test('the seven item types have seven different colours', () => {
    expect(new Set(Object.values(color.type)).size).toBe(itemTypeNames.length)
  })
})

describe('contrast', () => {
  const surfaces = Object.entries({
    canvas: color.bg.canvas,
    card: color.bg.card,
    cardHover: color.bg.cardHover,
    cardSelected: color.bg.cardSelected,
    column: color.bg.column,
    sunken: color.bg.sunken,
    shell: color.bg.shell,
    chip: color.bg.chip,
    overlay: color.bg.overlay,
  })

  test.each([
    ['text-primary', color.text.primary, 11.5],
    ['text-secondary', color.text.secondary, 7.5],
    ['text-muted', color.text.muted, 5.1],
    ['text-faint', color.text.faint, 3.0],
    ['lavender', color.accent.fg, 6.4],
    ['green', color.status.success, 6.1],
    ['amber', color.status.warning, 7.0],
    ['red', color.status.danger, 4.9],
    ['type-adr', color.type.adr, 7.1],
    ['type-doc', color.type.doc, 7.5],
    ['type-context', color.type.context, 8.2],
    ['type-runbook', color.type.runbook, 7.8],
  ])('%s on the canvas is the ratio the sheet states (%f)', (_name, fg, stated) => {
    expect(contrast(fg, color.bg.canvas)).toBeGreaterThanOrEqual(stated - 0.1)
  })

  test('the line numbers reach the 4.9 the sheet states on the editor (the card colour)', () => {
    expect(contrast(color.text.lineNumber, color.bg.card)).toBeGreaterThanOrEqual(4.8)
  })

  test.each(surfaces)(
    'primary, secondary and muted text are readable on %s (4.5:1)',
    (_name, bg) => {
      for (const fg of [color.text.primary, color.text.secondary, color.text.muted]) {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  test('the accent and the type colours read as text on the canvas and cards (4.5:1), and show as shapes on every surface (3:1)', () => {
    for (const fg of [color.accent.fg, ...Object.values(color.type)]) {
      for (const bg of [
        color.bg.canvas,
        color.bg.card,
        color.bg.cardHover,
        color.bg.sunken,
        color.bg.shell,
      ]) {
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
      for (const [, bg] of surfaces)
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3)
    }
  })

  test('statuses and the diff gutter can be seen on the canvas (3:1)', () => {
    for (const group of [color.status, color.diff, color.adr, color.state]) {
      for (const [name, value] of Object.entries(group)) {
        expect(contrast(value, color.bg.canvas), name).toBeGreaterThanOrEqual(3)
      }
    }
  })

  test('text on the solid accent is readable', () => {
    expect(contrast(color.text.onAccent, color.accent.solid)).toBeGreaterThanOrEqual(4.5)
  })

  test('the active rail item: icon on its ground', () => {
    expect(contrast(color.accent.fgHover, color.accent.subtle)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(color.text.icon, color.bg.shell)).toBeGreaterThanOrEqual(4.5)
  })

  test('the quietest text (line numbers, punctuation, "not tracked") is only for the editor and the dark panels, where the sheet measures it', () => {
    // On the canvas, columns and chips these three are 4.0 to 4.4:1, a little under AA. That is
    // the design's own value (#8A8FAD), kept as drawn; the sheet states 4.9 on the editor.
    for (const fg of [color.text.lineNumber, color.syntax.punct, color.freshness.unknown]) {
      for (const bg of [color.bg.card, color.bg.sunken, color.bg.shell, color.bg.overlay]) {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrast(fg, color.bg.canvas)).toBeGreaterThan(4.0)
      expect(contrast(fg, color.bg.canvas)).toBeLessThan(4.5)
    }
    expect(solid.length).toBeGreaterThan(50)
  })
})

describe('shapes', () => {
  test('graph nodes: sizes and shapes from the graph component', () => {
    expect(Object.keys(nodeSpec)).toEqual([...itemTypeNames])
    expect(nodeSpec.goal).toEqual({ shape: 'circle', radius: 15 })
    expect(nodeSpec.project).toEqual({ shape: 'circle', radius: 10.5 })
    expect(nodeSpec.task).toEqual({ shape: 'circle', radius: 6 })
    expect(nodeSpec.adr).toEqual({ shape: 'diamond', radius: 8 })
    expect(nodeSpec.doc).toEqual({ shape: 'square', radius: 7.5 })
    expect(nodeSpec.context).toEqual({ shape: 'ring', radius: 7.5 })
    expect(nodeSpec.runbook).toEqual({ shape: 'bar', radius: 7 })
  })

  test('the glyph box follows the graph’s own proportions', () => {
    expect(glyphBox('task', 12)).toMatchObject({
      width: 12,
      height: 12,
      radius: '50%',
      fill: color.type.task,
    })
    expect(glyphBox('adr', 20).width).toBeCloseTo(15.6, 5)
    expect(glyphBox('adr', 20)).toMatchObject({ rotate: 45, radius: '2px' })
    expect(glyphBox('doc', 20)).toMatchObject({ width: 17.2, height: 17.2, radius: '3px' })
    expect(glyphBox('runbook', 20)).toMatchObject({ width: 26, height: 14 })
    expect(glyphBox('context', 20)).toMatchObject({
      border: '2px solid #7ED6C8',
      fill: '#7ED6C833',
    })
  })

  test('a superseded ADR is the same diamond, hollow', () => {
    expect(glyphBox('adr', 20, true)).toMatchObject({
      fill: 'transparent',
      border: '1.5px solid #D2A8F0',
    })
    expect(glyphBox('adr', 20, false).border).toBe('none')
  })

  test('badge glyphs: the four knowledge types as sheet T2 draws them', () => {
    expect(badgeGlyph.adr).toMatchObject({ width: 6, height: 6, rotate: 45, radius: '2px' })
    expect(badgeGlyph.doc).toMatchObject({ width: 7, height: 7, radius: '3px' })
    expect(badgeGlyph.context).toMatchObject({ width: 8, height: 8, border: '1.5px solid #7ED6C8' })
    expect(badgeGlyph.runbook).toMatchObject({ width: 9, height: 5, radius: '2px' })
  })

  test('every type has its own look: shape, size or ring', () => {
    const looks = itemTypeNames.map((t) => `${nodeSpec[t].shape}`)
    expect(new Set(looks).size).toBe(5)
    expect(new Set(itemTypeNames.map((t) => color.type[t])).size).toBe(7)
  })
})

describe('edges', () => {
  test('the five kinds in the graph legend, as drawn', () => {
    expect(edgeStyle.belongs_to).toMatchObject({
      width: 1,
      dash: [],
      arrow: false,
      opacity: 0.45,
      color: '#50547A',
    })
    expect(edgeStyle.implements).toMatchObject({
      width: 1.5,
      dash: [],
      arrow: true,
      color: '#6A6E96',
      opacity: 0.7,
    })
    expect(edgeStyle.explains).toMatchObject({ width: 1.6, dash: [1.5, 4.5], arrow: false })
    expect(edgeStyle.supersedes).toMatchObject({ width: 1.5, dash: [7, 4], arrow: true })
    expect(edgeStyle.co_changes).toMatchObject({ width: 1.25, dash: [10, 4, 2, 4], arrow: false })
  })

  test('every kind has a style, and the ones the design does not draw are marked', () => {
    expect(Object.keys(edgeStyle)).toEqual([...edgeKinds])
    const extra = edgeKinds.filter((k) => !edgeStyle[k].inDesign)
    expect(extra).toEqual(['depends_on', 'related', 'reference'])
  })
})

describe('type, space and radii match T1', () => {
  test('the type scale', () => {
    expect(textStyle.display).toMatchObject({
      size: 28,
      lineHeight: 34,
      weight: 600,
      letterSpacing: -0.01,
    })
    expect(textStyle.title).toMatchObject({ size: 20, lineHeight: 26, weight: 600 })
    expect(textStyle.heading).toMatchObject({ size: 16, lineHeight: 22, weight: 600 })
    expect(textStyle.body).toMatchObject({ size: 15, lineHeight: 22, weight: 400 })
    expect(textStyle.bodySm).toMatchObject({ size: 14, lineHeight: 20, weight: 400 })
    expect(textStyle.caption).toMatchObject({ size: 13, lineHeight: 18, weight: 500 })
    expect(textStyle.micro).toMatchObject({ size: 12, lineHeight: 16, weight: 500 })
    expect(textStyle.mono).toMatchObject({ family: 'mono', size: 13, lineHeight: 22, weight: 400 })
    expect(textStyle.overline).toMatchObject({
      size: 12,
      weight: 600,
      letterSpacing: 0.06,
      uppercase: true,
    })
  })

  test('spacing is 4, 8, 12, 16, 20, 24, 32, 40, 48, 64', () => {
    expect(Object.values(space)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48, 64])
    expect(Object.keys(space)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  })

  test('radii: chip 4, button 6, card 10, column 14, pill', () => {
    expect(radius).toEqual({ xs: 4, sm: 6, md: 10, lg: 14, full: 999 })
  })

  test('the frame: a 64px rail with 40px items, screens at 1920 by 1080', () => {
    expect(layout.railWidth).toBe(64)
    expect(layout.railItem).toBe(40)
    expect(layout.screen).toEqual({ width: 1920, height: 1080 })
    expect(layout.pageInset).toBe(96)
    expect(layout.cardPadding).toBe(16)
  })

  test('the page grid: twelve columns of content 1728 wide at 1920', () => {
    expect(grid.columns).toBe(12)
    expect(layout.screen.width - layout.railWidth - grid.marginStart - grid.marginEnd).toBe(1728)
    expect(variables()['--nt-grid-columns']).toBe('12')
    expect(variables()['--nt-grid-gutter']).toBe('24px')
    expect(variables()['--nt-grid-margin-start']).toBe('96px')
  })

  test('status: four states, set by the state category, drawn by fill and never by hue', () => {
    expect(statusNames).toEqual(['backlog', 'progress', 'hold', 'done'])
    expect(statusOfCategory).toEqual({
      todo: 'backlog',
      active: 'progress',
      blocked: 'hold',
      done: 'done',
    })
    const v = variables()
    expect(v['--nt-status-hold']).toBe(statusGlyph.holdFill)
    expect(v['--nt-status-halo-gap']).toBe('1.5px')
    expect(v['--nt-status-done-opacity']).toBe('0.8')
  })

  test('line heights leave room', () => {
    for (const [name, style] of Object.entries(textStyle)) {
      expect(style.lineHeight, name).toBeGreaterThanOrEqual(style.size * 1.1)
    }
  })
})

describe('CSS variables', () => {
  const vars = variables()

  test('every name starts with the prefix and is lowercase kebab-case', () => {
    for (const name of Object.keys(vars)) {
      expect(name.startsWith(prefix), name).toBe(true)
      expect(name, name).toMatch(/^--[a-z0-9-]+$/)
    }
  })

  test('no value is empty or the trace of a bug', () => {
    for (const [name, value] of Object.entries(vars)) {
      expect(value, name).not.toMatch(/undefined|NaN|\[object|null/)
      expect(value.trim(), name).not.toBe('')
    }
  })

  test('has the variables the app and components rely on', () => {
    expect(vars['--nt-color-bg-canvas']).toBe('#282A3F')
    expect(vars['--nt-color-accent-fg']).toBe('#A5A7FF')
    expect(vars['--nt-color-type-adr']).toBe('#D2A8F0')
    expect(vars['--nt-color-adr-superseded']).toBe('#B9BCD3')
    expect(vars['--nt-color-syntax-mention']).toBe('#A5A7FF')
    expect(vars['--nt-tint-pill']).toBe('0.14')
    expect(vars['--nt-text-body-size']).toBe('15px')
    expect(vars['--nt-text-display-letter-spacing']).toBe('-0.01em')
    expect(vars['--nt-text-overline-transform']).toBe('uppercase')
    expect(vars['--nt-space-1']).toBe('4px')
    expect(vars['--nt-space-10']).toBe('64px')
    expect(vars['--nt-radius-md']).toBe('10px')
    expect(vars['--nt-radius-control']).toBe('7px')
    expect(vars['--nt-layout-rail-width']).toBe('64px')
    expect(vars['--nt-layout-rail-bar-height']).toBe('20px')
    expect(vars['--nt-icon-rail-size']).toBe('22px')
    expect(vars['--nt-icon-rail-weight']).toBe('300')
    expect(vars['--nt-duration-base']).toBe('160ms')
    expect(vars['--nt-node-radius-goal']).toBe('15px')
    expect(vars['--nt-edge-supersedes-dash']).toBe('7 4')
    expect(vars['--nt-edge-belongs-to-dash']).toBe('none')
    expect(vars['--nt-shadow-tooltip']).toBe('0 8px 24px rgba(0, 0, 0, 0.35)')
  })

  test('the library variables point at ours, and every target exists', () => {
    const lib = libraryVariables()
    expect(lib['--mantine-color-body']).toBe('var(--nt-color-bg-canvas)')
    for (const value of Object.values(lib)) {
      expect(value).toMatch(/^var\(--nt-[a-z0-9-]+\)$/)
      expect(vars[value.slice(4, -1)], value).toBeDefined()
    }
  })

  test('the stylesheet is one :root block, dark, each variable declared once', () => {
    const css = stylesheet()
    expect(css.match(/:root \{/g)).toHaveLength(1)
    expect(css).toContain('color-scheme: dark;')
    expect(css).not.toContain('data-mantine-color-scheme')
    const names = [...css.matchAll(/^\s+(--[a-z0-9-]+):/gm)].map((m) => m[1])
    expect(new Set(names).size).toBe(names.length)
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
  })

  test('every colour is a ten-step scale and the primary colour exists', () => {
    for (const [name, scale] of Object.entries(mantineTheme.colors)) {
      expect(scale, name).toHaveLength(10)
      for (const step of scale) expect(step).toMatch(hex)
    }
    expect(mantineTheme.colors[mantineTheme.primaryColor]).toBeDefined()
  })

  test('with the shade the theme picks, each scale gives exactly the design’s colour', () => {
    expect(mantineTheme.primaryShade).toBe(baseShade)
    for (const type of itemTypeNames)
      expect(mantineTheme.colors[type]?.[baseShade]).toBe(color.type[type])
    for (const status of ['success', 'warning', 'danger'] as const) {
      expect(mantineTheme.colors[status]?.[baseShade]).toBe(color.status[status])
    }
    expect(mantineTheme.colors.lavender?.[baseShade]).toBe(color.accent.solid)
  })

  test('scales run from light to dark', () => {
    for (const [name, scale] of Object.entries(mantineTheme.colors)) {
      const brightness = scale.map((s) => hexToRgb(s).reduce((a, b) => a + b, 0))
      expect(
        [...brightness].sort((a, b) => b - a),
        name,
      ).toEqual(brightness)
    }
  })

  test('sizes match the type scale and the spacing', () => {
    expect(mantineTheme.fontSizes.md).toBe('14px')
    expect(mantineTheme.spacing.sm).toBe('8px')
    expect(mantineTheme.radius.md).toBe('10px')
    expect(mantineTheme.headings.sizes.h1.fontSize).toBe('28px')
    expect(mantineTheme.fontFamily).toContain('Source Sans 3')
    expect(mantineTheme.fontFamilyMonospace).toContain('Source Code Pro')
    expect(mantineTheme.black).toBe(color.text.onAccent)
  })

  test('mixing is exact at the ends', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(scaleOf('#102030')[baseShade]).toBe('#102030')
    expect(tint.pill).toBe(0.14)
  })
})
