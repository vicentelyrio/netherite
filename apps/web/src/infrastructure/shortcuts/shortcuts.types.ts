import type { ActionId, ShortcutScope } from './actions'

export interface Combo {
  readonly mod: boolean
  readonly shift: boolean
  readonly alt: boolean
  readonly key: string
}

export type ShortcutLayer = 'app' | 'page' | 'overlay'

export interface ShortcutOptions {
  readonly enabled?: boolean
  readonly mac?: boolean
  readonly layer?: ShortcutLayer
  readonly scope?: ShortcutScope
}

export interface ResolvedShortcut {
  readonly keys: string | null
  readonly aliases: ReadonlyArray<string>
}

export type ShortcutOverrides = Readonly<Partial<Record<ActionId, string | null>>>
