import { type ItemType, itemTypes } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import type { Workspace } from '../workspace'
import { templateBody } from './templateBody'
import { templates, templatesFolder } from './templates'

export const starterBody = (
  workspace: Pick<Workspace, 'root' | 'contentRoot'>,
  type: ItemType,
  title: string,
) =>
  readTemplates(workspace).pipe(
    Effect.map((found) => {
      const own = found.find((t) => t.type === type)
      return own === undefined ? undefined : templateBody(own.text, title)
    }),
  )

export interface TemplateSource {
  readonly type: ItemType
  readonly source: 'workspace' | 'built-in'
  readonly path?: string
  readonly text: string
}

export const readTemplates = (workspace: Pick<Workspace, 'root' | 'contentRoot'>) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    return yield* Effect.forEach(itemTypes, (type) =>
      Effect.gen(function* () {
        const file = path.join(workspace.contentRoot, templatesFolder, `${type}.md`)
        const own = yield* fs.readFileString(file).pipe(Effect.option)
        if (own._tag === 'None') {
          return { type, source: 'built-in', text: templates[type] } satisfies TemplateSource
        }
        return {
          type,
          source: 'workspace',
          path: path.relative(workspace.root, file).split(path.sep).join('/'),
          text: own.value,
        } satisfies TemplateSource
      }),
    )
  })
