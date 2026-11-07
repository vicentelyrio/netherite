import { outlineMarkdown } from '@netherite/markdown'
import { type FieldIssue, ValidationError } from '@netherite/schema'
import { Effect } from 'effect'
import { contentHash } from '../hash'
import { readText } from '../io'
import type { Repo } from '../repo'
import { locate, mutate } from './mutate'
import type { OpOptions } from './operations.types'

export const readSource = (repo: Repo, id: string) =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    const text = yield* readText(repo, item.path)
    return { path: item.path, text, hash: contentHash(text) }
  })

export const replaceSource = (repo: Repo, id: string, text: string, options: OpOptions = {}) =>
  mutate(repo, [
    {
      id,
      baseHash: options.baseHash,
      edit: (_source, item) =>
        Effect.gen(function* () {
          const front = outlineMarkdown(text).frontmatter?.data
          const fields =
            typeof front === 'object' && front !== null ? (front as Record<string, unknown>) : {}
          const issues: FieldIssue[] = []
          if (fields.id !== item.id)
            issues.push({ path: ['id'], message: `id cannot be changed (it is ${item.id})` })
          if (fields.type !== item.type) {
            issues.push({ path: ['type'], message: `type cannot be changed (it is ${item.type})` })
          }
          return issues.length > 0 ? yield* new ValidationError({ issues }) : text
        }),
    },
  ])
