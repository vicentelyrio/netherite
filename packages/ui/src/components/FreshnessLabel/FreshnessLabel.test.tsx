import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { FreshnessLabel } from './index'

describe('FreshnessLabel', () => {
  test('freshness says how far a doc has drifted', () => {
    renderUi(
      <>
        <FreshnessLabel state="fresh" />
        <FreshnessLabel state="drifting" commits={1} />
        <FreshnessLabel state="drifting" commits={3} />
        <FreshnessLabel state="stale" commits={10} atLeast />
        <FreshnessLabel state="unknown" />
      </>,
    )
    expect(screen.getByText('Fresh')).toBeInTheDocument()
    expect(screen.getByText('Drifting · 1 commit')).toBeInTheDocument()
    expect(screen.getByText('Drifting · 3 commits')).toBeInTheDocument()
    expect(screen.getByText('Stale · 10+ commits')).toBeInTheDocument()
    expect(screen.getByText('Not tracked')).toBeInTheDocument()
  })

  test('the tooltip says since when', () => {
    const { container } = renderUi(<FreshnessLabel state="stale" commits={12} since="2026-01-15" />)
    expect(container.querySelector('.nt-freshness')).toHaveAttribute(
      'title',
      '12 commits to covered files since 2026-01-15',
    )
  })
})
