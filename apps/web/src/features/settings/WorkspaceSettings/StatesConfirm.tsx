import { Button, Modal } from '@netherite/ui'
import { useQueries } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { itemsQuery } from '@/infrastructure/query'
import type { StateChanges } from './statesDraft'

const justTheTotal = 1

export function StatesConfirm({
  changes,
  onCancel,
  onConfirm,
}: {
  readonly changes: StateChanges
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const text = LL.settings.workspace.states.confirm
  const lines = [
    ...changes.renamed.map(({ from, to }) => ({ state: from, label: text.renamed({ from, to }) })),
    ...changes.removed.map((name) => ({ state: name, label: text.removed({ name }) })),
  ]
  const counts = useQueries({
    queries: lines.map(({ state }) =>
      itemsQuery(api, { type: 'task', status: state, limit: justTheTotal }),
    ),
  })
  return (
    <Modal opened onClose={onCancel} title={text.title()} transitionProps={{ duration: 0 }}>
      <p className="sts-confirm-text">{text.text()}</p>
      <ul className="sts-confirm-list">
        {lines.map(({ state, label }, i) => {
          const total = counts[i]?.data?.total
          return (
            <li key={state}>
              <span>{label}</span>
              <strong>
                {total === undefined ? text.counting() : text.count({ count: total })}
              </strong>
            </li>
          )
        })}
      </ul>
      <div className="sts-buttons">
        <Button size="md" onClick={onCancel}>
          {text.cancel()}
        </Button>
        <Button variant="danger" size="md" onClick={onConfirm}>
          {text.confirm()}
        </Button>
      </div>
    </Modal>
  )
}
