import type { ItemDetail } from '@netherite/api'
import { ProgressBar } from '@/components'
import './TaskChecklist.css'
import '../shared.css'

/** The task's `- [ ]` items with how many are done; ticking one writes it to the file. */
export function TaskChecklist({
  task,
  onToggle,
}: {
  readonly task: ItemDetail
  readonly onToggle: (index: number, checked: boolean) => void
}) {
  return (
    <section className="drawer-section" aria-label="Checklist">
      <div className="drawer-check-head">
        <h3 className="drawer-h">Tasklist</h3>
        {task.progress !== null && (
          <div className="drawer-check-bar">
            <ProgressBar done={task.progress.done} total={task.progress.total} label="Checklist" />
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
        {task.checklist.length === 0 && <li className="app-muted">No checklist</li>}
      </ul>
    </section>
  )
}
