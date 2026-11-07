export const KnowledgeStatus = {
  Active: 'active',
  Deprecated: 'deprecated',
  Superseded: 'superseded',
} as const

export type KnowledgeStatus = (typeof KnowledgeStatus)[keyof typeof KnowledgeStatus]
