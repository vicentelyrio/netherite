export type SettingValue =
  | string
  | number
  | boolean
  | ReadonlyArray<unknown>
  | Readonly<Record<string, unknown>>

export const SettingSource = {
  ConfigFile: 'config-file',
  CliFlag: 'cli-flag',
  Browser: 'browser',
  Constant: 'constant',
} as const
export type SettingSource = (typeof SettingSource)[keyof typeof SettingSource]

export const SettingKind = {
  Integer: 'integer',
  Text: 'text',
  Boolean: 'boolean',
  List: 'list',
  Map: 'map',
} as const
export type SettingKind = (typeof SettingKind)[keyof typeof SettingKind]

export interface SettingDefinition<V extends SettingValue = SettingValue> {
  readonly default: V
  readonly kind: SettingKind
  readonly source: SettingSource
  readonly description: string
  readonly locator?: string
  readonly unit?: 'ms' | 'bytes' | 'tokens' | 'commits' | 'files' | 'chars' | 'items'
  readonly min?: number
  readonly max?: number
}

export type SettingArea = Readonly<Record<string, SettingDefinition>>

export type DefaultsOf<A extends SettingArea> = { readonly [K in keyof A]: A[K]['default'] }
