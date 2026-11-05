import { Banner } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { itemQuery, itemsQuery, useWrite } from '@/infrastructure/query'
import { summaryOf } from '@/infrastructure/text'
import type { BoardColumnInfo } from '../fields'
import { TaskChecklist } from '../TaskChecklist'
import { TaskDecisions } from '../TaskDecisions'
import { TaskFields } from '../TaskFields'
import { TaskRelated } from '../TaskRelated'
import './TaskContent.css'

export function TaskContent({
  id,
  columns,
}: {
  readonly id: string
  readonly columns: ReadonlyArray<BoardColumnInfo>
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(itemQuery(api, id))
  const adrs = useQuery(itemsQuery(api, { type: 'adr' }))
  const reload = () => void query.refetch()
  const setState = useWrite(
    api,
    (a, v: { state: string; hash: string }) =>
      a.call((c) =>
        c.items.setState({ params: { id }, payload: { state: v.state, baseHash: v.hash } }),
      ),
    { reload },
  )
  const toggle = useWrite(
    api,
    (a, v: { index: number; checked: boolean; hash: string }) =>
      a.call((c) =>
        c.items.toggleCheck({
          params: { id },
          payload: { item: v.index, checked: v.checked, baseHash: v.hash },
        }),
      ),
    { reload },
  )
  const linkAdr = useWrite(
    api,
    (a, v: { to: string; hash: string }) =>
      a.call((c) =>
        c.items.link({
          params: { id },
          payload: { to: v.to, kind: 'implements', baseHash: v.hash },
        }),
      ),
    { reload },
  )

  if (query.isPending) return <p className="app-muted">{LL.common.loading()}</p>
  if (query.isError) return <Banner variant="danger" title={LL.tasks.loadError()} />
  const task = query.data
  const decisions = task.links.filter((l) => l.kind === 'implements')
  const linked = new Set(decisions.map((d) => d.id))
  const choices = (adrs.data?.items ?? []).filter((a) => !linked.has(a.id))
  const summary = summaryOf(task.body)

  return (
    <div className="drawer-body" data-hash={task.hash}>
      <TaskFields
        task={task}
        columns={columns}
        onState={(state) => setState.mutate({ state, hash: task.hash })}
      />
      <TaskDecisions
        decisions={decisions}
        choices={choices}
        onLink={(to) => linkAdr.mutate({ to, hash: task.hash })}
      />
      <section className="drawer-title-block" aria-label={LL.tasks.summary()}>
        <h2 className="drawer-task-title">{task.title}</h2>
        {summary !== '' && <p>{summary}</p>}
      </section>
      <TaskChecklist
        task={task}
        onToggle={(index, checked) => toggle.mutate({ index, checked, hash: task.hash })}
      />
      <TaskRelated task={task} />
    </div>
  )
}
