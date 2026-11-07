import { designColor, Icon, type ItemTypeName, StatusGlyph } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { statusFilters } from './GraphView.constants'
import type { NodeStatus, StatusFilter } from './GraphView.types'
import { NodeShape } from './NodeShape'
import { styleOf } from './styleOf'

const sampleProgress: Partial<Record<NodeStatus, number>> = { progress: 0.6, hold: 0.4 }

export function LegendPanel({
  types,
  kinds,
  statuses,
  hiddenTypes,
  hiddenKinds,
  statusFilter,
  typeCount,
  kindCount,
  statusCount,
  onToggleType,
  onToggleKind,
  onStatusFilter,
  onMinify,
}: {
  readonly types: ReadonlyArray<ItemTypeName>
  readonly kinds: ReadonlyArray<string>
  readonly statuses: ReadonlyArray<NodeStatus>
  readonly hiddenTypes: ReadonlySet<string>
  readonly hiddenKinds: ReadonlySet<string>
  readonly statusFilter: StatusFilter
  readonly typeCount: (type: string) => number
  readonly kindCount: (kind: string) => number
  readonly statusCount: (status: NodeStatus) => number
  readonly onToggleType: (type: string) => void
  readonly onToggleKind: (kind: string) => void
  readonly onStatusFilter: (filter: StatusFilter) => void
  readonly onMinify: () => void
}) {
  const { LL } = useI18nContext()
  const text = LL.components.graph
  const edgeLabel = (kind: string) =>
    (text.edges as Record<string, (() => string) | undefined>)[kind]?.() ?? kind
  return (
    <aside className="gv-legend" aria-label={text.legend()}>
      <button
        type="button"
        className="gv-legend-toggle gv-legend-toggle--corner"
        aria-expanded
        aria-label={text.legendMinify()}
        title={text.legendMinify()}
        onClick={onMinify}
      >
        <Icon name="unfold_less" size="inline" />
      </button>
      <div>
        <h2 className="gv-legend-h">{text.nodes()}</h2>
        {types.map((t) => (
          <label key={t} className="gv-legend-row" data-off={hiddenTypes.has(t) || undefined}>
            <input
              type="checkbox"
              className="nt-visually-hidden"
              checked={!hiddenTypes.has(t)}
              onChange={() => onToggleType(t)}
            />
            <span className="gv-glyph">
              <svg width="14" height="14" aria-hidden="true">
                <NodeShape type={t} x={7} y={7} scale={0.7} />
              </svg>
            </span>
            <span className="gv-legend-name">{text.types[t]()}</span>
            <span className="gv-count">{typeCount(t)}</span>
          </label>
        ))}
      </div>
      <div>
        <h2 className="gv-legend-h">{text.edgesTitle()}</h2>
        {kinds.map((k) => {
          const style = styleOf(k)
          return (
            <label key={k} className="gv-legend-row" data-off={hiddenKinds.has(k) || undefined}>
              <input
                type="checkbox"
                className="nt-visually-hidden"
                checked={!hiddenKinds.has(k)}
                onChange={() => onToggleKind(k)}
              />
              <svg width="24" height="8" aria-hidden="true">
                <line
                  x1="1"
                  y1="4"
                  x2={style.arrow ? 17 : 23}
                  y2="4"
                  stroke={designColor.graph.sample}
                  strokeWidth={1.5}
                  strokeDasharray={style.dash.join(' ') || undefined}
                  strokeLinecap="round"
                />
                {style.arrow && <path d="M17,1 L23,4 L17,7 z" fill={designColor.graph.sample} />}
              </svg>
              <span className="gv-legend-name">{edgeLabel(k)}</span>
              <span className="gv-count">{kindCount(k)}</span>
            </label>
          )
        })}
        <div className="gv-legend-row gv-legend-stale">
          <span className="gv-stale-dot" />
          <span className="gv-legend-name">{text.staleDoc()}</span>
        </div>
      </div>
      <div>
        <h2 className="gv-legend-h">{text.statusTitle()}</h2>
        {statuses.map((st) => (
          <div key={st} className="gv-legend-row">
            <span className="gv-glyph">
              <StatusGlyph
                type="task"
                status={st}
                progress={sampleProgress[st] ?? 0}
                size={12}
                color={designColor.graph.sample}
              />
            </span>
            <span className="gv-legend-name">{text.status[st]()}</span>
            <span className="gv-count">{statusCount(st)}</span>
          </div>
        ))}
        <div className="gv-filter" role="radiogroup" aria-label={text.statusFilter()}>
          {statusFilters.map((f) => (
            <label key={f} data-on={statusFilter === f || undefined}>
              <input
                type="radio"
                name="gv-status"
                className="nt-visually-hidden"
                checked={statusFilter === f}
                onChange={() => onStatusFilter(f)}
              />
              {text.filters[f]()}
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}
