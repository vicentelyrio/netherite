import { Link } from '@tanstack/react-router'
import { useI18nContext } from '@/infrastructure/i18n'
import type { Placed } from './layout'

export function GraphFocus({
  node,
  onClear,
}: {
  readonly node: Placed
  readonly onClear: () => void
}) {
  const { LL } = useI18nContext()
  return (
    <div className="gv-focus" role="status">
      <strong>{node.id}</strong> {node.title}{' '}
      <Link to="/items/$id" params={{ id: node.id }}>
        {LL.components.graph.open()}
      </Link>{' '}
      <button type="button" onClick={onClear}>
        {LL.components.graph.clearFocus()}
      </button>
    </div>
  )
}
