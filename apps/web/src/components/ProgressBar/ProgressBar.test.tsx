import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ProgressBar } from './ProgressBar'

const show = (done: number, total: number) =>
  render(
    <NetheriteProvider env="test">
      <ProgressBar done={done} total={total} />
    </NetheriteProvider>,
  )

describe('ProgressBar', () => {
  test('shows the count, and marks it when everything is done', () => {
    const { unmount } = show(3, 10)
    expect(screen.getByText('3/10').hasAttribute('data-done')).toBe(false)
    unmount()
    show(4, 4)
    expect(screen.getByText('4/4').hasAttribute('data-done')).toBe(true)
  })

  test('an empty bar is not marked done', () => {
    show(0, 0)
    expect(screen.getByText('0/0').hasAttribute('data-done')).toBe(false)
  })
})
