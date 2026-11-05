import { Banner, type BannerVariant, Button } from '@netherite/ui'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import './notices.css'

export interface Notice {
  readonly id: number
  readonly variant: BannerVariant
  readonly title: string
  readonly text?: string
  readonly actions?: ReadonlyArray<{ readonly label: string; readonly run: () => void }>
  readonly persistent?: boolean
}

export interface Notices {
  readonly notify: (notice: Omit<Notice, 'id'>) => () => void
  readonly dismissAll: () => void
}

const lifetime = (notice: Notice) => {
  if (notice.persistent || notice.variant === 'danger' || notice.variant === 'warning') {
    return undefined
  }
  return notice.actions ? 10_000 : 5_000
}

const Context = createContext<Notices | undefined>(undefined)

export const useNotices = () => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useNotices needs a NoticeProvider')
  return value
}

function NoticeBanner({
  notice,
  paused,
  onDismiss,
}: {
  readonly notice: Notice
  readonly paused: boolean
  readonly onDismiss: (id: number) => void
}) {
  const ms = lifetime(notice)
  useEffect(() => {
    if (ms === undefined || paused) return
    const timer = window.setTimeout(() => onDismiss(notice.id), ms)
    return () => window.clearTimeout(timer)
  }, [ms, paused, notice.id, onDismiss])
  return (
    <Banner
      variant={notice.variant}
      title={notice.title}
      onClose={() => onDismiss(notice.id)}
      {...(notice.actions
        ? {
            actions: notice.actions.map((action) => (
              <Button
                key={action.label}
                onClick={() => {
                  action.run()
                  onDismiss(notice.id)
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
  )
}

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
    <Context.Provider value={value}>
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
    </Context.Provider>
  )
}
