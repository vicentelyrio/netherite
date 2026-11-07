import { designColor } from '@netherite/ui'

export const palette = [
  designColor.type.goal,
  designColor.type.project,
  designColor.type.task,
  designColor.type.adr,
  designColor.type.doc,
  designColor.type.runbook,
  designColor.type.context,
] as const

export const zoomLimits = { min: 0.5, max: 3, step: 1.25 } as const
export const wheelSpeed = 0.0015
export const panSlop = 3
export const nodeSlop = 4
export const dupeDash = '5 4'
export const dupeWidth = 1.5
export const edgeBase = 1
export const edgeRange = 5
export const bubbleOpacity = 0.22
export const bubbleStroke = { on: 3, off: 1.5 } as const
export const countOffset = 14
