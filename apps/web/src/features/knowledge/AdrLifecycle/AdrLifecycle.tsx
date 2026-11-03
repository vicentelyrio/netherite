import { Icon } from '@netherite/ui'
import { formatDate } from '@/infrastructure/datetime'
import './AdrLifecycle.css'

/** The steps an ADR goes through: where it has been and where it is. */
export function AdrLifecycle({
  status,
  steps,
}: {
  readonly status: string
  readonly steps: ReadonlyArray<{ status: string; date?: string; sha?: string }>
}) {
  const order =
    status === 'deprecated'
      ? ['proposed', 'accepted', 'deprecated']
      : status === 'superseded'
        ? ['proposed', 'accepted', 'superseded']
        : ['proposed', 'accepted']
  const at = order.indexOf(status)
  return (
    <ol className="kn-lifecycle" aria-label="Lifecycle">
      {order.map((step, i) => {
        const record = steps.filter((s) => s.status === step).at(-1)
        return (
          <li
            key={step}
            data-state={i < at ? 'past' : i === at ? 'current' : 'next'}
            data-status={step}
            aria-current={i === at ? 'step' : undefined}
          >
            <span className="kn-step-node">
              <Icon name={step === 'superseded' ? 'swap_horiz' : 'check'} size={13} />
            </span>
            <strong>{step}</strong>
            <span className="app-muted">
              {record?.date
                ? `${formatDate(record.date)}${record.sha ? ` · ${record.sha}` : ''}`
                : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
