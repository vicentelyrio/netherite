import { Icon, type ItemTypeName } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { LegendTypeToggle } from './LegendTypeToggle'

export function LegendMini({
  types,
  hidden,
  countOf,
  onToggle,
  onExpand,
}: {
  readonly types: ReadonlyArray<ItemTypeName>
  readonly hidden: ReadonlySet<string>
  readonly countOf: (type: string) => number
  readonly onToggle: (type: string) => void
  readonly onExpand: () => void
}) {
  const { LL } = useI18nContext()
  return (
    <aside className="gv-legend gv-legend--mini" aria-label={LL.components.graph.legend()}>
      {types.map((t) => (
        <LegendTypeToggle key={t} type={t} off={hidden.has(t)} onToggle={() => onToggle(t)}>
          {' '}
          <span className="gv-count">{countOf(t)}</span>
        </LegendTypeToggle>
      ))}
      <button
        type="button"
        className="gv-legend-toggle"
        aria-expanded={false}
        aria-label={LL.components.graph.legendExpand()}
        title={LL.components.graph.legendExpand()}
        onClick={onExpand}
      >
        <Icon name="unfold_more" size="inline" />
      </button>
    </aside>
  )
}
