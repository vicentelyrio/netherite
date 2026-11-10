import { Icon, SegmentedControl } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import type { EditorMode } from './ItemEditor.types'

const iconSize = 15

export function EditorStatus({
  errors,
  warnings,
  position,
  changed,
  branch,
  saving,
  dirty,
  mode,
  onMode,
  modeHint,
}: {
  readonly errors: number
  readonly warnings: number
  readonly position: { readonly line: number; readonly column: number }
  readonly changed: boolean
  readonly branch: string | undefined
  readonly saving: boolean
  readonly dirty: boolean
  readonly mode: EditorMode
  readonly onMode: (mode: EditorMode) => void
  readonly modeHint?: string
}) {
  const { LL } = useI18nContext()
  const text = LL.components.editor
  return (
    <footer className="ed-status">
      <span className="ed-count" data-kind="error" title={text.errors({ count: errors })}>
        <Icon name="error" size={iconSize} />
        {errors}
      </span>
      <span
        className="ed-count"
        data-kind="warning"
        data-on={warnings > 0 || undefined}
        title={text.warnings({ count: warnings })}
      >
        <Icon name="warning" size={iconSize} filled={warnings > 0} />
        {warnings}
      </span>
      <span className="ed-divider" aria-hidden="true" />
      <span className="ed-position">
        {text.position({ line: position.line, column: position.column })}
      </span>
      <span className="app-muted">{text.language()}</span>
      {changed && <span className="ed-changed">{text.changed()}</span>}
      <span className="ed-spacer" />
      {branch !== undefined && (
        <span className="ed-branch">
          <Icon name="commit" size={iconSize} /> {branch}
        </span>
      )}
      <span className="ed-save" data-state={saving ? 'saving' : dirty ? 'unsaved' : 'saved'}>
        {saving ? text.saving() : dirty ? text.unsaved() : text.saved()}
      </span>
      <SegmentedControl
        classNames={{ root: 'ed-mode', indicator: 'ed-mode-indicator' }}
        {...(modeHint === undefined ? {} : { title: modeHint })}
        value={mode}
        onChange={(value) => onMode(value as EditorMode)}
        data={[
          { value: 'split', label: text.code() },
          { value: 'text', label: text.text() },
        ]}
        aria-label={text.view()}
      />
    </footer>
  )
}
