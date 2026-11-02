/**
 * Every action the app can run from the keyboard, with the keys it has out of the box. A person's
 * own choice (see `settings`) replaces `keys`; `aliases` are extra keys for shortcuts a browser
 * keeps for itself (Command-L focuses the address bar), and apply only to the default.
 */
export const actions = {
  'search.open': { label: 'Search', keys: 'mod+k' },
  'go.inbox': { label: 'Inbox', keys: 'mod+i' },
  'go.goals': { label: 'Goals', keys: 'mod+g' },
  'go.projects': { label: 'Projects', keys: 'mod+p', aliases: ['mod+alt+p'] },
  'go.knowledge': { label: 'Knowledge', keys: 'mod+l', aliases: ['mod+alt+l'] },
  'go.stats': { label: 'Stats', keys: 'mod+d', aliases: ['mod+alt+d'] },
  'go.tags': { label: 'Tags', keys: 'mod+t', aliases: ['mod+alt+t'] },
  'go.graph': { label: 'Graph', keys: 'mod+shift+g' },
} as const satisfies Record<
  string,
  { readonly label: string; readonly keys: string; readonly aliases?: ReadonlyArray<string> }
>

export type ActionId = keyof typeof actions

export const actionIds = Object.keys(actions) as ReadonlyArray<ActionId>

export const isActionId = (value: string): value is ActionId => value in actions
