import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { ActionIcon } from './index'

describe('ActionIcon', () => {
  test('is named by its label, so a screen reader can say what it does', () => {
    renderUi(<ActionIcon icon="search" label="Search" />)
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })

  test('shows its label as a tooltip on hover', async () => {
    renderUi(<ActionIcon icon="search" label="Search" />)
    await userEvent.hover(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Search')
  })

  test('says whether it is on', () => {
    renderUi(<ActionIcon icon="filter_list" label="Filter" active tooltip={false} />)
    expect(screen.getByRole('button', { name: 'Filter' })).toHaveAttribute('aria-pressed', 'true')
  })
})
