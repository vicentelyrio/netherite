import { useI18nContext } from '@/infrastructure/i18n'
import { percent } from './percent'
import { unusedOpacity, usedKinds } from './TagDetail.constants'

export function TagUsage({
  groups,
  total,
}: {
  readonly groups: Readonly<Record<(typeof usedKinds)[number]['key'], number>>
  readonly total: number
}) {
  const { LL } = useI18nContext()
  return (
    <>
      <h3 className="td-h">{LL.tags.detail.usedIn()}</h3>
      <div className="td-bar" aria-hidden="true">
        {usedKinds.map((k) =>
          groups[k.key] === 0 ? null : (
            <span
              key={k.key}
              style={{ width: percent(groups[k.key] / Math.max(1, total)), background: k.color }}
            />
          ),
        )}
      </div>
      <ul className="td-used">
        {usedKinds.map((k) => (
          <li key={k.key} style={{ opacity: groups[k.key] ? 1 : unusedOpacity }}>
            <i style={{ background: k.color }} />
            {LL.tags.detail[k.key]({ count: groups[k.key] })}
          </li>
        ))}
      </ul>
    </>
  )
}
