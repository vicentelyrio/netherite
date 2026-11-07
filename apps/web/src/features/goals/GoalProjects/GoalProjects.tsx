import { DragOverlay } from '@dnd-kit/core'
import type { ProjectRow } from '@netherite/api'
import { Card, Icon } from '@netherite/ui'
import { useState } from 'react'
import { placeIn, ReorderContext, TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import { ProjectCard, ProjectCardBody } from '../ProjectCard'
import './GoalProjects.css'

export function GoalProjects({
  goalId,
  projects,
}: {
  readonly goalId: string
  readonly projects: ReadonlyArray<ProjectRow>
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const createProject = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({ payload: { type: 'project', title, fields: { goals: [goalId] } } }),
    ),
  )
  const reorder = useWrite(api, (a, v: { id: string; position: number }) =>
    a.call((c) =>
      c.items.update({ params: { id: v.id }, payload: { set: { position: v.position } } }),
    ),
  )
  const [draggingId, setDraggingId] = useState<string | undefined>()
  const dragging = projects.find((p) => p.id === draggingId)
  return (
    <>
      <header className="goal-projects-head">
        <h2 className="goal-projects-title">{LL.goals.detail.projects()}</h2>
        <span className="goal-count">{projects.length}</span>
        <button type="button" className="goal-link-button" onClick={() => setAdding(true)}>
          <Icon name="add" /> {LL.goals.detail.newProject()}
        </button>
      </header>
      {adding && (
        <TitleForm
          label={LL.goals.detail.projectTitle()}
          pending={createProject.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={(title) => createProject.mutate(title, { onSuccess: () => setAdding(false) })}
        />
      )}
      {projects.length === 0 && <p className="app-muted">{LL.goals.detail.noProjects()}</p>}
      <ReorderContext
        onStart={setDraggingId}
        onEnd={() => setDraggingId(undefined)}
        onDrop={(id, target) => {
          const position = placeIn(projects, id, target)
          if (position !== undefined) reorder.mutate({ id, position })
        }}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} list={goalId} />
        ))}
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div className="goal-overlay">
              <Card>
                <ProjectCardBody project={dragging} />
              </Card>
            </div>
          )}
        </DragOverlay>
      </ReorderContext>
    </>
  )
}
