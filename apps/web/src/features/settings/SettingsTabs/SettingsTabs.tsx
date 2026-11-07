import { Tabs } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { EditorSettings } from '../EditorSettings'
import { GeneralSettings } from '../GeneralSettings'
import { ShortcutSettings } from '../ShortcutSettings'
import { WorkspaceSettings } from '../WorkspaceSettings'
import { defaultSettingsTab, isSettingsTab, type SettingsTab, settingsTabs } from './tabs'
import './SettingsTabs.css'

const panels: Readonly<Record<SettingsTab, ComponentType>> = {
  general: GeneralSettings,
  editor: EditorSettings,
  shortcuts: ShortcutSettings,
  workspace: WorkspaceSettings,
}

export function SettingsTabs({ tab = defaultSettingsTab }: { readonly tab?: SettingsTab }) {
  const { LL } = useI18nContext()
  const navigate = useNavigate()
  return (
    <Tabs
      value={tab}
      onChange={(next) => {
        if (isSettingsTab(next))
          void navigate({ to: '/settings', search: { tab: next }, replace: true })
      }}
    >
      <Tabs.List aria-label={LL.settings.tabs.label()}>
        {settingsTabs.map((id) => (
          <Tabs.Tab key={id} value={id}>
            {LL.settings.tabs[id]()}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {settingsTabs.map((id) => {
        const Panel = panels[id]
        return (
          <Tabs.Panel key={id} value={id} className="st-panel">
            <Panel />
          </Tabs.Panel>
        )
      })}
    </Tabs>
  )
}
