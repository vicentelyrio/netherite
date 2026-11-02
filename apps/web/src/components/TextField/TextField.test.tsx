import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  test('is named by its label, reports typing and Escape', () => {
    const onChange = vi.fn()
    const onEscape = vi.fn()
    render(<TextField label="Area name" value="" onChange={onChange} onEscape={onEscape} />)
    const input = screen.getByRole('textbox', { name: 'Area name' })
    expect(input.hasAttribute('placeholder')).toBe(false)
    fireEvent.change(input, { target: { value: 'Life' } })
    expect(onChange).toHaveBeenCalledWith('Life')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalled()
  })

  test('shows a placeholder when given one', () => {
    render(<TextField label="First goal" placeholder="First goal" value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('First goal')).toBeTruthy()
  })
})
