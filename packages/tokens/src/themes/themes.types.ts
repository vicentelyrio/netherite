import type { color } from '../color'

type Widen<V> = { readonly [K in keyof V]: V[K] extends string ? string : Widen<V[K]> }

export type ColorSet = Widen<typeof color>

export type ColorScheme = 'dark' | 'light'

export interface ThemeSource {
  readonly url: string
  readonly license: string
}

export interface Theme {
  readonly id: string
  readonly name: string
  readonly scheme: ColorScheme
  readonly colors: ColorSet
  readonly source?: ThemeSource
}

export interface ThemeSeed {
  readonly scheme: ColorScheme
  readonly shell: string
  readonly canvas: string
  readonly card: string
  readonly sunken: string
  readonly overlay: string
  readonly stage: string
  readonly primary: string
  readonly secondary: string
  readonly muted: string
  readonly accent: string
  readonly solid: string
  readonly onAccent: string
  readonly success: string
  readonly warning: string
  readonly danger: string
  readonly type: ColorSet['type']
  readonly key: string
  readonly string: string
  readonly date: string
}
