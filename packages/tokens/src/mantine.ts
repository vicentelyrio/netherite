import { color } from './color'
import { hexToRgb } from './contrast'
import { fontFamily, fontSize, fontWeight, radius, shadow, space, textStyle } from './scale'

type Scale = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]

const toHex = (rgb: readonly number[]) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

/** Mixes two colours: `t` = 0 is `a`, 1 is `b`. */
export const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t])
}

/**
 * The ten-step scale the UI library wants, from two colours that work on a dark and a light
 * surface. With `primaryShade` of 4 (dark) and 7 (light), the library picks exactly these two.
 */
export const scaleOf = (forDark: string, forLight: string): Scale => [
  mix(forDark, '#ffffff', 0.9),
  mix(forDark, '#ffffff', 0.75),
  mix(forDark, '#ffffff', 0.55),
  mix(forDark, '#ffffff', 0.3),
  forDark,
  mix(forDark, forLight, 0.33),
  mix(forDark, forLight, 0.66),
  forLight,
  mix(forLight, '#000000', 0.15),
  mix(forLight, '#000000', 0.3),
]

const colors = {
  copper: scaleOf(color.dark.accent.solid, color.light.accent.solid),
  success: scaleOf(color.dark.status.success, color.light.status.success),
  warning: scaleOf(color.dark.status.warning, color.light.status.warning),
  danger: scaleOf(color.dark.status.danger, color.light.status.danger),
  info: scaleOf(color.dark.status.info, color.light.status.info),
  ...Object.fromEntries(
    (Object.keys(color.dark.type) as Array<keyof typeof color.dark.type>).map((type) => [
      type,
      scaleOf(color.dark.type[type], color.light.type[type]),
    ]),
  ),
} as Record<string, Scale>

const px = (n: number) => `${n}px`

/**
 * The theme for the UI library, as plain data: `packages/ui` passes it to `createTheme`. It is
 * data and not a call to the library because only `packages/ui` may import it (ADR-00011).
 */
export const mantineTheme = {
  primaryColor: 'copper',
  primaryShade: { light: 7, dark: 4 },
  autoContrast: true,
  luminanceThreshold: 0.5,
  colors,
  white: '#ffffff',
  black: color.dark.bg.canvas,
  fontFamily: fontFamily.sans,
  fontFamilyMonospace: fontFamily.mono,
  fontSmoothing: true,
  focusRing: 'auto' as const,
  defaultRadius: 'md',
  respectReducedMotion: true,
  cursorType: 'pointer' as const,
  fontSizes: {
    xs: px(fontSize.xs),
    sm: px(fontSize.sm),
    md: px(fontSize.lg),
    lg: px(fontSize.xl),
    xl: px(fontSize['2xl']),
  },
  lineHeights: {
    xs: px(textStyle.caption.lineHeight),
    sm: px(textStyle.label.lineHeight),
    md: px(textStyle.body.lineHeight),
    lg: px(textStyle.h3.lineHeight),
    xl: px(textStyle.h2.lineHeight),
  },
  spacing: {
    xs: px(space[1]),
    sm: px(space[2]),
    md: px(space[3]),
    lg: px(space[4]),
    xl: px(space[6]),
  },
  radius: {
    xs: px(radius.xs),
    sm: px(radius.sm),
    md: px(radius.md),
    lg: px(radius.lg),
    xl: px(radius.xl),
  },
  shadows: {
    xs: shadow.dark.sm,
    sm: shadow.dark.sm,
    md: shadow.dark.md,
    lg: shadow.dark.lg,
    xl: shadow.dark.lg,
  },
  headings: {
    fontFamily: fontFamily.sans,
    fontWeight: String(fontWeight.semibold),
    sizes: {
      h1: { fontSize: px(textStyle.h1.size), lineHeight: px(textStyle.h1.lineHeight) },
      h2: { fontSize: px(textStyle.h2.size), lineHeight: px(textStyle.h2.lineHeight) },
      h3: { fontSize: px(textStyle.h3.size), lineHeight: px(textStyle.h3.lineHeight) },
      h4: { fontSize: px(textStyle.h4.size), lineHeight: px(textStyle.h4.lineHeight) },
      h5: { fontSize: px(textStyle.bodySm.size), lineHeight: px(textStyle.bodySm.lineHeight) },
      h6: { fontSize: px(textStyle.label.size), lineHeight: px(textStyle.label.lineHeight) },
    },
  },
} as const
