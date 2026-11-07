import { StateCategoryName } from '@netherite/schema'
import { ActionIcon } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import type { StateRow } from './statesDraft'

const categories = Object.values(StateCategoryName)

export function StateRowEditor({
  row,
  position,
  count,
  onEdit,
  onMove,
  onRemove,
}: {
  readonly row: StateRow
  readonly position: number
  readonly count: number
  readonly onEdit: (change: { readonly name?: string; readonly category?: string }) => void
  readonly onMove: (to: number) => void
  readonly onRemove: () => void
}) {
  const { LL } = useI18nContext()
  const text = LL.settings.workspace.states
  const name = row.name.trim() || row.original || String(position + 1)
  return (
    <li className="sts-row">
      <input
        className="sts-input"
        aria-label={text.name({ position: position + 1 })}
        value={row.name}
        onChange={(event) => onEdit({ name: event.currentTarget.value })}
      />
      <select
        className="sts-input"
        aria-label={text.category({ name })}
        value={row.category}
        onChange={(event) => onEdit({ category: event.currentTarget.value })}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {text.categories[category]()}
          </option>
        ))}
      </select>
      <div className="sts-actions">
        <ActionIcon
          icon="arrow_upward"
          label={text.moveUp({ name })}
          variant="subtle"
          color="gray"
          disabled={position === 0}
          onClick={() => onMove(position - 1)}
        />
        <ActionIcon
          icon="arrow_downward"
          label={text.moveDown({ name })}
          variant="subtle"
          color="gray"
          disabled={position === count - 1}
          onClick={() => onMove(position + 1)}
        />
        <ActionIcon
          icon="delete"
          label={text.remove({ name })}
          variant="subtle"
          color="gray"
          onClick={onRemove}
        />
      </div>
    </li>
  )
}
