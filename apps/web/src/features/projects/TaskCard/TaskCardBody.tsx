import type { BoardCard } from '@netherite/api'
import { Avatar, Icon, StatusGlyph, statusOfCategory } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { ProgressBar, TagList } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'

const glyphSize = 10
const avatarSize = 24

export function TaskCardBody({
  card,
  projectId,
  overline,
  category,
}: {
  readonly card: BoardCard
  readonly projectId: string
  readonly overline?: string | undefined
  readonly category?: string | undefined
}) {
  const { LL } = useI18nContext()
  const assignee = card.assignees[0]
  return (
    <div className="board-card">
      {overline && <span className="board-overline">{overline}</span>}
      <div className="board-card-top">
        <StatusGlyph
          type="task"
          status={statusOfCategory[category as keyof typeof statusOfCategory] ?? 'backlog'}
          size={glyphSize}
          className="board-card-glyph"
        />
        <Link
          to="/projects/$id"
          params={{ id: projectId }}
          search={{ task: card.id }}
          className="board-card-title"
        >
          {card.title}
        </Link>
        {assignee !== undefined && <Avatar name={assignee} size={avatarSize} />}
      </div>
      <TagList tags={card.labels} />
      {card.waitingOn.length > 0 && (
        <div className="board-waiting">
          <Icon name="link" />{' '}
          {LL.projects.waitingOn({ names: card.waitingOn.map((d) => d.title).join(', ') })}
        </div>
      )}
      {card.checklist && <ProgressBar done={card.checklist.done} total={card.checklist.total} />}
    </div>
  )
}
