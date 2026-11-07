import type { YAMLMap } from 'yaml'

export interface FieldEditOptions {
  readonly order?: ReadonlyArray<string>
}

export interface ListEditOptions extends FieldEditOptions {
  readonly unique?: boolean
  readonly style?: 'flow' | 'block'
}

export type Json =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<Json>
  | { readonly [key: string]: Json }

export interface Parsed {
  readonly block: string
  readonly map: YAMLMap | undefined
  readonly eol: string
  readonly start: number
  readonly end: number
  readonly source: string
}
