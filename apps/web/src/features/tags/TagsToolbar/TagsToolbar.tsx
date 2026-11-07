import { Icon } from '@netherite/ui'
import { useRef } from 'react'
import { FilterTabs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useActionShortcuts, useShortcutHint } from '@/infrastructure/shortcuts'
import { useTags } from '../TagsProvider'
import './TagsToolbar.css'

const kinds = ['all', 'tags', 'labels'] as const
const views = ['map', 'list'] as const
const viewIcon = { map: 'bubble_chart', list: 'list' } as const

export function TagsToolbar() {
  const { LL } = useI18nContext()
  const { all, q, setQ, field, setField, count, view, setView } = useTags()
  const input = useRef<HTMLInputElement>(null)
  useActionShortcuts({ 'tags.search': () => input.current?.focus() })
  const hint = useShortcutHint('tags.search')
  if (all.length === 0) return null
  return (
    <>
      <label className="tgt-search">
        <input
          ref={input}
          aria-label={LL.tags.filter()}
          placeholder={LL.tags.filter()}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
        />
        {hint !== undefined && <kbd>{hint}</kbd>}
      </label>
      <FilterTabs
        label={LL.tags.kind()}
        options={kinds.map((value) => ({
          value,
          label: LL.tags.kinds[value](),
          count: count(value),
        }))}
        value={field}
        onChange={setField}
      />
      <FilterTabs
        label={LL.tags.view.label()}
        options={views.map((value) => ({
          value,
          label: LL.tags.view[value](),
          icon: <Icon name={viewIcon[value]} size="inline" />,
        }))}
        value={view}
        onChange={setView}
      />
      {view === 'map' && (
        <ul className="tgt-legend" aria-label={LL.tags.legend.label()}>
          <li>
            <span className="tgt-key" data-kind="small" />
            <span className="tgt-key" data-kind="big" />
            {LL.tags.legend.size()}
          </li>
          <li>
            <span className="tgt-key" data-kind="thick" />
            {LL.tags.legend.thickness()}
          </li>
          <li>
            <span className="tgt-key" data-kind="dup" />
            {LL.tags.legend.duplicate()}
          </li>
        </ul>
      )}
    </>
  )
}
