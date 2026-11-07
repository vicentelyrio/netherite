import { useI18nContext } from '@/infrastructure/i18n'
import { SettingsSection } from '../SettingsSection'
import { SwitchSetting } from '../SwitchSetting'
import type { WorkspaceSectionProps } from './WorkspaceSettings.types'

const rules = [
  'stale-doc',
  'proposed-adr',
  'orphan',
  'overdue-task',
  'closing-commit',
  'new-todo',
  'similar-tag',
] as const

export function InboxSettings({ settings, save }: WorkspaceSectionProps) {
  const { LL } = useI18nContext()
  const text = LL.settings.workspace.inbox
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      {rules.map((rule) => (
        <SwitchSetting
          key={rule}
          label={LL.inbox.rules[rule]()}
          hint={text.hints[rule]()}
          checked={settings.inbox.rules[rule] ?? true}
          onChange={(on) => save({ inbox: { rules: { [rule]: on } } })}
        />
      ))}
    </SettingsSection>
  )
}
