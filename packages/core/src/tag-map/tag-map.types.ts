import type { TagField, TagUse } from '../ops/operations'

export interface TagNode extends TagUse {
  readonly cluster: string
  readonly often: ReadonlyArray<{
    readonly field: TagField
    readonly name: string
    readonly count: number
  }>
}

export interface TagEdge {
  readonly a: { readonly field: TagField; readonly name: string }
  readonly b: { readonly field: TagField; readonly name: string }
  readonly count: number
}

export interface TagDuplicate {
  readonly a: { readonly field: TagField; readonly name: string }
  readonly b: { readonly field: TagField; readonly name: string }
  readonly reason: 'name' | 'neighbours'
  readonly score: number
}

export interface TagMap {
  readonly tags: ReadonlyArray<TagNode>
  readonly edges: ReadonlyArray<TagEdge>
  readonly clusters: ReadonlyArray<{ readonly name: string; readonly tags: number }>
  readonly duplicates: ReadonlyArray<TagDuplicate>
}
