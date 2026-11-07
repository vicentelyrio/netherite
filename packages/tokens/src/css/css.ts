import { color, edgeKinds, tint } from '../color'
import { edgeStyle, graphMetrics, nodeSpec } from '../graph'
import {
  fontFamily,
  fontSizeExtra,
  fontWeight,
  grid,
  icon,
  layout,
  motion,
  radius,
  radiusExtra,
  shadow,
  size,
  space,
  spaceExtra,
  stroke,
  textStyle,
  zIndex,
} from '../scale'
import { statusGlyph } from '../status'

export const prefix = '--nt-'

const kebab = (text: string) =>
  text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[._]/g, '-')
    .toLowerCase()

const px = (n: number) => (n === 0 ? '0' : `${n}px`)

const flatten = (value: unknown, path: string[] = []): Array<[string, string | number]> => {
  if (typeof value === 'string' || typeof value === 'number') return [[path.join('-'), value]]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, [...path, kebab(key)]),
  )
}

const named = (group: string, value: unknown, format: (leaf: string | number) => string = String) =>
  Object.fromEntries(
    flatten(value).map(([name, leaf]) => [
      `${prefix}${group}${name ? `-${name}` : ''}`,
      format(leaf),
    ]),
  )

const lengths = (leaf: string | number) => (typeof leaf === 'number' ? px(leaf) : leaf)

export const variables = (): Record<string, string> => {
  const edges = Object.fromEntries(
    edgeKinds.flatMap((kind) => {
      const s = edgeStyle[kind]
      const k = kebab(kind)
      return [
        [`${prefix}edge-${k}-color`, s.color],
        [`${prefix}edge-${k}-width`, px(s.width)],
        [`${prefix}edge-${k}-dash`, s.dash.length === 0 ? 'none' : s.dash.join(' ')],
        [`${prefix}edge-${k}-opacity`, String(s.opacity)],
      ]
    }),
  )
  return {
    ...named('color', color),
    ...named('tint', tint),
    ...named('font', fontFamily),
    ...named('font-weight', fontWeight),
    ...Object.fromEntries(
      Object.entries(textStyle).flatMap(([name, style]) => {
        const n = kebab(name)
        return [
          [`${prefix}text-${n}-family`, `var(${prefix}font-${style.family})`],
          [`${prefix}text-${n}-size`, px(style.size)],
          [`${prefix}text-${n}-line-height`, px(style.lineHeight)],
          [`${prefix}text-${n}-weight`, String(style.weight)],
          [`${prefix}text-${n}-letter-spacing`, `${style.letterSpacing}em`],
          [`${prefix}text-${n}-transform`, 'uppercase' in style ? 'uppercase' : 'none'],
        ]
      }),
    ),
    ...named('font-size', fontSizeExtra, lengths),
    ...named('space', space, lengths),
    ...named('space', spaceExtra, lengths),
    ...named('size', size, lengths),
    ...named('stroke', stroke, lengths),
    ...named('radius', radius, lengths),
    ...named('radius', radiusExtra, lengths),
    ...named('layout', layout, lengths),
    ...named('grid', grid, lengths),
    [`${prefix}grid-columns`]: String(grid.columns),
    ...named('icon', icon, (v) => (typeof v === 'number' && v > 100 ? String(v) : px(v as number))),
    ...named('duration', motion.duration, (v) => `${v}ms`),
    ...named('easing', motion.easing),
    ...named('z', zIndex),
    ...named('shadow', shadow),
    ...Object.fromEntries(
      Object.entries(nodeSpec).map(([type, s]) => [`${prefix}node-radius-${type}`, px(s.radius)]),
    ),
    [`${prefix}status-hold`]: statusGlyph.holdFill,
    [`${prefix}status-track-share`]: `${statusGlyph.trackShare}%`,
    [`${prefix}status-ring-thin`]: px(statusGlyph.ring.thin),
    [`${prefix}status-ring-thick`]: px(statusGlyph.ring.thick),
    [`${prefix}status-halo-gap`]: px(statusGlyph.halo.gap),
    [`${prefix}status-halo-width`]: px(statusGlyph.halo.width),
    [`${prefix}status-done-opacity`]: String(statusGlyph.doneOpacity),
    ...named('graph', graphMetrics, (v) => String(v)),
    ...edges,
  }
}

export const libraryVariables = (): Record<string, string> => ({
  '--mantine-color-body': `var(${prefix}color-bg-canvas)`,
  '--mantine-color-text': `var(${prefix}color-text-primary)`,
  '--mantine-color-dimmed': `var(${prefix}color-text-muted)`,
  '--mantine-color-error': `var(${prefix}color-status-danger)`,
  '--mantine-color-placeholder': `var(${prefix}color-text-muted)`,
  '--mantine-color-anchor': `var(${prefix}color-accent-fg)`,
  '--mantine-color-default': `var(${prefix}color-bg-card)`,
  '--mantine-color-default-hover': `var(${prefix}color-bg-column)`,
  '--mantine-color-default-color': `var(${prefix}color-text-primary)`,
  '--mantine-color-default-border': `var(${prefix}color-border-subtle)`,
  '--mantine-font-family': `var(${prefix}font-sans)`,
  '--mantine-font-family-monospace': `var(${prefix}font-mono)`,
  '--mantine-font-family-headings': `var(${prefix}font-sans)`,
  '--mantine-primary-color-filled': `var(${prefix}color-accent-solid)`,
  '--mantine-primary-color-filled-hover': `var(${prefix}color-accent-fg)`,
  '--mantine-primary-color-contrast': `var(${prefix}color-text-on-accent)`,
  '--mantine-focus-ring-color': `var(${prefix}color-accent-fg)`,
})

export const stylesheet = () => {
  const lines = [
    'color-scheme: dark;',
    ...Object.entries({ ...variables(), ...libraryVariables() }).map(([k, v]) => `${k}: ${v};`),
  ]
  return `/* Generated from @netherite/tokens. Do not edit. */\n:root {\n${lines.map((l) => `  ${l}`).join('\n')}\n}\n`
}
