import type { Board } from '@netherite/api'
import { Button, EmptyState } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'

type Type = 'doc' | 'runbook' | 'adr' | 'context'

const startsWith: ReadonlyArray<Type> = ['adr', 'doc', 'context', 'runbook']

export function ProjectEmpty({ board }: { readonly board: Board }) {
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
  const text = LL.projects.empty
  return (
    <div className="pe">
      <EmptyState
        icon="stacks"
        title={text.title()}
        description={text.text({ id: board.id })}
        actions={startsWith.map((type, i) => (
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
