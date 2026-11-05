import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { GroupCard } from './GroupCard'

const show = (ui: React.ReactElement) =>
  render(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('GroupCard', () => {
  test('names and counts the group', () => {
    show(
      <GroupCard title="Decisions" count={3}>
        <p>row</p>
      </GroupCard>,
    )
    expect(screen.getByRole('region', { name: 'Decisions' })).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('row')).toBeTruthy()
  })

  test('without a title it has no head but keeps its label', () => {
    show(
      <GroupCard label="Tags">
        <p>row</p>
      </GroupCard>,
    )
    expect(screen.getByRole('region', { name: 'Tags' })).toBeTruthy()
    expect(document.querySelector('.group-card-head')).toBeNull()
  })

  test('a group with a count of zero is not shown', () => {
    show(
      <GroupCard title="Orphans" count={0}>
        <p>row</p>
      </GroupCard>,
    )
    expect(screen.queryByText('row')).toBeNull()
  })
})
