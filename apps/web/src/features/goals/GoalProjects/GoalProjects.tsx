import type { ProjectRow } from '@netherite/api'
import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import { ProjectCard } from '../ProjectCard'
import './GoalProjects.css'

/** The projects of a goal, with a count and a way to add one. */
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
          onCancel={() => setAdding(false)}
          onSubmit={(title) => createProject.mutate(title, { onSuccess: () => setAdding(false) })}
        />
      )}
      {projects.length === 0 && <p className="app-muted">{LL.goals.detail.noProjects()}</p>}
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </>
  )
}
