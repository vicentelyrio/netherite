import { Banner, type BannerVariant, Button } from '@netherite/ui'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import './notices.css'

export interface Notice {
  readonly id: number
  readonly variant: BannerVariant
  readonly title: string
  readonly text?: string
  readonly actions?: ReadonlyArray<{ readonly label: string; readonly run: () => void }>
}

export interface Notices {
  /** Shows a message at the bottom right of the page. Returns a function that removes it. */
  readonly notify: (notice: Omit<Notice, 'id'>) => () => void
  readonly dismissAll: () => void
}

const Context = createContext<Notices | undefined>(undefined)

export const useNotices = () => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useNotices needs a NoticeProvider')
  return value
}

/** Messages at the bottom right of the page: conflicts, failed writes, a config that needs a restart. */
export function NoticeProvider({ children }: { readonly children: ReactNode }) {
  const [notices, setNotices] = useState<ReadonlyArray<Notice>>([])
  const remove = useCallback(
    (id: number) => setNotices((list) => list.filter((n) => n.id !== id)),
    [],
  )

  const value = useMemo<Notices>(() => {
    let next = 1
    return {
      notify: (notice) => {
        const id = next++
        // The same message twice is one message.
        setNotices((list) => [
          ...list.filter((n) => !(n.title === notice.title && n.text === notice.text)),
          { ...notice, id },
        ])
        return () => remove(id)
      },
      dismissAll: () => setNotices([]),
    }
  }, [remove])

  return (
    <Context.Provider value={value}>
      {notices.length > 0 && (
        <div className="app-notices">
          {notices.map((notice) => (
            <Banner
              key={notice.id}
              variant={notice.variant}
              title={notice.title}
              onClose={() => remove(notice.id)}
              {...(notice.actions
                ? {
                    actions: notice.actions.map((action) => (
                      <Button
                        key={action.label}
                        onClick={() => {
                          action.run()
                          remove(notice.id)
                        }}
                      >
                        {action.label}
                      </Button>
                    )),
                  }
                : {})}
            >
              {notice.text}
            </Banner>
          ))}
        </div>
      )}
      {children}
    </Context.Provider>
  )
}
