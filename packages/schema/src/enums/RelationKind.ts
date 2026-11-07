export const RelationKind = {
  BelongsTo: 'belongs_to',
  Implements: 'implements',
  Explains: 'explains',
  Supersedes: 'supersedes',
  DependsOn: 'depends_on',
  Related: 'related',
  Reference: 'reference',
} as const

export type RelationKind = (typeof RelationKind)[keyof typeof RelationKind]
