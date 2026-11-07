import type { AdrStatus, FreshnessState, ItemTypeName } from '@netherite/tokens'

export interface UiLabels {
  readonly dismiss: string
  readonly waiting: (label: string, count: number) => string
  readonly progress: string
  readonly progressOf: (label: string, done: number, total: number) => string
  readonly freshness: Readonly<Record<FreshnessState, string>>
  readonly types: Readonly<Record<ItemTypeName, string>>
  readonly adrStatus: Readonly<Record<AdrStatus, string>>
  readonly commits: (count: number, atLeast: boolean) => string
  readonly coveredSince: (commits: string, since: string) => string
}
