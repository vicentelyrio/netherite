import { Switch } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useEditorSettings } from '@/infrastructure/settings'
import './EditorSettings.css'

export function EditorSettings() {
  const { LL } = useI18nContext()
  const text = LL.settings.editor
  const { vimMode, setVimMode } = useEditorSettings()
  return (
    <section className="es" aria-label={text.title()}>
      <header>
        <h2 className="es-title">{text.title()}</h2>
        <p className="app-muted">{text.subtitle()}</p>
      </header>
      <div className="es-card">
        <Switch
          label={text.vimMode()}
          description={text.vimModeHint()}
          checked={vimMode}
          onChange={(event) => setVimMode(event.currentTarget.checked)}
        />
      </div>
    </section>
  )
}
