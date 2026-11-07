import { Button } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { actionIds, actions, groupOrder, useShortcutSettings } from '@/infrastructure/shortcuts'
import { ShortcutRow } from './ShortcutRow'
import './ShortcutSettings.css'

export function ShortcutSettings() {
  const { LL } = useI18nContext()
  const text = LL.settings.shortcuts
  const manage = useShortcutSettings()
  const custom = Object.keys(manage.overrides).length > 0
  return (
    <section className="sk" aria-label={text.title()}>
      <header className="sk-head">
        <div>
          <h2 className="sk-title">{text.title()}</h2>
          <p className="app-muted">{text.subtitle()}</p>
        </div>
        <Button disabled={!custom} onClick={manage.resetAll}>
          {text.resetAll()}
        </Button>
      </header>
      {groupOrder.map((group) => (
        <section key={group} className="sk-group" aria-label={text.groups[group]()}>
          <h3 className="sk-group-title">{text.groups[group]()}</h3>
          <ul className="sk-list">
            {actionIds
              .filter((id) => actions[id].group === group)
              .map((id) => (
                <ShortcutRow key={id} id={id} />
              ))}
          </ul>
        </section>
      ))}
    </section>
  )
}
