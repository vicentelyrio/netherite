import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { FreshnessCell } from './FreshnessCell'

const show = (freshness: Parameters<typeof FreshnessCell>[0]['freshness'], commits = 0) =>
  render(
    <NetheriteProvider env="test">
      <FreshnessCell freshness={freshness} commits={commits} />
    </NetheriteProvider>,
  )

describe('FreshnessCell', () => {
  test('stale says how many commits, drifting how far behind', () => {
    const { unmount } = show('stale', 14)
    expect(screen.getByText(/Stale · 14 commits/)).toBeTruthy()
    unmount()
    show('drifting', 4)
    expect(screen.getByText(/4 commits behind/)).toBeTruthy()
  })

  test('fresh says so, and anything untracked is "Not tracked"', () => {
    const { unmount } = show('fresh')
    expect(screen.getByText(/Fresh/)).toBeTruthy()
    unmount()
    show(null)
    expect(screen.getByText('Not tracked')).toBeTruthy()
  })
})
