import type { ProjectRow } from '@netherite/api'
import { Card } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { itemProps } from '@/infrastructure/sections'
import { DragFrame } from '../CardParts'
import { ProjectCardBody } from './ProjectCardBody'

export function ProjectCard({
  project,
  list,
}: {
  readonly project: ProjectRow
  readonly list: string
}) {
  return (
    <DragFrame id={project.id} list={list}>
      <Link
        to="/projects/$id"
        params={{ id: project.id }}
        className="app-row-link"
        draggable={false}
        {...itemProps(project.id)}
      >
        <Card interactive>
          <ProjectCardBody project={project} />
        </Card>
      </Link>
    </DragFrame>
  )
}
