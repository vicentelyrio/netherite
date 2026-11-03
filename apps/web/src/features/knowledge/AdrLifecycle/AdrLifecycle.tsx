import { Icon } from '@netherite/ui'
import { formatDate } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import './AdrLifecycle.css'

/** The steps an ADR goes through: where it has been and where it is. */
export function AdrLifecycle({
  status,
  steps,
}: {
  readonly status: string
  readonly steps: ReadonlyArray<{ status: string; date?: string; sha?: string }>
}) {
  const { LL } = useI18nContext()
  const order =
    status === 'deprecated'
      ? ['proposed', 'accepted', 'deprecated']
      : status === 'superseded'
        ? ['proposed', 'accepted', 'superseded']
        : ['proposed', 'accepted']
  const at = order.indexOf(status)
  return (
    <ol className="kn-lifecycle" aria-label={LL.knowledge.doc.lifecycle()}>
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
      {status === 'superseded' && (
        // A replaced decision is over: say what it never became, as the design does.
        <li data-state="next" data-status="deprecated" data-ghost>
          <span className="kn-step-node" />
          <strong>{LL.knowledge.doc.notReached()}</strong>
          <span className="app-muted">{LL.knowledge.doc.notReachedHint()}</span>
        </li>
      )}
    </ol>
  )
}
