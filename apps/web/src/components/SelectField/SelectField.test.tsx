import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { SelectField } from './SelectField'

describe('SelectField', () => {
  test('lists Any and the options, and reports the choice', () => {
    const onChange = vi.fn()
    render(
      <I18nProvider>
        <SelectField
          label="Status"
          value=""
          options={['proposed', 'accepted']}
          onChange={onChange}
        />
      </I18nProvider>,
    )
    const select = screen.getByRole('combobox', { name: 'Status' })
    expect(Array.from(select.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'Any',
      'proposed',
      'accepted',
    ])
    fireEvent.change(select, { target: { value: 'accepted' } })
    expect(onChange).toHaveBeenCalledWith('accepted')
  })
})
