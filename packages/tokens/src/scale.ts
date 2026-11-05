export const fontFamily = {
  sans: "'Source Sans 3 Variable', 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'Source Code Pro Variable', 'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  icon: "'Material Symbols Rounded Variable', 'Material Symbols Rounded'",
} as const

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const

export interface TextStyle {
  readonly family: 'sans' | 'mono'
  readonly size: number
  readonly lineHeight: number
  readonly weight: number
  readonly letterSpacing: number
  readonly uppercase?: true
}

export const textStyle = {
  display: { family: 'sans', size: 28, lineHeight: 34, weight: 600, letterSpacing: -0.01 },
  title: { family: 'sans', size: 20, lineHeight: 26, weight: 600, letterSpacing: 0 },
  heading: { family: 'sans', size: 16, lineHeight: 22, weight: 600, letterSpacing: 0 },
  body: { family: 'sans', size: 15, lineHeight: 22, weight: 400, letterSpacing: 0 },
  bodySm: { family: 'sans', size: 14, lineHeight: 20, weight: 400, letterSpacing: 0 },
  caption: { family: 'sans', size: 13, lineHeight: 18, weight: 500, letterSpacing: 0 },
  micro: { family: 'sans', size: 12, lineHeight: 16, weight: 500, letterSpacing: 0 },
  mono: { family: 'mono', size: 13, lineHeight: 22, weight: 400, letterSpacing: 0 },
  overline: {
    family: 'sans',
    size: 12,
    lineHeight: 16,
    weight: 600,
    letterSpacing: 0.06,
    uppercase: true,
  },
  monoSm: { family: 'mono', size: 12, lineHeight: 16, weight: 400, letterSpacing: 0 },
} as const satisfies Record<string, TextStyle>
export type TextStyleName = keyof typeof textStyle

export const fontSize = {
  micro: textStyle.micro.size,
  caption: textStyle.caption.size,
  bodySm: textStyle.bodySm.size,
  body: textStyle.body.size,
  heading: textStyle.heading.size,
  title: textStyle.title.size,
  display: textStyle.display.size,
} as const

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const

export const radius = { xs: 4, sm: 6, md: 10, lg: 14, full: 999 } as const
export const radiusExtra = { control: 7, tooltip: 8, group: 12 } as const

export const layout = {
  screen: { width: 1920, height: 1080 },
  railWidth: 64,
  railItem: 40,
  pageInset: 96,
  logo: 32,
  avatar: 32,
  switcher: { width: 36, height: 32 },
  tooltipHeight: 32,
  cardPadding: 16,
  cardGap: { board: 8, list: 12 },
  columnGap: 16,
  drawer: { text: 912, split: 1792, codePane: 880, header: 48, statusBar: 32 },
  railBar: { width: 3, height: 20 },
  focusRing: 2,
} as const

export const grid = {
  columns: 12,
  gutter: 24,
  marginStart: 96,
  marginEnd: 32,
  marginCompact: 24,
  compactBelow: 1280,
} as const

export const icon = {
  rail: { size: 22, weight: 300 },
  switcher: { size: 20, weight: 300 },
  inline: { size: 16, weight: 400 },
  pill: { size: 14, weight: 500 },
} as const

export const motion = {
  duration: { base: 160 },
  easing: { standard: 'ease' },
} as const

export const zIndex = { legend: 3, tooltip: 4, rail: 5, railTooltip: 20, modal: 400 } as const

export const shadow = {
  tooltip: '0 8px 24px rgba(0, 0, 0, 0.35)',
  popover: '0 12px 32px rgba(0, 0, 0, 0.4)',
  stage: '0 30px 80px rgba(0, 0, 0, 0.5)',
} as const
