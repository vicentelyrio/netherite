import { EmptyState } from '@netherite/ui'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { CommitCard } from '../CommitCard'
import { useDecisions } from '../DecisionProvider'
import './DecisionLanes.css'

/** One column per project, each a timeline of the commits that changed its ADRs. */
export function DecisionLanes() {
  const { LL } = useI18nContext()
  const { lanes } = useDecisions()
  const box = useRef<HTMLDivElement>(null)
  const shape = lanes.map((l) => l.project).join('|')
  useEffect(() => {
    if (box.current === null || shape === '') return
    box.current.scrollLeft = 0
    box.current.scrollTop = 0
  }, [shape])
  useLayoutEffect(() => {
    const fit = () => {
      const el = box.current
      if (el === null) return
      let page: HTMLElement | null = el.parentElement
      while (page !== null && !/(auto|scroll)/.test(getComputedStyle(page).overflowY))
        page = page.parentElement
      const edge = page?.getBoundingClientRect()
      const left = edge?.left ?? 0
      const right = edge === undefined ? window.innerWidth : left + (page?.clientWidth ?? 0)
      const bottom = edge?.bottom ?? window.innerHeight
      for (const name of [
        'marginLeft',
        'paddingLeft',
        'marginRight',
        'marginBottom',
        'height',
      ] as const)
        el.style[name] = ''
      const at = el.getBoundingClientRect()
      el.style.marginLeft = `${-(at.left - left)}px`
      el.style.paddingLeft = `${at.left - left}px`
      el.style.marginRight = `${-(right - at.right)}px`
      el.style.height = `${Math.max(320, bottom - at.top)}px`
      if (page !== null) {
        const extra = page.scrollHeight - page.clientHeight
        if (extra > 0) el.style.marginBottom = `${-extra}px`
      }
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [shape])
  if (lanes.length === 0) {
    return (
      <EmptyState
        icon="gavel"
        title={LL.decisions.empty.title()}
        description={LL.decisions.empty.text()}
      />
    )
  }
  return (
    <div
      ref={box}
      className="dl-lanes"
      style={{ ['--lanes' as string]: lanes.length === 1 ? 2 : lanes.length }}
    >
      {lanes.map((lane) => (
        <section key={lane.project} className="dl-lane" aria-label={lane.project}>
          <h2 className="dl-lane-head">
            <span className="dl-lane-dot" />
            {lane.title}
            <span className="app-muted">
              {LL.decisions.adrs({ count: lane.adrs })}
              {lane.chains > 0 ? ` · ${LL.decisions.chains({ count: lane.chains })}` : ''}
            </span>
          </h2>
          <div className="dl-scroll">
            <div className="dl-timeline">
              {lane.commits.map((commit) => (
                <CommitCard key={commit.hash} commit={commit} />
              ))}
              {lane.commits.length === 0 && <p className="app-muted">{LL.decisions.noChanges()}</p>}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
