import { Kbd } from '@netherite/ui'
import { useEffect, useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import {
  actionIds,
  actionLabel,
  formatShortcut,
  normalise,
  stepsOf,
  usePendingSequence,
  useResolvedShortcuts,
} from '@/infrastructure/shortcuts'
import './SequenceHint.css'

const hintDelayMs = 400

export function SequenceHint() {
  const { LL } = useI18nContext()
  const pending = usePendingSequence()
  const resolved = useResolvedShortcuts()
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (pending === undefined) {
      setShown(false)
      return
    }
    const timer = setTimeout(() => setShown(true), hintDelayMs)
    return () => clearTimeout(timer)
  }, [pending])
  if (pending === undefined || !shown) return null
  const next = new Set(pending.next)
  const rows = actionIds.flatMap((id) => {
    const { keys } = resolved[id]
    return keys !== null && next.has(normalise(keys)) ? [{ id, keys }] : []
  })
  return (
    <div className="sequence-hint" role="status" aria-label={LL.navigation.nextKeys()}>
      <ul className="sequence-hint-list">
        {rows.map(({ id, keys }) => (
          <li key={id} className="sequence-hint-row">
            <Kbd>{formatShortcut(stepsOf(keys).at(-1) ?? keys)}</Kbd>
            <span>{actionLabel(LL, id)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
