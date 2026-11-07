import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Button } from '../Button'
import { EmptyState } from '../EmptyState'
import { Banner } from './index'

describe('Banner and EmptyState', () => {
  test('problems interrupt screen readers; other messages wait', () => {
    renderUi(
      <>
        <Banner variant="danger" title="d" />
        <Banner variant="warning" title="w" />
        <Banner variant="info" title="i" />
        <Banner variant="success" title="s" />
      </>,
    )
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  test('shows its title, text and actions, and can be dismissed', async () => {
    const onClose = vi.fn()
    renderUi(
      <Banner title="Out of date" actions={<Button>Review</Button>} onClose={onClose}>
        12 commits since review.
      </Banner>,
    )
    expect(screen.getByText('Out of date')).toBeInTheDocument()
    expect(screen.getByText('12 commits since review.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('has no close button unless it can close', () => {
    renderUi(<Banner title="x" />)
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
  })

  test('an empty state says what is missing and offers a way forward', async () => {
    const onClick = vi.fn()
    renderUi(
      <EmptyState
        title="No knowledge yet"
        description="Add a doc."
        actions={<Button onClick={onClick}>New doc</Button>}
      />,
    )
    expect(screen.getByRole('heading', { name: 'No knowledge yet' })).toBeInTheDocument()
    expect(screen.getByText('Add a doc.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'New doc' }))
    expect(onClick).toHaveBeenCalled()
  })
})
