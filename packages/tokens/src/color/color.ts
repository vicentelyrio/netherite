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
  base: { black: '#000000', white: '#FFFFFF' },
  bg: {
    shell: '#1E2032',
    canvas: '#282A3F',
    card: '#212336',
    cardHover: '#25273C',
    cardSelected: '#262840',
    column: '#2E3148',
    sunken: '#18192A',
    chip: '#2E3149',
    overlay: '#15162A',
    track: '#34374F',
    activeLine: '#2A2C45',
    thumb: '#F4F4FA',
    stage: '#141522',
  },
  border: {
    rail: '#2A2C42',
    subtle: '#2F3250',
    divider: '#33364F',
    overlay: '#393C58',
    strong: '#474B6E',
  },
  text: {
    primary: '#E8E9F3',
    secondary: '#B9BCD3',
    muted: '#969AB8',
    faint: '#6E7292',
    lineNumber: '#8A8FAD',
    icon: '#9EA2C4',
    onAccent: '#15162A',
  },
  accent: {
    fg: '#A5A7FF',
    fgHover: '#C9CAFF',
    solid: '#7F82EA',
    subtle: '#34365A',
    edgeActive: '#B7B9FF',
  },
  status: {
    success: '#2CC27E',
    warning: '#E2AE4C',
    warningText: '#DDB168',
    danger: '#F0717E',
    context: '#4FB3A6',
  },
  type: {
    goal: '#8F91F2',
    project: '#3BA474',
    task: '#D9A646',
    adr: '#D2A8F0',
    doc: '#8FC3F2',
    context: '#7ED6C8',
    runbook: '#F0B397',
  },
  state: { todo: '#969AB8', active: '#A5A7FF', blocked: '#E2AE4C', done: '#2CC27E' },
  adr: { proposed: '#A5A7FF', accepted: '#2CC27E', deprecated: '#F0717E', superseded: '#B9BCD3' },
  freshness: { fresh: '#2CC27E', drifting: '#E2AE4C', stale: '#E2AE4C', unknown: '#8A8FAD' },
  syntax: {
    key: '#F29AA5',
    string: '#A6DCAE',
    date: '#E8C07A',
    mention: '#A5A7FF',
    punct: '#8A8FAD',
    text: '#D4D6E8',
  },
  diff: { added: '#2CC27E', modified: '#E2AE4C', deleted: '#F0717E', lint: '#E2AE4C' },
  graph: {
    edge: '#50547A',
    edgeTyped: '#6A6E96',
    edgeWarm: '#7F82B8',
    arrow: '#7A7EA6',
    sample: '#B9BCD3',
    labelBg: 'rgba(30, 32, 50, 0.85)',
  },
} as const

export const tint = {
  pill: 0.14,
  pillNeutral: 0.16,
  banner: 0.1,
  bannerBorder: 0.35,
  ring: 0.2,
  dropTarget: 0.08,
  selectedRing: 0.18,
  panel: 0.94,
} as const

export type Color = typeof color
