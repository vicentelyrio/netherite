import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Button } from '../Button'
import { EmptyState } from './index'

describe('EmptyState', () => {
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
