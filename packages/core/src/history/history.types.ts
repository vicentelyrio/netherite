export interface Author {
  readonly name: string
  readonly email: string
}

export type FieldValue = string | ReadonlyArray<string> | undefined

export interface Transition {
  readonly id: string
  readonly type: string | undefined
  readonly field: string
  readonly from: FieldValue
  readonly to: FieldValue
  readonly kind: 'created' | 'changed' | 'seen'
  readonly hash: string
  readonly date: string
  readonly author: Author
}

export interface AuthorSummary extends Author {
  readonly commits: number
  readonly first: string
  readonly last: string
}

export interface ItemHistory {
  readonly id: string
  readonly type: string | undefined
  readonly paths: ReadonlyArray<string>
  readonly transitions: ReadonlyArray<Transition>
  readonly authors: ReadonlyArray<AuthorSummary>
  readonly created:
    | { readonly hash: string; readonly date: string; readonly author: Author }
    | undefined
  readonly deletedAt: string | undefined
  readonly commits: number
}

export interface History {
  readonly items: ReadonlyMap<string, ItemHistory>
  readonly commits: number
  readonly log: ReadonlyArray<{ readonly hash: string; readonly date: string }>
  readonly partial: boolean
}

export interface HistoryOptions {
  readonly contentRoot: string
  readonly fields?: ReadonlyArray<string>
  readonly after?: string
  readonly limit?: number
}

export interface Builder {
  id: string
  type: string | undefined
  paths: string[]
  transitions: Transition[]
  fields: Map<string, FieldValue>
  authors: Map<string, { author: Author; commits: number; first: string; last: string }>
  created: ItemHistory['created']
  deletedAt: string | undefined
  commits: number
  lastCounted: string | undefined
}
