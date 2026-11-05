import type { ProjectRow } from '@netherite/api'
import { Card, StatusGlyph } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { ProgressBar, TagList } from '@/components'
import '../GoalCard/GoalCard.css'
import { statusOfProgress } from '../status'

export function ProjectCard({ project }: { readonly project: ProjectRow }) {
  const progress = project.progress ?? { done: 0, total: 0 }
  return (
    <Link to="/projects/$id" params={{ id: project.id }} className="app-row-link">
      <Card interactive>
        <div className="goal-card">
          {project.goals.length > 0 && (
            <span className="goal-overline">{project.goals.map((g) => g.title).join(' · ')}</span>
          )}
          <span className="goal-card-title">
            <StatusGlyph
              type="project"
              status={statusOfProgress(progress.done, progress.total)}
              progress={progress.total > 0 ? progress.done / progress.total : 0}
              size={14}
            />{' '}
            {project.title}
          </span>
          <TagList tags={project.tags} />
          <ProgressBar done={progress.done} total={progress.total} />
        </div>
      </Card>
    </Link>
  )
}
