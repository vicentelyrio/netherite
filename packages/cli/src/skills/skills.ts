import { adrSkill } from './items/adr'
import { contextSkill } from './items/context'
import { discoverSkill } from './items/discover'
import { migrateSkill } from './items/migrate'
import { planSkill } from './items/plan'
import { refreshSkill } from './items/refresh'
import { taskSkill } from './items/task'
import type { Skill } from './skill'

export const skills: ReadonlyArray<Skill> = [
  adrSkill,
  planSkill,
  taskSkill,
  refreshSkill,
  contextSkill,
  migrateSkill,
  discoverSkill,
]
