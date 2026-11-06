import type { Board } from '@netherite/api'
import { Button, EmptyState } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import { useI18nContext } from '@/infrastructure/i18n'

type Type = 'doc' | 'runbook' | 'adr' | 'context'

const startsWith: ReadonlyArray<Type> = ['adr', 'doc', 'context', 'runbook']

export function ProjectEmpty({ board }: { readonly board: Board }) {
  const { LL } = useI18nContext()
  const navigate = useNavigate()
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
            onClick={() =>
              void navigate({
                to: '/knowledge/new/$type',
                params: { type },
                search: { project: board.id },
              })
            }
          >
            {labels[type]}
          </Button>
        ))}
      />
    </div>
  )
}
