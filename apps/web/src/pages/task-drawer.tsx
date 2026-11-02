import {
  Avatar,
  Banner,
  Button,
  Drawer,
  Icon,
  Menu,
  type StateCategory,
  TaskStatePill,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ProgressBar } from '@/components'
import { useApi } from '../lib/app-context'
import { itemQuery, itemsQuery, useHealth } from '../lib/queries'
import { summaryOf } from '../lib/summary'
import { useWrite } from '../lib/writes'
import { SourceEditor } from './source-editor'

interface Column {
  readonly name: string
  readonly category: string
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

const field = (frontmatter: unknown, key: string): unknown =>
  typeof frontmatter === 'object' && frontmatter !== null
    ? (frontmatter as Record<string, unknown>)[key]
    : undefined

function Body({ id, columns }: { readonly id: string; readonly columns: ReadonlyArray<Column> }) {
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

  if (query.isPending) return <p className="app-muted">Loading…</p>
  if (query.isError) return <Banner variant="danger" title="Could not load this task" />
  const task = query.data
  const category = (columns.find((c) => c.name === task.state)?.category ?? 'todo') as StateCategory
  const fm = task.frontmatter
  const decisions = task.links.filter((l) => l.kind === 'implements')
  const related = [
    ...task.links.filter((l) => l.kind !== 'implements' && l.kind !== 'belongs_to'),
    ...task.backlinks.filter((l) => l.kind !== 'belongs_to'),
  ].filter((l) => l.id !== undefined)
  const createdRaw = field(fm, 'created') ?? field(fm, 'created_at')
  const created =
    typeof createdRaw === 'string' || createdRaw instanceof Date
      ? new Date(createdRaw).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined
  const linked = new Set(decisions.map((d) => d.id))
  const choices = (adrs.data?.items ?? []).filter((a) => !linked.has(a.id))

  return (
    <div className="drawer-body" data-hash={task.hash}>
      <div className="drawer-meta">
        <div className="drawer-cell">
          <span className="drawer-cell-label">State</span>
          <Menu>
            <Menu.Target>
              <button type="button" className="drawer-state" aria-label="Change state">
                <TaskStatePill state={task.state ?? ''} category={category} />
                <Icon name="expand_more" />
              </button>
            </Menu.Target>
            <Menu.Dropdown>
              {columns.map((c) => (
                <Menu.Item
                  key={c.name}
                  onClick={() => setState.mutate({ state: c.name, hash: task.hash })}
                >
                  {c.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>
        <div className="drawer-cell">
          <span className="drawer-cell-label">Created</span>
          <span>{created ?? '—'}</span>
          {typeof field(fm, 'created_by') === 'string' && (
            <span className="app-muted">
              by {String(field(fm, 'created_by')).replace(/^@/, '')}
            </span>
          )}
        </div>
        <div className="drawer-cell">
          <span className="drawer-cell-label">Assignees</span>
          <span className="drawer-people">
            {strings(field(fm, 'assignees')).map((a) => (
              <span key={a} className="drawer-person">
                <Avatar name={a} size={22} /> {a.replace(/^@/, '')}
              </span>
            ))}
            {strings(field(fm, 'assignees')).length === 0 && '—'}
          </span>
        </div>
        <div className="drawer-cell">
          <span className="drawer-cell-label">Labels</span>
          <span className="drawer-labels">
            {strings(field(fm, 'labels')).map((l) => (
              <span key={l} className="goal-tag">
                {l}
              </span>
            ))}
            {strings(field(fm, 'labels')).length === 0 && '—'}
          </span>
        </div>
      </div>

      <section className="drawer-row" aria-label="Decisions">
        <span className="drawer-cell-label">Decisions</span>
        <div className="drawer-decisions">
          {decisions.map((d) => (
            <Link key={d.id} to="/items/$id" params={{ id: d.id as string }} className="drawer-adr">
              <Icon name="diamond" size={14} />
              <span className="drawer-adr-id">{d.id}</span> {d.title}
            </Link>
          ))}
          {decisions.length === 0 && <span className="app-muted">None linked</span>}
          <Menu>
            <Menu.Target>
              <Button size="sm" icon="add" disabled={choices.length === 0}>
                Link ADR
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {choices.map((a) => (
                <Menu.Item key={a.id} onClick={() => linkAdr.mutate({ to: a.id, hash: task.hash })}>
                  {a.id} {a.title}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>
      </section>

      <section className="drawer-title-block" aria-label="Summary">
        <h2 className="drawer-task-title">{task.title}</h2>
        {summaryOf(task.body) !== '' && <p>{summaryOf(task.body)}</p>}
      </section>

      <section className="drawer-section" aria-label="Checklist">
        <div className="drawer-check-head">
          <h3 className="drawer-h">Tasklist</h3>
          {task.progress !== null && (
            <div className="drawer-check-bar">
              <ProgressBar
                done={task.progress.done}
                total={task.progress.total}
                label="Checklist"
              />
            </div>
          )}
        </div>
        <ul className="drawer-checklist">
          {task.checklist.map((item, index) => (
            <li key={`${index}:${item.text}`}>
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    toggle.mutate({ index, checked: e.currentTarget.checked, hash: task.hash })
                  }
                />{' '}
                {item.text}
              </label>
            </li>
          ))}
          {task.checklist.length === 0 && <li className="app-muted">No checklist</li>}
        </ul>
      </section>

      <section className="drawer-section" aria-label="Related">
        <h3 className="drawer-h">Related</h3>
        <ul className="app-link-list">
          {related.map((l) => (
            <li key={`${l.kind}:${l.path}`}>
              <span className="app-muted">{l.kind.replace('_', ' ')}</span>{' '}
              <Link to="/items/$id" params={{ id: l.id as string }}>
                {l.id} {l.title}
              </Link>
            </li>
          ))}
          {related.length === 0 && <li className="drawer-empty">No related items.</li>}
        </ul>
      </section>
    </div>
  )
}

/** A task in a drawer: its fields and checklist, and with `code` the file beside them. */
export function TaskDrawer({
  id,
  columns,
  projectTitle,
  initial,
  onClose,
}: {
  readonly id: string | undefined
  /** `code` opens with the file beside the task. */
  readonly initial?: 'code'
  readonly columns: ReadonlyArray<Column>
  readonly projectTitle?: string | undefined
  readonly onClose: () => void
}) {
  const api = useApi()
  const task = useQuery({ ...itemQuery(api, id ?? ''), enabled: id !== undefined })
  const health = useHealth(api)
  const [mode, setMode] = useState<'text' | 'code'>(initial ?? 'text')
  const [changedLines, setChangedLines] = useState(0)
  const file = task.data ? `${task.data.id.replace(/^[A-Z]+-0*/, '')} - ${task.data.title}.md` : ''
  const preview =
    id === undefined ? null : (
      <div className="drawer-preview">
        <Body id={id} columns={columns} />
        <Link to="/items/$id" params={{ id }} className="drawer-full">
          Open full page
        </Link>
      </div>
    )
  return (
    <Drawer
      opened={id !== undefined}
      onClose={onClose}
      position="left"
      size={mode === 'code' ? 'min(1792px, calc(100vw - 128px))' : 912}
      classNames={{
        body: 'drawer-frame',
        inner: 'drawer-inner',
        content: 'drawer-content',
        header: 'drawer-head',
        overlay: 'drawer-overlay',
        title: 'drawer-title-slot',
      }}
      title={
        id === undefined ? undefined : (
          <nav className="drawer-crumbs" aria-label="Task path">
            <Icon name="description" />
            <span>Projects</span> › <span>{projectTitle ?? task.data?.project}</span> ›{' '}
            <span>Tasks</span> › <strong>{file || id}</strong>
            {changedLines > 0 && (
              <span className="drawer-lines">
                M {changedLines} {changedLines === 1 ? 'line' : 'lines'} changed
              </span>
            )}
          </nav>
        )
      }
    >
      {id !== undefined && (
        <SourceEditor
          id={id}
          variant="drawer"
          preview={preview}
          mode={mode === 'code' ? 'split' : 'text'}
          onModeChange={(m) => setMode(m === 'split' ? 'code' : 'text')}
          onStats={(stats) => setChangedLines(stats.changedLines)}
          branch={health.data?.branch}
        />
      )}
    </Drawer>
  )
}
