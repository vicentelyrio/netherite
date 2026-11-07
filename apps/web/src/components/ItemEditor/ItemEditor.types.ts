import type { EditorView } from '@codemirror/view'
import type { ReactNode } from 'react'
import type { LinkTarget } from './complete'
import type { ServerDiagnostic } from './diagnostics'
import type { Version } from './session'

export type EditorMode = 'split' | 'text'

export interface ItemEditorProps {
  readonly source: Version & { readonly head: string | null }
  readonly onSave: (text: string, baseHash: string) => Promise<Version>
  readonly lint: (text: string) => Promise<ReadonlyArray<ServerDiagnostic>>
  readonly targets: ReadonlyArray<LinkTarget>
  readonly mode?: EditorMode
  readonly onModeChange?: (mode: EditorMode) => void
  readonly onReady?: (view: EditorView) => void
  readonly variant?: 'page' | 'drawer'
  readonly preview?: ReactNode
  readonly onStats?: (stats: { readonly changedLines: number }) => void
  readonly branch?: string | undefined
  readonly autosaveDelay?: number
  readonly saveKeys?: string | null
  readonly vimMode?: boolean
}
