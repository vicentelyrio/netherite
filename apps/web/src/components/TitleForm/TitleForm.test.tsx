import { NetheriteProvider } from '@netherite/ui'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { TitleForm, type TitleFormProps } from './TitleForm'

const show = (props: Partial<TitleFormProps> = {}) => {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(
    <NetheriteProvider env="test">
      <I18nProvider>
        <TitleForm label="New goal" onSubmit={onSubmit} onCancel={onCancel} {...props} />
      </I18nProvider>
    </NetheriteProvider>,
  )
  const input = screen.getByLabelText<HTMLInputElement>('New goal')
  return {
    onSubmit,
    onCancel,
    input,
    type: (value: string) => fireEvent.change(input, { target: { value } }),
    enter: () => fireEvent.submit(input.closest('form') as HTMLFormElement),
    leave: () => act(() => input.blur()),
  }
}

describe('TitleForm', () => {
  test('has no buttons', () => {
    show()
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('Enter creates with the trimmed title', () => {
    const { onSubmit, type, enter } = show()
    type('  Learn Italian  ')
    enter()
    expect(onSubmit).toHaveBeenCalledWith('Learn Italian')
  })

  test('leaving the field creates when it has text', () => {
    const { onSubmit, onCancel, type, leave } = show()
    type('Learn Italian')
    leave()
    expect(onSubmit).toHaveBeenCalledWith('Learn Italian')
    expect(onCancel).not.toHaveBeenCalled()
  })

  test('Enter or leaving with only spaces cancels', () => {
    const entered = show()
    entered.type('   ')
    entered.enter()
    expect(entered.onCancel).toHaveBeenCalledTimes(1)
    expect(entered.onSubmit).not.toHaveBeenCalled()
  })

  test('leaving an empty field cancels', () => {
    const { onSubmit, onCancel, leave } = show()
    leave()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('Escape cancels even with text', () => {
    const { onSubmit, onCancel, input, type } = show()
    type('Learn Italian')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('switching window keeps the half-typed title', () => {
    const { onSubmit, onCancel, input, type } = show()
    type('Learn Ita')
    expect(document.activeElement).toBe(input)
    fireEvent.blur(input)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  test('does not create twice while the first is saving', () => {
    const { onSubmit, type, enter, leave } = show({ pending: true })
    type('Learn Italian')
    enter()
    leave()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('onEmpty replaces cancelling on an empty title, and Escape still cancels', () => {
    const onEmpty = vi.fn()
    const { onCancel, input, enter } = show({ onEmpty })
    enter()
    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
