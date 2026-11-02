import { type ColorTokens, color, edgeKinds, type Scheme } from './color'
import { edgeColor, edgeStyle, graphMetrics, nodeRadius } from './graph'
import {
  fontFamily,
  fontSize,
  fontWeight,
  layout,
  motion,
  radius,
  shadow,
  space,
  textStyle,
  zIndex,
} from './scale'

/** Every CSS variable starts with this, so they cannot clash with a library's. */
export const prefix = '--nt-'

const kebab = (text: string) =>
  text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\./g, '-')
    .replace(/_/g, '-')
    .toLowerCase()

const px = (n: number) => (n === 0 ? '0' : `${n}px`)

type Leaf = string | number | readonly unknown[]

/** Flattens nested objects to `[name, leaf]` pairs, joining keys with `-`. */
const flatten = (value: unknown, path: string[] = []): Array<[string, Leaf]> => {
  if (typeof value === 'string' || typeof value === 'number') return [[path.join('-'), value]]
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => flatten(item, [...path, String(i)]))
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, [...path, kebab(key)]),
  )
}

const named = (group: string, value: unknown, format: (leaf: Leaf) => string) =>
  Object.fromEntries(
    flatten(value).map(([name, leaf]) => [
      `${prefix}${group}${name ? `-${name}` : ''}`.replace(/\./g, '-'),
      format(leaf),
    ]),
  )

/** The variables that do not change with the colour scheme. */
export const staticVariables = (): Record<string, string> => ({
  ...named('font', fontFamily, String),
  ...named('font-size', fontSize, (v) => px(v as number)),
  ...named('font-weight', fontWeight, String),
  ...Object.fromEntries(
    Object.entries(textStyle).flatMap(([name, style]) => [
      [`${prefix}text-${kebab(name)}-family`, `var(${prefix}font-${style.family})`],
      [`${prefix}text-${kebab(name)}-size`, px(style.size)],
      [`${prefix}text-${kebab(name)}-line-height`, px(style.lineHeight)],
      [`${prefix}text-${kebab(name)}-weight`, String(style.weight)],
      [`${prefix}text-${kebab(name)}-letter-spacing`, `${style.letterSpacing}em`],
      [`${prefix}text-${kebab(name)}-transform`, 'uppercase' in style ? 'uppercase' : 'none'],
    ]),
  ),
  ...named('space', space, (v) => px(v as number)),
  ...named('radius', radius, (v) => px(v as number)),
  ...named('layout', layout, (v) => (typeof v === 'number' ? px(v) : String(v))),
  ...named('duration', motion.duration, (v) => `${v}ms`),
  ...named('easing', motion.easing, String),
  ...named('z', zIndex, String),
  ...named('node-radius', nodeRadius, (v) => px(v as number)),
  ...named('graph', graphMetrics, (v) => String(v)),
})

/** The variables for one colour scheme. */
export const schemeVariables = (scheme: Scheme): Record<string, string> => {
  const c: ColorTokens = color[scheme]
  const edge = Object.fromEntries(
    edgeKinds.flatMap((kind) => {
      const s = edgeStyle[kind]
      const k = kebab(kind)
      return [
        [`${prefix}edge-${k}-color`, edgeColor(scheme, kind)],
        [`${prefix}edge-${k}-width`, px(s.width)],
        [`${prefix}edge-${k}-dash`, s.dash.length === 0 ? 'none' : s.dash.join(' ')],
        [`${prefix}edge-${k}-opacity`, String(s.opacity)],
      ]
    }),
  )
  return {
    ...named('color', c, String),
    ...named('shadow', shadow[scheme], String),
    ...edge,
  }
}

/**
 * Variables that point the UI library's own variables at ours, so its components look like the
 * design without a rule per component.
 */
export const libraryVariables = (): Record<string, string> => ({
  '--mantine-color-body': `var(${prefix}color-bg-canvas)`,
  '--mantine-color-text': `var(${prefix}color-text-primary)`,
  '--mantine-color-dimmed': `var(${prefix}color-text-muted)`,
  '--mantine-color-error': `var(${prefix}color-status-danger)`,
  '--mantine-color-placeholder': `var(${prefix}color-text-muted)`,
  '--mantine-color-anchor': `var(${prefix}color-accent-fg)`,
  '--mantine-color-default': `var(${prefix}color-bg-raised)`,
  '--mantine-color-default-hover': `var(${prefix}color-bg-hover)`,
  '--mantine-color-default-color': `var(${prefix}color-text-primary)`,
  '--mantine-color-default-border': `var(${prefix}color-border-default)`,
  '--mantine-font-family': `var(${prefix}font-sans)`,
  '--mantine-font-family-monospace': `var(${prefix}font-mono)`,
  '--mantine-font-family-headings': `var(${prefix}font-sans)`,
  '--mantine-primary-color-filled': `var(${prefix}color-accent-solid)`,
  '--mantine-primary-color-filled-hover': `var(${prefix}color-accent-solid-hover)`,
  '--mantine-primary-color-contrast': `var(${prefix}color-text-on-accent)`,
  '--mantine-focus-ring-color': `var(${prefix}color-focus)`,
})

const block = (selector: string, vars: Record<string, string>, extra: string[] = []) =>
  `${selector} {\n${[...extra, ...Object.entries(vars).map(([k, v]) => `${k}: ${v};`)].map((l) => `  ${l}`).join('\n')}\n}\n`

/**
 * The whole stylesheet: shared variables on `:root`, dark colours as the default, and light
 * colours when the UI library sets `data-mantine-color-scheme="light"` on the root element.
 */
export const stylesheet = () =>
  [
    '/* Generated from @netherite/tokens. Do not edit. */',
    block(':root', { ...staticVariables(), ...libraryVariables() }),
    block(':root, :root[data-mantine-color-scheme="dark"]', schemeVariables('dark'), [
      'color-scheme: dark;',
    ]),
    block(':root[data-mantine-color-scheme="light"]', schemeVariables('light'), [
      'color-scheme: light;',
    ]),
  ].join('\n')
