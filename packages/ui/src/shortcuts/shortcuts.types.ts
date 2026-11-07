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
