import { Button } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import type { Effect } from 'effect'
import { type Client, useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { useInboxState } from '../InboxProvider'
import { type Raised, tabOf, tagPair, todoTitle, weekAfter } from '../triage'
import './TriageDetail.css'

type Act = (client: Client) => Effect.Effect<unknown, unknown>

/** The picked item: why it is here, the one thing to do about it, and archive or snooze. */
export function TriageDetail() {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const { selected, archive, snooze, tab } = useInboxState()
  const done = (title: string) => (item: Raised) =>
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
  const primary: Record<Raised['rule'], { label: string; run: () => void } | undefined> = {
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
  return (
    <section className="trd-panel" aria-label={LL.inbox.detail.title()}>
      <span className="trd-rule">{LL.inbox.rules[item.rule]()}</span>
      <h2 className="trd-title">{item.title}</h2>
      <p className="trd-why">{item.detail}</p>
      {item.id && (
        <Link to="/items/$id" params={{ id: item.id }} className="trd-open">
          {item.id}
        </Link>
      )}
      {item.path && !item.id && (
        <code className="trd-open">
          {item.path}
          {item.line ? `:${item.line}` : ''}
        </code>
      )}
      <div className="trd-actions">
        {main && (
          <Button variant="primary" onClick={main.run} disabled={run.isPending}>
            {main.label}
          </Button>
        )}
        {item.rule === 'overdue-task' && (
          <Button
            onClick={() =>
              go(
                (c) =>
                  c.items.update({
                    params: { id },
                    payload: { set: { due: weekAfter(item.date, new Date()) } },
                  }),
                LL.inbox.done.moved(),
              )
            }
            disabled={run.isPending}
          >
            {LL.inbox.actions.moveDue()}
          </Button>
        )}
        {item.rule === 'orphan' && item.id && (
          <Link to="/items/$id" params={{ id: item.id }} className="trd-link-button">
            {LL.inbox.actions.link()}
          </Link>
        )}
        <Button onClick={() => snooze(item)}>
          {LL.inbox.actions.snooze()} <kbd>H</kbd>
        </Button>
        <Button onClick={() => archive(item)}>
          {LL.inbox.actions.archive()} <kbd>E</kbd>
        </Button>
      </div>
      <p className="trd-hint">
        {tabOf(item.rule) === 'commits' ? LL.inbox.detail.fromCommit() : ''}
      </p>
    </section>
  )
}
