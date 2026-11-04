import type { Board } from '@netherite/api'
import { Button, EmptyState } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'

type Kind = 'docs' | 'knowledge'
type Type = 'doc' | 'runbook' | 'adr' | 'context'

/** What each view can start from nothing: the kinds of item that belong to it. */
const startsWith: Readonly<Record<Kind, ReadonlyArray<Type>>> = {
  docs: ['doc', 'runbook'],
  knowledge: ['adr', 'context', 'doc'],
}

/**
 * A project section with nothing in it: what the section holds, how an item ends up in it, and a
 * way to start one that already belongs to this project.
 */
export function ProjectEmpty({ board, kind }: { readonly board: Board; readonly kind: Kind }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const navigate = useNavigate()
  const [creating, setCreating] = useState<Type | undefined>(undefined)
  const create = useWrite(api, (a, v: { type: Type; title: string }) =>
    a.call((c) =>
      c.items.create({ payload: { type: v.type, title: v.title, fields: { project: board.id } } }),
    ),
  )
  const labels = {
    doc: LL.knowledge.actions.newDoc(),
    runbook: LL.knowledge.actions.newRunbook(),
    adr: LL.knowledge.actions.newAdr(),
    context: LL.knowledge.actions.newContext(),
  }
  const text = LL.projects.empty[kind]
  return (
    <div className="pe">
      <EmptyState
        icon={kind === 'docs' ? 'description' : 'stacks'}
        title={text.title()}
        description={text.text({ id: board.id })}
        actions={startsWith[kind].map((type, i) => (
          <Button
            key={type}
            icon="add"
            variant={i === 0 ? 'primary' : 'secondary'}
            onClick={() => setCreating(type)}
          >
            {labels[type]}
          </Button>
        ))}
      />
      {creating !== undefined && (
        <TitleForm
          label={LL.knowledge.actions.titleLabel({ type: creating })}
          onCancel={() => setCreating(undefined)}
          onSubmit={(title) =>
            create.mutate(
              { type: creating, title },
              { onSuccess: (r) => void navigate({ to: '/items/$id', params: { id: r.id } }) },
            )
          }
        />
      )}
    </div>
  )
}
