import {
  type Config,
  type ItemSchemas,
  type ItemType,
  knownFields,
  makeItemSchemas,
} from '@netherite/schema'
import { Effect } from 'effect'
import type { ParseOptions } from '../parse-pool'
import { scanItems } from '../scan'
import type { ScannedItem } from '../scanned-item'
import { openWorkspace, type Workspace } from '../workspace'
import { createIndex, type WorkspaceIndex } from '../workspace-index'

/** A workspace together with its live index. Operations read and update both. */
export interface Repo {
  /** The workspace and its config. Replaced when the config file changes. */
  readonly workspace: Workspace
  readonly index: WorkspaceIndex
  readonly schemas: ItemSchemas
  /** Field names of each type in schema order, so new fields are inserted in order. */
  readonly fieldOrder: Readonly<Record<ItemType, ReadonlyArray<string>>>
  /** Content root relative to the workspace root, such as `netherite`. */
  readonly contentRoot: string
  /** Switches to a new configuration, for the schemas, field order and index. */
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

/** Finds the workspace from `startDir`, scans it and builds the index. */
export const openRepo = (startDir: string, parse?: ParseOptions) =>
  Effect.gen(function* () {
    const workspace = yield* openWorkspace(startDir)
    const items = yield* scanItems(workspace, parse)
    return makeRepo(workspace, items)
  })
