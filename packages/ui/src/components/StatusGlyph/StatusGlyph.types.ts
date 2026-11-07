import type { StatusName } from '@netherite/tokens'

export type StatusType = 'goal' | 'project' | 'task'

export interface StatusGlyphProps {
  readonly type: StatusType
  readonly status: StatusName
  readonly progress?: number
  readonly size?: number
  readonly label?: string
  readonly dimDone?: boolean
  readonly color?: string
  readonly className?: string
}
