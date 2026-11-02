import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { FilterTabs } from './FilterTabs'

const options = [
  { value: 'all', label: 'All', count: 12 },
  { value: 'adr', label: 'ADR', count: 6 },
] as const

describe('FilterTabs', () => {
  test('is a labelled radio group with the current option checked and counts shown', () => {
    render(<FilterTabs label="Type" options={options} value="adr" onChange={() => {}} />)
    const group = screen.getByRole('radiogroup', { name: 'Type' })
    expect(group.textContent).toContain('12')
    expect((screen.getByRole('radio', { name: /ADR/ }) as HTMLInputElement).checked).toBe(true)
  })

  test('choosing an option reports its value', () => {
    const onChange = vi.fn()
    render(<FilterTabs label="Type" options={options} value="adr" onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /All/ }))
    expect(onChange).toHaveBeenCalledWith('all')
  })

  test('the variant is a class, and options without a count show none', () => {
    render(
      <FilterTabs
        label="Kind"
        variant="chips"
        options={[{ value: 'a', label: 'A' }]}
        value="a"
        onChange={() => {}}
      />,
    )
    expect(document.querySelector('.filter-tabs--chips')).not.toBeNull()
    expect(document.querySelector('.filter-tabs-count')).toBeNull()
  })
})
