import type { ItemDetail } from '@netherite/api'
import { Icon, Switch } from '@netherite/ui'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
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

export function ContextCard({
  item,
  context,
}: {
  readonly item: ItemDetail
  readonly context: ContextInfo
}) {
  const { LL } = useI18nContext()
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
    <section
      aria-label={LL.knowledge.doc.context.label()}
      className="kf-context"
      data-on={context.include || undefined}
    >
      <div className="kf-context-top">
        <Icon name="smart_toy" size={20} />
        <div>
          <strong>{LL.knowledge.doc.context.include()}</strong>
          <span>
            {context.include
              ? LL.knowledge.doc.context.included()
              : LL.knowledge.doc.context.excluded()}
          </span>
        </div>
        <Switch
          checked={context.include}
          disabled={toggle.isPending}
          onChange={(e) => toggle.mutate(e.currentTarget.checked)}
          label={<span className="nt-visually-hidden">{LL.knowledge.doc.context.switch()}</span>}
        />
      </div>
      {first && (
        <div className="kf-context-tokens" data-off={!context.include || undefined}>
          <span className="kf-context-number">
            {LL.knowledge.doc.context.approx({ count: first.tokens })}
          </span>
          <span>{LL.knowledge.doc.context.tokens()}</span>
          <span className="kf-context-bar">
            <span style={{ width: `${pct}%` }} />
          </span>
          <span>{LL.knowledge.doc.context.budget({ count: first.budget })}</span>
        </div>
      )}
      <div className="kf-context-targets" data-off={!context.include || undefined}>
        <span>{LL.knowledge.doc.context.syncedTo()}</span>
        {context.targets.map((t) => (
          <code key={t.target}>{t.path}</code>
        ))}
        {context.targets.length === 0 && (
          <span className="app-muted">{LL.knowledge.doc.context.noTargets()}</span>
        )}
      </div>
    </section>
  )
}
