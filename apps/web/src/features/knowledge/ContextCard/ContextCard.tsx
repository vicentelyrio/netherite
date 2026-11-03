import type { ItemDetail } from '@netherite/api'
import { Icon, Switch } from '@netherite/ui'
import { useApi } from '@/infrastructure/api'
import { useWrite } from '@/infrastructure/query'
import './ContextCard.css'

export interface ContextInfo {
  readonly include: boolean
  readonly targets: ReadonlyArray<{
    readonly target: string
    readonly path: string
    readonly included: boolean
    readonly omitted: boolean
    readonly tokens: number
    readonly budget: number
    readonly stale: boolean
  }>
}

/** Whether a context item goes to agents, how many tokens it costs, and where it is synced. */
export function ContextCard({
  item,
  context,
}: {
  readonly item: ItemDetail
  readonly context: ContextInfo
}) {
  const api = useApi()
  const toggle = useWrite(api, (a, include: boolean) =>
    a.call((c) =>
      c.items.update({
        params: { id: item.id },
        payload: { set: { include_in_context: include }, baseHash: item.hash },
      }),
    ),
  )
  const first = context.targets[0]
  const pct =
    first && first.budget > 0 ? Math.min(100, Math.round((first.tokens / first.budget) * 100)) : 0
  return (
    <section aria-label="Context" className="kf-context" data-on={context.include || undefined}>
      <div className="kf-context-top">
        <Icon name="smart_toy" size={20} />
        <div>
          <strong>Include in AI context</strong>
          <span>
            {context.include
              ? 'Sent to agents working in this repo'
              : 'Excluded: agents won’t receive this doc'}
          </span>
        </div>
        <Switch
          checked={context.include}
          disabled={toggle.isPending}
          onChange={(e) => toggle.mutate(e.currentTarget.checked)}
          label={<span className="nt-visually-hidden">Include in context</span>}
        />
      </div>
      {first && (
        <div className="kf-context-tokens" data-off={!context.include || undefined}>
          <span className="kf-context-number">≈ {first.tokens.toLocaleString('en-US')}</span>
          <span>tokens</span>
          <span className="kf-context-bar">
            <span style={{ width: `${pct}%` }} />
          </span>
          <span>of {first.budget.toLocaleString('en-US')} repo budget</span>
        </div>
      )}
      <div className="kf-context-targets" data-off={!context.include || undefined}>
        <span>Synced to</span>
        {context.targets.map((t) => (
          <code key={t.target}>{t.path}</code>
        ))}
        {context.targets.length === 0 && (
          <span className="app-muted">No sync targets are configured.</span>
        )}
      </div>
    </section>
  )
}
