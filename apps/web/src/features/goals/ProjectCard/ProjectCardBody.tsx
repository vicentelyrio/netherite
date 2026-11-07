import type { ProjectRow } from '@netherite/api'
import { StatusGlyph } from '@netherite/ui'
import { ProgressBar, TagList } from '@/components'
import { CardBody, CardOverline, CardTitle } from '../CardParts'
import { statusOfProgress } from '../status'

const glyphSize = 14

export function ProjectCardBody({ project }: { readonly project: ProjectRow }) {
  const progress = project.progress ?? { done: 0, total: 0 }
  return (
    <CardBody>
      {project.goals.length > 0 && (
        <CardOverline>{project.goals.map((g) => g.title).join(' · ')}</CardOverline>
      )}
      <CardTitle>
        <StatusGlyph
          type="project"
          status={statusOfProgress(progress.done, progress.total)}
          progress={progress.total > 0 ? progress.done / progress.total : 0}
          size={glyphSize}
        />{' '}
        {project.title}
      </CardTitle>
      <TagList tags={project.tags} />
      <ProgressBar done={progress.done} total={progress.total} />
    </CardBody>
  )
}
