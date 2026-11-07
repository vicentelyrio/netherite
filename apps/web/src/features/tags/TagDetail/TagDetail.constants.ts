import { designColor } from '@netherite/ui'

export const usedKinds = [
  { key: 'goals', color: designColor.type.goal },
  { key: 'projects', color: designColor.type.project },
  { key: 'tasks', color: designColor.type.task },
  { key: 'docs', color: designColor.type.doc },
] as const

export const overviewSize = 8
export const unusedOpacity = 0.45
