import type { Repo } from '@netherite/core'

export interface ToolScope {
  readonly repo: Repo
  readonly hash: Readonly<Record<string, unknown>>
  readonly filters: Readonly<Record<string, unknown>>
  readonly schemas: Readonly<Record<string, unknown>>
}
