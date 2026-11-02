import {
  Banner,
  Button,
  Drawer,
  Icon,
  type ItemTypeName,
  Menu,
  Progress,
  type StateCategory,
  TaskStatePill,
  TypeBadge,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useApi } from '../lib/app-context'
import { itemQuery, itemsQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'

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
  const linked = new Set(decisions.map((d) => d.id))
  const choices = (adrs.data?.items ?? []).filter((a) => !linked.has(a.id))

  return (
    <div className="drawer-body" data-hash={task.hash}>
      <div className="drawer-meta">
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
        <dl className="drawer-fields">
          <dt>Created</dt>
          <dd>{String(field(fm, 'created') ?? '—')}</dd>
          <dt>Assignees</dt>
          <dd>{strings(field(fm, 'assignees')).join(', ') || '—'}</dd>
          <dt>Labels</dt>
          <dd>
            {strings(field(fm, 'labels')).map((l) => (
              <span key={l} className="goal-tag">
                {l}
              </span>
            ))}
            {strings(field(fm, 'labels')).length === 0 && '—'}
          </dd>
          {typeof field(fm, 'due') === 'string' && (
            <>
              <dt>Due</dt>
              <dd>{String(field(fm, 'due'))}</dd>
            </>
          )}
        </dl>
      </div>

      <section className="drawer-section" aria-label="Decisions">
        <h3 className="nt-overline">Decisions</h3>
        <div className="drawer-decisions">
          {decisions.map((d) => (
            <Link key={d.id} to="/items/$id" params={{ id: d.id as string }} className="goal-tag">
              {d.id} {d.title}
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

      <section className="drawer-section" aria-label="Checklist">
        <h3 className="nt-overline">Checklist</h3>
        {task.progress !== null && (
          <Progress done={task.progress.done} total={task.progress.total} label="Checklist" />
        )}
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
        <h3 className="nt-overline">Related</h3>
        <ul className="app-link-list">
          {related.map((l) => (
            <li key={`${l.kind}:${l.path}`}>
              <span className="app-muted">{l.kind.replace('_', ' ')}</span>{' '}
              <Link to="/items/$id" params={{ id: l.id as string }}>
                {l.id} {l.title}
              </Link>
            </li>
          ))}
          {related.length === 0 && <li className="app-muted">Nothing related</li>}
        </ul>
      </section>
    </div>
  )
}

/** A task in a side drawer: fields, decisions, checklist and related items, all editable in place. */
export function TaskDrawer({
  id,
  columns,
  onClose,
}: {
  readonly id: string | undefined
  readonly columns: ReadonlyArray<Column>
  readonly onClose: () => void
}) {
  const api = useApi()
  const title = useQuery({ ...itemQuery(api, id ?? ''), enabled: id !== undefined })
  return (
    <Drawer
      opened={id !== undefined}
      onClose={onClose}
      position="right"
      size={480}
      title={
        id === undefined ? undefined : (
          <span className="drawer-title">
            <TypeBadge type={'task' as ItemTypeName} />
            <code className="app-id">{id}</code>
            <span>{title.data?.title}</span>
          </span>
        )
      }
    >
      {id !== undefined && <Body id={id} columns={columns} />}
      {id !== undefined && (
        <Link to="/items/$id" params={{ id }} className="drawer-full">
          Open full page
        </Link>
      )}
    </Drawer>
  )
}
