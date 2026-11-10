import type { ShortcutLayer } from './shortcuts.types'

export type ShortcutScope =
  | 'global'
  | 'section'
  | 'inbox'
  | 'tags'
  | 'board'
  | 'drawer'
  | 'goals'
  | 'knowledge'
  | 'graph'
  | 'editor'
export type ShortcutGroup = Exclude<ShortcutScope, 'global' | 'section'> | 'navigation' | 'movement'

export interface ActionDefinition {
  readonly scope: ShortcutScope
  readonly group: ShortcutGroup
  readonly keys: string
  readonly aliases?: ReadonlyArray<string>
  readonly fixed?: boolean
}

export const actions = {
  'search.open': { scope: 'global', group: 'navigation', keys: 'mod+k' },
  'help.open': { scope: 'global', group: 'navigation', keys: '?' },
  'go.inbox': { scope: 'global', group: 'navigation', keys: 'g i' },
  'go.goals': { scope: 'global', group: 'navigation', keys: 'g g' },
  'go.projects': { scope: 'global', group: 'navigation', keys: 'g p' },
  'go.knowledge': { scope: 'global', group: 'navigation', keys: 'g k' },
  'go.stats': { scope: 'global', group: 'navigation', keys: 'g d' },
  'go.tags': { scope: 'global', group: 'navigation', keys: 'g t' },
  'go.timeline': { scope: 'global', group: 'navigation', keys: 'g l' },
  'go.graph': { scope: 'global', group: 'navigation', keys: 'g r' },
  'go.settings': { scope: 'global', group: 'navigation', keys: 'g s' },
  'section.next': { scope: 'section', group: 'movement', keys: '.', aliases: ['f6'] },
  'section.previous': { scope: 'section', group: 'movement', keys: ',', aliases: ['shift+f6'] },
  'section.sidebar': { scope: 'section', group: 'movement', keys: ';' },
  'item.next': { scope: 'section', group: 'movement', keys: 'j', aliases: ['arrowdown'] },
  'item.previous': { scope: 'section', group: 'movement', keys: 'k', aliases: ['arrowup'] },
  'item.open': { scope: 'section', group: 'movement', keys: 'enter', fixed: true },
  'item.back': { scope: 'section', group: 'movement', keys: 'escape', fixed: true },
  'inbox.next': { scope: 'inbox', group: 'inbox', keys: 'j' },
  'inbox.previous': { scope: 'inbox', group: 'inbox', keys: 'k' },
  'inbox.archive': { scope: 'inbox', group: 'inbox', keys: 'e' },
  'inbox.snooze': { scope: 'inbox', group: 'inbox', keys: 'h' },
  'inbox.capture': { scope: 'inbox', group: 'inbox', keys: 'n' },
  'tags.search': { scope: 'tags', group: 'tags', keys: '/' },
  'board.down': { scope: 'board', group: 'board', keys: 'j', aliases: ['arrowdown'] },
  'board.up': { scope: 'board', group: 'board', keys: 'k', aliases: ['arrowup'] },
  'board.left': { scope: 'board', group: 'board', keys: 'h', aliases: ['arrowleft'] },
  'board.right': { scope: 'board', group: 'board', keys: 'l', aliases: ['arrowright'] },
  'board.moveLeft': { scope: 'board', group: 'board', keys: 'shift+h' },
  'board.moveRight': { scope: 'board', group: 'board', keys: 'shift+l' },
  'board.move': { scope: 'board', group: 'board', keys: 'm' },
  'board.new': { scope: 'board', group: 'board', keys: 'n' },
  'drawer.mode': { scope: 'drawer', group: 'drawer', keys: 't' },
  'goals.new': { scope: 'goals', group: 'goals', keys: 'n' },
  'knowledge.new': { scope: 'knowledge', group: 'knowledge', keys: 'n' },
  'knowledge.filter': { scope: 'knowledge', group: 'knowledge', keys: '/' },
  'graph.zoomIn': { scope: 'graph', group: 'graph', keys: 'plus', aliases: ['='] },
  'graph.zoomOut': { scope: 'graph', group: 'graph', keys: '-' },
  'graph.reset': { scope: 'graph', group: 'graph', keys: '0' },
  'editor.save': { scope: 'editor', group: 'editor', keys: 'mod+s' },
} as const satisfies Record<string, ActionDefinition>

export const scopeLayers: Readonly<Record<ShortcutScope, ShortcutLayer>> = {
  global: 'app',
  section: 'app',
  inbox: 'page',
  tags: 'page',
  board: 'page',
  drawer: 'overlay',
  goals: 'page',
  knowledge: 'page',
  graph: 'page',
  editor: 'page',
}

export type ActionId = keyof typeof actions

export const actionIds = Object.keys(actions) as ReadonlyArray<ActionId>

export const isActionId = (value: string): value is ActionId => value in actions

export const groupOrder: ReadonlyArray<ShortcutGroup> = [
  'navigation',
  'movement',
  'inbox',
  'board',
  'drawer',
  'goals',
  'knowledge',
  'tags',
  'graph',
  'editor',
]
