import { color } from './color'
import { hexToRgb } from './contrast'
import { fontFamily, fontWeight, radius, space, textStyle } from './scale'

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

/** The step of every scale that holds the colour itself; the theme's `primaryShade` points here. */
export const baseShade = 6

/**
 * The ten-step scale the UI library wants, around one colour: step 6 is the colour, lighter steps
 * mix toward white and darker ones toward the design's deepest background.
 */
export const scaleOf = (base: string): Scale => [
  mix(base, '#ffffff', 0.82),
  mix(base, '#ffffff', 0.68),
  mix(base, '#ffffff', 0.5),
  mix(base, '#ffffff', 0.32),
  mix(base, '#ffffff', 0.16),
  mix(base, '#ffffff', 0.07),
  base,
  mix(base, color.bg.overlay, 0.22),
  mix(base, color.bg.overlay, 0.42),
  mix(base, color.bg.overlay, 0.62),
]

const colors = {
  lavender: scaleOf(color.accent.solid),
  success: scaleOf(color.status.success),
  warning: scaleOf(color.status.warning),
  danger: scaleOf(color.status.danger),
  ...Object.fromEntries(
    (Object.keys(color.type) as Array<keyof typeof color.type>).map((type) => [
      type,
      scaleOf(color.type[type]),
    ]),
  ),
} as Record<string, Scale>

const px = (n: number) => `${n}px`

/**
 * The theme for the UI library, as plain data: `packages/ui` passes it to `createTheme`. It is
 * data and not a call to the library because only `packages/ui` may import it (ADR-00011).
 */
export const mantineTheme = {
  primaryColor: 'lavender',
  primaryShade: baseShade,
  autoContrast: true,
  luminanceThreshold: 0.5,
  colors,
  white: '#ffffff',
  black: color.text.onAccent,
  fontFamily: fontFamily.sans,
  fontFamilyMonospace: fontFamily.mono,
  fontSmoothing: true,
  focusRing: 'auto' as const,
  defaultRadius: 'sm',
  respectReducedMotion: true,
  cursorType: 'pointer' as const,
  fontSizes: {
    xs: px(textStyle.micro.size),
    sm: px(textStyle.caption.size),
    md: px(textStyle.bodySm.size),
    lg: px(textStyle.heading.size),
    xl: px(textStyle.title.size),
  },
  lineHeights: {
    xs: px(textStyle.micro.lineHeight),
    sm: px(textStyle.caption.lineHeight),
    md: px(textStyle.bodySm.lineHeight),
    lg: px(textStyle.heading.lineHeight),
    xl: px(textStyle.title.lineHeight),
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
    xl: px(radius.lg),
  },
  headings: {
    fontFamily: fontFamily.sans,
    fontWeight: String(fontWeight.semibold),
    sizes: {
      h1: { fontSize: px(textStyle.display.size), lineHeight: px(textStyle.display.lineHeight) },
      h2: { fontSize: px(textStyle.title.size), lineHeight: px(textStyle.title.lineHeight) },
      h3: { fontSize: px(textStyle.heading.size), lineHeight: px(textStyle.heading.lineHeight) },
      h4: { fontSize: px(textStyle.bodySm.size), lineHeight: px(textStyle.bodySm.lineHeight) },
      h5: { fontSize: px(textStyle.caption.size), lineHeight: px(textStyle.caption.lineHeight) },
      h6: { fontSize: px(textStyle.micro.size), lineHeight: px(textStyle.micro.lineHeight) },
    },
  },
} as const
