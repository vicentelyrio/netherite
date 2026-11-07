export type ShortcutScope = 'global' | 'inbox' | 'tags' | 'editor'
export type ShortcutGroup = 'navigation' | 'inbox' | 'tags' | 'editor'

export interface ActionDefinition {
  readonly scope: ShortcutScope
  readonly group: ShortcutGroup
  readonly keys: string
  readonly aliases?: ReadonlyArray<string>
}

export const actions = {
  'search.open': { scope: 'global', group: 'navigation', keys: 'mod+k' },
  'go.inbox': { scope: 'global', group: 'navigation', keys: 'mod+i' },
  'go.goals': { scope: 'global', group: 'navigation', keys: 'mod+g' },
  'go.projects': { scope: 'global', group: 'navigation', keys: 'mod+p', aliases: ['mod+alt+p'] },
  'go.knowledge': { scope: 'global', group: 'navigation', keys: 'mod+l', aliases: ['mod+alt+l'] },
  'go.stats': { scope: 'global', group: 'navigation', keys: 'mod+d', aliases: ['mod+alt+d'] },
  'go.tags': { scope: 'global', group: 'navigation', keys: 'mod+t', aliases: ['mod+alt+t'] },
  'go.timeline': { scope: 'global', group: 'navigation', keys: 'mod+y', aliases: ['mod+alt+y'] },
  'go.graph': { scope: 'global', group: 'navigation', keys: 'mod+shift+g' },
  'go.settings': { scope: 'global', group: 'navigation', keys: 'mod+,' },
  'inbox.next': { scope: 'inbox', group: 'inbox', keys: 'j' },
  'inbox.previous': { scope: 'inbox', group: 'inbox', keys: 'k' },
  'inbox.archive': { scope: 'inbox', group: 'inbox', keys: 'e' },
  'inbox.snooze': { scope: 'inbox', group: 'inbox', keys: 'h' },
  'tags.search': { scope: 'tags', group: 'tags', keys: '/' },
  'editor.save': { scope: 'editor', group: 'editor', keys: 'mod+s' },
} as const satisfies Record<string, ActionDefinition>

export type ActionId = keyof typeof actions

export const actionIds = Object.keys(actions) as ReadonlyArray<ActionId>

export const isActionId = (value: string): value is ActionId => value in actions

export const groupOrder: ReadonlyArray<ShortcutGroup> = ['navigation', 'inbox', 'tags', 'editor']
