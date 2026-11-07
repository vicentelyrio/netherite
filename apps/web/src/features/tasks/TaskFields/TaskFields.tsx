import type { ItemDetail } from '@netherite/api'
import { Avatar, Icon, Menu, type StateCategory, TaskStatePill } from '@netherite/ui'
import { TagList } from '@/components'
import { formatDateTime } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { DrawerLabel } from '../DrawerLabel'
import { type BoardColumnInfo, field, strings } from '../fields'
import './TaskFields.css'

export function TaskFields({
  task,
  columns,
  onState,
}: {
  readonly task: ItemDetail
  readonly columns: ReadonlyArray<BoardColumnInfo>
  readonly onState: (state: string) => void
}) {
  const { LL } = useI18nContext()
  const fm = task.frontmatter
  const category = (columns.find((c) => c.name === task.state)?.category ?? 'todo') as StateCategory
  const createdRaw = field(fm, 'created') ?? field(fm, 'created_at')
  const created =
    typeof createdRaw === 'string' || createdRaw instanceof Date
      ? formatDateTime(createdRaw)
      : undefined
  const by = field(fm, 'created_by')
  const assignees = strings(field(fm, 'assignees'))
  const labels = strings(field(fm, 'labels'))
  return (
    <div className="drawer-meta">
      <div className="drawer-cell">
        <DrawerLabel>{LL.tasks.fields.state()}</DrawerLabel>
        <Menu>
          <Menu.Target>
            <button
              type="button"
              className="drawer-state"
              aria-label={LL.tasks.fields.changeState()}
            >
              <TaskStatePill state={task.state ?? ''} category={category} />
              <Icon name="expand_more" />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            {columns.map((c) => (
              <Menu.Item key={c.name} onClick={() => onState(c.name)}>
                {c.name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
      <div className="drawer-cell">
        <DrawerLabel>{LL.tasks.fields.created()}</DrawerLabel>
        <span>{created ?? '—'}</span>
        {typeof by === 'string' && (
          <span className="app-muted">{LL.tasks.fields.by({ name: by.replace(/^@/, '') })}</span>
        )}
      </div>
      <div className="drawer-cell">
        <DrawerLabel>{LL.tasks.fields.assignees()}</DrawerLabel>
        <span className="drawer-people">
          {assignees.map((a) => (
            <span key={a} className="drawer-person">
              <Avatar name={a} size={22} /> {a.replace(/^@/, '')}
            </span>
          ))}
          {assignees.length === 0 && '—'}
        </span>
      </div>
      <div className="drawer-cell">
        <DrawerLabel>{LL.tasks.fields.labels()}</DrawerLabel>
        <span className="drawer-labels">
          <TagList tags={labels} />
          {labels.length === 0 && '—'}
        </span>
      </div>
    </div>
  )
}
