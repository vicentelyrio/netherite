import { Invalid } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { ContextSettings } from './ContextSettings'
import { FreshnessSettings } from './FreshnessSettings'
import { InboxSettings } from './InboxSettings'
import { StatesSettings } from './StatesSettings'
import { useWorkspaceConfig } from './useWorkspaceConfig'
import './WorkspaceSettings.css'

export function WorkspaceSettings() {
  const { LL } = useI18nContext()
  const text = LL.settings.workspace
  const { config, save } = useWorkspaceConfig()
  if (config.isError) {
    return config.error instanceof Invalid ? (
      <Banner variant="danger" title={text.invalid()}>
        <p>{text.invalidText()}</p>
        <p className="ws-problem">{config.error.message}</p>
      </Banner>
    ) : (
      <Banner variant="danger" title={text.loadError()} />
    )
  }
  if (config.isPending) return <p className="app-muted">{text.loading()}</p>
  const { settings } = config.data
  return (
    <div className="ws">
      <p className="app-muted ws-note">{text.note()}</p>
      <StatesSettings settings={settings} save={save} />
      <InboxSettings settings={settings} save={save} />
      <FreshnessSettings settings={settings} save={save} />
      <ContextSettings settings={settings} save={save} />
    </div>
  )
}
