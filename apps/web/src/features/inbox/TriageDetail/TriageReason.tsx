import { Button, Icon } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { now } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { type Entry, ruleLook, tabOf, tagPair, todoTitle, weekAfter } from '../triage'
import { useTriageRun } from './useTriageRun'

const iconSize = 18

export function TriageReason({ item }: { readonly item: Entry }) {
  const { LL } = useI18nContext()
  const { go, pending } = useTriageRun(item)
  const id = item.id ?? ''
  const finish = {
    label: LL.inbox.actions.taskDone(),
    run: () =>
      go(
        (c) => c.items.setState({ params: { id }, payload: { state: 'done' } }),
        LL.inbox.done.taskDone(),
      ),
  }
  const pair = tagPair(item)
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
    'overdue-task': finish,
    'closing-commit': finish,
    'new-todo': {
      label: LL.inbox.actions.makeTask(),
      run: () =>
        go(
          (c) => c.items.create({ payload: { type: 'task', title: todoTitle(item.title) } }),
          LL.inbox.done.madeTask(),
        ),
    },
    'similar-tag':
      pair === undefined
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
          },
  }
  const main = primary[item.rule]
  const look = ruleLook[item.rule]
  return (
    <>
      <div className="trd-reason" style={{ '--tri-tone': look.tone } as CSSProperties}>
        <Icon
          name={look.icon}
          size={iconSize}
          filled={item.rule === 'stale-doc'}
          className="trd-reason-icon"
        />
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
            disabled={pending}
          >
            {LL.inbox.actions.moveDue()}
          </Button>
        )}
        {main && (
          <Button variant="primary" onClick={main.run} disabled={pending}>
            {main.label}
          </Button>
        )}
      </div>
      <p className="trd-hint">
        {tabOf(item.rule) === 'commits' ? LL.inbox.detail.fromCommit() : ''}
      </p>
    </>
  )
}
