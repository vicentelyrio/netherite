import { NetheriteProvider } from '@netherite/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { TitleForm } from './TitleForm'

const show = (onSubmit = vi.fn(), onCancel = vi.fn()) => {
  render(
    <NetheriteProvider env="test">
      <I18nProvider>
        <TitleForm label="New goal" onSubmit={onSubmit} onCancel={onCancel} />
      </I18nProvider>
    </NetheriteProvider>,
  )
  return { onSubmit, onCancel, input: screen.getByLabelText('New goal') }
}

describe('TitleForm', () => {
  test('submits the trimmed title', () => {
    const { onSubmit, input } = show()
    fireEvent.change(input, { target: { value: '  Learn Italian  ' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    expect(onSubmit).toHaveBeenCalledWith('Learn Italian')
  })

  test('an empty title does not submit, and Escape cancels', () => {
    const { onSubmit, onCancel, input } = show()
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })
})
