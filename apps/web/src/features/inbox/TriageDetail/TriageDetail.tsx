import { Button, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Effect } from 'effect'
import { useState } from 'react'
import { FilterTabs, SelectField } from '@/components'
import { type Client, useApi } from '@/infrastructure/api'
import { now } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { projectsQuery, tagMapQuery, useWrite } from '@/infrastructure/query'
import { useInboxState } from '../InboxProvider'
import {
  type Entry,
  folderOf,
  ruleLook,
  slugOf,
  suggestFor,
  tabOf,
  tagPair,
  todoTitle,
  weekAfter,
} from '../triage'
import './TriageDetail.css'

const captureTypes = ['task', 'doc', 'adr', 'runbook', 'context'] as const
type CaptureType = (typeof captureTypes)[number]

type Act = (client: Client) => Effect.Effect<unknown, unknown>

/** The picked item: why it is here, the one thing to do about it, and archive or snooze. */
export function TriageDetail() {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const { selected, archive, snooze, tab } = useInboxState()
  const projects = useQuery(projectsQuery(api)).data?.projects ?? []
  const knownTags = (useQuery(tagMapQuery(api)).data?.tags ?? [])
    .filter((t) => t.field === 'tags')
    .map((t) => t.name)
  const [dropped, setDropped] = useState<{ key: string; tags: ReadonlyArray<string> } | undefined>(
    undefined,
  )
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  const [as, setAs] = useState<{ key: string; type: CaptureType } | undefined>(undefined)
  const guess =
    selected?.rule === 'capture' ? suggestFor(selected.title, projects, knownTags) : undefined
  const project = chosen ?? guess?.project ?? projects[0]?.id ?? ''
  const done = (title: string) => (item: Entry) =>
    notices.notify({ variant: 'success', title, text: item.title })
  const run = useWrite(api, (a, act: Act) => a.call(act))
  if (tab === 'changes' || selected === undefined) {
    return (
      <section className="trd-panel trd-panel-empty" aria-label={LL.inbox.detail.title()}>
        <p className="app-muted">{LL.inbox.detail.pick()}</p>
      </section>
    )
  }
  const item = selected
  const go = (act: Act, title: string) => run.mutate(act, { onSuccess: () => done(title)(item) })
  const id = item.id ?? ''
  const primary: Record<Entry['rule'], { label: string; run: () => void } | undefined> = {
    'stale-doc': {
      label: LL.inbox.actions.reviewed(),
      run: () =>
        go((c) => c.items.markReviewed({ params: { id }, payload: {} }), LL.inbox.done.reviewed()),
    },
    'proposed-adr': {
      label: LL.inbox.actions.accept(),
      run: () =>
        go(
          (c) => c.items.setState({ params: { id }, payload: { state: 'accepted' } }),
          LL.inbox.done.accepted(),
        ),
    },
    capture: undefined,
    orphan: undefined,
    'overdue-task': {
      label: LL.inbox.actions.taskDone(),
      run: () =>
        go(
          (c) => c.items.setState({ params: { id }, payload: { state: 'done' } }),
          LL.inbox.done.taskDone(),
        ),
    },
    'closing-commit': {
      label: LL.inbox.actions.taskDone(),
      run: () =>
        go(
          (c) => c.items.setState({ params: { id }, payload: { state: 'done' } }),
          LL.inbox.done.taskDone(),
        ),
    },
    'new-todo': {
      label: LL.inbox.actions.makeTask(),
      run: () =>
        go(
          (c) => c.items.create({ payload: { type: 'task', title: todoTitle(item.title) } }),
          LL.inbox.done.madeTask(),
        ),
    },
    'similar-tag': (() => {
      const pair = tagPair(item)
      return pair === undefined
        ? undefined
        : {
            label: LL.inbox.actions.mergeTags({ from: pair.merge, to: pair.keep }),
            run: () =>
              go(
                (c) =>
                  c.tags.rename({
                    payload: { field: pair.field, from: pair.merge, to: pair.keep },
                  }),
                LL.inbox.done.merged(),
              ),
          }
    })(),
  }
  const main = primary[item.rule]
  const look = ruleLook[item.rule]
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
    <section className="trd-panel" aria-label={LL.inbox.detail.title()}>
      <div className="trd-top">
        <span className="trd-kind" style={{ '--tri-tone': look.tone } as React.CSSProperties}>
          <Icon name={look.icon} size="inline" filled={item.rule === 'stale-doc'} />
          <strong>{LL.inbox.rules[item.rule]()}</strong>
          {item.date !== undefined && <span>{item.date.slice(0, 10)}</span>}
        </span>
        <span className="trd-icons">
          <button
            type="button"
            className="trd-icon"
            title={`${LL.inbox.actions.snooze()} (H)`}
            aria-label={LL.inbox.actions.snooze()}
            onClick={() => snooze(item)}
          >
            <Icon name="snooze" size={18} />
          </button>
          <button
            type="button"
            className="trd-icon"
            title={`${LL.inbox.actions.archive()} (E)`}
            aria-label={LL.inbox.actions.archive()}
            onClick={() => archive(item)}
          >
            <Icon name="archive" size={18} />
          </button>
        </span>
      </div>
      <h2 className="trd-title">{item.title}</h2>
      {item.rule === 'capture' ? (
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
              {goals.length > 0 && (
                <span className="app-muted"> {LL.inbox.fields.viaProject()}</span>
              )}
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
                  <Icon name="close" size={12} />
                </button>
              ))}
            </dd>
          </dl>
          <section className="trd-file" aria-label={LL.inbox.fields.file()}>
            <div className="trd-file-path">
              <Icon name="note_add" size={15} />
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
              disabled={run.isPending || (type === 'task' && project === '')}
              onClick={create}
            >
              {LL.inbox.create()}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="trd-reason" style={{ '--tri-tone': look.tone } as React.CSSProperties}>
            <Icon name={look.icon} size={18} filled={item.rule === 'stale-doc'} />
            <p>{item.detail}</p>
          </div>
          {item.path && !item.id && (
            <code className="trd-open">
              {item.path}
              {item.line ? `:${item.line}` : ''}
            </code>
          )}
          <div className="trd-actions">
            {item.id && (
              <Link to="/items/$id" params={{ id: item.id }} className="trd-link-button">
                {item.id}
                <Icon name="arrow_forward" size="inline" />
              </Link>
            )}
            {item.rule === 'overdue-task' && (
              <Button
                onClick={() =>
                  go(
                    (c) =>
                      c.items.update({
                        params: { id },
                        payload: { set: { due: weekAfter(item.date, now().toDate()) } },
                      }),
                    LL.inbox.done.moved(),
                  )
                }
                disabled={run.isPending}
              >
                {LL.inbox.actions.moveDue()}
              </Button>
            )}
            {main && (
              <Button variant="primary" onClick={main.run} disabled={run.isPending}>
                {main.label}
              </Button>
            )}
          </div>
          <p className="trd-hint">
            {tabOf(item.rule) === 'commits' ? LL.inbox.detail.fromCommit() : ''}
          </p>
        </>
      )}
    </section>
  )
}
