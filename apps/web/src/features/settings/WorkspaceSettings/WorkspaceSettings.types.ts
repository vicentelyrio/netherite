import type { WorkspaceSettings } from '@netherite/api'

export interface WorkspaceSectionProps {
  readonly settings: typeof WorkspaceSettings.Type
  readonly save: (set: Readonly<Record<string, unknown>>) => void
}
