import { describe, expect, test } from 'vitest'
import {
  color,
  contrast,
  defaultThemeId,
  itemTypeNames,
  stylesheet,
  themeById,
  themes,
} from '../src/index'

const shape = (value: object): unknown =>
  Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      typeof child === 'string' ? 'colour' : shape(child as object),
    ]),
  )

const leaves = (value: object): ReadonlyArray<string> =>
  Object.values(value).flatMap((child) =>
    typeof child === 'string' ? [child] : leaves(child as object),
  )

describe('the theme list', () => {
  test('is the agreed list, with Netherite as the default and unchanged', () => {
    expect(themes.map((theme) => theme.name)).toEqual([
      'Netherite',
      'Netherite Light',
      'Dracula',
      'Nord',
      'Catppuccin Mocha',
      'Tokyo Night',
      'Gruvbox Dark',
      'Solarized Light',
    ])
    expect(themeById(defaultThemeId)?.colors).toBe(color)
  })

  test('every borrowed palette names its source and licence', () => {
    for (const theme of themes.filter((t) => !t.name.startsWith('Netherite'))) {
      expect(theme.source?.url, theme.name).toMatch(/^https:/)
      expect(theme.source?.license, theme.name).toBe('MIT')
    }
  })

  test('the stylesheet has one block for each other theme, with its colour scheme', () => {
    const css = stylesheet()
    for (const theme of themes.filter((t) => t.id !== defaultThemeId)) {
      const block = css.slice(css.indexOf(`:root[data-theme="${theme.id}"]`))
      expect(block, theme.id).toContain(`color-scheme: ${theme.scheme};`)
      expect(block, theme.id).toContain(`--nt-color-bg-canvas: ${theme.colors.bg.canvas};`)
      expect(block, theme.id).toContain('--nt-edge-belongs-to-color:')
      expect(block, theme.id).toContain('--mantine-color-lavender-6:')
    }
  })
})

describe.each(themes.map((theme) => [theme.name, theme] as const))('%s', (_, theme) => {
  const c = theme.colors
  const reading = [c.bg.canvas, c.bg.card, c.bg.cardHover, c.bg.sunken, c.bg.shell]

  test('has every colour the default has, and only real colours', () => {
    expect(shape(c)).toEqual(shape(color))
    for (const value of leaves(c)) expect(value).toMatch(/^(#[0-9a-fA-F]{6}|rgba\(.*\))$/)
  })

  test('its text reads on every surface (4.5:1)', () => {
    for (const fg of [c.text.primary, c.text.secondary, c.text.muted]) {
      for (const bg of reading)
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('the accent and the type colours read as text (4.5:1)', () => {
    for (const fg of [c.accent.fg, ...Object.values(c.type)]) {
      for (const bg of reading)
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('statuses and the diff gutter can be seen (3:1)', () => {
    for (const group of [c.status, c.diff, c.adr, c.state]) {
      for (const [name, value] of Object.entries(group)) {
        expect(contrast(value, c.bg.canvas), name).toBeGreaterThanOrEqual(3)
      }
    }
  })

  test('text on the solid accent and on the active rail item is readable', () => {
    expect(contrast(c.text.onAccent, c.accent.solid)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(c.accent.fgHover, c.accent.subtle)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(c.text.icon, c.bg.shell)).toBeGreaterThanOrEqual(4.5)
  })

  test('the seven item types stay seven different colours', () => {
    expect(new Set(itemTypeNames.map((type) => c.type[type])).size).toBe(itemTypeNames.length)
  })

  test('success, warning and danger are told apart', () => {
    expect(new Set([c.status.success, c.status.warning, c.status.danger]).size).toBe(3)
  })
})
