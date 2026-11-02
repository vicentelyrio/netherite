/**
 * Fonts. The variable fonts are self-hosted by `@netherite/ui/fonts.css` under the names that
 * Fontsource gives them (`... Variable`); the plain names and system fonts cover the moment
 * before they load, and installs of the static fonts.
 */
export const fontFamily = {
  sans: "'Source Sans 3 Variable', 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'Source Code Pro Variable', 'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  icon: "'Material Symbols Rounded Variable', 'Material Symbols Rounded'",
} as const

/** Font sizes in px. The UI is dense: body text is 14. */
export const fontSize = {
  '2xs': 10,
  xs: 11,
  sm: 12,
  md: 13,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
} as const

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const

export interface TextStyle {
  readonly family: 'sans' | 'mono'
  readonly size: number
  readonly lineHeight: number
  readonly weight: number
  /** In em. */
  readonly letterSpacing: number
  readonly uppercase?: true
}

/** Named text styles. Components pick a style rather than mixing sizes and weights. */
export const textStyle = {
  h1: { family: 'sans', size: 24, lineHeight: 30, weight: 600, letterSpacing: -0.01 },
  h2: { family: 'sans', size: 20, lineHeight: 26, weight: 600, letterSpacing: -0.005 },
  h3: { family: 'sans', size: 16, lineHeight: 22, weight: 600, letterSpacing: 0 },
  h4: { family: 'sans', size: 14, lineHeight: 20, weight: 600, letterSpacing: 0 },
  body: { family: 'sans', size: 14, lineHeight: 20, weight: 400, letterSpacing: 0 },
  bodySm: { family: 'sans', size: 13, lineHeight: 18, weight: 400, letterSpacing: 0 },
  label: { family: 'sans', size: 12, lineHeight: 16, weight: 600, letterSpacing: 0.01 },
  overline: {
    family: 'sans',
    size: 11,
    lineHeight: 14,
    weight: 600,
    letterSpacing: 0.06,
    uppercase: true,
  },
  caption: { family: 'sans', size: 11, lineHeight: 14, weight: 400, letterSpacing: 0.01 },
  code: { family: 'mono', size: 13, lineHeight: 20, weight: 400, letterSpacing: 0 },
  codeSm: { family: 'mono', size: 12, lineHeight: 16, weight: 400, letterSpacing: 0 },
} as const satisfies Record<string, TextStyle>
export type TextStyleName = keyof typeof textStyle

/** A 4px grid. Index by step; `space[4]` is 16px. */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const

export const radius = { none: 0, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, full: 9999 } as const

/** Sizes of the app's frame. */
export const layout = {
  railWidth: 56,
  sidebarWidth: 280,
  drawerWidth: 560,
  previewWidth: 360,
  headerHeight: 44,
  rowHeight: 32,
  rowHeightCompact: 28,
  cardWidth: 280,
  iconSize: { sm: 16, md: 20, lg: 24 },
  focusRing: 2,
} as const

export const motion = {
  duration: { fast: 100, base: 160, slow: 240 },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0, 0, 0, 1)',
    exit: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const

/** Box shadows per scheme: deeper on dark surfaces, where they would otherwise vanish. */
export const shadow = {
  dark: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 12px rgba(0, 0, 0, 0.55)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.6)',
  },
  light: {
    sm: '0 1px 2px rgba(29, 26, 31, 0.08)',
    md: '0 4px 12px rgba(29, 26, 31, 0.12)',
    lg: '0 12px 32px rgba(29, 26, 31, 0.16)',
  },
} as const
