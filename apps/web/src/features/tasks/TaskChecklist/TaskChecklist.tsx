import type { ItemDetail } from '@netherite/api'
import { ProgressBar } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { DrawerHeading, DrawerSection } from '../DrawerSection'
import './TaskChecklist.css'

export function TaskChecklist({
  task,
  onToggle,
}: {
  readonly task: ItemDetail
  readonly onToggle: (index: number, checked: boolean) => void
}) {
  const { LL } = useI18nContext()
  return (
    <DrawerSection label={LL.tasks.checklist.label()}>
      <div className="drawer-check-head">
        <DrawerHeading>{LL.tasks.checklist.title()}</DrawerHeading>
        {task.progress !== null && (
          <div className="drawer-check-bar">
            <ProgressBar
              done={task.progress.done}
              total={task.progress.total}
              label={LL.tasks.checklist.label()}
            />
          </div>
        )}
      </div>
      <ul className="drawer-checklist">
        {task.checklist.map((item, index) => (
          <li key={`${index}:${item.text}`}>
            <label>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => onToggle(index, e.currentTarget.checked)}
              />{' '}
              {item.text}
            </label>
          </li>
        ))}
        {task.checklist.length === 0 && <li className="app-muted">{LL.tasks.checklist.none()}</li>}
      </ul>
    </DrawerSection>
  )
}
