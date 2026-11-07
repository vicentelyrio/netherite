import type { WeekCount } from '../history'
import type { NodeStatus } from '../views'

export interface TimelineHold {
  readonly from: string
  readonly to?: string
}

export interface TimelineBase {
  readonly id: string
  readonly title: string
  readonly status: NodeStatus
  readonly progress: number
  readonly created?: string
  readonly started?: string
  readonly finished?: string
  readonly due?: string
  readonly overdue: boolean
  readonly planned: boolean
  readonly holds: ReadonlyArray<TimelineHold>
  readonly approximate: boolean
}

export interface TimelineGoal extends TimelineBase {
  readonly horizon?: string
}

export interface TimelineProject extends TimelineBase {
  readonly goal?: string
  readonly milestone?: string
}

export interface TimelineTask extends TimelineBase {
  readonly project?: string
}

export interface TimelineDecision {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly project?: string
  readonly proposed?: string
  readonly accepted?: string
  readonly ended?: string
}

export interface Timeline {
  readonly from: string
  readonly to: string
  readonly today: string
  readonly goals: ReadonlyArray<TimelineGoal>
  readonly projects: ReadonlyArray<TimelineProject>
  readonly tasks: ReadonlyArray<TimelineTask>
  readonly decisions: ReadonlyArray<TimelineDecision>
  readonly activity: ReadonlyArray<WeekCount>
  readonly approximate: boolean
}

export interface TimelineOptions {
  readonly from?: string
  readonly to?: string
  readonly now?: string
}
