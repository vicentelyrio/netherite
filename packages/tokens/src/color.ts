export type Scheme = 'dark' | 'light'

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
  'depends_on',
  'related',
  'reference',
  'co_changes',
] as const
export type EdgeKind = (typeof edgeKinds)[number]

export interface ColorTokens {
  readonly bg: {
    /** The page behind everything. */
    readonly canvas: string
    /** Panels and the rail. */
    readonly surface: string
    /** Cards and inputs sitting on a surface. */
    readonly raised: string
    /** Menus, popovers, modals. */
    readonly overlay: string
    readonly hover: string
    readonly selected: string
  }
  readonly border: { readonly subtle: string; readonly default: string; readonly strong: string }
  readonly text: {
    readonly primary: string
    readonly secondary: string
    /** Hints and metadata. Still readable (4.5:1). */
    readonly muted: string
    /** Text on a solid accent or status fill. */
    readonly onAccent: string
  }
  readonly accent: {
    /** Ten shades, lightest first, for the UI library's colour scale. */
    readonly scale: readonly [
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
    /** The accent used for text, icons and focus rings on this scheme's surfaces. */
    readonly fg: string
    /** The accent as a fill (buttons, selected tabs). */
    readonly solid: string
    readonly solidHover: string
  }
  readonly status: {
    readonly success: string
    readonly warning: string
    readonly danger: string
    readonly info: string
  }
  readonly focus: string
  /** Colour of each kind of item: badges, graph nodes, card edges. */
  readonly type: Readonly<Record<ItemTypeName, string>>
  readonly state: Readonly<Record<StateCategory, string>>
  readonly adr: Readonly<Record<AdrStatus, string>>
  readonly freshness: Readonly<Record<FreshnessState, string>>
  /** Editor syntax highlighting. */
  readonly syntax: {
    readonly property: string
    readonly string: string
    readonly number: string
    readonly keyword: string
    readonly comment: string
    readonly heading: string
    readonly link: string
    readonly wikilink: string
    readonly code: string
    readonly quote: string
    readonly meta: string
    readonly invalid: string
  }
  /** The editor's change gutter, from git. */
  readonly diff: { readonly added: string; readonly modified: string; readonly deleted: string }
}

const accentDark = [
  '#fdf3ec',
  '#f8e0cf',
  '#f1c3a0',
  '#ea9f6c',
  '#e38441',
  '#de7329',
  '#dc6a1d',
  '#c45a12',
  '#ae4f0d',
  '#964305',
] as const

const accentLight = [
  '#fdf3ec',
  '#f8e0cf',
  '#f1c3a0',
  '#ea9f6c',
  '#e38441',
  '#d06a1e',
  '#b95a14',
  '#a84c0b',
  '#8f3f08',
  '#783405',
] as const

const dark: ColorTokens = {
  bg: {
    canvas: '#121113',
    surface: '#1a181b',
    raised: '#232025',
    overlay: '#2c282e',
    hover: '#2a272c',
    selected: '#3a2f2a',
  },
  border: { subtle: '#2f2b32', default: '#3d3842', strong: '#57505c' },
  text: { primary: '#ece8ee', secondary: '#b8b1bd', muted: '#9b94a1', onAccent: '#1a0f08' },
  accent: { scale: accentDark, fg: '#ea9f6c', solid: '#dc6a1d', solidHover: '#e37a35' },
  status: { success: '#5fbf8a', warning: '#e0b24d', danger: '#f06b6b', info: '#6aa8f0' },
  focus: '#ea9f6c',
  type: {
    goal: '#e3b341',
    project: '#5ea1ff',
    task: '#4cc3b0',
    adr: '#b08cff',
    doc: '#8ec07c',
    context: '#f07fb0',
    runbook: '#ff9e64',
  },
  state: { todo: '#8da2c0', active: '#6aa8f0', blocked: '#f06b6b', done: '#5fbf8a' },
  adr: { proposed: '#e0b24d', accepted: '#5fbf8a', deprecated: '#9b94a1', superseded: '#b08cff' },
  freshness: { fresh: '#5fbf8a', drifting: '#e0b24d', stale: '#f06b6b', unknown: '#9b94a1' },
  syntax: {
    property: '#8ec7ff',
    string: '#a5d6a7',
    number: '#f2a65a',
    keyword: '#c792ea',
    comment: '#9b94a1',
    heading: '#ece8ee',
    link: '#6aa8f0',
    wikilink: '#ea9f6c',
    code: '#f0c987',
    quote: '#9b94a1',
    meta: '#9b94a1',
    invalid: '#f06b6b',
  },
  diff: { added: '#5fbf8a', modified: '#6aa8f0', deleted: '#f06b6b' },
}

const light: ColorTokens = {
  bg: {
    canvas: '#faf8fa',
    surface: '#ffffff',
    raised: '#f3f0f4',
    overlay: '#ffffff',
    hover: '#f0ecf1',
    selected: '#fbe9dc',
  },
  border: { subtle: '#ebe6ee', default: '#d9d2de', strong: '#b3a9ba' },
  text: { primary: '#1d1a1f', secondary: '#4e4753', muted: '#6e6674', onAccent: '#ffffff' },
  accent: { scale: accentLight, fg: '#a84c0b', solid: '#b95a14', solidHover: '#a84c0b' },
  status: { success: '#1f8a55', warning: '#9a6b00', danger: '#c93c3c', info: '#2f6fc0' },
  focus: '#a84c0b',
  type: {
    goal: '#9a6b00',
    project: '#1f62c4',
    task: '#0f7f70',
    adr: '#6a3fd0',
    doc: '#3f7d2a',
    context: '#b82d72',
    runbook: '#b8530f',
  },
  state: { todo: '#4f6684', active: '#2f6fc0', blocked: '#c93c3c', done: '#1f8a55' },
  adr: { proposed: '#9a6b00', accepted: '#1f8a55', deprecated: '#6e6674', superseded: '#6a3fd0' },
  freshness: { fresh: '#1f8a55', drifting: '#9a6b00', stale: '#c93c3c', unknown: '#6e6674' },
  syntax: {
    property: '#1f62c4',
    string: '#2b7a3a',
    number: '#a5560a',
    keyword: '#7a3fb8',
    comment: '#6e6674',
    heading: '#1d1a1f',
    link: '#1f62c4',
    wikilink: '#a84c0b',
    code: '#8a5a00',
    quote: '#5d5663',
    meta: '#6e6674',
    invalid: '#b83232',
  },
  diff: { added: '#1f8a55', modified: '#2f6fc0', deleted: '#c93c3c' },
}

/** Colours for each scheme. Dark is the design's home; light follows the same roles. */
export const color: Readonly<Record<Scheme, ColorTokens>> = { dark, light }
