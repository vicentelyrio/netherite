import type { ItemTypeName } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { LegendTypeToggle } from './LegendTypeToggle'

export function LegendRow({
  types,
  hidden,
  onToggle,
  className,
}: {
  readonly types: ReadonlyArray<ItemTypeName>
  readonly hidden: ReadonlySet<string>
  readonly onToggle: (type: string) => void
  readonly className?: string | undefined
}) {
  const { LL } = useI18nContext()
  return (
    <aside
      className={`gv-legend gv-legend--row${className ? ` ${className}` : ''}`}
      aria-label={LL.components.graph.legend()}
    >
      {types.map((t) => (
        <LegendTypeToggle key={t} type={t} off={hidden.has(t)} onToggle={() => onToggle(t)} />
      ))}
    </aside>
  )
}
