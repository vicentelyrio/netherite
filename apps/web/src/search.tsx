import type { ItemSummary } from '@netherite/api'
import { Icon, type ItemTypeName, Modal, TypeGlyph } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FilterTabs } from '@/components'
import { useApi } from './lib/app-context'
import { searchQuery } from './lib/queries'

/** A result: the item's summary, how well it matched, and where the words were found. */
export type SearchHit = ItemSummary & {
  readonly score: number
  readonly snippet?: string | undefined
}

export type Group = 'adr' | 'task' | 'doc' | 'context' | 'project' | 'goal'

/** Which result group a type belongs to: docs and runbooks sit together. */
export const groupOf = (type: string): Group => (type === 'runbook' ? 'doc' : (type as Group))

const groups: ReadonlyArray<readonly [Group, string]> = [
  ['adr', 'Decisions'],
  ['task', 'Tasks'],
  ['doc', 'Docs & runbooks'],
  ['context', 'AI context'],
  ['project', 'Projects'],
  ['goal', 'Goals'],
]

const chips: ReadonlyArray<readonly [Group | 'all', string]> = [
  ['all', 'All'],
  ['adr', 'ADRs'],
  ['task', 'Tasks'],
  ['doc', 'Docs'],
  ['context', 'Context'],
  ['project', 'Projects'],
  ['goal', 'Goals'],
]

/** Results in the palette's order: grouped, each group in the order the search ranked them. */
export const arrange = (hits: ReadonlyArray<SearchHit>, only: Group | 'all') => {
  const shown = hits.filter((h) => only === 'all' || groupOf(h.type) === only)
  return groups
    .map(([group, name]) => ({
      group,
      name,
      rows: shown.filter((h) => groupOf(h.type) === group),
    }))
    .filter((g) => g.rows.length > 0)
}

/** Where a result goes: a goal and a project to their pages, a task to its drawer on the board. */
export const targetOf = (hit: SearchHit, split = false) => {
  const mode = split ? ({ mode: 'split' } as const) : {}
  if (hit.type === 'goal') return { to: '/goals/$id', params: { id: hit.id } } as const
  if (hit.type === 'project') return { to: '/projects/$id', params: { id: hit.id } } as const
  if (hit.type === 'task' && hit.project !== undefined) {
    return {
      to: '/projects/$id',
      params: { id: hit.project },
      search: { task: hit.id, ...mode },
    } as const
  }
  return { to: '/items/$id', params: { id: hit.id }, ...(split ? { search: mode } : {}) } as const
}

function Highlight({ text, q }: { readonly text: string; readonly q: string }) {
  const at = q.trim() === '' ? -1 : text.toLowerCase().indexOf(q.trim().toLowerCase())
  if (at < 0) return <>{text}</>
  const end = at + q.trim().length
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, end)}</mark>
      {text.slice(end)}
    </>
  )
}

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
        <div className="sp-results" role="listbox" aria-label="Results">
          {debounced.trim() === '' && (
            <div className="sp-empty">Search goals, projects, tasks and knowledge.</div>
          )}
          {arranged.map((g) => (
            <div key={g.group}>
              <div className="sp-group">
                <span>{g.name}</span>
                <span>{g.rows.length}</span>
              </div>
              {g.rows.map((hit) => {
                const index = flat.indexOf(hit)
                return (
                  // biome-ignore lint/a11y/useFocusableInteractive: the input keeps focus; arrows move the highlight
                  <div
                    key={hit.id}
                    role="option"
                    aria-selected={index === hi}
                    className="sp-row"
                    data-hi={index === hi || undefined}
                    onMouseEnter={() => setHi(index)}
                    onClick={() => open(hit)}
                    onKeyDown={undefined}
                  >
                    <span className="sp-glyph">
                      <TypeGlyph
                        type={hit.type as ItemTypeName}
                        hollow={hit.status === 'superseded'}
                      />
                    </span>
                    <div className="sp-main">
                      <div className="sp-title">
                        {hit.type === 'adr' && <span className="sp-id">{hit.id}</span>}
                        <span
                          className="sp-name"
                          data-old={hit.status === 'superseded' || undefined}
                        >
                          <Highlight text={hit.title} q={debounced} />
                        </span>
                      </div>
                      {hit.snippet && <span className="sp-snip">{hit.snippet}</span>}
                    </div>
                    {(hit.status ?? hit.state) && (
                      <span className="sp-status" data-s={hit.status ?? hit.state}>
                        {hit.status ?? hit.state}
                      </span>
                    )}
                    <span className="sp-meta">{hit.project ?? hit.type}</span>
                  </div>
                )
              })}
            </div>
          ))}
          {debounced.trim() !== '' && !query.isPending && flat.length === 0 && (
            <div className="sp-empty">No results. Try a file name or an ADR id.</div>
          )}
        </div>
        <footer className="sp-foot">
          <span>
            <kbd>↑↓</kbd>navigate
          </span>
          <span>
            <kbd>↵</kbd>open
          </span>
          <span>
            <kbd>⌘↵</kbd>open as split
          </span>
          <span>
            <kbd>tab</kbd>next type
          </span>
          <span className="kn-spacer" />
          <span>{flat.length} results · titles, paths and body</span>
        </footer>
      </div>
    </Modal>
  )
}
