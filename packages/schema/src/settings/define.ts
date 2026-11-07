import {
  type SettingDefinition,
  SettingKind,
  SettingSource,
  type SettingValue,
} from './settings.types'

type Options = Omit<SettingDefinition, 'default' | 'kind' | 'source' | 'description'>

const primitive =
  <Base extends SettingValue>(kind: SettingKind) =>
  (
    value: Base,
    source: SettingSource,
    description: string,
    options: Options = {},
  ): SettingDefinition<Base> => ({ default: value, kind, source, description, ...options })

const structured =
  <Base extends SettingValue>(kind: SettingKind) =>
  <V extends Base>(
    value: V,
    source: SettingSource,
    description: string,
    options: Options = {},
  ): SettingDefinition<V> => ({ default: value, kind, source, description, ...options })

export const integer = primitive<number>(SettingKind.Integer)
export const text = primitive<string>(SettingKind.Text)
export const boolean = primitive<boolean>(SettingKind.Boolean)
export const list = structured<ReadonlyArray<unknown>>(SettingKind.List)
export const map = structured<Readonly<Record<string, unknown>>>(SettingKind.Map)

export const { ConfigFile, CliFlag, Browser, Constant } = SettingSource
