import { NetheriteProvider } from '@netherite/ui'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { type Notice, NoticeProvider, useNotices } from './index'

const Raise = ({ notice }: { readonly notice: Omit<Notice, 'id'> }) => {
  const { notify } = useNotices()
  return (
    <button type="button" onClick={() => notify(notice)}>
      raise
    </button>
  )
}

const raise = (notice: Omit<Notice, 'id'>) => {
  render(
    <NetheriteProvider env="test">
      <NoticeProvider>
        <Raise notice={notice} />
      </NoticeProvider>
    </NetheriteProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'raise' }))
}

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('notices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('a success dismisses itself after five seconds', () => {
    raise({ variant: 'success', title: 'Saved' })
    wait(4_999)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    wait(1)
    expect(screen.queryByText('Saved')).toBeNull()
  })

  test('a notice with an action stays longer, so it can be used', () => {
    raise({ variant: 'info', title: 'Archived', actions: [{ label: 'Undo', run: vi.fn() }] })
    wait(9_999)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    wait(1)
    expect(screen.queryByText('Archived')).toBeNull()
  })

  test.each(['danger', 'warning'] as const)('a %s stays until it is dismissed', (variant) => {
    raise({ variant, title: 'Broken' })
    wait(60_000)
    expect(screen.getByText('Broken')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Broken')).toBeNull()
  })

  test('a persistent notice stays until it is dismissed', () => {
    raise({ variant: 'info', title: 'Restart', persistent: true })
    wait(60_000)
    expect(screen.getByText('Restart')).toBeInTheDocument()
  })

  test('hovering holds the timer, and leaving starts it again', () => {
    raise({ variant: 'success', title: 'Saved' })
    const stack = screen.getByRole('status').parentElement as HTMLElement
    fireEvent.mouseEnter(stack)
    wait(60_000)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    fireEvent.mouseLeave(stack)
    wait(5_000)
    expect(screen.queryByText('Saved')).toBeNull()
  })

  test('a later notice is not held by a hover on a stack that has gone', () => {
    raise({ variant: 'success', title: 'Saved' })
    fireEvent.mouseEnter(screen.getByRole('status').parentElement as HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    fireEvent.click(screen.getByRole('button', { name: 'raise' }))
    wait(5_000)
    expect(screen.queryByText('Saved')).toBeNull()
  })
})
