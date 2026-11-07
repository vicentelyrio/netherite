import { Button, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Effect } from 'effect'
import { useState } from 'react'
import { FilterTabs, SelectField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { projectsQuery, tagMapQuery } from '@/infrastructure/query'
import { type Entry, folderOf, slugOf, suggestFor } from '../triage'
import { type CaptureType, captureTypes } from './TriageDetail.types'
import { useTriageRun } from './useTriageRun'

const tagIconSize = 12
const fileIconSize = 15

export function TriageCapture({ item }: { readonly item: Entry }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const { go, pending } = useTriageRun(item)
  const projects = useQuery(projectsQuery(api)).data?.projects ?? []
  const knownTags = (useQuery(tagMapQuery(api)).data?.tags ?? [])
    .filter((t) => t.field === 'tags')
    .map((t) => t.name)
  const [dropped, setDropped] = useState<{ key: string; tags: ReadonlyArray<string> } | undefined>(
    undefined,
  )
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  const [as, setAs] = useState<{ key: string; type: CaptureType } | undefined>(undefined)
  const guess = suggestFor(item.title, projects, knownTags)
  const project = chosen ?? guess?.project ?? projects[0]?.id ?? ''
  const type: CaptureType = as?.key === item.key ? as.type : 'task'
  const goals = projects.find((p) => p.id === project)?.goals ?? []
  const skipped = dropped?.key === item.key ? dropped.tags : []
  const tags = (guess?.tags ?? []).filter((t) => !skipped.includes(t))
  const fields = {
    ...(project !== '' && (type === 'task' || type === 'adr') ? { project } : {}),
    ...(tags.length > 0 ? { tags } : {}),
  }
  const create = () =>
    go(
      (c) =>
        c.items
          .create({
            payload: {
              type,
              title: item.title,
              ...(Object.keys(fields).length > 0 ? { fields } : {}),
            },
          })
          .pipe(Effect.andThen(() => c.inbox.release({ query: { text: item.title } }))),
      LL.inbox.done.turned(),
    )
  return (
    <>
      <div className="trd-field">
        <span className="trd-label">{LL.inbox.turnInto()}</span>
        <FilterTabs
          label={LL.inbox.turnInto()}
          options={captureTypes.map((t) => ({ value: t, label: LL.inbox.actions.asType[t]() }))}
          value={type}
          onChange={(t) => setAs({ key: item.key, type: t })}
        />
      </div>
      <SelectField
        label={LL.inbox.actions.project()}
        value={project}
        options={projects.map((p) => p.id)}
        anyLabel={LL.inbox.actions.noProject()}
        onChange={setChosen}
      />
      <dl className="trd-fields">
        <dt>{LL.inbox.fields.goal()}</dt>
        <dd>
          {goals.length === 0 ? '—' : goals.map((g) => g.title).join(' · ')}
          {goals.length > 0 && <span className="app-muted"> {LL.inbox.fields.viaProject()}</span>}
        </dd>
        <dt>{LL.inbox.fields.tags()}</dt>
        <dd className="trd-tags">
          {tags.length === 0 && <span className="app-muted">—</span>}
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className="trd-tag"
              aria-label={LL.inbox.fields.dropTag({ name: t })}
              onClick={() => setDropped({ key: item.key, tags: [...skipped, t] })}
            >
              {t}
              <Icon name="close" size={tagIconSize} />
            </button>
          ))}
        </dd>
      </dl>
      <section className="trd-file" aria-label={LL.inbox.fields.file()}>
        <div className="trd-file-path">
          <Icon name="note_add" size={fileIconSize} className="trd-file-icon" />
          {folderOf[type]}/…-{slugOf(item.title)}.md
        </div>
        <pre className="trd-file-body">
          {[
            '---',
            `type: ${type}`,
            `title: ${item.title}`,
            ...Object.entries(fields).map(
              ([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`,
            ),
            '---',
          ].join('\n')}
        </pre>
      </section>
      <div className="trd-actions">
        <p className="trd-hint">{LL.inbox.createHint()}</p>
        <Button
          variant="primary"
          disabled={pending || (type === 'task' && project === '')}
          onClick={create}
        >
          {LL.inbox.create()}
        </Button>
      </div>
    </>
  )
}
