import { ProjectsEntry, ProjectsHeading } from '@/features/projects'
import { CardGridTemplate } from '@/templates'

export function ProjectsEntryPage() {
  return (
    <CardGridTemplate header={<ProjectsHeading />}>
      <ProjectsEntry />
    </CardGridTemplate>
  )
}
