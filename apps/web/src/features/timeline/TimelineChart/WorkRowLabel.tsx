import { Icon, StatusGlyph } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { WorkLink, type WorkRow } from './WorkLink'

const glyphSize = { task: 10, other: 14 } as const

export function WorkRowLabel({
  row,
  onToggle,
}: {
  readonly row: WorkRow
  readonly onToggle: (projectId: string) => void
}) {
  const { LL } = useI18nContext()
  const item = row.item
  return (
    <div className={`tl-label tl-indent-${row.kind}`}>
      {row.kind === 'project' ? (
        <button
          type="button"
          className="tl-chevron"
          aria-expanded={row.expanded}
          aria-label={row.expanded ? LL.timeline.hideTasks() : LL.timeline.showTasks()}
          disabled={row.tasks === 0}
          onClick={() => onToggle(row.item.id)}
        >
          <Icon name={row.expanded ? 'expand_more' : 'chevron_right'} size="inline" />
        </button>
      ) : (
        <span className="tl-chevron-gap" />
      )}
      <StatusGlyph
        type={row.kind}
        status={item.status}
        progress={item.progress}
        size={row.kind === 'task' ? glyphSize.task : glyphSize.other}
      />
      <WorkLink row={row} className="tl-title">
        {item.title}
      </WorkLink>
      {item.overdue && <span className="tl-flag">{LL.timeline.overdue()}</span>}
      {row.kind === 'goal' && <span className="tl-share">{Math.round(item.progress * 100)}%</span>}
      {row.kind === 'project' && (
        <span className="tl-sub">{row.tasks === 0 ? '' : `${row.done}/${row.tasks}`}</span>
      )}
    </div>
  )
}
