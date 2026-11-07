import type { ActionId } from './actions'

export interface Combo {
  readonly mod: boolean
  readonly shift: boolean
  readonly alt: boolean
  readonly key: string
}

export interface ShortcutOptions {
  readonly enabled?: boolean
  readonly mac?: boolean
}

export interface ResolvedShortcut {
  readonly keys: string | null
  readonly aliases: ReadonlyArray<string>
}

export type ShortcutOverrides = Readonly<Partial<Record<ActionId, string | null>>>
