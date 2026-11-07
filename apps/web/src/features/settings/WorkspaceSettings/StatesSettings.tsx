import { StateCategoryName } from '@netherite/schema'
import { Button } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { SettingsSection } from '../SettingsSection'
import { StateRowEditor } from './StateRowEditor'
import { StatesConfirm } from './StatesConfirm'
import { hasChanges } from './statesDraft'
import { useStatesDraft } from './useStatesDraft'
import type { WorkspaceSectionProps } from './WorkspaceSettings.types'
import './StatesSettings.css'

export function StatesSettings({ settings, save }: WorkspaceSectionProps) {
  const { LL } = useI18nContext()
  const text = LL.settings.workspace.states
  const draft = useStatesDraft(settings.states)
  const [confirming, setConfirming] = useState(false)
  const write = () => {
    setConfirming(false)
    save({ states: draft.values })
  }
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      <ol className="sts-list">
        {draft.rows.map((row, position) => (
          <StateRowEditor
            key={row.key}
            row={row}
            position={position}
            count={draft.rows.length}
            onEdit={(change) => draft.edit(row.key, change)}
            onMove={(to) => draft.move(position, to)}
            onRemove={() => draft.remove(row.key)}
          />
        ))}
      </ol>
      <div className="sts-footer">
        <Button
          icon="add"
          onClick={() => draft.add({ name: text.newName(), category: StateCategoryName.Todo })}
        >
          {text.add()}
        </Button>
        {draft.problem !== undefined && (
          <span className="sts-problem" role="alert">
            {text.problems[draft.problem]()}
          </span>
        )}
        <div className="sts-buttons">
          <Button variant="subtle" disabled={!draft.dirty} onClick={draft.discard}>
            {text.discard()}
          </Button>
          <Button
            variant="primary"
            disabled={!draft.dirty || draft.problem !== undefined}
            onClick={() => (hasChanges(draft.changes) ? setConfirming(true) : write())}
          >
            {text.save()}
          </Button>
        </div>
      </div>
      {confirming && (
        <StatesConfirm
          changes={draft.changes}
          onCancel={() => setConfirming(false)}
          onConfirm={write}
        />
      )}
    </SettingsSection>
  )
}
