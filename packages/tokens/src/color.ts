/**
 * Colours from the "Netherite Refined" design (token sheets T1 and T2 in the Claude Design project
 * "Netherite UI Refinement"). The design is dark only, so there is one set. Where the sheets do not
 * say, a value is marked "not in the design" and is the nearest choice made from the sheet's own
 * colours.
 */

/** The seven kinds of item. Matches `itemTypes` in `@netherite/schema`. */
export const itemTypeNames = [
  'goal',
  'project',
  'task',
  'adr',
  'doc',
  'context',
  'runbook',
] as const
export type ItemTypeName = (typeof itemTypeNames)[number]

/** Task states group into categories in the config; colours follow the category. */
export const stateCategories = ['todo', 'active', 'blocked', 'done'] as const
export type StateCategory = (typeof stateCategories)[number]

export const adrStatuses = ['proposed', 'accepted', 'deprecated', 'superseded'] as const
export type AdrStatus = (typeof adrStatuses)[number]

export const freshnessStates = ['fresh', 'drifting', 'stale', 'unknown'] as const
export type FreshnessState = (typeof freshnessStates)[number]

export const edgeKinds = [
  'belongs_to',
  'implements',
  'explains',
  'supersedes',
  'co_changes',
  'depends_on',
  'related',
  'reference',
] as const
export type EdgeKind = (typeof edgeKinds)[number]

export const color = {
  bg: {
    /** The rail. */
    shell: '#1E2032',
    /** The page. */
    canvas: '#282A3F',
    card: '#212336',
    cardHover: '#25273C',
    cardSelected: '#262840',
    /** Board columns, hovered rows, menus' hover. */
    column: '#2E3148',
    /** Groups of controls, toggles, the graph legend's ground. */
    sunken: '#18192A',
    /** The chip ground behind type badges. */
    chip: '#2E3149',
    /** Tooltips, popovers and the graph tooltip. */
    overlay: '#15162A',
    /** Bars and rings that show progress. */
    track: '#34374F',
    /** The editor's line under the cursor, and its line number's ground. */
    activeLine: '#2A2C45',
    /** The knob of a switch. */
    thumb: '#F4F4FA',
    /** The presentation canvas around screens; not used in the app. */
    stage: '#141522',
  },
  border: {
    rail: '#2A2C42',
    subtle: '#2F3250',
    divider: '#33364F',
    /** The edge of tooltips and popovers. */
    overlay: '#393C58',
    strong: '#474B6E',
  },
  text: {
    primary: '#E8E9F3',
    secondary: '#B9BCD3',
    muted: '#969AB8',
    /** Decoration only: 3.0:1 on the canvas, so never for text that has to be read. */
    faint: '#6E7292',
    lineNumber: '#8A8FAD',
    /** Idle icons in the rail. */
    icon: '#9EA2C4',
    /** Text on a solid accent fill. */
    onAccent: '#15162A',
  },
  accent: {
    /** Links, active icons, focus and selection outlines. */
    fg: '#A5A7FF',
    fgHover: '#C9CAFF',
    /** Fills: the logo, primary buttons, bars. */
    solid: '#7F82EA',
    /** The active ground of rail items and tabs. */
    subtle: '#34365A',
    /** The graph edge next to the pointer. */
    edgeActive: '#B7B9FF',
  },
  status: {
    success: '#2CC27E',
    warning: '#E2AE4C',
    /** Warning as text: slightly lighter so it reads (drifting). */
    warningText: '#DDB168',
    danger: '#F0717E',
    /** The "include in AI context" toggle. */
    context: '#4FB3A6',
  },
  /** Colour of each kind of item: badges and graph nodes. */
  type: {
    goal: '#8F91F2',
    project: '#3BA474',
    task: '#D9A646',
    adr: '#D2A8F0',
    doc: '#8FC3F2',
    context: '#7ED6C8',
    runbook: '#F0B397',
  },
  /** Not in the design: states are shown by progress, with "on hold" in amber. */
  state: { todo: '#969AB8', active: '#A5A7FF', blocked: '#E2AE4C', done: '#2CC27E' },
  adr: { proposed: '#A5A7FF', accepted: '#2CC27E', deprecated: '#F0717E', superseded: '#B9BCD3' },
  freshness: { fresh: '#2CC27E', drifting: '#E2AE4C', stale: '#E2AE4C', unknown: '#8A8FAD' },
  /** Editor syntax: frontmatter keys, strings, dates, `@mentions` (and Markdown marks), punctuation, text. */
  syntax: {
    key: '#F29AA5',
    string: '#A6DCAE',
    date: '#E8C07A',
    mention: '#A5A7FF',
    punct: '#8A8FAD',
    text: '#D4D6E8',
  },
  /** The editor's change gutter, from git. */
  diff: { added: '#2CC27E', modified: '#E2AE4C', deleted: '#F0717E', lint: '#E2AE4C' },
  graph: {
    /** Belongs-to lines. */
    edge: '#50547A',
    /** Lines for typed relations. */
    edgeTyped: '#6A6E96',
    /** Lines of the focused node's neighbours. */
    edgeWarm: '#7F82B8',
    arrow: '#7A7EA6',
    /** Legend line samples. */
    sample: '#B9BCD3',
    /** Behind a node's label. */
    labelBg: 'rgba(30, 32, 50, 0.85)',
  },
} as const

/** Opacity of the tinted grounds behind pills and banners, which take the colour of their text. */
export const tint = {
  pill: 0.14,
  /** The "superseded" pill sits on a neutral, a little stronger. */
  pillNeutral: 0.16,
  banner: 0.1,
  bannerBorder: 0.35,
  /** The ring fill of a context node and badge. */
  ring: 0.2,
  dropTarget: 0.08,
  /** The glow around the selected card. */
  selectedRing: 0.18,
  /** Panels laid over the graph. */
  panel: 0.94,
} as const

export type Color = typeof color
