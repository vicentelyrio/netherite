import { NetheriteProvider } from '@netherite/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { SearchField } from './SearchField'

describe('SearchField', () => {
  test('is named by its label and reports what is typed', () => {
    const onChange = vi.fn()
    render(
      <NetheriteProvider env="test">
        <SearchField label="Filter tags" value="" onChange={onChange} />
      </NetheriteProvider>,
    )
    const input = screen.getByRole('textbox', { name: 'Filter tags' })
    expect(input.getAttribute('placeholder')).toBe('Filter tags')
    fireEvent.change(input, { target: { value: 'nvim' } })
    expect(onChange).toHaveBeenCalledWith('nvim')
  })
})
