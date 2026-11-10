import { Kbd, Modal } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import {
  actionIds,
  actionLabel,
  actions,
  dispatcher,
  formatShortcut,
  type ShortcutGroup,
  useActionShortcuts,
  useResolvedShortcuts,
} from '@/infrastructure/shortcuts'
import { sheetGroups } from './sheetGroups'
import './ShortcutSheet.css'

export function ShortcutSheet() {
  const { LL } = useI18nContext()
  const text = LL.settings.shortcuts
  const resolved = useResolvedShortcuts()
  const [groups, setGroups] = useState<ReadonlyArray<ShortcutGroup> | undefined>()
  useActionShortcuts({
    'help.open': () =>
      setGroups((open) =>
        open === undefined ? sheetGroups(dispatcher.activeScopes()) : undefined,
      ),
  })
  return (
    <Modal
      opened={groups !== undefined}
      onClose={() => setGroups(undefined)}
      title={text.title()}
      size="lg"
      transitionProps={{ duration: 0 }}
    >
      {groups?.map((group) => (
        <section key={group} className="sheet-group" aria-label={text.groups[group]()}>
          <h3 className="sheet-title">{text.groups[group]()}</h3>
          <ul className="sheet-list">
            {actionIds
              .filter((id) => actions[id].group === group && resolved[id].keys !== null)
              .map((id) => (
                <li key={id} className="sheet-row">
                  <span>{actionLabel(LL, id)}</span>
                  <Kbd>{formatShortcut(resolved[id].keys ?? '')}</Kbd>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Modal>
  )
}
