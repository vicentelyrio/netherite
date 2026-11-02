/** Fonts. The variable fonts are self-hosted by `@netherite/ui/fonts.css`; the fallbacks cover the moment before they load. */
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
  /** In em. */
  readonly letterSpacing: number
  readonly uppercase?: true
}

/** The type scale from sheet T1, and the small caps label both sheets use for section titles. */
export const textStyle = {
  display: { family: 'sans', size: 28, lineHeight: 34, weight: 600, letterSpacing: -0.01 },
  title: { family: 'sans', size: 20, lineHeight: 26, weight: 600, letterSpacing: 0 },
  heading: { family: 'sans', size: 16, lineHeight: 22, weight: 600, letterSpacing: 0 },
  body: { family: 'sans', size: 15, lineHeight: 22, weight: 400, letterSpacing: 0 },
  bodySm: { family: 'sans', size: 14, lineHeight: 20, weight: 400, letterSpacing: 0 },
  caption: { family: 'sans', size: 13, lineHeight: 18, weight: 500, letterSpacing: 0 },
  micro: { family: 'sans', size: 12, lineHeight: 16, weight: 500, letterSpacing: 0 },
  mono: { family: 'mono', size: 13, lineHeight: 22, weight: 400, letterSpacing: 0 },
  /** Not in T1's list but on every sheet: 12/16, 600, 6% tracking, upper case. */
  overline: {
    family: 'sans',
    size: 12,
    lineHeight: 16,
    weight: 600,
    letterSpacing: 0.06,
    uppercase: true,
  },
  /** Not in the design: code in small places (shortcut keys use it at 12/16). */
  monoSm: { family: 'mono', size: 12, lineHeight: 16, weight: 400, letterSpacing: 0 },
} as const satisfies Record<string, TextStyle>
export type TextStyleName = keyof typeof textStyle

/** Font sizes in px, from the styles above. */
export const fontSize = {
  micro: textStyle.micro.size,
  caption: textStyle.caption.size,
  bodySm: textStyle.bodySm.size,
  body: textStyle.body.size,
  heading: textStyle.heading.size,
  title: textStyle.title.size,
  display: textStyle.display.size,
} as const

/** A 4px grid: `space[1]` is 4px … `space[10]` is 64px (T1 names them space-1 to space-10). */
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

/**
 * Corner radii from T1: chip, button, card, column, pill. The extra sizes are ones the screens use
 * that the sheet does not name: 7 (small square buttons), 8 (tooltips, the logo), 12 (rail groups).
 */
export const radius = { xs: 4, sm: 6, md: 10, lg: 14, full: 999 } as const
export const radiusExtra = { control: 7, tooltip: 8, group: 12 } as const

/** Sizes of the app's frame and its parts, measured from the screens. */
export const layout = {
  /** Screens are designed at 1920 by 1080. */
  screen: { width: 1920, height: 1080 },
  railWidth: 64,
  railItem: 40,
  /** Space left of a screen's content. */
  pageInset: 96,
  /** The rail's logo, and the avatar below the groups. */
  logo: 32,
  avatar: 32,
  /** The knowledge switcher's targets. */
  switcher: { width: 36, height: 32 },
  tooltipHeight: 32,
  cardPadding: 16,
  cardGap: { board: 8, list: 12 },
  columnGap: 16,
  /** The task drawer (TaskDrawer.dc.html): text only is 912 wide; with the code pane, 1792. */
  drawer: { text: 912, split: 1792, codePane: 880, header: 48, statusBar: 32 },
  /** The edge bar beside the active rail item. */
  railBar: { width: 3, height: 20 },
  focusRing: 2,
} as const

/** Icon sizes and strokes (sheet T1, "Icons"). */
export const icon = {
  rail: { size: 22, weight: 300 },
  switcher: { size: 20, weight: 300 },
  inline: { size: 16, weight: 400 },
  pill: { size: 14, weight: 500 },
} as const

export const motion = {
  /** Nodes fade and glow over this long. */
  duration: { base: 160 },
  easing: { standard: 'ease' },
} as const

/** Stacking, from the screens: the graph's legend, its tooltip, the rail, the rail's tooltip. */
export const zIndex = { legend: 3, tooltip: 4, rail: 5, railTooltip: 20, modal: 400 } as const

export const shadow = {
  /** Rail tooltips. */
  tooltip: '0 8px 24px rgba(0, 0, 0, 0.35)',
  /** The graph tooltip. */
  popover: '0 12px 32px rgba(0, 0, 0, 0.4)',
  /** A screen on the presentation canvas; not used in the app. */
  stage: '0 30px 80px rgba(0, 0, 0, 0.5)',
} as const
