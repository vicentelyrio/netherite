import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { NoticeBanner } from './NoticeBanner'
import type { Notice, Notices } from './notices.types'
import { NoticesContext } from './useNotices'
import './notices.css'

export function NoticeProvider({ children }: { readonly children: ReactNode }) {
  const [notices, setNotices] = useState<ReadonlyArray<Notice>>([])
  const [paused, setPaused] = useState(false)
  const remove = useCallback(
    (id: number) => setNotices((list) => list.filter((n) => n.id !== id)),
    [],
  )

  const value = useMemo<Notices>(() => {
    let next = 1
    return {
      notify: (notice) => {
        const id = next++
        setNotices((list) => [
          ...list.filter((n) => !(n.title === notice.title && n.text === notice.text)),
          { ...notice, id },
        ])
        return () => remove(id)
      },
      dismissAll: () => setNotices([]),
    }
  }, [remove])

  useEffect(() => {
    if (notices.length === 0) setPaused(false)
  }, [notices.length])

  return (
    <NoticesContext.Provider value={value}>
      {notices.length > 0 && (
        // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only hold the timers
        <div
          className="app-notices"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {notices.map((notice) => (
            <NoticeBanner key={notice.id} notice={notice} paused={paused} onDismiss={remove} />
          ))}
        </div>
      )}
      {children}
    </NoticesContext.Provider>
  )
}
