import { type ItemType, itemTypes } from '@netherite/schema'
import { adr } from './items/adr'
import { context } from './items/context'
import { doc } from './items/doc'
import { goal } from './items/goal'
import { project } from './items/project'
import { runbook } from './items/runbook'
import { task } from './items/task'

export const templates: Readonly<Record<ItemType, string>> = {
  goal,
  project,
  task,
  adr,
  doc,
  context,
  runbook,
}

export const templateTypes: ReadonlyArray<ItemType> = itemTypes

export const templatesFolder = 'templates'
