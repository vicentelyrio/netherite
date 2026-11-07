import {
  type Config,
  type ItemSchemas,
  type ItemType,
  knownFields,
  makeItemSchemas,
} from '@netherite/schema'
import { Effect } from 'effect'
import type { ParseOptions } from '../../parse-pool'
import { scanItems } from '../../scan'
import type { ScannedItem } from '../../scanned-item'
import { openWorkspace, type Workspace } from '../../workspace'
import { createIndex, type WorkspaceIndex } from '../../workspace-index'

export interface Repo {
  readonly workspace: Workspace
  readonly index: WorkspaceIndex
  readonly schemas: ItemSchemas
  readonly fieldOrder: Readonly<Record<ItemType, ReadonlyArray<string>>>
  readonly contentRoot: string
  readonly applyConfig: (config: Config) => void
}

const derive = (workspace: Workspace) => {
  const schemas = makeItemSchemas(workspace.config)
  return { workspace, schemas, fieldOrder: knownFields(schemas) }
}

export const makeRepo = (workspace: Workspace, items: Iterable<ScannedItem>): Repo => {
  const index = createIndex({ config: workspace.config })
  index.build(items)
  let state = derive(workspace)
  return {
    get workspace() {
      return state.workspace
    },
    get schemas() {
      return state.schemas
    },
    get fieldOrder() {
      return state.fieldOrder
    },
    index,
    contentRoot: workspace.contentRoot
      .slice(workspace.root.length + 1)
      .split('\\')
      .join('/'),
    applyConfig: (config) => {
      state = derive({ ...state.workspace, config })
      index.setConfig(config)
    },
  }
}

export const openRepo = (startDir: string, parse?: ParseOptions) =>
  Effect.gen(function* () {
    const workspace = yield* openWorkspace(startDir)
    const items = yield* scanItems(workspace, parse)
    return makeRepo(workspace, items)
  })
