import type { ReactElement } from 'react'

import { Goals } from 'templates/Goals/Goals'

export type WorkspaceNames = 'GOALS'
| 'GOAL'
| 'PROJECTS'
| 'PROJECT'
| 'TASK'
| 'INBOX'
| 'TOPICS'

export type WorkspaceComponents = typeof Goals

const WORKSPACE_TYPE: Partial<Record<WorkspaceNames, WorkspaceComponents>> = {
  GOALS: Goals,
  GOAL: Goals,
  PROJECTS: Goals,
  PROJECT: Goals,
  TASK: Goals,
  INBOX: Goals,
  TOPICS: Goals,
}

export const Workspace = ({ type }: { type: WorkspaceNames }): ReactElement | null => {
  const WorkspaceComponent = WORKSPACE_TYPE[type] as WorkspaceComponents

  if (!WorkspaceComponent) return null

  return (
    <WorkspaceComponent />
  )
}

