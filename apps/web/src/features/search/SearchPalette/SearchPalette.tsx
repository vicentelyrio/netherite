import { Icon, type ItemTypeName, Modal, TypeGlyph } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FilterTabs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { searchQuery } from '@/infrastructure/query'
import { arrange, chips, type Group, groupOf, type SearchHit, targetOf } from '../results'
import { SearchFooter } from '../SearchFooter'
import { SearchResults } from '../SearchResults'
import './SearchPalette.css'

/**
 * Search across everything (SearchPalette.dc.html): type to find goals, projects, tasks and
 * knowledge by title, ID, path or text. Arrow keys move, Enter opens, Tab cycles the type chips.
 */
export function SearchPalette({
  opened,
  onClose,
}: {
  readonly opened: boolean
  readonly onClose: () => void
}) {
  const api = useApi()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [only, setOnly] = useState<Group | 'all'>('all')
  const [hi, setHi] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(q), 150)
    return () => clearTimeout(timer)
  }, [q])
  useEffect(() => {
    if (opened) {
      setQ('')
      setDebounced('')
      setOnly('all')
      setHi(0)
    }
  }, [opened])

  const query = useQuery(searchQuery(api, debounced))
  const hits = query.data?.results ?? []
  const arranged = useMemo(() => arrange(hits, only), [hits, only])
  const flat = arranged.flatMap((g) => g.rows)
  const counts = (key: Group | 'all') =>
    key === 'all' ? hits.length : hits.filter((h) => groupOf(h.type) === key).length

  const open = (hit: SearchHit | undefined, split = false) => {
    if (hit === undefined) return
    onClose()
    void navigate(targetOf(hit, split) as never)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = hi + (e.key === 'ArrowDown' ? 1 : -1)
      setHi(Math.max(0, Math.min(flat.length - 1, next)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      open(flat[hi], e.metaKey || e.ctrlKey)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const keys = chips.map(([k]) => k)
      const at = keys.indexOf(only)
      setOnly(keys[(at + (e.shiftKey ? keys.length - 1 : 1)) % keys.length] as Group | 'all')
      setHi(0)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<span className="nt-visually-hidden">Search</span>}
      withCloseButton={false}
      size={720}
      yOffset={120}
      classNames={{ content: 'sp-content', header: 'sp-header', body: 'sp-body' }}
      transitionProps={{ duration: 0 }}
      trapFocus
    >
      <div className="sp">
        <div className="sp-input">
          <Icon name="search" size={22} />
          <input
            ref={input}
            // biome-ignore lint/a11y/noAutofocus: the palette opens to be typed into
            autoFocus
            aria-label="Search goals, projects, tasks and knowledge"
            placeholder="Search goals, projects, tasks and knowledge"
            value={q}
            onKeyDown={onKeyDown}
            onChange={(e) => {
              setQ(e.currentTarget.value)
              setHi(0)
            }}
          />
          <kbd>esc</kbd>
        </div>
        <FilterTabs
          className="sp-chips"
          variant="chips"
          label="Type"
          options={chips.map(([key, label]) => ({
            value: key,
            label,
            count: counts(key),
            icon: key !== 'all' && (
              <TypeGlyph type={(key === 'doc' ? 'doc' : key) as ItemTypeName} />
            ),
          }))}
          value={only}
          onChange={(key) => {
            setOnly(key)
            setHi(0)
          }}
        />
        <SearchResults
          arranged={arranged}
          flat={flat}
          q={debounced}
          pending={query.isPending}
          highlight={hi}
          onHighlight={setHi}
          onOpen={(hit) => open(hit)}
        />
        <SearchFooter count={flat.length} />
      </div>
    </Modal>
  )
}
