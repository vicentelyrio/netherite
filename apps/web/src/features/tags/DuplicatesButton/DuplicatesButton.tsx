import { Icon } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { keyOf } from '../rules'
import { useTags } from '../TagsProvider'
import './DuplicatesButton.css'

/** How many tags look like duplicates; a click picks the first, whose panel says what to do. */
export function DuplicatesButton() {
  const { LL } = useI18nContext()
  const { duplicates, select } = useTags()
  const first = duplicates[0]
  if (first === undefined) return null
  return (
    <button type="button" className="dup-button" onClick={() => select(keyOf(first.a))}>
      <Icon name="join" size="inline" />
      {LL.tags.duplicates.count()}
      <span>{duplicates.length}</span>
    </button>
  )
}
